import { NextResponse } from "next/server";
import { getUserApiKey } from "@/lib/ai/get-user-api-key";
import { z } from "zod";

/* ---------------------------- ZOD SCHEMA ---------------------------- */

export const PersonaSchema = z.object({
  name: z.string(),
  role: z.string(),

  age: z.string(),
  occupation: z.string(),
  location: z.string(),
  gender: z.string(),
  relationship_status: z.string(),
  education: z.string(),

  buzzwords: z.array(z.string()).max(6),

  personality_01: z.number().min(0).max(100),
  personality_02: z.number().min(0).max(100),
  personality_03: z.number().min(0).max(100),
  personality_04: z.number().min(0).max(100),

  motivation: z.string(),
  goals: z.array(z.string()).max(3),
  pain_points: z.array(z.string()).max(3),

  skill_01: z.number().min(0).max(10),
  skill_02: z.number().min(0).max(10),
  skill_03: z.number().min(0).max(10),

  skin_tone: z.enum(["tone0", "tone1", "tone2"]),
});

export type Persona = z.infer<typeof PersonaSchema>;

/* -------------------------- PROMPTS -------------------------- */

const SYSTEM_PROMPT = `
You output ONLY valid JSON. 
No markdown, no text outside JSON. 
Follow the schema exactly.

SCHEMA:
{
  "name": "string",
  "role": "string",
  "age": "string",
  "occupation": "string",
  "location": "string",
  "gender": "Male | Female | Divers",
  "relationship_status": "string",
  "education": "string",
  "buzzwords": "string[] (max 5)",
  "personality_01": "number (between 0-100) - Introverted <-> Extroverted, 0 = extremely introverted, 100 = extremely extroverted",
  "personality_02": "number (between 0-100) - Thinking <-> Feeling, 0 = acting based on thinking, 100 = acting based on feelings",
  "personality_03": "number (between 0-100) - Intuitive <-> Observant, 0 = extremely intuitive, 100 = extremely observant",
  "personality_04": "number (between 0-100) - Independent <-> Team player, 0 = works best alone, 100 = works best in a team",
  "motivation": "string - about 3-4 sentences",
  "goals": "string[] (max 3)",
  "pain_points": "string[] (max 3)",
  "skill_01": "number (between 0-10) - Domain Knowledge, 0 = weak domain knowledge, 10 = strong domain knowledge",
  "skill_02": "number (between 0-10) - Technology Prodiciency, 0 = no technology proficiency, 10 = strong technology proficiency",
  "skill_03": "number (between 0-10) - Adaptability, 0 = cannot adapt well, 10 = can adapt well",
  "skin_tone": "tone0 | tone1 | tone2 - tone0 is light skin color, tone1 is medium skin color and tone2 is the darkest skin color"
}
`;

const userPrompt = (name: string, role: string) =>
  `Create a persona.\nName: ${name}\nRole: ${role}\nReturn ONLY valid JSON.`;

/* --------------------------- API ROUTE --------------------------- */

export async function POST(request: Request) {
  try {
    // Get user's API key
    const { apiKey, error: keyError, userId } = await getUserApiKey();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: keyError || "API key not configured", code: "NO_API_KEY" },
        { status: 401 },
      );
    }

    const { name, role } = await request.json();
    if (!name || !role)
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 },
      );

    /* -------------------- Primary LLM call -------------------- */
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_output_tokens: 400,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt(name, role) },
        ],
      }),
    });

    const data = await response.json();

    // 2) If OpenAI returned an error, STOP here (do not parse)
    if (!response.ok) {
      console.error("OpenAI API error:", response.status, data);
      return NextResponse.json(
        {
          error: "OpenAI request failed",
          status: response.status,
          code: data?.error?.code,
          message: data?.error?.message,
        },
        { status: 502 }, // or 402 for quota; 502 is generic upstream failure
      );
    }
    /* ---------------- SAFE RAW TEXT EXTRACTION ---------------- */

    let rawText: string | undefined =
      data.output_text ?? data.output?.[0]?.content?.[0]?.text ?? undefined;

    if (!rawText) {
      console.error("Unexpected LLM response shape:", data);
      return NextResponse.json(
        { error: "Unexpected model response format", details: data },
        { status: 500 },
      );
    }

    /* -------------------- Try validation -------------------- */
    let persona: Persona;

    try {
      persona = PersonaSchema.parse(JSON.parse(rawText));
    } catch {
      console.warn("Invalid JSON detected. Attempting repair…");

      const repairResponse = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_output_tokens: 300,
            input: [
              {
                role: "system",
                content: `You fix invalid JSON. Output ONLY valid JSON.`,
              },
              {
                role: "user",
                content: `Fix this JSON:\n${rawText}`,
              },
            ],
          }),
        },
      );
      const repaired = await repairResponse.json();
      rawText =
        repaired.output_text ??
        repaired.output?.[0]?.content?.[0]?.text ??
        undefined;

      if (!rawText) {
        return NextResponse.json(
          { error: "Repair failed. Bad model response.", details: repaired },
          { status: 500 },
        );
      }

      persona = PersonaSchema.parse(JSON.parse(rawText));
    }

    return NextResponse.json({ persona });
  } catch (err) {
    console.error("Persona API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
