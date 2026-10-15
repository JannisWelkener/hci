'use client'

import { Circle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JourneyStage } from '@/lib/types/database'
import { STAGE_ORDER } from '@/lib/utils/journey-stages'

interface JourneyStageTrackerProps {
  stages: JourneyStage[]
  className?: string
}

export function JourneyStageTracker({ stages, className }: JourneyStageTrackerProps) {
  // Create a set of stage names that are present in the journey map
  const activeStageNames = new Set(stages.map(stage => stage.name))

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {STAGE_ORDER.map((stageName, index) => {
        const isActive = activeStageNames.has(stageName)

        return (
          <div key={stageName} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center transition-all',
              )}
              aria-label={`${stageName}: ${isActive ? 'included' : 'not included'}`}
              title={stageName}
            >
              {isActive ? (
                <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/30" />
              )}
            </div>
            {index < STAGE_ORDER.length - 1 && (
              <div className={cn(
                'h-0.5 w-3',
                isActive ? 'bg-primary' : 'bg-muted-foreground/20'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
