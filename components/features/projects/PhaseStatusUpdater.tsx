"use client"

import * as React from "react"
import { useState } from "react"
import { Check, Circle, Clock } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateProjectPhase } from "@/lib/hooks/use-project-phases"
import type { IsoPhase, PhaseStatusValue, Project } from "@/lib/types/database"

interface PhaseStatusUpdaterProps {
  project: Project
  compact?: boolean
  showProgress?: boolean
  className?: string
}

const PHASE_LABELS: Record<IsoPhase, string> = {
  understand_context: 'Understand Context of Use',
  specify_requirements: 'Specify Requirements',
  produce_design_solutions: 'Produce Design Solutions',
  evaluate_against_requirements: 'Evaluate Against Requirements',
}

const PHASE_SHORT_LABELS: Record<IsoPhase, string> = {
  understand_context: 'Context',
  specify_requirements: 'Requirements',
  produce_design_solutions: 'Design',
  evaluate_against_requirements: 'Evaluation',
}

const STATUS_LABELS: Record<PhaseStatusValue, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const STATUS_ICONS: Record<PhaseStatusValue, React.ReactNode> = {
  not_started: <Circle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  completed: <Check className="h-4 w-4" />,
}

const STATUS_COLORS: Record<PhaseStatusValue, string> = {
  not_started: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

export function PhaseStatusUpdater({
  project,
  compact = false,
  showProgress = true,
  className,
}: PhaseStatusUpdaterProps) {
  const { mutate: updatePhase, isPending } = useUpdateProjectPhase()
  const [editingPhase, setEditingPhase] = useState<IsoPhase | null>(null)

  const phases: IsoPhase[] = [
    'understand_context',
    'specify_requirements',
    'produce_design_solutions',
    'evaluate_against_requirements',
  ]

  const handleStatusChange = (phase: IsoPhase, status: PhaseStatusValue) => {
    updatePhase(
      {
        projectId: project.id,
        phase,
        status,
      },
      {
        onSuccess: () => {
          toast.success(`Phase status updated to "${STATUS_LABELS[status]}"`)
          setEditingPhase(null)
        },
        onError: (error) => {
          toast.error(`Failed to update phase: ${error.message}`)
        },
      }
    )
  }

  // Calculate overall progress
  const calculateProgress = () => {
    const statuses = Object.values(project.phase_status)
    const completed = statuses.filter(s => s === 'completed').length
    const inProgress = statuses.filter(s => s === 'in_progress').length
    return {
      completed,
      inProgress,
      total: statuses.length,
      percentage: Math.round((completed / statuses.length) * 100),
    }
  }

  const progress = calculateProgress()

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Overall Progress</span>
              <span>{progress.percentage}% Complete</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 dark:bg-green-600 transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Compact Phase List */}
        <div className="grid grid-cols-2 gap-2">
          {phases.map((phase) => {
            const status = project.phase_status[phase]
            const isEditing = editingPhase === phase

            return (
              <div
                key={phase}
                className="flex flex-col gap-1.5 p-2 border border-slate-200 dark:border-slate-800 rounded-md"
              >
                <p className="text-xs font-medium truncate">
                  {PHASE_SHORT_LABELS[phase]}
                </p>
                {isEditing ? (
                  <Select
                    value={status}
                    onValueChange={(value) => handleStatusChange(phase, value as PhaseStatusValue)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingPhase(phase)}
                    className="text-left"
                  >
                    <Badge
                      variant="secondary"
                      className={cn("text-xs font-normal", STATUS_COLORS[status])}
                    >
                      {STATUS_ICONS[status]}
                      <span className="ml-1">{STATUS_LABELS[status]}</span>
                    </Badge>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">ISO 9241-210 Phase Tracking</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track progress through the human-centered design process
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Overall Progress</span>
            <span className="font-medium">
              {progress.completed} of {progress.total} phases completed
            </span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {progress.inProgress > 0 && `${progress.inProgress} in progress • `}
            {progress.percentage}% complete
          </p>
        </div>
      )}

      {/* Phase List */}
      <div className="space-y-3">
        {phases.map((phase, index) => {
          const status = project.phase_status[phase]
          const isCurrentPhase = project.current_phase === phase
          const isEditing = editingPhase === phase

          return (
            <div
              key={phase}
              className={cn(
                "flex items-start gap-3 p-3 border rounded-lg transition-colors",
                isCurrentPhase
                  ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                  : "border-slate-200 dark:border-slate-800"
              )}
            >
              {/* Phase Number */}
              <div
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0",
                  status === 'completed'
                    ? "bg-green-500 text-white"
                    : status === 'in_progress'
                    ? "bg-blue-500 text-white"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {status === 'completed' ? <Check className="h-3 w-3" /> : index + 1}
              </div>

              {/* Phase Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{PHASE_LABELS[phase]}</p>
                  {isCurrentPhase && (
                    <Badge variant="outline" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>

                {/* Status Selector */}
                <div className="mt-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={status}
                        onValueChange={(value) =>
                          handleStatusChange(phase, value as PhaseStatusValue)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                {STATUS_ICONS[value as PhaseStatusValue]}
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPhase(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingPhase(phase)}
                      className="inline-flex"
                    >
                      <Badge
                        variant="secondary"
                        className={cn("font-normal", STATUS_COLORS[status])}
                      >
                        {STATUS_ICONS[status]}
                        <span className="ml-1.5">{STATUS_LABELS[status]}</span>
                      </Badge>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
