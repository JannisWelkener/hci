'use client'

import { useProjectNotifications } from '@/lib/hooks/use-project-notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { History, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NotificationWithDetails } from '@/lib/types/database'

interface ProjectHistoryProps {
  projectId: string
  projectName: string
}

/**
 * ProjectHistory Component
 *
 * Displays a chronological history of all activity in a specific project.
 * Shows all entity creations (Journey Maps, User Stories, Personas) from all team members.
 *
 * Features:
 * - Shows activity from all project members (including yourself)
 * - Chronological order (newest first)
 * - Formatted notification messages with entity counts
 * - Relative timestamps (e.g., "2 hours ago")
 * - Empty state when no activity
 * - Loading state with skeletons
 * - Scrollable list
 */
export function ProjectHistory({ projectId, projectName }: ProjectHistoryProps) {
  const { notifications, isLoading, error } = useProjectNotifications({ projectId })

  console.log('[ProjectHistory] Render:', {
    projectId,
    notificationCount: notifications.length,
    isLoading,
    error,
  })

  /**
   * Format entity type for display
   */
  const formatEntityType = (entityType: string): string => {
    const types: Record<string, string> = {
      journey_map: 'Journey Map',
      persona: 'Persona',
      user_story: 'User Story',
      prototype: 'Prototype',
      mockup: 'Mockup',
      wireframe: 'Wireframe',
    }
    return types[entityType] || entityType
  }

  /**
   * Format notification message
   * Example: "John Doe created Journey Map: 'Customer Onboarding Flow'"
   */
  const formatNotificationMessage = (notification: NotificationWithDetails): string => {
    const entityName = formatEntityType(notification.entity_type)
    const plural = notification.entity_count > 1 ? 's' : ''

    // If we have entity_name, show it
    if (notification.entity_name) {
      return `${notification.creator_name} ${notification.action} ${entityName}: "${notification.entity_name}"`
    }

    // Fallback to count format (for old notifications)
    return `${notification.creator_name} ${notification.action} (${notification.entity_count}) ${entityName}${plural}`
  }

  /**
   * Format relative time (e.g., "2 hours ago", "yesterday")
   */
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return then.toLocaleDateString()
  }

  /**
   * Format full date for tooltips
   */
  const formatFullDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Project History</CardTitle>
              <CardDescription>
                Activity timeline for {projectName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive mb-2">Failed to load project history</p>
              <p className="text-xs text-muted-foreground">{error.message}</p>
            </div>
          ) : notifications.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
                <History className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">No activity yet</p>
              <p className="text-xs text-muted-foreground/60">
                Project history will appear here as team members create items
              </p>
            </div>
          ) : (
            // Activity list
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-accent/50',
                    // Subtle highlight for recent items (less than 24 hours old)
                    new Date().getTime() - new Date(notification.created_at).getTime() < 86400000 &&
                      'bg-accent/10'
                  )}
                >
                  {/* Icon based on entity type */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <span className="text-lg" role="img" aria-label={notification.entity_type}>
                      {notification.entity_type === 'journey_map' && '🗺️'}
                      {notification.entity_type === 'persona' && '👤'}
                      {notification.entity_type === 'user_story' && '📝'}
                      {notification.entity_type === 'prototype' && '🎨'}
                      {notification.entity_type === 'mockup' && '🎭'}
                      {notification.entity_type === 'wireframe' && '📐'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      {formatNotificationMessage(notification)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={notification.created_at}
                        title={formatFullDate(notification.created_at)}
                      >
                        {formatRelativeTime(notification.created_at)}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer stats */}
          {!isLoading && !error && notifications.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                {notifications.length} {notifications.length === 1 ? 'activity' : 'activities'} total
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
