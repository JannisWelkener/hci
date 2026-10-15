'use client'

import { UserJourneyMap } from '@/lib/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Eye, Sparkles, MoreVertical, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState, useMemo } from 'react'
import { sortStagesByOrder } from '@/lib/utils/journey-stages'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteUserJourneyMap } from '@/lib/hooks/use-user-journey-maps'
import { useToast } from '@/hooks/use-toast'
import { JourneyStageTracker } from './JourneyStageTracker'

interface UserJourneyMapCardProps {
  journeyMap: UserJourneyMap
}

export function UserJourneyMapCard({ journeyMap }: UserJourneyMapCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteMutation = useDeleteUserJourneyMap(journeyMap.project_id)

  const sortedStages = useMemo(() => sortStagesByOrder(journeyMap.stages), [journeyMap.stages])

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(journeyMap.id)
      toast({
        title: 'Success',
        description: 'Journey map deleted successfully',
      })
      setShowDeleteDialog(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete journey map',
        variant: 'destructive',
      })
    }
  }

  // Calculate average emotion across all stages
  const avgEmotion =
    sortedStages.length > 0
      ? sortedStages.reduce((sum, stage) => sum + stage.emotions, 0) / sortedStages.length
      : 0

  const emotionLabel = avgEmotion >= 4 ? 'Positive' : avgEmotion >= 3 ? 'Neutral' : 'Negative'
  const emotionColor = avgEmotion >= 4 ? 'bg-green-500' : avgEmotion >= 3 ? 'bg-yellow-500' : 'bg-red-500'

  const handleCardClick = () => {
    router.push(`/projects/${journeyMap.project_id}/user-journey-maps/${journeyMap.id}`)
  }

  return (
    <>
      <Card
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{journeyMap.title}</CardTitle>
              {journeyMap.description && (
                <CardDescription className="line-clamp-2">{journeyMap.description}</CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  handleCardClick()
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{sortedStages.length} stages</Badge>
              <Badge className={emotionColor}>{emotionLabel} Journey</Badge>
              {journeyMap.ai_optimize_timeline && (
                <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Optimized
                </Badge>
              )}
            </div>

            {/* Journey Stage Progress Circles */}
            <JourneyStageTracker stages={sortedStages} />

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(journeyMap.created_at), 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journey Map</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{journeyMap.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
