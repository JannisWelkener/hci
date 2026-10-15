import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { generateUserStorySchema } from "@/lib/validations/user-story";
import { getUserApiKey } from "@/lib/ai/get-user-api-key";
import {
  generateUserStory,
  storyToInput,
  validateGeneratedStory,
} from "@/lib/services/ai-story-generator";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/projects/[id]/user-stories/generate
 * Generate user story fields using AI from a description
 * Returns the generated fields without saving to database
 * The frontend can display these in a form for user review/editing
 * before creating via the regular POST /api/projects/[id]/user-stories endpoint
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;

    // Get user's API key
    const { apiKey, error: keyError, userId } = await getUserApiKey();

    if (!userId) {
      return errorResponse("Unauthorized", 401);
    }

    if (!apiKey) {
      return errorResponse(
        keyError ||
          "API key not configured. Please add your OpenAI API key in Settings.",
        401,
      );
    }

    const supabase = await createClient();

    // Parse request body
    const body = await request.json();

    // Validate request body
    const parseResult = generateUserStorySchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(
        `Invalid request body: ${parseResult.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`,
        400,
      );
    }

    const { description } = parseResult.data;

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return errorResponse("Project not found or access denied", 404);
    }

    // Generate user story using AI service
    let generatedStory;
    try {
      generatedStory = await generateUserStory({
        description,
        projectId,
        apiKey,
      });
    } catch (aiError) {
      console.error("AI generation error:", aiError);
      const errorMessage =
        aiError instanceof Error
          ? aiError.message
          : "Failed to generate user story";
      return errorResponse(errorMessage, 500);
    }

    // Validate generated story
    if (!validateGeneratedStory(generatedStory)) {
      console.error("Generated story failed validation:", generatedStory);
      return errorResponse("Generated story is invalid", 500);
    }

    // Convert to input format
    const userStoryInput = storyToInput(generatedStory, description);

    // Return the generated story fields without saving to database
    // The frontend can show these fields in a form for user review/editing
    // and then use the regular POST endpoint to create the story
    return successResponse(
      {
        ...userStoryInput,
        generation_method: "ai_generated",
      },
      200,
    );
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/projects/[projectId]/user-stories/generate:",
      error,
    );
    return errorResponse("Internal server error", 500);
  }
}
