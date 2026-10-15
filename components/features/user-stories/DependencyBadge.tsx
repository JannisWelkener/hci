'use client'

import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Link2, AlertCircle } from 'lucide-react'
import type { UserStory } from '@/lib/types/database'

interface DependencyBadgeProps {
  dependencies: string[]
  allStories: UserStory[]
  onStoryClick?: (storyId: string) => void
}

export function DependencyBadge({
  dependencies,
  allStories,
  onStoryClick,
}: DependencyBadgeProps) {
  if (!dependencies || dependencies.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>
  }

  const getStoryById = (storyId: string) => {
    return allStories.find((story) => story.id === storyId)
  }

  const validDependencies = dependencies.filter((storyId) =>
    getStoryById(storyId)
  )
  const invalidCount = dependencies.length - validDependencies.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity">
          <Badge variant="outline" className="cursor-pointer">
            <Link2 className="h-3 w-3 mr-1" />
            {dependencies.length}
          </Badge>
          {invalidCount > 0 && (
            <AlertCircle className="h-3 w-3 text-yellow-600" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Dependencies</h4>
            <Badge variant="secondary" className="text-xs">
              {dependencies.length} total
            </Badge>
          </div>

          <div className="space-y-2">
            {dependencies.map((storyId) => {
              const story = getStoryById(storyId)

              if (!story) {
                return (
                  <div
                    key={storyId}
                    className="p-2 border border-yellow-200 dark:border-yellow-800 rounded-md bg-yellow-50 dark:bg-yellow-900/10"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1 text-xs">
                        <div className="font-medium text-yellow-900 dark:text-yellow-100">
                          Story not found
                        </div>
                        <div className="text-yellow-700 dark:text-yellow-300">
                          ID: {storyId.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={storyId}
                  className="p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onStoryClick?.(storyId)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {story.priority && (
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {story.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm font-medium truncate">
                        {story.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        As a {story.user_role}
                      </div>
                      {story.status && (
                        <Badge
                          variant="secondary"
                          className="mt-1 text-xs capitalize"
                        >
                          {story.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {invalidCount > 0 && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 pt-2 border-t">
              <AlertCircle className="h-3 w-3" />
              {invalidCount} {invalidCount === 1 ? 'dependency' : 'dependencies'}{' '}
              could not be found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
