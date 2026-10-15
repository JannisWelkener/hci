"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { FeatureFormDialog } from "@/components/shared/FeatureFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import { useAIKey } from "@/lib/contexts/AIKeyContext";
import { useCreatePersona } from "@/lib/hooks/use-personas";
import {
  LoadingProgress,
  type LoadingStep,
} from "@/components/shared/LoadingProgress";

interface PersonaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function PersonaFormDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: PersonaFormDialogProps) {
  const { hasAIKey } = useAIKey();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [generateWithAI, setGenerateWithAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const loadingIndicatorRef = useRef<HTMLDivElement>(null);

  const createMutation = useCreatePersona(projectId);

  // Auto-scroll to loading indicator when it appears
  useEffect(() => {
    if (loadingSteps.length > 0 && loadingIndicatorRef.current) {
      setTimeout(() => {
        loadingIndicatorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [loadingSteps.length]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting || createMutation.isPending) return;

    setIsSubmitting(true);

    try {
      let personaData;

      if (generateWithAI) {
        // Initialize loading steps for AI mode
        setLoadingSteps([
          { message: "Validating data...", progress: 0, completed: false },
          {
            message: "Generating persona with AI...",
            progress: 0,
            completed: false,
          },
          {
            message: "Processing AI response...",
            progress: 0,
            completed: false,
          },
          { message: "Creating persona...", progress: 0, completed: false },
        ]);
        setCurrentProgress(0);

        // Step 1: Validate data
        updateProgress(0, "Validating data...", 15);
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 2: Generate with AI
        updateProgress(
          1,
          "Generating persona with AI (this may take 5-15 seconds)...",
          30,
        );
        const generatedPersona = await sendPrompt(name, role);

        // Step 3: Process AI response
        updateProgress(2, "Processing AI response...", 70);
        await new Promise((resolve) => setTimeout(resolve, 300));
        personaData = buildPersonaDataFromGenerated(generatedPersona);

        // Step 4: Create persona
        updateProgress(3, "Creating persona in database...", 90);
      } else {
        // Manual mode - no loading dialog, direct creation
        personaData = buildBasicPersonaData(name, role);
      }

      createMutation.mutate(personaData, {
        onSuccess: () => {
          // Complete!
          setCurrentProgress(100);
          setLoadingSteps((prev) =>
            prev.map((step) => ({ ...step, completed: true })),
          );

          toast.success("Persona created successfully!");
          setName("");
          setRole("");
          setGenerateWithAI(false);
          setLoadingSteps([]);
          setCurrentProgress(0);
          setIsSubmitting(false);
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(`Failed to create persona: ${error.message}`);
          setLoadingSteps([]);
          setCurrentProgress(0);
          setIsSubmitting(false);
        },
      });
    } catch (err) {
      console.error("Failed to generate persona:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate persona";
      toast.error(errorMessage);
      setLoadingSteps([]);
      setCurrentProgress(0);
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || createMutation.isPending;

  return (
    <FeatureFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Persona"
      description="Add a new persona to your project. You can generate details with AI or create manually."
      onSubmit={handleSubmit}
      submitLabel={
        isLoading
          ? generateWithAI
            ? "Generating with AI..."
            : "Creating..."
          : "Create Persona"
      }
      isSubmitting={isLoading}
      maxWidth="3xl"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          maxLength={18}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Sarah Johnson"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Persona Role</Label>
        <Input
          id="role"
          value={role}
          maxLength={28}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g., Product Manager"
          required
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={!hasAIKey ? 0 : undefined}>
                <Button
                  type="button"
                  variant={generateWithAI ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGenerateWithAI(!generateWithAI)}
                  disabled={isLoading || !hasAIKey}
                  className="h-8 px-3 gap-1.5"
                  title={
                    !hasAIKey
                      ? undefined
                      : generateWithAI
                        ? "AI Mode Active: AI will generate complete persona details"
                        : "AI Mode Off: Create persona manually with basic fields"
                  }
                >
                  <Sparkles
                    className={`h-3.5 w-3.5 ${generateWithAI ? "text-purple-400" : ""}`}
                  />
                  <span className="text-xs">AI Generate</span>
                </Button>
              </span>
            </TooltipTrigger>
            {!hasAIKey && (
              <TooltipContent>
                <p>Add your OpenAI API key in Settings to use AI features</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Loading Progress Indicator */}
      <LoadingProgress
        ref={loadingIndicatorRef}
        title={
          generateWithAI ? "Generating Persona with AI" : "Creating Persona"
        }
        progress={currentProgress}
        steps={loadingSteps}
        tip={
          generateWithAI
            ? "The AI is analyzing your inputs to create a detailed persona with personality traits, skills, and demographics. This usually takes 5-15 seconds."
            : undefined
        }
      />
    </FeatureFormDialog>
  );
}

// Helper function to fetch AI-generated persona
async function sendPrompt(name: string, role: string) {
  const res = await fetch("/api/ai/generate-persona", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, role }),
  });

  // Try to parse JSON, but don't assume it always exists
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors; we'll handle via res.ok
  }

  // If backend returned an error, throw with a meaningful message
  if (!res.ok) {
    const message =
      data?.message || data?.error || `Request failed (${res.status})`;

    const err = new Error(message) as Error & {
      status?: number;
      code?: string;
      details?: unknown;
    };
    err.status = res.status;
    err.code = data?.code;
    err.details = data;
    throw err;
  }

  // Extra safety: ensure persona exists
  if (!data?.persona) {
    throw new Error("No persona returned from server.");
  }

  return data.persona;
}

// Helper function to build basic persona data
function buildBasicPersonaData(name: string, role: string) {
  return {
    photo_url: null,
    name,
    role,
    age: null,
    occupation: "",
    location: "",
    gender: "",
    relationship_status: "",
    education: "",
    buzzwords: [],
    personality_01: 0,
    personality_02: 0,
    personality_03: 0,
    personality_04: 0,
    motivation: "",
    goals: [],
    pain_points: [],
    skill_01: 0,
    skill_02: 0,
    skill_03: 0,
    metadata: {},
  };
}

// Helper function to build persona data from AI-generated data
function buildPersonaDataFromGenerated(persona: Record<string, unknown>) {
  const age = typeof persona.age === "number" ? persona.age : 0;
  let agePrefix = "young";
  if (age < 30) {
    agePrefix = "young";
  } else if (age > 60) {
    agePrefix = "old";
  } else {
    agePrefix = "adult";
  }

  const gender = typeof persona.gender === "string" ? persona.gender : "";
  const genderPrefix = gender === "Male" ? "man" : "woman";

  return {
    photo_url: `/persona_default_images/${agePrefix}_${genderPrefix}_${persona.skin_tone ?? "default"}.png`,
    name: persona.name ?? "",
    role: persona.role ?? "",
    age: persona.age ?? null,
    occupation: persona.occupation ?? "",
    location: persona.location ?? "",
    gender: persona.gender ?? "",
    relationship_status: persona.relationship_status ?? "",
    education: persona.education ?? "",
    buzzwords: persona.buzzwords ?? [],
    personality_01: persona.personality_01 ?? 0,
    personality_02: persona.personality_02 ?? 0,
    personality_03: persona.personality_03 ?? 0,
    personality_04: persona.personality_04 ?? 0,
    motivation: persona.motivation ?? "",
    goals: persona.goals ?? [],
    pain_points: persona.pain_points ?? [],
    skill_01: persona.skill_01 ?? 0,
    skill_02: persona.skill_02 ?? 0,
    skill_03: persona.skill_03 ?? 0,
    metadata: {},
  };
}
