// File: app/api/ai/generate-journey-map/route.ts
import { NextResponse } from "next/server";
import { getUserApiKey } from "@/lib/ai/get-user-api-key";
import type { JourneyStage } from "@/lib/types/database";

/**
 * @method POST
 * @description Generate journey map stages using AI
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user and get API key
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

    // 2. Parse request body
    const { prompt, model = "gpt-4o" } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    console.log("🤖 Calling OpenAI API with model:", model);
    console.log("📝 Prompt length:", prompt.length, "characters");

    // 4. Call OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const aiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content:
                  "You are an expert UX researcher and designer. Generate concise, realistic user journey map stages based on the provided persona and user stories. Always respond with valid JSON. IMPORTANT: Use decimal numbers (floats) for emotion ratings (e.g., 3.7, 4.2) for precise emotional states, not integers. For each pain point, provide a corresponding opportunity (solution approach). The opportunities array should have the same length as painPoints array, with each opportunity addressing the corresponding pain point. Keep responses concise.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000, // Reduced from 4000 for faster response
          }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      const aiData = await aiResponse.json();

      // Check if OpenAI returned an error (e.g., quota exceeded, invalid key)
      if (!aiResponse.ok || aiData.error) {
        console.error("OpenAI API error:", aiResponse.status, aiData);
        return NextResponse.json(
          {
            error: "OpenAI request failed",
            status: aiResponse.status,
            code: aiData?.error?.code,
            message: aiData?.error?.message || "Unknown OpenAI error",
          },
          { status: 502 },
        );
      }

      const aiContent = aiData.choices?.[0]?.message?.content;

      if (!aiContent) {
        console.error("No content in AI response:", aiData);
        return NextResponse.json(
          { error: "No response from AI", message: "The AI returned an empty response" },
          { status: 500 },
        );
      }

      console.log("✅ AI Response received, length:", aiContent.length);

      // 5. Parse the AI response
      const stages = parseAIResponseToStages(aiContent);

      if (!stages || stages.length === 0) {
        console.error("Failed to parse stages from AI response");
        return NextResponse.json(
          {
            error: "Failed to parse AI response",
            rawResponse: aiContent,
          },
          { status: 500 },
        );
      }

      console.log("✅ Parsed", stages.length, "stages successfully");

      // 6. Return parsed stages
      return NextResponse.json({
        stages,
        rawResponse: aiContent,
        model: aiData.model,
        usage: aiData.usage,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("OpenAI API timeout after 30 seconds");
        return NextResponse.json(
          { error: "AI request timeout. Please try again." },
          { status: 504 },
        );
      }

      throw fetchError; // Re-throw other errors
    }
  } catch (error: unknown) {
    console.error("Error in generate-journey-map API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * AI Response Stage Interface
 * Supports multiple naming conventions from different AI models
 */
interface AIStageResponse {
  // Name variants
  name?: string;
  stageName?: string;
  "Stage Name"?: string;

  // Description variants
  description?: string;
  Description?: string;

  // Actions variants
  actions?: string[];
  Actions?: string[];

  // Thoughts variants
  thoughts?: string[];
  Thoughts?: string[];

  // Emotions variants
  emotions?: number;
  Emotions?: number;

  // Pain Points variants
  painPoints?: string[];
  "Pain Points"?: string[];
  painpoints?: string[];

  // Opportunities variants
  opportunities?: string[];
  Opportunities?: string[];

  // Touchpoints variants
  touchpoints?: string[];
  Touchpoints?: string[];
}

/**
 * Parse AI response and extract journey stages
 * Supports multiple naming conventions from different AI models
 */
function parseAIResponseToStages(aiContent: string): JourneyStage[] {
  try {
    // Try to find JSON in the response (handles markdown code blocks)
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as AIStageResponse[];

      // Validate and transform the stages
      return parsed.map((stage: AIStageResponse) => transformStage(stage));
    }

    // If no JSON found, try to parse as full JSON object
    const fullParse = JSON.parse(aiContent) as AIStageResponse[];
    if (Array.isArray(fullParse)) {
      return fullParse.map((stage: AIStageResponse) => transformStage(stage));
    }

    console.error("Could not find valid JSON in AI response");
    return [];
  } catch (error) {
    console.error("Error parsing AI response:", error);
    console.log("Raw AI content:", aiContent.substring(0, 500));
    return [];
  }
}

/**
 * Transform AI stage response to JourneyStage
 * Handles multiple naming conventions (camelCase, PascalCase, "Spaced Words")
 */
function transformStage(stage: AIStageResponse): JourneyStage {
  return {
    name:
      stage.name || stage.stageName || stage["Stage Name"] || "Unnamed Stage",
    description: stage.description || stage.Description || "",
    actions: Array.isArray(stage.actions || stage.Actions)
      ? stage.actions || stage.Actions || []
      : [],
    thoughts: Array.isArray(stage.thoughts || stage.Thoughts)
      ? stage.thoughts || stage.Thoughts || []
      : [],
    emotions:
      typeof (stage.emotions ?? stage.Emotions) === "number"
        ? parseFloat(
            Math.max(
              1,
              Math.min(5, stage.emotions ?? stage.Emotions ?? 3),
            ).toFixed(1),
          )
        : 3.0,
    painPoints: Array.isArray(
      stage.painPoints || stage["Pain Points"] || stage.painpoints,
    )
      ? stage.painPoints || stage["Pain Points"] || stage.painpoints || []
      : [],
    opportunities: Array.isArray(stage.opportunities || stage.Opportunities)
      ? stage.opportunities || stage.Opportunities || []
      : [],
    touchpoints: Array.isArray(stage.touchpoints || stage.Touchpoints)
      ? stage.touchpoints || stage.Touchpoints || []
      : [],
  };
}
