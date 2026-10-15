'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, FileText, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserStory } from '@/lib/types/database'
import { UserStoryCard } from './UserStoryCard'

interface UserStoriesListProps {
  projectId?: string
  stories: UserStory[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onCreateStory?: () => void
  onStoryClick?: (story: UserStory) => void
  onSortChange?: (sort: string, order: string) => void
}

export function UserStoriesList({
  stories,
  isLoading = false,
  isError = false,
  onRetry,
  onCreateStory,
  onStoryClick,
  onSortChange,
}: UserStoriesListProps) {
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSortChange = (value: string) => {
    setSortBy(value)
    if (onSortChange) {
      onSortChange(value, sortOrder)
    }
  }

  const handleOrderChange = (value: 'asc' | 'desc') => {
    setSortOrder(value)
    if (onSortChange) {
      onSortChange(sortBy, value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Stories</h1>
          <p className="text-muted-foreground">
            Manage user stories for your project
          </p>
        </div>
        {onCreateStory && (
          <Button onClick={onCreateStory}>
            <Plus className="mr-2 h-4 w-4" />
            New User Story
          </Button>
        )}
      </div>

      {/* Sorting Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-medium whitespace-nowrap">Sort by:</span>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="updated_at">Updated Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={handleOrderChange}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground self-center">
          {stories.length} {stories.length === 1 ? 'story' : 'stories'}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <UserStoriesListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : stories.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <UserStoryCard
              key={story.id}
              story={story}
              onClick={onStoryClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function UserStoriesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-4 p-6 border rounded-lg">
          <div className="flex items-start justify-between">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6 mb-4">
        <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to load user stories</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        There was an error loading the user stories. Please try again.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  )
}

function EmptyState({ onCreateStory }: { onCreateStory?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No user stories yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Get started by creating your first user story to document requirements for your HCI project
      </p>
      {onCreateStory && (
        <Button onClick={onCreateStory}>
          <Plus className="mr-2 h-4 w-4" />
          Create Your First User Story
        </Button>
      )}
    </div>
  )
}
