import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  UserStory,
  ApiResponse,
  PaginatedResponse,
} from "@/lib/types/database";
import type {
  GetUserStoriesQuery,
  CreateUserStoryInput,
  UpdateUserStoryInput,
  GenerateUserStoryInput,
  ReorderUserStoriesInput,
} from "@/lib/validations/user-story";

// Query Keys
export const userStoryKeys = {
  all: ["user-stories"] as const,
  lists: () => [...userStoryKeys.all, "list"] as const,
  list: (projectId: string, filters: Partial<GetUserStoriesQuery>) =>
    [...userStoryKeys.lists(), projectId, filters] as const,
  details: () => [...userStoryKeys.all, "detail"] as const,
  detail: (projectId: string, storyId: string) =>
    [...userStoryKeys.details(), projectId, storyId] as const,
  dependencies: (projectId: string, storyId: string) =>
    [...userStoryKeys.all, "dependencies", projectId, storyId] as const,
};

// API Functions
async function fetchUserStories(
  projectId: string,
  params: Partial<GetUserStoriesQuery> = {},
) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const res = await fetch(
    `/api/projects/${projectId}/user-stories?${searchParams.toString()}`,
  );
  if (!res.ok) {
    throw new Error("Failed to fetch user stories");
  }
  const data: ApiResponse<PaginatedResponse<UserStory>> = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data!;
}

async function fetchUserStory(projectId: string, storyId: string) {
  const res = await fetch(`/api/projects/${projectId}/user-stories/${storyId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch user story");
  }
  const data: ApiResponse<UserStory> = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data!;
}

async function createUserStory(projectId: string, input: CreateUserStoryInput) {
  const res = await fetch(`/api/projects/${projectId}/user-stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData: ApiResponse<null> = await res.json();
    throw new Error(errorData.error?.message || "Failed to create user story");
  }

  const data: ApiResponse<UserStory> = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data!;
}

async function updateUserStory(
  projectId: string,
  storyId: string,
  input: UpdateUserStoryInput,
) {
  console.log("input passed to the upadate user story: ", input);
  const res = await fetch(
    `/api/projects/${projectId}/user-stories/${storyId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!res.ok) {
    const errorData: ApiResponse<null> = await res.json();
    throw new Error(errorData.error?.message || "Failed to update user story");
  }

  const data: ApiResponse<UserStory> = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data!;
}

async function deleteUserStory(projectId: string, storyId: string) {
  const res = await fetch(
    `/api/projects/${projectId}/user-stories/${storyId}`,
    {
      method: "DELETE",
    },
  );

  if (!res.ok) {
    const errorData: ApiResponse<null> = await res.json();
    throw new Error(errorData.error?.message || "Failed to delete user story");
  }

  const data: ApiResponse<{ message: string }> = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data!;
}

async function generateUserStory(
  projectId: string,
  input: GenerateUserStoryInput,
) {
  const res = await fetch(`/api/projects/${projectId}/user-stories/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  // Try to parse JSON, but don't assume it always exists
  let data: ApiResponse<UserStory> | null = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors; we'll handle via res.ok
  }

  if (!res.ok) {
    //aiData?.message || aiData?.error || `Request failed (${aiResponse.status})`;
    const errorMessage =
      data?.error?.message || `Failed to generate user story (${res.status})`;
    throw new Error(errorMessage);
  }

  if (data?.error) {
    throw new Error(data.error.message);
  }

  if (!data?.data) {
    throw new Error("No user story data returned from server");
  }

  return data.data;
}

async function reorderUserStories(
  projectId: string,
  input: ReorderUserStoriesInput,
) {
  const res = await fetch(`/api/projects/${projectId}/user-stories/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData: ApiResponse<null> = await res.json();
    throw new Error(
      errorData.error?.message || "Failed to reorder user stories",
    );
  }

  const data: ApiResponse<{ updated: number; stories: UserStory[] }> =
    await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data!;
}

interface DependencyResponse {
  story: UserStory;
  outgoing: UserStory[];
  incoming: UserStory[];
}

async function fetchStoryDependencies(
  projectId: string,
  storyId: string,
): Promise<DependencyResponse> {
  const res = await fetch(
    `/api/projects/${projectId}/user-stories/${storyId}/dependencies`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch story dependencies");
  }

  const data: ApiResponse<DependencyResponse> = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const result = data.data;
  console.log("dependencies: ", result);
  return data.data!;
}

// Hooks
export function useUserStories(
  projectId: string,
  filters: Partial<GetUserStoriesQuery> = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: userStoryKeys.list(projectId, filters),
    queryFn: () => fetchUserStories(projectId, filters),
    enabled: options.enabled !== undefined ? options.enabled : !!projectId,
  });
}

export function useUserStory(projectId: string, storyId: string) {
  return useQuery({
    queryKey: userStoryKeys.detail(projectId, storyId),
    queryFn: () => fetchUserStory(projectId, storyId),
    enabled: !!projectId && !!storyId,
  });
}

export function useCreateUserStory(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserStoryInput) =>
      createUserStory(projectId, input),
    onSuccess: () => {
      // Invalidate and refetch user story lists
      queryClient.invalidateQueries({ queryKey: userStoryKeys.lists() });
      toast.success("User story created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user story");
    },
  });
}

export function useUpdateUserStory(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storyId,
      data,
    }: {
      storyId: string;
      data: UpdateUserStoryInput;
    }) => updateUserStory(projectId, storyId, data),
    onMutate: async ({ storyId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: userStoryKeys.detail(projectId, storyId),
      });

      // Snapshot the previous value
      const previousStory = queryClient.getQueryData(
        userStoryKeys.detail(projectId, storyId),
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        userStoryKeys.detail(projectId, storyId),
        (old: UserStory | undefined) => {
          if (!old) return old;
          return { ...old, ...data };
        },
      );

      return { previousStory };
    },
    onSuccess: (data, variables) => {
      // Update the specific user story in cache with server response
      queryClient.setQueryData(
        userStoryKeys.detail(projectId, variables.storyId),
        data,
      );
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: userStoryKeys.lists() });

      // refresh dependencies for this story
      queryClient.invalidateQueries({
        queryKey: userStoryKeys.dependencies(projectId, variables.storyId),
      });

      toast.success("User story updated successfully");
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousStory) {
        queryClient.setQueryData(
          userStoryKeys.detail(projectId, variables.storyId),
          context.previousStory,
        );
      }
      toast.error(error.message || "Failed to update user story");
    },
  });
}

export function useDeleteUserStory(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => deleteUserStory(projectId, storyId),
    onMutate: async (storyId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userStoryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userStoryKeys.details() });

      // Snapshot the previous values
      const previousLists = queryClient.getQueriesData({
        queryKey: userStoryKeys.lists(),
      });
      const previousDetails = queryClient.getQueriesData({
        queryKey: userStoryKeys.details(),
      });

      // Optimistically remove from all list queries
      queryClient.setQueriesData<PaginatedResponse<UserStory>>(
        { queryKey: userStoryKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((story) => story.id !== storyId),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        },
      );

      // Optimistically remove the deleted story from all other stories' dependencies
      queryClient.setQueriesData<UserStory>(
        { queryKey: userStoryKeys.details() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            dependencies: old.dependencies.filter((depId) => depId !== storyId),
          };
        },
      );

      return { previousLists, previousDetails };
    },
    onSuccess: (data, storyId) => {
      // Remove the deleted story from cache
      queryClient.removeQueries({
        queryKey: userStoryKeys.detail(projectId, storyId),
      });

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: userStoryKeys.lists() });

      // CRITICAL: Invalidate ALL story details because any of them might have
      // had this deleted story in their dependencies array
      queryClient.invalidateQueries({ queryKey: userStoryKeys.details() });

      // Invalidate ALL dependency queries to reflect the deletion
      // This ensures dependency lists, incoming dependencies, etc. are updated
      queryClient.invalidateQueries({
        queryKey: [...userStoryKeys.all, "dependencies"],
      });
      queryClient.invalidateQueries({
        queryKey: [...userStoryKeys.all, "incoming-dependencies"],
      });
      queryClient.invalidateQueries({
        queryKey: [...userStoryKeys.all, "journey-dependencies"],
      });

      toast.success("User story deleted successfully");
    },
    onError: (error: Error, storyId, context) => {
      // Rollback to previous state on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDetails) {
        context.previousDetails.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || "Failed to delete user story");
    },
  });
}

export function useGenerateAIStory(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateUserStoryInput) =>
      generateUserStory(projectId, input),
    onSuccess: () => {
      // Invalidate and refetch user story lists
      queryClient.invalidateQueries({ queryKey: userStoryKeys.lists() });
      toast.success("User story generated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate user story");
    },
  });
}

export function useUpdateStoryOrder(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderUserStoriesInput) =>
      reorderUserStories(projectId, input),
    onMutate: async (input) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userStoryKeys.lists() });

      // Snapshot the previous value
      const previousLists = queryClient.getQueriesData({
        queryKey: userStoryKeys.lists(),
      });

      // Optimistically update priority_order in all list queries
      queryClient.setQueriesData<PaginatedResponse<UserStory>>(
        { queryKey: userStoryKeys.lists() },
        (old) => {
          if (!old) return old;

          // Create a map of story ID to new priority_order
          const orderMap = new Map(
            input.stories.map((s) => [s.id, s.priority_order]),
          );

          // Update and sort items
          const updatedItems = old.items
            .map((story) => {
              const newOrder = orderMap.get(story.id);
              if (newOrder !== undefined) {
                return { ...story, priority_order: newOrder };
              }
              return story;
            })
            .sort((a, b) => a.priority_order - b.priority_order);

          return {
            ...old,
            items: updatedItems,
          };
        },
      );

      return { previousLists };
    },
    onSuccess: () => {
      // Invalidate all queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: userStoryKeys.lists() });
      toast.success("Story order updated successfully");
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous lists on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || "Failed to update story order");
    },
  });
}

export function useStoryDependencies(
  projectId: string,
  storyId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: userStoryKeys.dependencies(projectId, storyId),
    queryFn: () => fetchStoryDependencies(projectId, storyId),
    enabled:
      options.enabled !== undefined
        ? options.enabled
        : !!projectId && !!storyId,
  });
}

// Journey Map Dependencies Hook
interface JourneyMapDependency {
  id: string;
  title: string;
  created_at: string;
  persona_id: string;
}

interface JourneyMapDependenciesResponse {
  journeyMaps: JourneyMapDependency[];
  count: number;
}

async function fetchJourneyMapDependencies(
  projectId: string,
  storyId: string,
): Promise<JourneyMapDependenciesResponse> {
  const res = await fetch(
    `/api/projects/${projectId}/user-stories/${storyId}/journey-map-dependencies`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch journey map dependencies");
  }

  const data: ApiResponse<JourneyMapDependenciesResponse> = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data!;
}

export function useUserStoryJourneyMapDependencies(
  projectId: string,
  storyId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [
      ...userStoryKeys.all,
      "journey-dependencies",
      projectId,
      storyId,
    ],
    queryFn: () => fetchJourneyMapDependencies(projectId, storyId),
    enabled:
      options.enabled !== undefined
        ? options.enabled
        : !!projectId && !!storyId,
    // Cache for 30 seconds - dependency info changes infrequently
    staleTime: 30000,
  });
}

// Incoming Story Dependencies Hook
interface IncomingDependenciesResponse {
  incoming: UserStory[];
  count: number;
}

async function fetchIncomingStoryDependencies(
  projectId: string,
  storyId: string,
): Promise<IncomingDependenciesResponse> {
  // Fetch all dependencies and return only incoming ones
  const response = await fetchStoryDependencies(projectId, storyId);

  return {
    incoming: response.incoming,
    count: response.incoming.length,
  };
}

export function useUserStoryIncomingDependencies(
  projectId: string,
  storyId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [
      ...userStoryKeys.all,
      "incoming-dependencies",
      projectId,
      storyId,
    ],
    queryFn: () => fetchIncomingStoryDependencies(projectId, storyId),
    enabled:
      options.enabled !== undefined
        ? options.enabled
        : !!projectId && !!storyId,
    // Cache for 30 seconds - dependency info changes infrequently
    staleTime: 30000,
  });
}
