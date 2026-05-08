"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFParse } from "pdf-parse";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

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
      const parser = new PDFParse({ data: fileData });
      const result = await parser.getText();
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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean JSON response (handle potential markdown blocks)
    const jsonString = responseText.replace(/```json|```/g, "").trim();
    const milestones = JSON.parse(jsonString);

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
      
      Project Milestones:
      ${milestoneSummary}

      Developer Context (Commit/PR Message):
      "${contextMessage}"

      Code Diff:
      ${cleanedDiff}

      Evaluate if this code change directly implements or progresses any of the milestones.
      Respond ONLY with a JSON object:
      {
        "milestone_index": number (1-based index from the list above, or 0 if no match),
        "confidence": number (0-100),
        "status_update": "in_progress" | "complete" | "none",
        "reasoning": "1-sentence explanation"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const evaluation = JSON.parse(responseText.replace(/```json|```/g, "").trim());

    if (evaluation.milestone_index > 0 && evaluation.confidence > 70) {
      const targetMilestone = milestones[evaluation.milestone_index - 1];
      
      // Update Milestone Status
      if (evaluation.status_update !== "none") {
        await supabaseAdmin
          .from("hf_project_dna")
          .update({ status: evaluation.status_update })
          .eq("id", targetMilestone.id);
      }

      // 4. Update Team Progress Score
      // Calculate new score: sum of weights of completed milestones
      const { data: allMilestones } = await supabaseAdmin
        .from("hf_project_dna")
        .select("weight, status")
        .eq("team_id", teamId);

      const totalProgress = allMilestones?.reduce((acc, m) => {
        if (m.status === 'complete') return acc + m.weight;
        if (m.status === 'in_progress') return acc + (m.weight * 0.3); // Partial credit
        return acc;
      }, 0) || 0;

      await supabaseAdmin
        .from("hf_teams")
        .update({ 
          ai_progress_score: Math.min(Math.round(totalProgress), 100),
          ai_status_summary: evaluation.reasoning
        })
        .eq("id", teamId);

      return { success: true, matched: targetMilestone.milestone_title, progress: totalProgress };
    }

    return { success: true, matched: null };

  } catch (err: unknown) {
    console.error("CODE_AUDIT_FAIL:", err);
    return { success: false, error: "Evaluation failed." };
  }
}
