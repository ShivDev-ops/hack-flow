"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRequire } from "module";
import { JudgingResult, DNAMilestone } from "@/types/common";

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
    console.error("[GEMINI_CONFIG_ERROR]: GEMINI_API_KEY is missing from environment variables!");
} else {
    console.log("[GEMINI_CONFIG_OK]: GEMINI_API_KEY is present (length: " + process.env.GEMINI_API_KEY.length + ")");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const flashModel = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
const proModel = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

/**
 * Retries a Gemini API call if it fails due to high demand (503) or rate limits (429).
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isRetryable = 
      err?.message?.includes("503") || 
      err?.message?.includes("Service Unavailable") ||
      err?.message?.includes("429") ||
      err?.message?.includes("Too Many Requests");

    if (isRetryable && retries > 0) {
      console.warn(`[AI_RETRY] Gemini busy (Retries left: ${retries}). Waiting ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
      return callWithRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw err;
  }
}

/**
 * Logs API usage (tokens) to the hf_api_telemetry table.
 */
async function logAPIUsage(eventId: string, response: any, operationType: string) {
  try {
    const supabaseAdmin = await createAdminClient();
    const tokens = response?.usageMetadata?.totalTokenCount || 0;
    
    if (tokens > 0 && eventId) {
      await supabaseAdmin.from("hf_api_telemetry").insert({
        event_id: eventId,
        tokens_consumed: tokens,
        operation_type: operationType
      });
    }
  } catch (err) {
    console.error("[API_USAGE_LOG_FAIL]:", err);
  }
}

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
        // Fall through to Attempt 3
      }
    }

    // Attempt 3: Find the first and last structural characters ({ or [ and } or ])
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) start = Math.min(firstBrace, firstBracket);
    else if (firstBrace !== -1) start = firstBrace;
    else if (firstBracket !== -1) start = firstBracket;

    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    let end = -1;
    if (lastBrace !== -1 && lastBracket !== -1) end = Math.max(lastBrace, lastBracket);
    else if (lastBrace !== -1) end = lastBrace;
    else if (lastBracket !== -1) end = lastBracket;

    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        throw new Error("Failed to parse AI response as JSON");
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
    const supabaseAdmin = await createAdminClient();

    let extractedText = textContent || "";

    // 1. Extract text from PDF if provided
    if (fileData) {
      // Lazy-load pdf-parse to avoid build-time browser API issues
      const require = createRequire(import.meta.url);
      const pdf = require("pdf-parse");
      const result = await pdf(fileData);
      extractedText = result.text;
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return { success: false, error: "The document is too short or empty. Please provide more detail about your project." };
    }

    const { data: teamInfo } = await supabaseAdmin.from("hf_teams").select("event_id").eq("id", teamId).single();
    const eventId = teamInfo?.event_id;

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

    const result = await callWithRetry(() => flashModel.generateContent(prompt));
    await logAPIUsage(eventId, result, "DNA_SYNTHESIS");
    const milestones = extractJSON(result.response.text());

    // 3. Clear existing DNA for this team (Fresh Start)
    await supabaseAdmin.from("hf_project_dna").delete().eq("team_id", teamId);

    // 4. Generate Embeddings & Save to DB
    for (const milestone of milestones) {
      // Create a synthetic context for better vector matching
      const context = `${milestone.title}: ${milestone.criteria}`;
      
      const embeddingResult = await callWithRetry(() => embeddingModel.embedContent(context));
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

    // 5. AUTO-KANBAN GENERATION: Generate specific phased tasks
    const taskPrompt = `
        You are a Lead Technical Architect and Project Manager. Based on the following Project DNA, generate a comprehensive 3-Phase technical roadmap.
        
        CRITICAL: You must generate EXACTLY 4 specific, actionable technical tasks per phase (total 12 tasks).

        Project Milestones:
        ${JSON.stringify(milestones, null, 2)}

        Phase 1: Foundation (Environment, Auth, DB Schema, Core API structure)
        Phase 2: Core Logic (Primary features identified in milestones, critical UI/UX paths)
        Phase 3: Optimization (Edge cases, technical depth, AI refinement, final Deployment)

        Respond ONLY with a JSON array of objects:
        [{"phase": 1|2|3, "title": string, "description": string}]
    `;

    try {
        const taskResult = await callWithRetry(() => flashModel.generateContent(taskPrompt));
        await logAPIUsage(eventId, taskResult, "KANBAN_GENERATION");
        const tasks = extractJSON(taskResult.response.text());

        // Clear existing tasks to avoid duplicates if re-synthesizing
        await supabaseAdmin.from("hf_tasks").delete().eq("team_id", teamId);

        for (const task of tasks) {
            await supabaseAdmin.from("hf_tasks").insert({
                team_id: teamId,
                event_id: eventId,
                title: `[PHASE ${task.phase}] ${task.title}`,
                description: task.description,
                status: 'Todo'
            });
        }

        // Log the event to telemetry with the SPECIFIC notification language
        // The Chat Agent will monitor for "ROADMAP_READY" action_type
        await supabaseAdmin.from("hf_telemetry_logs").insert({
            team_id: teamId,
            action_type: "ROADMAP_READY",
            table_name: "hf_tasks",
            details: `Neural Uplink Successful. I have analyzed your SRS and generated 12 technical objectives across 3 implementation phases. Check your Objectives tab to begin.`
        });
    } catch (taskErr) {
        console.error("[AUTO_KANBAN_FAIL]:", taskErr);
    }

    return { success: true, count: milestones.length };

  } catch (err: any) {
    const errorMessage = err?.message || (err?.error?.message) || (typeof err === 'string' ? err : JSON.stringify(err));
    console.error("DNA_SYNTHESIS_CRITICAL_FAIL:", err);
    return { success: false, error: errorMessage };
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

    const { data: teamInfo } = await supabaseAdmin.from("hf_teams").select("event_id").eq("id", teamId).single();
    const eventId = teamInfo?.event_id;

    // 3. AI Evaluation
    const milestoneSummary = milestones.map((m: DNAMilestone, i: number) => `${i+1}. ${m.milestone_title}: ${m.milestone_description}`).join("\n");

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

    const result = await callWithRetry(() => flashModel.generateContent(prompt));
    await logAPIUsage(eventId, result, "CODE_AUDIT");
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

      const totalProgress = allMilestones?.reduce((acc: number, m: any) => {
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

  } catch (err: any) {
    const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
    console.error("CODE_AUDIT_FAIL:", err);
    return { success: false, error: `Evaluation failed: ${errorMessage}` };
  }
}

/**
 * PHASE 3: Deep Audit & Judging
 * A comprehensive evaluation of the project using Gemini 1.5 Pro.
 */
export async function performDeepAudit(teamId: string, eventId: string, problemStatement: string, rubric: Record<string, number>): Promise<{ success: boolean; evaluation?: JudgingResult; error?: string }> {
  console.log(`[DEEP_AUDIT] Starting for Team: ${teamId}, Event: ${eventId}`);
  try {
    const supabaseAdmin = await createAdminClient();

    // 1. Gather all "Evidence"
    const { data: milestones } = await supabaseAdmin.from("hf_project_dna").select("*").eq("team_id", teamId);
    const { data: team } = await supabaseAdmin.from("hf_teams").select("name, repo_url, ai_progress_score").eq("id", teamId).single();
    
    console.log(`[DEEP_AUDIT] Found ${milestones?.length || 0} milestones and repo: ${team?.repo_url}`);

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
                console.log(`[DEEP_AUDIT] Fetching GitHub tree: ${treeUrl}`);
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
                    console.log(`[DEEP_AUDIT] Successfully fetched ${data.tree.length} tree items`);
                } else {
                    console.warn(`[DEEP_AUDIT] GitHub fetch failed for main branch, trying master...`);
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
        milestones: milestones?.map((m: DNAMilestone) => ({ title: m.milestone_title, status: m.status, criteria: m.verification_criteria })),
        claimed_progress: team?.ai_progress_score || 0,
        repository_file_structure: repoStructure
    };

    console.log(`[DEEP_AUDIT] Preparing prompt for Gemini...`);

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
    let evaluationRaw: any;
    try {
        console.log(`[DEEP_AUDIT] Calling gemini-1.5-pro...`);
        const result = await callWithRetry(() => proModel.generateContent(prompt));
        await logAPIUsage(eventId, result, "DEEP_AUDIT");
        const responseText = result.response.text();
        console.log(`[DEEP_AUDIT] Raw response received, length: ${responseText.length}`);
        evaluationRaw = extractJSON(responseText);
        console.log(`[DEEP_AUDIT] gemini-1.5-pro SUCCESS`);
    } catch (proErr: any) {
        console.warn(`[DEEP_AUDIT] gemini-1.5-pro failed, trying flash fallback. Error: ${proErr.message}`);
        try {
            const result = await callWithRetry(() => flashModel.generateContent(prompt));
            await logAPIUsage(eventId, result, "DEEP_AUDIT_FALLBACK");
            const responseText = result.response.text();
            evaluationRaw = extractJSON(responseText);
            console.log(`[DEEP_AUDIT] gemini-1.5-flash fallback SUCCESS`);
        } catch (flashErr: any) {
            console.error(`[DEEP_AUDIT] Flash fallback also failed: ${flashErr.message}`);
            throw new Error(`AI Audit failed: ${flashErr.message}`);
        }
    }

    if (!evaluationRaw) {
        throw new Error("AI returned an empty or invalid evaluation.");
    }

    console.log(`[DEEP_AUDIT] Evaluation data ready. Saving to DB...`);

    // 2. Save result to DB (Manual Upsert to handle missing unique constraint)
    const { data: existing } = await supabaseAdmin
        .from("hf_judging_results")
        .select("id")
        .eq("team_id", teamId)
        .maybeSingle();

    const resultPayload = {
        team_id: teamId,
        event_id: eventId,
        alignment_score: evaluationRaw.alignment_score || 0,
        execution_score: evaluationRaw.execution_score || 0,
        innovation_score: evaluationRaw.innovation_score || 0,
        technical_score: evaluationRaw.technical_score || 0,
        total_score: evaluationRaw.total_weighted_score || evaluationRaw.total_score || 0,
        ai_justification: evaluationRaw.ai_justification || "No justification provided."
    };

    let dbRes;
    if (existing) {
        dbRes = await supabaseAdmin
            .from("hf_judging_results")
            .update(resultPayload)
            .eq("id", existing.id)
            .select()
            .single();
    } else {
        dbRes = await supabaseAdmin
            .from("hf_judging_results")
            .insert(resultPayload)
            .select()
            .single();
    }

    const { data: savedResult, error: dbError } = dbRes;

    if (dbError) {
        console.error(`[DEEP_AUDIT] DB Error: ${dbError.message}`);
        throw dbError;
    }
    
    console.log(`[DEEP_AUDIT] Results saved to DB for team ${teamId}`);

    // 3. GENERATE TEAM COACHING INSIGHTS (Background)
    try {
        await generateAIInsights(teamId);
    } catch (insightErr) {
        console.error("[DEEP_AUDIT] Failed to generate insights:", insightErr);
    }

    return { success: true, evaluation: savedResult as JudgingResult };

  } catch (err: any) {
    const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
    console.error("[DEEP_AUDIT_CRITICAL_FAIL]:", err);
    return { 
      success: false, 
      error: `Audit Error: ${errorMessage}` 
    };
  }
}

/**
 * COMPREHENSIVE RE-AUDIT
 * Forces a re-check of all milestones against the repo structure and then runs deep audit.
 */
export async function reAuditTeamWork(teamId: string) {
    console.log(`[RE_AUDIT] Initiating comprehensive re-audit for team ${teamId}`);
    try {
        const supabaseAdmin = await createAdminClient();

        // 1. Fetch Team info
        const { data: team, error: teamError } = await supabaseAdmin
            .from("hf_teams")
            .select("*")
            .eq("id", teamId)
            .single();

        if (teamError || !team) {
            console.error(`[RE_AUDIT] Team ${teamId} not found in DB`);
            throw new Error("Team not found");
        }
        
        // 2. Fetch Event info separately to be safe
        const { data: event, error: eventError } = await supabaseAdmin
            .from("hf_events")
            .select("*")
            .eq("id", team.event_id)
            .single();

        if (eventError || !event) {
            console.error(`[RE_AUDIT] Event ${team.event_id} not found for team ${teamId}`);
            throw new Error("Associated event not found");
        }

        console.log(`[RE_AUDIT] Found team "${team.name}" and event "${event.name}"`);

        // 3. Fetch repo structure
        let repoStructure = "";
        if (team.repo_url && team.repo_url.includes("github.com")) {
            const parts = team.repo_url.replace(/\/$/, "").split("/");
            const repo = parts.pop();
            const owner = parts.pop();
            if (owner && repo) {
                const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
                console.log(`[RE_AUDIT] Fetching repo structure: ${treeUrl}`);
                try {
                    const response = await fetch(treeUrl, {
                        headers: { 'Accept': 'application/vnd.github.v3+json' }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        repoStructure = data.tree
                            .filter((item: any) => item.type === 'blob')
                            .slice(0, 300) // Slightly more for full re-audit
                            .map((item: any) => item.path)
                            .join("\n");
                        console.log(`[RE_AUDIT] Repo structure fetched: ${data.tree.length} files`);
                    } else {
                        console.warn(`[RE_AUDIT] GitHub fetch failed for main branch (Status: ${response.status}), trying master...`);
                        const masterUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
                        const masterResponse = await fetch(masterUrl);
                        if (masterResponse.ok) {
                            const data = await masterResponse.json();
                            repoStructure = data.tree
                                .filter((item: any) => item.type === 'blob')
                                .slice(0, 300)
                                .map((item: any) => item.path)
                                .join("\n");
                            console.log(`[RE_AUDIT] Repo structure fetched from master: ${data.tree.length} files`);
                        }
                    }
                } catch (fetchErr) {
                    console.error(`[RE_AUDIT] Network error fetching repo structure:`, fetchErr);
                }
            }
        }

        if (!repoStructure) {
            console.error(`[RE_AUDIT] Could not build repository structure for team ${teamId}`);
            return { success: false, error: "Could not fetch repository structure. Ensure the GitHub URL is correct, public, and contains code." };
        }

        // 4. Re-evaluate Milestones
        const { data: milestones } = await supabaseAdmin.from("hf_project_dna").select("*").eq("team_id", teamId);
        if (milestones && milestones.length > 0) {
            console.log(`[RE_AUDIT] Re-evaluating ${milestones.length} milestones with Gemini Flash Lite...`);
            const milestoneSummary = milestones.map((m: DNAMilestone, i: number) => `${i+1}. ${m.milestone_title}: ${m.verification_criteria}`).join("\n");
            
            const prompt = `
                Analyze the following repository file structure against these project milestones.
                Identify which milestones are likely implemented based on the files present.
                
                Milestones:
                ${milestoneSummary}

                Repo Structure:
                ${repoStructure}

                Respond ONLY with a JSON array of status updates:
                [{"index": number, "status": "complete" | "in_progress" | "pending"}]
            `;

            try {
                const result = await callWithRetry(() => flashModel.generateContent(prompt));
                await logAPIUsage(event.id, result, "RE_AUDIT_MILESTONES");
                const updates = extractJSON(result.response.text());
                console.log(`[RE_AUDIT] Gemini Flash returned ${updates?.length || 0} updates`);

                for (const update of updates) {
                    if (update.index > 0 && update.index <= milestones.length) {
                        await supabaseAdmin
                            .from("hf_project_dna")
                            .update({ status: update.status })
                            .eq("id", milestones[update.index - 1].id);
                    }
                }
            } catch (aiErr) {
                console.error(`[RE_AUDIT] AI Milestone evaluation failed:`, aiErr);
                // Continue anyway to try deep audit
            }
        } else {
            console.warn(`[RE_AUDIT] No milestones found for team ${teamId}. Skipping milestone re-evaluation.`);
        }

        // 5. Update Progress Score
        const { data: updatedMilestones } = await supabaseAdmin.from("hf_project_dna").select("weight, status").eq("team_id", teamId);
        const totalProgress = updatedMilestones?.reduce((acc: number, m: any) => {
            if (m.status === 'complete') return acc + m.weight;
            if (m.status === 'in_progress') return acc + (m.weight * 0.3);
            return acc;
        }, 0) || 0;

        await supabaseAdmin.from("hf_teams").update({ ai_progress_score: Math.min(Math.round(totalProgress), 100) }).eq("id", teamId);
        console.log(`[RE_AUDIT] Progress score updated: ${totalProgress}%`);

        // 6. Run Deep Audit
        console.log(`[RE_AUDIT] Triggering final Deep Audit...`);
        const auditRes = await performDeepAudit(
            teamId, 
            event.id, 
            event.problem_statement || "Build a hackathon project", 
            event.judging_rubric || { "Alignment": 25, "Execution": 25, "Innovation": 25, "Technical Depth": 25 }
        );

        if (!auditRes.success) {
            console.error(`[RE_AUDIT] Deep Audit failed: ${auditRes.error}`);
            return { success: false, error: `Milestones updated, but final audit failed: ${auditRes.error}` };
        }

        console.log(`[RE_AUDIT] SUCCESS for team ${teamId}`);
        return { success: true, progress: totalProgress, audit: auditRes.evaluation };

    } catch (err: any) {
        const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
        console.error("[RE_AUDIT_CRITICAL_FAIL]:", err);
        return { success: false, error: `Re-audit failed: ${errorMessage}` };
    }
}

/**
 * PHASE 4: AI Insights & Coaching
 * Generates actionable advice and reminders for a team based on their current progress and repo.
 */
export async function generateAIInsights(teamId: string) {
    try {
        const supabaseAdmin = await createAdminClient();

        // 1. Gather Context
        const { data: team } = await supabaseAdmin.from("hf_teams").select("*").eq("id", teamId).single();
        const { data: milestones } = await supabaseAdmin.from("hf_project_dna").select("*").eq("team_id", teamId);
        const { data: judging } = await supabaseAdmin.from("hf_judging_results").select("*").eq("team_id", teamId).maybeSingle();

        if (!team || !milestones) throw new Error("Team context not found.");

        const context = {
            teamName: team.name,
            currentProgress: team.ai_progress_score || 0,
            milestones: milestones.map(m => ({ title: m.milestone_title, status: m.status })),
            latestJudging: judging ? { 
                justification: judging.ai_justification,
                totalScore: judging.total_score 
            } : null
        };

        const prompt = `
            You are a Technical Mentor for a Hackathon. Analyze the following team progress and provide 3-4 actionable insights.
            - If they are stuck (low progress), give them a roadmap.
            - If they have good progress but low scores, suggest technical improvements.
            - Provide 1 specific "Reminder" for their next technical hurdle.

            Team Progress Context:
            ${JSON.stringify(context, null, 2)}

            Respond ONLY with a JSON object:
            {
                "briefing": "A 2-sentence summary of their current situation.",
                "insights": [
                    { "type": "suggestion" | "reminder" | "warning", "text": "The advice text" }
                ],
                "next_milestone": "The title of the milestone they should focus on now."
            }
        `;

        const result = await callWithRetry(() => flashModel.generateContent(prompt));
        await logAPIUsage(team.event_id, result, "AI_INSIGHTS");
        const insightData = extractJSON(result.response.text());

        // Update the team with the latest briefing
        await supabaseAdmin.from("hf_teams").update({
            ai_status_summary: insightData.briefing
        }).eq("id", teamId);

        // Store detailed insights in telemetry for historical tracking
        await supabaseAdmin.from("hf_telemetry_logs").insert({
            team_id: teamId,
            action_type: "AI_INSIGHT",
            table_name: "hf_teams",
            details: JSON.stringify(insightData)
        });

        return { success: true, insights: insightData };
    } catch (err: any) {
        console.error("AI_INSIGHTS_FAIL:", err);
        return { success: false, error: err.message };
    }
}

/**
 * PHASE 5: Neural Chat Agent (Interactive Coaching)
 * Handles conversational queries from team members, personalized by their role.
 */
export async function neuralChatAction(teamId: string, role: string, history: { role: 'user' | 'model', parts: string }[], userMessage: string) {
    try {
        const supabaseAdmin = await createAdminClient();

        // 1. Context Injection
        const { data: team } = await supabaseAdmin.from("hf_teams").select("*").eq("id", teamId).single();
        const { data: milestones } = await supabaseAdmin.from("hf_project_dna").select("*").eq("team_id", teamId);
        const { data: currentJudging } = await supabaseAdmin.from("hf_judging_results").select("*").eq("team_id", teamId).maybeSingle();
        const { data: currentTasks } = await supabaseAdmin.from("hf_tasks").select("*").eq("team_id", teamId);
        const { data: recentCommits } = await supabaseAdmin.from("repository_commits").select("*").eq("team_id", teamId).order("created_at", { ascending: false }).limit(5);
        
        if (!team || !milestones) throw new Error("Neural link unstable: Context lost.");

        const systemPrompt = `
            You are the "Neural Link Agent", a high-tech technical mentor for a hackathon.
            Current User Role: ${role}
            Team Context: "${team.name}" | Progress: ${team.ai_progress_score}%
            Milestones: ${milestones.map(m => m.milestone_title + " (" + m.status + ")").join(", ")}
            Current Kanban Objectives: ${currentTasks?.map(t => t.title + " [ID: " + t.id + "] status: " + t.status).join(", ") || "None"}
            Recent Commits: ${recentCommits?.map(c => c.message + " [SHA: " + c.commit_sha + "]").join(", ") || "No commits detected."}

            Role-Based Instructions:
            - If role is LEAD: Focus on high-level architecture, roadmap optimization, and ensuring milestones are met.
            - If role is MEMBER: Focus on specific technical implementations, bug-fixing, and individual task execution.

            SPECIAL COMMAND: /critique
            - Perform a "Shadow Audit" and provide predictive scores and advice.

            SPECIAL COMMAND: /demo
            - Generate a 3-minute Pitch Script and technical README outline.

            UNIVERSAL ACTION PROTOCOL:
            - You can suggest technical actions that the user can approve via a button.
            - If you suggest actions, you MUST append a single JSON array block at the VERY END of your response on a new line prefixed with "ACTION_PROTOCOL: ".
            - Example: ACTION_PROTOCOL: [{"type": "ADD_TASK", "payload": {"title": "Task 1", "description": "Desc", "phase": 1}}]
            - Action Types:
                1. {"type": "ADD_TASK", "payload": {"title": string, "description": string, "phase": 1|2|3}}
                2. {"type": "LINK_COMMIT", "payload": {"taskId": string, "commitSha": string, "taskTitle": string}}

            - USE LINK_COMMIT when: You see a recent commit that seems to complete an unverified task.
            - USE ADD_TASK when: The user asks for "next steps" or you identify a missing technical component.
            Library Uplink (Proactive Advice):
            - Recommend specific tools using the "💡" symbol. No code snippets.

            Formatting Instructions:
            - Use Markdown for organization (## Headings, **bold**, lists).
            - Keep responses structured and professional.

            Personality: Futuristic, tech-noir terminology ("uplink", "logic gates").
            Goal: Keep the team on track and solve technical hurdles.
        `;

        // Start chat with context
        const chat = flashModel.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: "Neural uplink established. Listening for command..." }] },
                ...history.map(h => ({ role: h.role, parts: [{ text: h.parts }] }))
            ]
        });

        // 2. Persist User Message
        await supabaseAdmin.from("hf_telemetry_logs").insert({
            team_id: teamId,
            action_type: "CHAT_MESSAGE",
            table_name: "hf_chat",
            details: JSON.stringify({ role: 'user', parts: userMessage, user_role: role })
        });

        const result = await callWithRetry(() => chat.sendMessage(userMessage));
        await logAPIUsage(team.event_id, result, "NEURAL_CHAT");
        const fullResponse = result.response.text();

        // 3. Persist Model Response (Keep raw protocol for UI to parse)
        await supabaseAdmin.from("hf_telemetry_logs").insert({
            team_id: teamId,
            action_type: "CHAT_MESSAGE",
            table_name: "hf_chat",
            details: JSON.stringify({ role: 'model', parts: fullResponse, user_role: role })
        });

        return { success: true, response: fullResponse };
    } catch (err: any) {
        console.error("NEURAL_CHAT_FAIL:", err);
        return { success: false, error: "Communication link severed. Try again." };
    }
}

export async function getChatHistory(teamId: string) {
    try {
        const supabaseAdmin = await createAdminClient();
        const { data, error } = await supabaseAdmin
            .from("hf_telemetry_logs")
            .select("*")
            .eq("team_id", teamId)
            .eq("action_type", "CHAT_MESSAGE")
            .order("created_at", { ascending: true });

        if (error) throw error;

        return { 
            success: true, 
            history: data.map(log => {
                try {
                    const details = JSON.parse(log.details);
                    return {
                        role: details.role,
                        parts: details.parts
                    };
                } catch (e) {
                    console.error("[CHAT_HISTORY_PARSE_ERR]:", e, log.details);
                    return null;
                }
            }).filter(h => h !== null) 
        };
    } catch (err: any) {
        console.error("GET_CHAT_HISTORY_FAIL:", err);
        return { success: false, history: [] };
    }
}

/**
 * EVALUATES THE 'VIBE' OF A COMMIT FOR THE WAR ROOM MEME SYSTEM
 */
export async function evaluateCommitVibe(teamName: string, commitMessage: string) {
    try {
        const prompt = `
            You are a snarky, high-octane Hackathon Meme Architect. 
            Analyze this commit and determine its "Vibe".
            
            Team: ${teamName}
            Message: "${commitMessage}"

            CATEGORIES:
            1. BULK: A massive amount of code, likely un-tested or a huge feature dump.
            2. FRANTIC: Quick, short messages like "fix", "please work", "test", or rapid succession.
            3. START: The very first steps or project initialization.
            4. HYPE: High quality logic, major milestones, or clean progress.
            5. END: Committing right before the deadline.

            Respond ONLY with a JSON object:
            {
                "searchTerm": "A precise phrase to search on Giphy for a relevant meme (e.g., 'dumping trash', 'hacking fast', 'nervous sweat')",
                "commentary": "A 1-sentence snarky or hype comment to the team.",
                "vibe": "BULK" | "FRANTIC" | "START" | "HYPE" | "END"
            }
        `;

        const result = await flashModel.generateContent(prompt);
        return extractJSON(result.response.text());
    } catch (err) {
        console.error("VIBE_CHECK_FAIL:", err);
        return { searchTerm: "hacker", commentary: "System anomaly detected.", vibe: "HYPE" };
    }
}
export async function generateArchitectBroadcast(teamId: string, eventId: string) {
    try {
        const supabaseAdmin = await createAdminClient();

        // 1. Check if we already sent a broadcast recently (e.g., last 20 mins) to avoid spam
        const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
        const { data: recentLogs } = await supabaseAdmin
            .from("hf_telemetry_logs")
            .select("id")
            .eq("team_id", teamId)
            .eq("action_type", "ARCHITECT_BROADCAST")
            .gt("created_at", twentyMinsAgo)
            .limit(1);

        if (recentLogs && recentLogs.length > 0) {
            return { success: true, skipped: true, message: "Last broadcast was recent. Maintaining radio silence." };
        }

        // 2. Gather context for Gemini
        const [commitsRes, tasksRes, teamRes] = await Promise.all([
            supabaseAdmin.from("repository_commits").select("message, created_at").eq("team_id", teamId).order("created_at", { ascending: false }).limit(5),
            supabaseAdmin.from("hf_tasks").select("title, status").eq("team_id", teamId),
            supabaseAdmin.from("hf_teams").select("name, ai_status_summary").eq("id", teamId).single()
        ]);

        const recentCommits = commitsRes.data?.map(c => c.message).join(", ") || "None";
        const taskSummary = tasksRes.data?.map(t => `${t.title} (${t.status})`).join(", ") || "No tasks initialized.";
        const teamName = teamRes.data?.name || "Unknown Team";

        // 3. Generate Prompt
        const prompt = `
            You are the "Architect" - the elite, pro-active AI technical lead for the Hack-Flow platform.
            Your goal is to monitor teams and give them high-impact, tactical, and slightly aggressive technical advice to push them forward.
            
            Team: ${teamName}
            Current AI Status: ${teamRes.data?.ai_status_summary || "Unknown"}
            Recent GitHub Commits: ${recentCommits}
            Kanban Tasks: ${taskSummary}

            INSTRUCTIONS:
            - Analyze if they are "Hot" (pushed recently), "Warm" (active but slow), or "Stuck" (no commits or tasks in review).
            - Give one sentence of blunt, cyber-punk technical advice.
            - Focus on a specific technical gap (e.g., lack of auth, slow deployment, missing tests).
            - Use a commanding but professional tone.
            - Keep it under 25 words.

            OUTPUT FORMAT: Raw text only. No intro, no "Architect says". Just the transmission.
        `;

        const result = await flashModel.generateContent(prompt);
        const broadcast = result.response.text().trim();

        // 4. Log the broadcast
        await supabaseAdmin.from("hf_telemetry_logs").insert({
            team_id: teamId,
            action_type: "ARCHITECT_BROADCAST",
            table_name: "hf_architect",
            details: broadcast
        });

        // 5. Log API Usage
        await logAPIUsage(eventId, result.response, "ARCHITECT_BROADCAST");

        return { success: true, broadcast };
    } catch (err) {
        console.error("ARCHITECT_BROADCAST_FAIL:", err);
        return { success: false, error: "Radio link interference." };
    }
}


