import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { projectStatsSchema, type ProjectStats } from "@/lib/validations/dashboard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]/stats
 * Retrieve aggregated statistics for all subapps within a specific project
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
      return errorResponse("Unauthorized - Please log in", 401);
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return errorResponse("Project not found or access denied", 404);
    }

    // Execute parallel queries for all subapps to minimize latency
    const [
      userStoriesResult,
      personasResult,
      userJourneysResult,
      mockupsResult,
      wireframesResult,
    ] = await Promise.all([
      // Query user stories
      supabase
        .from("user_stories")
        .select("updated_at", { count: "exact" })
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(1),

      // Query personas
      supabase
        .from("personas")
        .select("updated_at", { count: "exact" })
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(1),

      // Query user journey maps
      supabase
        .from("user_journey_maps")
        .select("updated_at", { count: "exact" })
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(1),

      // Query mockups (uses created_at as fallback since it doesn't have updated_at)
      supabase
        .from("mockups")
        .select("created_at", { count: "exact" })
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1),

      // Query wireframes
      supabase
        .from("wireframes")
        .select("updated_at", { count: "exact" })
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

    // Check for any database errors
    if (userStoriesResult.error) {
      console.error("Error fetching user stories stats:", userStoriesResult.error);
      return errorResponse("Failed to fetch user stories statistics", 500);
    }
    if (personasResult.error) {
      console.error("Error fetching personas stats:", personasResult.error);
      return errorResponse("Failed to fetch personas statistics", 500);
    }
    if (userJourneysResult.error) {
      console.error("Error fetching user journeys stats:", userJourneysResult.error);
      return errorResponse("Failed to fetch user journeys statistics", 500);
    }
    if (mockupsResult.error) {
      console.error("Error fetching mockups stats:", mockupsResult.error);
      return errorResponse("Failed to fetch mockups statistics", 500);
    }
    if (wireframesResult.error) {
      console.error("Error fetching wireframes stats:", wireframesResult.error);
      return errorResponse("Failed to fetch wireframes statistics", 500);
    }

    // Construct the response data
    const stats: ProjectStats = {
      userStories: {
        count: userStoriesResult.count || 0,
        lastUpdated: userStoriesResult.data?.[0]?.updated_at || null,
      },
      personas: {
        count: personasResult.count || 0,
        lastUpdated: personasResult.data?.[0]?.updated_at || null,
      },
      userJourneys: {
        count: userJourneysResult.count || 0,
        lastUpdated: userJourneysResult.data?.[0]?.updated_at || null,
      },
      mockups: {
        count: mockupsResult.count || 0,
        lastUpdated: mockupsResult.data?.[0]?.created_at || null,
      },
      wireframes: {
        count: wireframesResult.count || 0,
        lastUpdated: wireframesResult.data?.[0]?.updated_at || null,
      },
    };

    // Validate response schema
    const validationResult = projectStatsSchema.safeParse(stats);
    if (!validationResult.success) {
      console.error("Response validation error:", validationResult.error);
      return errorResponse("Failed to validate response data", 500);
    }

    return successResponse(validationResult.data);
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/projects/[id]/stats:",
      error
    );
    return errorResponse("Internal server error", 500);
  }
}
