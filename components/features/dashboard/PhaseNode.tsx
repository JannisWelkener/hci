"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  ClipboardList,
  Lightbulb,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import type { PhaseNodeData } from "@/lib/types/dashboard";

/**
 * Map icon names to Lucide icon components for phases
 */
const iconMap: Record<string, LucideIcon> = {
  Search,
  ClipboardList,
  Lightbulb,
  CheckCircle,
};

/**
 * Phase node component (Overview variant)
 * Displays a phase card with title, description, and method count
 * Used in the phase overview circular layout
 */
export function PhaseNode({ data }: NodeProps<PhaseNodeData>) {
  const IconComponent = iconMap[data.icon] || Search;
  const hasMethods = data.totalInUse > 0; // Color logic based on totalInUse

  // Tooltip content
  const tooltipContent = "Click to explore";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`
              w-[380px] h-[280px]
              cursor-pointer transition-all duration-200 ease-in-out
              hover:shadow-xl hover:scale-105 active:scale-95
              ${
                hasMethods
                  ? "border-primary/60 hover:border-primary"
                  : "border-muted hover:border-muted-foreground/30"
              }
            `}
          >
            {/* Handles on all 4 sides for flexible connections */}
            <Handle
              type="source"
              position={Position.Top}
              id="top"
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="target"
              position={Position.Top}
              id="top-target"
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="source"
              position={Position.Right}
              id="right"
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="target"
              position={Position.Right}
              id="right-target"
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="bottom"
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="target"
              position={Position.Bottom}
              id="bottom-target"
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="source"
              position={Position.Left}
              id="left"
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="target"
              position={Position.Left}
              id="left-target"
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />

            <div className="p-6 h-full flex flex-col">
              {/* Icon and Title */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`
                      p-4 rounded-lg transition-colors flex-shrink-0
                      ${
                        hasMethods
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    <IconComponent className="h-10 w-10" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl mb-1 line-clamp-1">
                      {data.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/90 line-clamp-1">
                      {data.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description - positioned in the middle */}
              <div className="flex-1 flex items-center py-4">
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {data.description}
                </p>
              </div>

              {/* Method Count Badge and Hint */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={hasMethods ? "default" : "secondary"}
                    className="text-sm px-3 py-1"
                  >
                    {data.methodCount}{" "}
                    {data.methodCount === 1 ? "method" : "methods"}
                  </Badge>
                  {!hasMethods && (
                    <span className="text-sm text-muted-foreground">
                      None in use
                    </span>
                  )}
                  {hasMethods && (
                    <span className="text-sm text-muted-foreground">
                      {data.totalInUse} in use
                    </span>
                  )}
                </div>

                {hasMethods && (
                  <p className="text-xs text-muted-foreground italic">
                    Click to explore →
                  </p>
                )}
              </div>
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[320px]">
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
