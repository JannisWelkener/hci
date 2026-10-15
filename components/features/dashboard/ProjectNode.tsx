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
import { FolderKanban, Calendar, Eye, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";
import type { ProjectNodeData } from "@/lib/types/dashboard";

/**
 * Central project node component
 * Serves as the hub from which all subapps branch
 * Click to view/edit project details
 */
export function ProjectNode({ data }: NodeProps<ProjectNodeData>) {
  const startDate = data.startDate
    ? format(new Date(data.startDate), "MMM d, yyyy")
    : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className="
              w-[420px] sm:w-[480px] md:w-[520px]
              border-2 border-primary shadow-l
              bg-gradient-to-br from-primary/5 to-primary/10
              cursor-pointer transition-[box-shadow,border-color,filter] duration-200
              hover:shadow-2xl hover:border-primary/80
              hover:ring-2 hover:ring-primary/20
              hover:-translate-y-[2px]
              active:translate-y-0 active:shadow-lg
              group
            "
          >
      {/* Input handle for incoming connections (if any) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-5 !h-5 !border-2 !border-background"
      />

      <div className="p-8 space-y-5">
        {/* Icon and Title */}
        <div className="flex items-start gap-5">
          <div className="p-4 rounded-xl bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
            <LayoutDashboard className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base text-muted-foreground uppercase tracking-wide font-medium mb-2">
              Project Hub
            </p>
            <h2 className="font-bold text-2xl sm:text-3xl line-clamp-1">
              {data.projectName}
            </h2>
          </div>
        </div>

        {/* Description - Truncated to 2 lines */}
        {data.description && (
          <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        )}

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3 text-base">
          {/* Current Phase */}
          {data.currentPhase && (
            <Badge variant="secondary" className="text-base px-3 py-1">
              {data.currentPhase
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          )}

          {/* Start Date */}
          {startDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span>{startDate}</span>
            </div>
          )}
        </div>

        {/* Click to View Indicator */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-2.5 text-base text-primary opacity-60 group-hover:opacity-100 transition-opacity">
            <Eye className="h-5 w-5" />
            <span className="font-medium">Click to view & edit</span>
          </div>
        </div>
      </div>

      {/* Output handles for all directions */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!bg-primary !w-4 !h-4 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-primary !w-4 !h-4 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-primary !w-4 !h-4 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-primary !w-4 !h-4 !border-2 !border-background"
      />
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[300px]">
          <p className="text-sm">Click to view project details.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
