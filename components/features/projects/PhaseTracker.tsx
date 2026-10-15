'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, XCircle, Loader2 } from 'lucide-react'
import type { PhaseStatus, IsoPhase, PhaseStatusValue } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface PhaseTrackerProps {
  phaseStatus: PhaseStatus
  currentPhase: IsoPhase
  compact?: boolean
  onPhaseClick?: (phase: IsoPhase) => void
}

const PHASES: Array<{ key: IsoPhase; label: string; description: string }> = [
  {
    key: 'understand_context',
    label: 'Context of Use',
    description: 'Understanding users, tasks, and environment',
  },
  {
    key: 'specify_requirements',
    label: 'Requirements',
    description: 'Defining user needs and requirements',
  },
  {
    key: 'produce_design_solutions',
    label: 'Design Solutions',
    description: 'Creating and iterating design prototypes',
  },
  {
    key: 'evaluate_against_requirements',
    label: 'Evaluation',
    description: 'Testing designs against requirements',
  },
]

function getStatusIcon(status: PhaseStatusValue, isActive: boolean) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    case 'in_progress':
      return <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
    case 'not_started':
      return <Circle className={cn('h-5 w-5', isActive ? 'text-gray-400' : 'text-gray-300')} />
    default:
      return <XCircle className="h-5 w-5 text-red-600" />
  }
}

function getStatusBadgeVariant(status: PhaseStatusValue): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default'
    case 'in_progress':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function PhaseTracker({ phaseStatus, currentPhase, compact = false, onPhaseClick }: PhaseTrackerProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {PHASES.map((phase, index) => {
          const status = phaseStatus[phase.key]
          const isActive = phase.key === currentPhase

          return (
            <div key={phase.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPhaseClick?.(phase.key)}
                disabled={!onPhaseClick}
                className={cn(
                  'flex items-center justify-center transition-all',
                  onPhaseClick && 'hover:scale-110 cursor-pointer',
                  !onPhaseClick && 'cursor-default'
                )}
                aria-label={`${phase.label}: ${status}`}
              >
                {getStatusIcon(status, isActive)}
              </button>
              {index < PHASES.length - 1 && (
                <div className={cn(
                  'h-0.5 w-4',
                  status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                )} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {PHASES.map((phase) => {
        const status = phaseStatus[phase.key]
        const isActive = phase.key === currentPhase

        return (
          <div
            key={phase.key}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border transition-all',
              isActive && 'border-blue-500 bg-blue-50',
              !isActive && 'border-gray-200',
              onPhaseClick && 'cursor-pointer hover:shadow-md',
            )}
            onClick={() => onPhaseClick?.(phase.key)}
            role={onPhaseClick ? 'button' : undefined}
            tabIndex={onPhaseClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onPhaseClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onPhaseClick(phase.key)
              }
            }}
          >
            <div className="mt-0.5">
              {getStatusIcon(status, isActive)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className={cn(
                  'font-medium',
                  isActive && 'text-blue-700'
                )}>
                  {phase.label}
                </h4>
                <Badge variant={getStatusBadgeVariant(status)}>
                  {status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
