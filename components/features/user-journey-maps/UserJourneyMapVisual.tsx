'use client'

import { UserJourneyMap } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Smile, Frown, Meh, Calendar } from 'lucide-react'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { sortStagesByOrder } from '@/lib/utils/journey-stages'

interface UserJourneyMapVisualProps {
  journeyMap: UserJourneyMap
}

function EmotionIcon({ value }: { value: number }) {
  if (value >= 4) return <Smile className="h-5 w-5 text-green-500" />
  if (value >= 3) return <Meh className="h-5 w-5 text-yellow-500" />
  return <Frown className="h-5 w-5 text-red-500" />
}

export function UserJourneyMapVisual({ journeyMap }: UserJourneyMapVisualProps) {
  const stages = useMemo(() => sortStagesByOrder(journeyMap.stages), [journeyMap.stages])

  // Calculate emotion curve path for SVG
  const emotionCurvePath = useMemo(() => {
    if (stages.length === 0) return { path: '', points: [], width: 100, height: 100 }

    const width = 100
    const height = 100
    const paddingTop = 15
    const paddingBottom = 10
    const paddingLeft = 5
    const paddingRight = 5

    const availableWidth = width - paddingLeft - paddingRight
    const availableHeight = height - paddingTop - paddingBottom
    const stepWidth = stages.length > 1 ? availableWidth / (stages.length - 1) : 0

    const points = stages.map((stage, index) => {
      const x = stages.length === 1 ? width / 2 : paddingLeft + index * stepWidth
      // Invert Y because SVG coordinates go from top to bottom
      const y = paddingTop + availableHeight - ((stage.emotions - 1) / 4) * availableHeight
      return { x, y, emotion: stage.emotions }
    })

    // Check if all points have the same Y value (flat line)
    const allSameY = points.every(p => Math.abs(p.y - points[0].y) < 0.01)

    // Special case: all emotions are the same - draw a simple horizontal line
    if (allSameY) {
      const y = points[0].y
      const path = `M ${paddingLeft} ${y} L ${width - paddingRight} ${y}`
      return { path, points, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom }
    }

    // Use cubic bezier curves for smoother lines
    let path = `M ${points[0].x} ${points[0].y}`

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]

      // Calculate control points for smooth cubic bezier curve
      const tension = 0.3 // Tension factor (0 = straight, 1 = very curved)

      // Control point 1: extends from current point
      const cp1x = current.x + (next.x - current.x) * tension
      const cp1y = current.y

      // Control point 2: approaches next point
      const cp2x = next.x - (next.x - current.x) * tension
      const cp2y = next.y

      // Create cubic bezier curve
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
    }

    return { path, points, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom }
  }, [stages])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{journeyMap.title}</h2>
        {journeyMap.description && (
          <p className="text-muted-foreground">{journeyMap.description}</p>
        )}
        <div className="flex gap-2 mt-3 items-center">
          <Badge variant="secondary">{journeyMap.stages.length} stages</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created: {format(new Date(journeyMap.created_at), "MMM dd, yyyy")}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Visual Journey Map Grid */}
      <div className="relative w-full">
        <div className="w-full overflow-x-auto pb-4 scroll-smooth" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--primary)) transparent'
        }}>
          <div className="min-w-max">
            {/* Grid Container */}
            <div className="grid gap-0 border rounded-lg overflow-hidden bg-card"
                 style={{
                   gridTemplateColumns: `200px repeat(${stages.length}, 250px)`
                 }}>

            {/* Header Row - Stage Names */}
            <div className="bg-muted p-4 border-b border-r font-semibold sticky left-0 z-10">
              Journey Stages
            </div>
            {stages.map((stage, index) => (
              <div key={index} className="bg-primary p-4 border-b border-r last:border-r-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">Stage {index + 1}</Badge>
                  <EmotionIcon value={stage.emotions} />
                </div>
                <h3 className="font-bold text-sm mb-1.5 leading-tight text-white">{stage.name}</h3>
                <p className="text-xs text-white/90 line-clamp-3 leading-relaxed">{stage.description}</p>
              </div>
            ))}

            {/* Touchpoints Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                Touchpoints
              </span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} className="p-4 border-b border-r last:border-r-0 bg-card">
                {stage.touchpoints.length > 0 ? (
                  <ul className="space-y-1.5">
                    {stage.touchpoints.map((touchpoint, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span className="leading-relaxed">{touchpoint}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No touchpoints</span>
                )}
              </div>
            ))}

            {/* Actions Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Actions
              </span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} className="p-4 border-b border-r last:border-r-0 bg-card">
                {stage.actions.length > 0 ? (
                  <ul className="space-y-1.5">
                    {stage.actions.map((action, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span className="leading-relaxed">{action}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No actions</span>
                )}
              </div>
            ))}

            {/* Thoughts Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">💭</span>
                Thoughts
              </span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} className="p-4 border-b border-r last:border-r-0 bg-card">
                {stage.thoughts.length > 0 ? (
                  <ul className="space-y-1.5">
                    {stage.thoughts.map((thought, i) => (
                      <li key={i} className="text-xs italic text-muted-foreground leading-relaxed">
                        &quot;{thought}&quot;
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No thoughts</span>
                )}
              </div>
            ))}

            {/* Pain Points Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Pain Points
              </span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} className="p-4 border-b border-r last:border-r-0 bg-card">
                {stage.painPoints.length > 0 ? (
                  <ul className="space-y-1.5">
                    {stage.painPoints.map((pain, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span className="leading-relaxed">{pain}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No pain points</span>
                )}
              </div>
            ))}

            {/* Emotional Curve Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                Emotional Curve
              </span>
            </div>
            <div
              className="p-6 border-b border-r-0 relative"
              style={{ gridColumn: '2 / -1' }}
            >
              <div className="w-full h-48 relative pl-6">
                <svg
                  viewBox={`0 0 ${emotionCurvePath.width} ${emotionCurvePath.height}`}
                  className="w-full h-full"
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', left: '1.5rem', right: 0, top: 0, bottom: 0, width: 'calc(100% - 1.5rem)' }}
                >
                  {/* Background gradient zones */}
                  <defs>
                    <linearGradient id="emotionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#eab308" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>

                  {/* Background fill */}
                  <rect x="0" y="0" width="100" height="100" fill="url(#emotionGradient)" />

                  {/* Grid lines */}
                  {[1, 2, 3, 4, 5].map((level) => {
                    const availableHeight = emotionCurvePath.height - emotionCurvePath.paddingTop - emotionCurvePath.paddingBottom
                    const y = emotionCurvePath.paddingTop + availableHeight - ((level - 1) / 4) * availableHeight
                    return (
                      <line
                        key={level}
                        x1={emotionCurvePath.paddingLeft}
                        y1={y}
                        x2={emotionCurvePath.width - emotionCurvePath.paddingRight}
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                    )
                  })}

                  {/* Area under curve */}
                  {stages.length > 0 && (
                    <path
                      d={`${emotionCurvePath.path} L ${emotionCurvePath.width - emotionCurvePath.paddingRight} ${emotionCurvePath.height - emotionCurvePath.paddingBottom} L ${emotionCurvePath.paddingLeft} ${emotionCurvePath.height - emotionCurvePath.paddingBottom} Z`}
                      fill="url(#lineGradient)"
                      fillOpacity="0.1"
                    />
                  )}

                  {/* Main emotion curve line */}
                  {stages.length > 0 && (
                    <path
                      d={emotionCurvePath.path}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))"
                    />
                  )}
                </svg>

                {/* Emoji markers as HTML overlays (not affected by SVG stretch) */}
                {emotionCurvePath.points.map((point, index) => {
                  const emotion = point.emotion
                  // Map emotion value to emoji
                  let emoji = '😊'
                  if (emotion >= 4.5) emoji = '😊'
                  else if (emotion >= 3.5) emoji = '🙂'
                  else if (emotion >= 2.5) emoji = '😐'
                  else if (emotion >= 1.5) emoji = '😕'
                  else emoji = '😢'

                  // Calculate pixel position
                  const leftPercent = (point.x / emotionCurvePath.width) * 100
                  const topPercent = (point.y / emotionCurvePath.height) * 100

                  return (
                    <div
                      key={index}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: '28px',
                        lineHeight: 1,
                      }}
                    >
                      {emoji}
                    </div>
                  )
                })}

                {/* Scale numbers (1-5) as HTML overlays */}
                {[1, 2, 3, 4, 5].map((level) => {
                  const availableHeight = emotionCurvePath.height - (emotionCurvePath.paddingTop ?? 0) - (emotionCurvePath.paddingBottom ?? 0)
                  const y = (emotionCurvePath.paddingTop ?? 0) + availableHeight - ((level - 1) / 4) * availableHeight
                  const topPercent = (y / emotionCurvePath.height) * 100

                  return (
                    <div
                      key={level}
                      className="absolute left-0 text-xs font-semibold text-gray-600"
                      style={{
                        top: `${topPercent}%`,
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {level}
                    </div>
                  )
                })}
              </div>

              {/* Emotion scale legend */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Frown className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-medium text-muted-foreground">1-2 Frustrated</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Meh className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs font-medium text-muted-foreground">3 Neutral</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Smile className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-muted-foreground">4-5 Satisfied</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunities Row */}
            <div className="bg-muted p-4 border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                Opportunities
              </span>
            </div>
            {stages.map((stage, index) => (
              <div key={index} className="p-4 border-r last:border-r-0 bg-card">
                <ul className="space-y-1.5">
                  {stage.opportunities && stage.opportunities.length > 0 ? (
                    stage.opportunities.map((opportunity, oppIndex) => (
                      <li key={oppIndex} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span className="leading-relaxed">{opportunity}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-muted-foreground italic list-none">
                      No opportunities identified
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
