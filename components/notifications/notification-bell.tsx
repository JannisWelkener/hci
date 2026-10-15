'use client'

import { Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { useMarkNotificationsRead } from '@/lib/hooks/use-mark-notifications-read'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NotificationWithDetails } from '@/lib/types/database'

/**
 * NotificationBell Component
 *
 * Displays a bell icon with an orange badge showing unread notification count.
 * Clicking the bell opens a dropdown with notification history.
 *
 * Features:
 * - Orange badge overlay with count (only for notifications from other users)
 * - Dropdown list of all notifications (including own changes)
 * - Persistent notification history across sessions
 * - Formatted notification messages: "User X created (N) Journey Map(s) in Project Y"
 * - Empty state message when no notifications
 * - Scrollable list with max height
 * - Full keyboard accessibility
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, isLoading, error } = useNotifications()
  const markAsReadMutation = useMarkNotificationsRead()

  console.log('[NotificationBell] Render:', {
    notificationCount: notifications.length,
    unreadCount,
    isLoading,
    error
  })

  // Mark notifications as read when dropdown is opened
  useEffect(() => {
    if (open && unreadCount > 0) {
      console.log('[NotificationBell] Marking notifications as read...')
      markAsReadMutation.mutate()
    }
  }, [open, unreadCount])

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
   * Example: "John Doe created User Story: 'Login Authentication' in Project Alpha"
   */
  const formatNotificationMessage = (notification: NotificationWithDetails): string => {
    const entityName = formatEntityType(notification.entity_type)
    const plural = notification.entity_count > 1 ? 's' : ''

    // If we have entity_name, show it
    if (notification.entity_name) {
      return `${notification.creator_name} ${notification.action} ${entityName}: "${notification.entity_name}" in ${notification.project_name}`
    }

    // Fallback to count format (for old notifications)
    return `${notification.creator_name} ${notification.action} (${notification.entity_count}) ${entityName}${plural} in ${notification.project_name}`
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold"
              aria-live="polite"
              aria-atomic="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 max-h-[32rem] overflow-hidden p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-muted/50">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount} new {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[28rem]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading notifications...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground/60 text-center mt-1">
                  You&apos;ll see project updates here
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 hover:bg-accent/50 transition-colors cursor-default',
                      // Highlight unread notifications with subtle background
                      !notification.read && notification.creator_id !== notification.user_id && 'bg-accent/10'
                    )}
                  >
                    <p className="text-sm leading-relaxed">
                      {formatNotificationMessage(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
