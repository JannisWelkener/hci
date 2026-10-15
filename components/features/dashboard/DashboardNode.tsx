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
  FileText,
  Users,
  Map,
  Image,
  Layout,
  type LucideIcon,
  Layers,
  Figma,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NodeData } from "@/lib/types/dashboard";

/**
 * Map icon names to Lucide icon components
 */
const iconMap: Record<string, LucideIcon> = {
  FileText,
  Users,
  Map,
  Layers,
  Figma,
};

/**
 * Custom node component for the dashboard graph
 * Features responsive design, hover effects, and informative tooltips
 */
export function DashboardNode({ data }: NodeProps<NodeData>) {
  const IconComponent = iconMap[data.icon] || FileText;
  const hasItems = data.count > 0;

  // Format the last updated timestamp
  const lastUpdatedText = data.lastUpdated
    ? `Updated ${formatDistanceToNow(new Date(data.lastUpdated), {
        addSuffix: true,
      })}`
    : "No items yet";

  // Tooltip content with additional details
  const tooltipContent = `Click to navigate to ${data.label}.`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`
              w-[340px] sm:w-[360px]
              cursor-pointer transition-all duration-200 ease-in-out
              hover:shadow-lg hover:scale-105 active:scale-95
              ${
                hasItems
                  ? "border-primary/50 hover:border-primary"
                  : "border-muted hover:border-muted-foreground/30"
              }
            `}
          >
            {/* Input handle for incoming connections */}
            <Handle
              type="target"
              position={Position.Top}
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />

            <div className="p-6 space-y-4">
              {/* Icon and Title Row */}
              <div className="flex items-center gap-4">
                <div
                  className={`
                    p-3 rounded-lg transition-colors
                    ${
                      hasItems
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  <IconComponent className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {data.label}
                  </h3>
                </div>
              </div>

              {/* Count Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={hasItems ? "default" : "secondary"}
                  className="text-base transition-colors"
                >
                  {data.count} {data.count === 1 ? "item" : "items"}
                </Badge>
                {!hasItems && (
                  <span className="text-base text-muted-foreground">Empty</span>
                )}
              </div>

              {/* Last Updated Timestamp */}
              <div className="text-base text-muted-foreground line-clamp-1">
                {lastUpdatedText}
              </div>
            </div>

            {/* Output handle for outgoing connections */}
            <Handle
              type="source"
              position={Position.Bottom}
              className="!bg-primary !w-4 !h-4 !border-2 !border-background transition-all hover:!scale-125"
            />
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[300px]">
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
