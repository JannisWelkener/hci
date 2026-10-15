'use client'

import { forwardRef } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export interface LoadingStep {
  message: string
  progress: number
  completed?: boolean
}

interface LoadingProgressProps {
  /**
   * Title displayed at the top of the loading indicator
   */
  title: string

  /**
   * Current progress percentage (0-100)
   */
  progress: number

  /**
   * Array of loading steps to display
   */
  steps: LoadingStep[]

  /**
   * Optional tip message to show during loading
   */
  tip?: string

  /**
   * Progress range to show the tip (default: 40-75)
   */
  tipProgressRange?: [number, number]
}

/**
 * Reusable loading progress indicator with steps
 *
 * @example
 * ```tsx
 * const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([])
 * const [currentProgress, setCurrentProgress] = useState(0)
 *
 * <LoadingProgress
 *   title="Creating Journey Map"
 *   progress={currentProgress}
 *   steps={loadingSteps}
 *   tip="AI is analyzing your data..."
 * />
 * ```
 */
export const LoadingProgress = forwardRef<HTMLDivElement, LoadingProgressProps>(
  ({ title, progress, steps, tip, tipProgressRange = [40, 75] }, ref) => {
    const showTip = tip && progress >= tipProgressRange[0] && progress < tipProgressRange[1]

    if (steps.length === 0) return null

    return (
      <div
        ref={ref}
        className="mt-6 p-6 bg-muted/50 rounded-lg border border-border space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {title}
          </h4>
          <span className="text-sm text-muted-foreground font-mono">
            {progress}%
          </span>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2" />

        {/* Loading Steps */}
        <div className="space-y-3 mt-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 transition-all duration-300 ${
                step.completed ? 'opacity-60' : 'opacity-100'
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    step.completed
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground font-medium'
                  }`}
                >
                  {step.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Optional Tip */}
        {showTip && (
          <div className="mt-4 p-3 bg-muted/50 border border-border rounded-md animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> {tip}
            </p>
          </div>
        )}
      </div>
    )
  }
)

LoadingProgress.displayName = 'LoadingProgress'
