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
  ArrowLeft,
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
 * Expanded phase node component (Detail variant)
 * Displays a larger, highlighted phase card when zoomed into detail view
 * Has handles on all 4 sides for connecting to method nodes
 * Click to return to overview
 */
export function PhaseNodeExpanded({ data }: NodeProps<PhaseNodeData>) {
  const IconComponent = iconMap[data.icon] || Search;
  const hasMethods = data.totalInUse > 0; // Color logic based on totalInUse

  // Tooltip content
  const tooltipContent = "Click to return to overview";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`
              w-[480px] h-[360px]
              cursor-pointer transition-all duration-200 ease-in-out
              hover:shadow-2xl hover:scale-[1.02] active:scale-95
              border-2 border-primary shadow-lg
              bg-gradient-to-br from-background to-primary/5
            `}
          >
            {/* Handles on all 4 sides for method connections */}
            <Handle
              type="source"
              position={Position.Top}
              id="top"
              className="!bg-primary !w-5 !h-5 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="source"
              position={Position.Right}
              id="right"
              className="!bg-primary !w-5 !h-5 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="bottom"
              className="!bg-primary !w-5 !h-5 !border-2 !border-background transition-all hover:!scale-125"
            />
            <Handle
              type="source"
              position={Position.Left}
              id="left"
              className="!bg-primary !w-5 !h-5 !border-2 !border-background transition-all hover:!scale-125"
            />

            <div className="p-8 h-full flex flex-col justify-between">
              {/* Icon, Title, and Description */}
              <div className="space-y-5">
                <div className="flex items-start gap-5">
                  <div className="p-5 rounded-xl bg-primary/15 text-primary flex-shrink-0 shadow-sm">
                    <IconComponent className="h-12 w-12" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-2xl mb-2 line-clamp-1">
                      {data.title}
                    </h3>
                    <p className="text-base text-muted-foreground/90 mb-3 font-medium">
                      {data.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {data.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Method Count Badge and Return Hint */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="text-base px-4 py-1.5">
                    {data.methodCount}{" "}
                    {data.methodCount === 1 ? "method" : "methods"}
                  </Badge>
                  {!hasMethods && (
                    <span className="text-sm text-muted-foreground font-medium">
                      None in use
                    </span>
                  )}
                  {hasMethods && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {data.totalInUse} in use
                    </span>
                  )}
                </div>

                {/* Click to return hint */}
                <div className="flex items-center gap-2 text-sm text-primary/80 font-medium">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Click to return to overview</span>
                </div>
              </div>
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[360px]">
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
