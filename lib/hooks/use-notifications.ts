// File: lib/hooks/use-notifications.ts

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { NotificationWithDetails } from '@/lib/types/database'

interface UseNotificationsOptions {
  /**
   * Whether to enable the query (defaults to true)
   */
  enabled?: boolean
}

interface UseNotificationsReturn {
  /**
   * Array of notifications with denormalized user and project data
   */
  notifications: NotificationWithDetails[]

  /**
   * Count of unread notifications (notifications from other users)
   */
  unreadCount: number

  /**
   * Total count of all notifications
   */
  totalCount: number

  /**
   * Loading state
   */
  isLoading: boolean

  /**
   * Error state
   */
  error: Error | null

  /**
   * Whether the query is currently fetching
   */
  isFetching: boolean
}

/**
 * Hook to fetch all notifications for the authenticated user with user and project information.
 *
 * Features:
 * - Fetches notifications with joined user/project data in a single query
 * - Calculates unread count (excludes creator_id === user_id)
 * - Orders by created_at DESC (newest first)
 * - Updates on page refresh (refetchOnMount: true)
 * - Uses Supabase client with RLS for security
 *
 * @param options - Optional configuration for the query
 * @returns Notification data with loading and error states
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { enabled = true } = options

  const queryResult = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<{
      notifications: NotificationWithDetails[]
      unreadCount: number
      totalCount: number
    }> => {
      console.log('[useNotifications] Starting fetch...')
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('[useNotifications] User:', user?.id, 'Error:', userError)

      if (!user) {
        console.error('[useNotifications] No user found!')
        throw new Error('User not authenticated')
      }

      // Fetch notifications (without joins first)
      console.log('[useNotifications] Fetching notifications for user:', user.id)

      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('id, user_id, creator_id, project_id, entity_type, entity_count, action, created_at, read, entity_id, entity_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('[useNotifications] Query result:', {
        dataCount: notificationsData?.length,
        error: notificationsError,
        errorDetails: notificationsError ? JSON.stringify(notificationsError, null, 2) : null
      })

      if (notificationsError) {
        console.error('[useNotifications] Query error:', notificationsError)
        console.error('[useNotifications] Error details:', {
          message: notificationsError.message,
          details: notificationsError.details,
          hint: notificationsError.hint,
          code: notificationsError.code
        })
        throw new Error(notificationsError.message || 'Failed to fetch notifications')
      }

      if (!notificationsData || notificationsData.length === 0) {
        console.log('[useNotifications] No notifications found')
        return { notifications: [], unreadCount: 0, totalCount: 0 }
      }

      // Get unique creator IDs and project IDs
      const creatorIds = [...new Set(notificationsData.map(n => n.creator_id))]
      const projectIds = [...new Set(notificationsData.map(n => n.project_id))]

      console.log('[useNotifications] Fetching profiles and projects...', {
        creatorCount: creatorIds.length,
        projectCount: projectIds.length
      })

      // Fetch creator profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', creatorIds)

      console.log('[useNotifications] Profiles fetched:', {
        count: profiles?.length,
        error: profilesError
      })

      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds)

      console.log('[useNotifications] Projects fetched:', {
        count: projects?.length,
        error: projectsError
      })

      // Create lookup maps
      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))
      const projectMap = new Map((projects || []).map(p => [p.id, p.name]))

      // Transform the data to match NotificationWithDetails interface
      const notifications: NotificationWithDetails[] = notificationsData.map(notification => ({
        id: notification.id,
        user_id: notification.user_id,
        creator_id: notification.creator_id,
        project_id: notification.project_id,
        entity_type: notification.entity_type,
        entity_count: notification.entity_count,
        action: notification.action,
        created_at: notification.created_at,
        read: notification.read,
        entity_id: notification.entity_id,
        entity_name: notification.entity_name,
        creator_name: profileMap.get(notification.creator_id) || 'Unknown User',
        project_name: projectMap.get(notification.project_id) || 'Unknown Project',
      }))

      // Calculate unread count (notifications where read === false AND creator_id !== user_id)
      const unreadCount = notifications.filter(n => !n.read && n.creator_id !== user.id).length

      // Total count
      const totalCount = notifications.length

      return {
        notifications,
        unreadCount,
        totalCount,
      }
    },
    enabled,
    // Fetch fresh data when component mounts
    refetchOnMount: true,
    // Keep data fresh for 30 seconds
    staleTime: 30000,
    // Retry once on failure
    retry: 1,
  })

  return {
    notifications: queryResult.data?.notifications || [],
    unreadCount: queryResult.data?.unreadCount || 0,
    totalCount: queryResult.data?.totalCount || 0,
    isLoading: queryResult.isLoading,
    error: queryResult.error as Error | null,
    isFetching: queryResult.isFetching,
  }
}
