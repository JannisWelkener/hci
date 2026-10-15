'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, FileText, Sparkles } from 'lucide-react'
import type { UserStory } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface UserStoryCardProps {
  story: UserStory
  onClick?: (story: UserStory) => void
}

export function UserStoryCard({ story, onClick }: UserStoryCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(story)
    }
  }

  return (
    <Card
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-lg">{story.title}</CardTitle>
          {story.story_points && (
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-medium">
              {story.story_points}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          {/* User Story Preview */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            As a <span className="font-medium text-foreground">{story.user_role}</span>, I want{' '}
            <span className="font-medium text-foreground">{story.action}</span>
          </p>

          {/* Description Preview */}
          {story.description && (
            <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
              <FileText className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground line-clamp-2">
                {story.description}
              </p>
            </div>
          )}

          {/* Acceptance Criteria Count */}
          {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>{story.acceptance_criteria.length} acceptance criteria</span>
            </div>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                getPriorityColor(story.priority || 'medium')
              )}
            >
              {formatPriority(story.priority || 'medium')}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                getStatusColor(story.status || 'backlog')
              )}
            >
              {formatStatus(story.status || 'backlog')}
            </Badge>
            {story.generation_method === 'ai_generated' && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'border-red-600 text-red-600'
    case 'high':
      return 'border-orange-600 text-orange-600'
    case 'medium':
      return 'border-yellow-600 text-yellow-600'
    case 'low':
      return 'border-green-600 text-green-600'
    default:
      return ''
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'border-green-600 text-green-600'
    case 'in_progress':
      return 'border-blue-600 text-blue-600'
    case 'backlog':
      return 'border-gray-600 text-gray-600'
    default:
      return ''
  }
}

function formatPriority(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

function formatStatus(status: string): string {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
