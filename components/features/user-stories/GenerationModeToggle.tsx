"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PenLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAIKey } from "@/lib/contexts/AIKeyContext";

export type GenerationMode = "manual" | "ai";

interface GenerationModeToggleProps {
  value: GenerationMode;
  onChange: (mode: GenerationMode) => void;
  disabled?: boolean;
}

export function GenerationModeToggle({
  value,
  onChange,
  disabled = false,
}: GenerationModeToggleProps) {
  const { hasAIKey } = useAIKey();
  const [currentMode, setCurrentMode] = useState("manual");
  const aiDisabled = disabled || !hasAIKey;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Creation Method</h3>
          <p className="text-xs text-muted-foreground">
            Choose how to create your user story
          </p>
        </div>
        <Badge
          variant={value === "ai" ? "default" : "secondary"}
          className="capitalize"
        >
          {value === "ai" ? "AI" : "Manual"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Manual Mode */}
        <button
          type="button"
          onClick={() => {
            onChange("manual");
            setCurrentMode("manual");
          }}
          disabled={disabled}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
            "hover:bg-muted/50",
            value === "manual"
              ? "border-primary bg-primary/5"
              : "border-border bg-card",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <PenLine
            className={cn(
              "h-6 w-6",
              value === "manual" ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div className="text-center">
            <div
              className={cn(
                "text-sm font-medium",
                value === "manual" ? "text-primary" : "text-foreground"
              )}
            >
              Manual
            </div>
            <div className="text-xs text-muted-foreground">
              Fill in all fields
            </div>
          </div>
        </button>

        {/* AI Mode */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={!hasAIKey ? 0 : undefined} className="block">
                <button
                  type="button"
                  onClick={() => {
                    onChange("ai");
                    setCurrentMode("ai");
                  }}
                  disabled={aiDisabled}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all w-full",
                    "hover:bg-muted/50",
                    value === "ai"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card",
                    aiDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Sparkles
                    className={cn(
                      "h-6 w-6",
                      value === "ai" ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        value === "ai" ? "text-primary" : "text-foreground"
                      )}
                    >
                      AI Generated
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Describe your story
                    </div>
                  </div>
                </button>
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

      {/* Mode Description */}
      <div className="p-3 bg-muted/50 rounded-md">
        <p className="text-xs text-muted-foreground">
          {value === "manual" ? (
            <>
              <strong className="text-foreground">Manual mode:</strong> Enter
              the user role, action, benefit, and other details manually.
            </>
          ) : (
            <>
              <strong className="text-foreground">AI mode:</strong> Describe
              what you want in plain language, and AI will generate a complete
              user story for you. You can edit the generated fields afterwards.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
