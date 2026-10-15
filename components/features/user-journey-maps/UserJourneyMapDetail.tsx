'use client'

import { UserJourneyMap, JourneyStage } from '@/lib/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Smile, Frown, Meh, Calendar } from 'lucide-react'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { sortStagesByOrder } from '@/lib/utils/journey-stages'

interface UserJourneyMapDetailProps {
  journeyMap: UserJourneyMap
}

function EmotionIcon({ value }: { value: number }) {
  if (value >= 4) return <Smile className="h-5 w-5 text-green-500" />
  if (value >= 3) return <Meh className="h-5 w-5 text-yellow-500" />
  return <Frown className="h-5 w-5 text-red-500" />
}

function StageCard({ stage, index }: { stage: JourneyStage; index: number }) {
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">Stage {index + 1}</Badge>
              <EmotionIcon value={stage.emotions} />
            </div>
            <CardTitle className="text-lg">{stage.name}</CardTitle>
            <CardDescription>{stage.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        {stage.actions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Actions</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {stage.actions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Thoughts */}
        {stage.thoughts.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Thoughts</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground italic">
              {stage.thoughts.map((thought, i) => (
                <li key={i}>&quot;{thought}&quot;</li>
              ))}
            </ul>
          </div>
        )}

        {/* Pain Points */}
        {stage.painPoints.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 text-destructive">Pain Points</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {stage.painPoints.map((pain, i) => (
                <li key={i}>{pain}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Touchpoints */}
        {stage.touchpoints.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Touchpoints</h4>
            <div className="flex flex-wrap gap-2">
              {stage.touchpoints.map((touchpoint, i) => (
                <Badge key={i} variant="secondary">
                  {touchpoint}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Emotion Rating */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-sm font-medium">Emotion:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <div
                key={val}
                className={`w-3 h-3 rounded-full ${
                  val <= stage.emotions ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({stage.emotions}/5)
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function UserJourneyMapDetail({ journeyMap }: UserJourneyMapDetailProps) {
  const sortedStages = useMemo(() => sortStagesByOrder(journeyMap.stages), [journeyMap.stages])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{journeyMap.title}</h2>
        {journeyMap.description && (
          <p className="text-muted-foreground">{journeyMap.description}</p>
        )}
        <div className="flex gap-2 mt-3 items-center">
          <Badge variant="secondary">{sortedStages.length} stages</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created: {format(new Date(journeyMap.created_at), "MMM dd, yyyy")}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Journey Stages */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Journey Stages</h3>
        <div className="space-y-6">
          {sortedStages.map((stage, index) => (
            <div key={index}>
              <StageCard stage={stage} index={index} />
              {index < sortedStages.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="text-2xl text-muted-foreground">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
