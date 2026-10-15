// File: lib/hooks/use-mark-notifications-read.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to mark all unread notifications as read for the current user.
 *
 * This mutation:
 * - Marks all notifications where read = false as read = true
 * - Only updates notifications belonging to the authenticated user
 * - Invalidates the notifications query to trigger a refetch
 *
 * @returns Mutation object with mutate function
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      console.log('[useMarkNotificationsRead] Marking notifications as read...')
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Mark all unread notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('[useMarkNotificationsRead] Error:', error)
        throw new Error(error.message)
      }

      console.log('[useMarkNotificationsRead] Successfully marked notifications as read')
    },
    onSuccess: () => {
      // Invalidate notifications query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
