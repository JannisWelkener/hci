import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  calculatePagination,
} from "@/lib/utils/api";
import {
  createUserStorySchema,
  getUserStoriesQuerySchema,
  type CreateUserStoryInput,
} from "@/lib/validations/user-story";
import type { UserStory, PaginatedResponse } from "@/lib/types/database";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]/user-stories
 * Retrieve all user stories for a specific project
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const queryResult = getUserStoriesQuerySchema.safeParse(searchParams);

    if (!queryResult.success) {
      return errorResponse(
        `Invalid query parameters: ${queryResult.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`,
        400
      );
    }

    const { page, limit, sort, order } = queryResult.data;

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return errorResponse("Project not found or access denied", 404);
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("user_stories")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    if (countError) {
      console.error("Error counting user stories:", countError);
      return errorResponse("Failed to count user stories", 500);
    }

    // Fetch user stories with pagination and sorting
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: userStories, error } = await supabase
      .from("user_stories")
      .select("*")
      .eq("project_id", projectId)
      .order(sort, { ascending: order === "asc" })
      .range(from, to);

    if (error) {
      console.error("Error fetching user stories:", error);
      return errorResponse("Failed to fetch user stories", 500);
    }

    const response: PaginatedResponse<UserStory> = {
      items: userStories as UserStory[],
      pagination: calculatePagination(count || 0, page, limit),
    };

    return successResponse(response);
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/projects/[projectId]/user-stories:",
      error
    );
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/projects/[id]/user-stories
 * Create a new user story
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const parseResult = createUserStorySchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`,
        400
      );
    }

    const userStoryData = parseResult.data as CreateUserStoryInput;

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return errorResponse("Project not found or access denied", 404);
    }

    // Validate dependencies if provided
    if (userStoryData.dependencies && userStoryData.dependencies.length > 0) {
      const dependencyIds = userStoryData.dependencies

      // Check that all dependency stories exist and belong to the same project
      const { data: dependentStories, error: depError } = await supabase
        .from("user_stories")
        .select("id, project_id")
        .in("id", dependencyIds);

      if (depError) {
        console.error("Error validating dependencies:", depError);
        return errorResponse("Failed to validate dependencies", 500);
      }

      if (
        !dependentStories ||
        dependentStories.length !== dependencyIds.length
      ) {
        return errorResponse("One or more dependency stories not found", 400);
      }

      const invalidDeps = dependentStories.filter(
        (story) => story.project_id !== projectId
      );
      if (invalidDeps.length > 0) {
        return errorResponse("Dependencies must be from the same project", 400);
      }
    }

    // Auto-calculate priority_order if not provided
    let priorityOrder = userStoryData.priority_order;
    if (priorityOrder === undefined || priorityOrder === null) {
      // Get the min priority_order for this project (new stories appear first)
      const { data: minStory } = await supabase
        .from("user_stories")
        .select("priority_order")
        .eq("project_id", projectId)
        .order("priority_order", { ascending: true })
        .limit(1)
        .single();

      priorityOrder = minStory ? minStory.priority_order - 1 : 1;
    }

    // Create user story
    const { data: userStory, error } = await supabase
      .from("user_stories")
      .insert({
        project_id: projectId,
        created_by: user.id,
        ...userStoryData,
        priority_order: priorityOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user story:", error);
      return errorResponse("Failed to create user story", 500);
    }

    return successResponse(userStory as UserStory, 201);
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/projects/[projectId]/user-stories:",
      error
    );
    return errorResponse("Internal server error", 500);
  }
}
