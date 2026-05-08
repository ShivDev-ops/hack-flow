"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const flashModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
const proModel = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

/**
 * Robust JSON extraction from AI responses that might contain markdown or conversational filler.
 */
function extractJSON(text: string) {
  try {
    // Attempt 1: Direct parse
    return JSON.parse(text);
  } catch {
    // Attempt 2: Extract content between ```json and ```
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        // Fallback: search for first [ or { and last ] or }
        const start = text.indexOf('{') !== -1 ? text.indexOf('{') : text.indexOf('[');
        const end = text.lastIndexOf('}') !== -1 ? text.lastIndexOf('}') : text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          try {
            return JSON.parse(text.slice(start, end + 1));
          } catch {
            throw new Error("Failed to parse AI response as JSON");
          }
        }
      }
    }
    throw new Error("Could not find JSON in AI response");
  }
}

/**
 * PHASE 1: DNA Synthesis
 * Takes a project document (PDF or Text) and extracts the core technical milestones.
 */
export async function synthesizeProjectDNA(teamId: string, fileData?: Buffer, textContent?: string) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    let extractedText = textContent || "";

    // 1. Extract text from PDF if provided
    if (fileData) {
      const result = await pdf(fileData);
      extractedText = result.text;
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return { success: false, error: "The document is too short or empty. Please provide more detail about your project." };
    }

    // 2. AI Synthesis: Extract Technical Pillars
    const prompt = `
      You are a Project DNA Architect. Your task is to analyze the following project document and extract the core technical milestones required to build this project.
      The document might be an SRS, a project overview, or a brainstorm.
      
      Identify 4-6 high-level technical milestones. For each milestone, provide:
      - title: Short, clear name (e.g., "User Authentication")
      - description: 1-sentence explanation of what it is.
      - criteria: Specific technical evidence to look for in code (e.g., "Check for Supabase auth imports and login UI components").
      - weight: Numerical importance (1-100), the sum of all weights must be exactly 100.

      Document Content:
      "${extractedText.slice(0, 10000)}"

      Respond ONLY with a raw JSON array of objects following this schema:
      [{"title": string, "description": string, "criteria": string, "weight": number}]
    `;

    const result = await flashModel.generateContent(prompt);
    const milestones = extractJSON(result.response.text());

    // 3. Clear existing DNA for this team (Fresh Start)
    await supabaseAdmin.from("hf_project_dna").delete().eq("team_id", teamId);

    // 4. Generate Embeddings & Save to DB
    for (const milestone of milestones) {
      // Create a synthetic context for better vector matching
      const context = `${milestone.title}: ${milestone.criteria}`;
      
      const embeddingResult = await embeddingModel.embedContent(context);
      const embedding = embeddingResult.embedding.values;

      const { error: insertError } = await supabaseAdmin
        .from("hf_project_dna")
        .insert({
          team_id: teamId,
          milestone_title: milestone.title,
          milestone_description: milestone.description,
          verification_criteria: milestone.criteria,
          weight: milestone.weight,
          embedding: embedding,
          status: 'pending'
        });

      if (insertError) {
        console.error("DB_INSERT_ERROR:", insertError);
        throw new Error(`Failed to save milestone: ${milestone.title}`);
      }
    }

    return { success: true, count: milestones.length };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected AI error occurred.";
    console.error("DNA_SYNTHESIS_CRITICAL_FAIL:", err);
    return { success: false, error: msg };
  }
}

/**
 * PHASE 2: Engineering Pulse (Code Audit)
 * Analyzes a code diff and maps it to the DNA milestones.
 */
export async function auditCodeChange(teamId: string, diffText: string, contextMessage: string) {
  try {
    const supabaseAdmin = await createAdminClient();

    // 1. Fetch the Project DNA (Milestones)
    const { data: milestones } = await supabaseAdmin
      .from("hf_project_dna")
      .select("*")
      .eq("team_id", teamId);

    if (!milestones || milestones.length === 0) {
      return { success: false, error: "No project DNA found. Please upload a project document first." };
    }

    // 2. Pre-process Diff (Basic Sanitization)
    const cleanedDiff = diffText
      .split("\n")
      .filter(line => 
        !line.startsWith("diff --git") && 
        !line.startsWith("index ") &&
        !line.includes("node_modules") &&
        !line.includes("package-lock.json")
      )
      .join("\n")
      .slice(0, 15000); // Limit to 15k chars for token efficiency

    // 3. AI Evaluation
    const milestoneSummary = milestones.map((m, i) => `${i+1}. ${m.milestone_title}: ${m.milestone_description}`).join("\n");

    const prompt = `
      You are a Senior Technical Auditor. Your task is to evaluate a code change against a set of project milestones.
      A code change might implement multiple milestones at once (especially in large bulk uploads).
      
      Project Milestones:
      ${milestoneSummary}

      Developer Context (Commit/PR Message):
      "${contextMessage}"

      Code Diff:
      ${cleanedDiff}

      Evaluate which milestones are implemented or progressed by this code change.
      Respond ONLY with a JSON object:
      {
        "matches": [
          {
            "milestone_index": number (1-based index),
            "confidence": number (0-100),
            "status_update": "in_progress" | "complete",
            "reasoning": "1-sentence explanation"
          }
        ]
      }
    `;

    const result = await flashModel.generateContent(prompt);
    const evaluation = extractJSON(result.response.text());
    
    let lastReasoning = "No matches found.";

    if (evaluation.matches && Array.isArray(evaluation.matches)) {
      for (const match of evaluation.matches) {
        if (match.milestone_index > 0 && match.milestone_index <= milestones.length && match.confidence > 70) {
          const targetMilestone = milestones[match.milestone_index - 1];
          
          await supabaseAdmin
            .from("hf_project_dna")
            .update({ status: match.status_update })
            .eq("id", targetMilestone.id);
          
          lastReasoning = match.reasoning;
        }
      }

      // 4. Update Team Progress Score
      const { data: allMilestones } = await supabaseAdmin
        .from("hf_project_dna")
        .select("weight, status")
        .eq("team_id", teamId);

      const totalProgress = allMilestones?.reduce((acc, m) => {
        if (m.status === 'complete') return acc + m.weight;
        if (m.status === 'in_progress') return acc + (m.weight * 0.3);
        return acc;
      }, 0) || 0;

      await supabaseAdmin
        .from("hf_teams")
        .update({ 
          ai_progress_score: Math.min(Math.round(totalProgress), 100),
          ai_status_summary: lastReasoning
        })
        .eq("id", teamId);

      return { success: true, matches: evaluation.matches.length, progress: totalProgress };
    }

    return { success: true, matched: null };

  } catch (err: unknown) {
    console.error("CODE_AUDIT_FAIL:", err);
    return { success: false, error: "Evaluation failed." };
  }
}

/**
 * PHASE 3: Deep Audit & Judging
 * A comprehensive evaluation of the project using Gemini 1.5 Pro.
 */
export async function performDeepAudit(teamId: string, eventId: string, problemStatement: string, rubric: any): Promise<{ success: boolean; evaluation?: any; error?: string }> {
  try {
    const supabaseAdmin = await createAdminClient();

    // 1. Gather all "Evidence"
    const { data: milestones } = await supabaseAdmin.from("hf_project_dna").select("*").eq("team_id", teamId);
    const { data: team } = await supabaseAdmin.from("hf_teams").select("name, repo_url, ai_progress_score").eq("id", teamId).single();
    
    // 2. FETCH GITHUB REPOSITORY STRUCTURE (Bulk Upload Support)
    let repoStructure = "No repository structure available.";
    if (team?.repo_url && team.repo_url.includes("github.com")) {
        try {
            // Extract owner and repo from URL
            const parts = team.repo_url.replace(/\/$/, "").split("/");
            const repo = parts.pop();
            const owner = parts.pop();
            
            if (owner && repo) {
                // Fetch the default branch's tree recursively
                const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
                const response = await fetch(treeUrl, {
                    headers: { 'Accept': 'application/vnd.github.v3+json' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Filter and format the tree to keep it token-efficient (limit to 200 files)
                    repoStructure = data.tree
                        .filter((item: any) => item.type === 'blob')
                        .slice(0, 200)
                        .map((item: any) => item.path)
                        .join("\n");
                    console.log(`[AI_AUDITOR] Successfully fetched repo structure for ${owner}/${repo}`);
                } else {
                    // Try 'master' if 'main' fails
                    const masterUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
                    const masterResponse = await fetch(masterUrl);
                    if (masterResponse.ok) {
                        const data = await masterResponse.json();
                        repoStructure = data.tree
                            .filter((item: any) => item.type === 'blob')
                            .slice(0, 200)
                            .map((item: any) => item.path)
                            .join("\n");
                    }
                }
            }
        } catch (githubErr) {
            console.warn("[AI_AUDITOR] GitHub structure fetch failed:", githubErr);
        }
    }

    const evidence = {
        milestones: milestones?.map(m => ({ title: m.milestone_title, status: m.status, criteria: m.verification_criteria })),
        claimed_progress: team?.ai_progress_score || 0,
        repository_file_structure: repoStructure
    };

    const prompt = `
      You are an elite Hackathon Judge and Senior Architect. 
      Your task is to perform a DEEP AUDIT of a project implementation.

      PROBLEM STATEMENT (The Goal):
      "${problemStatement}"

      TEAM PROJECT DNA & PROGRESS:
      ${JSON.stringify(evidence, null, 2)}

      JUDGING RUBRIC (Weights):
      ${JSON.stringify(rubric, null, 2)}

      IMPORTANT INSTRUCTIONS FOR BULK UPLOADS:
      Check the "repository_file_structure" carefully. 
      If the structure contains significant logic files (e.g., controllers, services, UI components) that match the milestones, but the "claimed_progress" is low, it is likely the team performed a BULK UPLOAD.
      In case of a bulk upload, prioritize the actual repository structure over the incremental progress score to give an accurate evaluation of their execution.

      Evaluate the project on these 4 factors (0-100 for each):
      1. Alignment: How well does the technical implementation solve the problem statement?
      2. Execution: Based on the milestones and file structure, how much high-quality logic is actually finished?
      3. Innovation: Does the code/approach show creative problem-solving or just boilerplate?
      4. Technical Depth: Is the architecture robust and technically challenging?

      Respond ONLY with a JSON object:
      {
        "alignment_score": number,
        "execution_score": number,
        "innovation_score": number,
        "technical_score": number,
        "ai_justification": "A detailed 3-4 sentence technical critique of the project.",
        "total_weighted_score": number
      }
    `;

    // Attempt with Pro model first, fallback to Flash if quota exceeded (429)
    let evaluation;
    try {
        const result = await proModel.generateContent(prompt);
        evaluation = extractJSON(result.response.text());
        console.log(`[AI_AUDITOR] Deep audit successful using Pro model for team ${teamId}`);
    } catch (proErr: any) {
        if (proErr.message?.includes("429") || proErr.message?.includes("quota")) {
            console.warn(`[AI_AUDITOR] Pro model quota exceeded, falling back to Flash model for team ${teamId}`);
            const result = await flashModel.generateContent(prompt);
            evaluation = extractJSON(result.response.text());
        } else {
            throw proErr;
        }
    }

    // 2. Save result to DB (Upsert)
    const { error: insertError } = await supabaseAdmin
        .from("hf_judging_results")
        .upsert({
            team_id: teamId,
            event_id: eventId,
            alignment_score: evaluation.alignment_score,
            execution_score: evaluation.execution_score,
            innovation_score: evaluation.innovation_score,
            technical_score: evaluation.technical_score,
            total_score: evaluation.total_weighted_score,
            ai_justification: evaluation.ai_justification
        }, { onConflict: 'team_id' });

    if (insertError) throw insertError;

    return { success: true, evaluation };

  } catch (err: unknown) {
    console.error("DEEP_AUDIT_FAIL:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "An unexpected error occurred during deep audit." 
    };
  }
}
