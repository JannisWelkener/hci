"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserJourneyMapFormSchema } from "@/lib/validations/user-journey-map";
import type { CreateUserJourneyMapFormInput } from "@/lib/validations/user-journey-map";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateUserJourneyMap,
  useUserJourneyMaps,
} from "@/lib/hooks/use-user-journey-maps";
import { usePersonas } from "@/lib/hooks/use-personas";
import { useUserStories } from "@/lib/hooks/use-user-stories";
import {
  type StageName,
  getStagesByNames,
} from "@/lib/utils/journey-map-templates";
import { generateJourneyMapPrompt } from "@/lib/utils/ai-prompt-generator";
import { USE_AI_API } from "@/lib/config/environment";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { UserStoryTimeline } from "./UserStoryTimeline";
import { StageSelector } from "./StageSelector";
import { ManualStageEditor } from "./ManualStageEditor";
import {
  GenerationModeToggle,
  type GenerationMode,
} from "@/components/features/user-stories/GenerationModeToggle";
import {
  LoadingProgress,
  type LoadingStep,
} from "@/components/shared/LoadingProgress";
import { Loader2 } from "lucide-react";
import type { JourneyStage } from "@/lib/types/database";

interface UserJourneyMapFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export function UserJourneyMapForm({
  projectId,
  onSuccess,
}: UserJourneyMapFormProps) {
  const { toast } = useToast();
  const [generationMode, setGenerationMode] =
    useState<GenerationMode>("manual");
  const [selectedStages, setSelectedStages] = useState<StageName[]>([]);
  const [manualStages, setManualStages] = useState<JourneyStage[]>([]);
  const [aiPrompt] = useState<string>("");
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadingIndicatorRef = useRef<HTMLDivElement>(null);

  const createMutation = useCreateUserJourneyMap(projectId);

  // Fetch personas, user stories, and existing journey maps (environment-aware)
  const { data: personas = [], isLoading: personasLoading } =
    usePersonas(projectId);
  const { data: userStoriesData, isLoading: userStoriesLoading } =
    useUserStories(projectId);
  const { data: existingJourneyMaps = [], isLoading: journeyMapsLoading } =
    useUserJourneyMaps(projectId);
  const userStories = userStoriesData?.items ?? [];

  // Auto-scroll to loading indicator when it appears
  useEffect(() => {
    if (loadingSteps.length > 0 && loadingIndicatorRef.current) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        loadingIndicatorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [loadingSteps.length]);

  const form = useForm<CreateUserJourneyMapFormInput>({
    resolver: zodResolver(createUserJourneyMapFormSchema),
    defaultValues: {
      title: "",
      description: "",
      persona_id: "",
      timeline: [],
      ai_optimize_timeline: false,
    },
  });

  // Helper function to update loading progress
  const updateProgress = (
    stepIndex: number,
    message: string,
    progress: number,
  ) => {
    setCurrentProgress(progress);
    setLoadingSteps((prev) => {
      const newSteps = [...prev];
      if (stepIndex > 0) {
        // Mark previous steps as completed
        for (let i = 0; i < stepIndex; i++) {
          newSteps[i].completed = true;
        }
      }
      if (newSteps[stepIndex]) {
        newSteps[stepIndex].message = message;
        newSteps[stepIndex].progress = progress;
      }
      return newSteps;
    });
  };

  const onSubmit = async (values: CreateUserJourneyMapFormInput) => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      let stages: JourneyStage[];

      // Manual mode: use manually created stages directly
      if (generationMode === "manual") {
        // Manual mode - no loading dialog, direct validation and creation
        // Validate manual stages
        if (manualStages.length === 0) {
          throw new Error("At least one stage is required");
        }

        // Validate that all stages have required fields
        for (const stage of manualStages) {
          if (!stage.name.trim()) {
            throw new Error("All stages must have a name");
          }
          if (!stage.description.trim()) {
            throw new Error("All stages must have a description");
          }
        }

        stages = manualStages;
      } else {
        // AI mode: original AI-based flow
        // Initialize loading steps
        setLoadingSteps([
          { message: "Validating data...", progress: 0, completed: false },
          { message: "Generating AI prompt...", progress: 0, completed: false },
          { message: "Calling AI API...", progress: 0, completed: false },
          { message: "Processing stages...", progress: 0, completed: false },
          { message: "Creating journey map...", progress: 0, completed: false },
        ]);
        setCurrentProgress(0);

        // Step 1: Validate data
        updateProgress(0, "Validating data...", 10);
        await new Promise((resolve) => setTimeout(resolve, 300)); // Small delay for UX

        // Find the selected persona
        const selectedPersona = personas.find(
          (p) => p.id === values.persona_id,
        );

        if (!selectedPersona) {
          throw new Error("Selected persona not found");
        }

        // Step 2: Generate AI prompt
        updateProgress(1, "Generating AI prompt...", 25);
        await new Promise((resolve) => setTimeout(resolve, 300));

        const prompt = generateJourneyMapPrompt({
          title: values.title,
          description: values.description || null,
          persona: selectedPersona,
          userStories: userStories,
          timelineStoryIds: values.timeline,
          selectedStages: selectedStages,
          aiOptimizeTimeline: values.ai_optimize_timeline,
        });

        // Conditional AI API call based on config
        if (USE_AI_API) {
          // Step 3: Call AI API
          updateProgress(
            2,
            "Calling AI API (this may take 10-30 seconds)...",
            40,
          );

          try {
            const aiResponse = await fetch("/api/ai/generate-journey-map", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                prompt: prompt,
                model: "gpt-4o",
              }),
            });

            // Try to parse JSON, but don't assume it always exists
            let aiData: {
              stages?: JourneyStage[];
              error?: string;
              message?: string;
            } | null = null;
            try {
              aiData = await aiResponse.json();
            } catch {
              // ignore parse errors; we'll handle via aiResponse.ok
            }

            if (!aiResponse.ok) {
              // Extract error message from response if available
              const errorMessage =
                aiData?.message ||
                aiData?.error ||
                `Request failed (${aiResponse.status})`;

              // Fallback to templates
              stages = getStagesByNames(selectedStages);
              console.log("AI Unavailable errorMessage: ", errorMessage);
              toast({
                title: "AI Unavailable",
                description:
                  errorMessage ||
                  "Using template stages instead. AI credits may be exhausted.",
                variant: "default",
              });
              throw new Error(
                errorMessage ||
                  "Using template stages instead. AI credits may be exhausted.",
              );
            } else {
              stages = aiData?.stages || [];

              if (!stages || stages.length === 0) {
                stages = getStagesByNames(selectedStages);
              }
            }
          } catch (err) {
            stages = getStagesByNames(selectedStages);

            const errorMessage =
              err instanceof Error ? err.message : "Unknown error occurred";
            console.log("AI Error errorMessage: ", errorMessage);
            toast({
              title: "AI Error",
              description: `Using template stages instead. ${errorMessage}`,
              variant: "default",
            });
            throw new Error(
              errorMessage || "AI Error. AI credits may be exhausted.",
            );
          }

          // Step 4: Process stages
          updateProgress(3, "Processing stages...", 75);

          await new Promise((resolve) => setTimeout(resolve, 300));
        } else {
          // Use template stages (no AI)
          updateProgress(2, "Using template stages...", 50);
          await new Promise((resolve) => setTimeout(resolve, 300));

          stages = getStagesByNames(selectedStages);

          toast({
            title: "Templates Mode",
            description: "Using predefined stage templates.",
          });

          updateProgress(3, "Processing stages...", 75);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Step 5: Create journey map
        updateProgress(4, "Creating journey map in database...", 90);
      }

      await createMutation.mutateAsync({
        title: values.title,
        description: values.description || null,
        persona_id: values.persona_id,
        timeline: values.timeline,
        ai_optimize_timeline: values.ai_optimize_timeline,
        stages,
      });

      // Complete!
      setCurrentProgress(100);
      setLoadingSteps((prev) =>
        prev.map((step) => ({ ...step, completed: true })),
      );

      toast({
        title: "Success!",
        description: "User journey map created successfully.",
      });

      form.reset();
      setSelectedStages([]);
      setManualStages([]);
      setLoadingSteps([]);
      setCurrentProgress(0);
      setIsSubmitting(false);
      onSuccess?.();
    } catch (error) {
      setLoadingSteps([]);
      setCurrentProgress(0);
      setIsSubmitting(false);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create journey map",
        variant: "destructive",
      });
    }
  };

  const isLoading =
    createMutation.isPending ||
    personasLoading ||
    userStoriesLoading ||
    journeyMapsLoading ||
    isSubmitting;

  // Check if current title already exists
  const currentTitle = form.watch("title");
  const titleExists = existingJourneyMaps.some(
    (map) =>
      map.title.toLowerCase().trim() === currentTitle.toLowerCase().trim(),
  );

  const canSubmit =
    !isLoading &&
    !titleExists &&
    personas.length > 0 &&
    userStories.length > 0 &&
    form.watch("timeline").length > 0 &&
    (generationMode === "manual"
      ? manualStages.length > 0
      : selectedStages.length > 0);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Generation Mode Toggle - First choice */}
          <GenerationModeToggle
            value={generationMode}
            onChange={(mode) => {
              setGenerationMode(mode);
              // Reset stages when switching modes
              if (mode === "manual") {
                setSelectedStages([]);
                // Start with no stages in manual mode
                if (manualStages.length === 0) {
                  setManualStages([]);
                }
              } else {
                setManualStages([]);
              }
            }}
            disabled={isLoading}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => {
              // Check if title already exists
              const titleExists = existingJourneyMaps.some(
                (map) =>
                  map.title.toLowerCase().trim() ===
                  field.value.toLowerCase().trim(),
              );

              return (
                <FormItem>
                  <FormLabel
                    className={
                      titleExists ? "text-red-600 dark:text-red-500" : ""
                    }
                  >
                    Title *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., E-commerce Checkout Journey"
                      {...field}
                      disabled={isLoading}
                      className={
                        titleExists
                          ? "border-red-500 bg-red-50 dark:bg-red-950/20 focus-visible:ring-red-500 focus-visible:border-red-500"
                          : ""
                      }
                    />
                  </FormControl>
                  {titleExists && (
                    <p className="text-sm font-semibold text-red-600 dark:text-red-500 flex items-center gap-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 flex-shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      A journey map with this title already exists in this
                      project
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormDescription>
                  Optional description of what this journey map represents
                </FormDescription>
                <FormControl>
                  <Textarea
                    placeholder="Describe the purpose of this journey map..."
                    rows={3}
                    value={field.value || ""}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="persona_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Persona *</FormLabel>
                <FormDescription>
                  Select the persona this journey map is based on
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a persona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {personas.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No personas available. Create a persona first.
                      </div>
                    ) : (
                      personas.map((persona) => (
                        <SelectItem key={persona.id} value={persona.id}>
                          {persona.name} {persona.role && `- ${persona.role}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeline"
            render={({ field }) => (
              <FormItem className="overflow-hidden">
                <FormLabel>User Story Journey *</FormLabel>
                <FormDescription>
                  Build your journey timeline by adding user stories. Stories
                  can be added multiple times and reordered.
                </FormDescription>
                <FormControl className="overflow-hidden">
                  <UserStoryTimeline
                    userStories={userStories}
                    selectedStoryIds={field.value}
                    onChange={field.onChange}
                    disabled={isLoading || userStories.length === 0}
                    aiOptimizeTimeline={form.watch("ai_optimize_timeline")}
                    onAiOptimizeChange={(value) => {
                      form.setValue("ai_optimize_timeline", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                    showAiOptimize={generationMode === "ai"}
                  />
                </FormControl>
                {userStories.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No user stories available. Create a user story first.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stage selection - conditional based on mode */}
          {generationMode === "ai" ? (
            <StageSelector
              selectedStages={selectedStages}
              onChange={setSelectedStages}
              disabled={isLoading}
            />
          ) : (
            <ManualStageEditor
              stages={manualStages}
              onChange={setManualStages}
              disabled={isLoading}
            />
          )}

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={!canSubmit}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating Journey Map..." : "Create Journey Map"}
            </Button>
          </div>

          {/* Loading Progress Indicator */}
          <LoadingProgress
            ref={loadingIndicatorRef}
            title="Creating Your Journey Map"
            progress={currentProgress}
            steps={loadingSteps}
            tip={
              USE_AI_API
                ? "The AI is analyzing your persona and user stories to create personalized journey stages. This usually takes 10-30 seconds depending on complexity."
                : undefined
            }
          />
        </form>
      </Form>

      {/* AI Prompt Preview Dialog (Mock Mode) */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Prompt Preview (Mock Mode)</DialogTitle>
            <DialogDescription>
              This is the prompt that will be sent to the AI to generate
              personalized journey map stages. In production mode, this prompt
              will be sent to the AI API automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {aiPrompt}
              </pre>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(aiPrompt);
                  toast({
                    title: "Copied!",
                    description: "Prompt copied to clipboard",
                  });
                }}
              >
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => {
                  setShowPromptDialog(false);
                  toast({
                    title: "Preview Complete",
                    description: "You can now integrate this with your AI API",
                  });
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
