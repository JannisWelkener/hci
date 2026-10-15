'use client'

import { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Plus, X, GripVertical, Sparkles } from 'lucide-react'
import type { UserStory } from '@/lib/types/database'

interface TimelineItem {
  id: string
  storyId: string
}

interface UserStoryTimelineProps {
  userStories: UserStory[]
  selectedStoryIds: string[]
  onChange: (storyIds: string[]) => void
  disabled?: boolean
  aiOptimizeTimeline: boolean
  onAiOptimizeChange: (value: boolean) => void
  showAiOptimize?: boolean
}

function SortableStoryItem({
  item,
  story,
  onRemove,
  disabled,
}: {
  item: TimelineItem
  story: UserStory
  onRemove: () => void
  disabled?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md border min-w-[200px] max-w-[200px]"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={disabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing touch-none"}
        disabled={disabled}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{story.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {story.user_role}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-destructive hover:text-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function UserStoryTimeline({
  userStories,
  selectedStoryIds,
  onChange,
  disabled = false,
  aiOptimizeTimeline,
  onAiOptimizeChange,
  showAiOptimize = true,
}: UserStoryTimelineProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() =>
    selectedStoryIds.map((storyId, index) => ({
      id: `timeline-item-${index}`,
      storyId,
    }))
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = timelineItems.findIndex((item) => item.id === active.id)
      const newIndex = timelineItems.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(timelineItems, oldIndex, newIndex)
      setTimelineItems(newItems)
      onChange(newItems.map((item) => item.storyId))
    }
  }

  const handleAddStory = (storyId: string) => {
    if (!storyId) return
    const newItem: TimelineItem = {
      id: `timeline-item-${Date.now()}-${Math.random()}`,
      storyId,
    }
    const newItems = [...timelineItems, newItem]
    setTimelineItems(newItems)
    onChange(newItems.map((item) => item.storyId))
  }

  const handleRemoveStory = (itemId: string) => {
    const newItems = timelineItems.filter((item) => item.id !== itemId)
    setTimelineItems(newItems)
    onChange(newItems.map((item) => item.storyId))
  }

  const [localDropdownOpen, setLocalDropdownOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleLocalAddStory = (storyId: string) => {
    handleAddStory(storyId)
    setLocalDropdownOpen(false)
  }

  // Auto-scroll to right after adding new story
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth
    }
  }, [timelineItems])

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">User Stories Timeline *</label>
          {showAiOptimize && (
            <Button
              type="button"
              variant={aiOptimizeTimeline ? "default" : "outline"}
              size="sm"
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!disabled) {
                  onAiOptimizeChange(!aiOptimizeTimeline)
                }
              }}
              disabled={disabled}
              className="h-7 px-2 gap-1"
              title={aiOptimizeTimeline
                ? "AI Mode Active: AI will optimize the timeline order for best user experience"
                : "AI Mode Off: Timeline order will be strictly followed as you defined"
              }
            >
              <Sparkles className={`h-3.5 w-3.5 ${aiOptimizeTimeline ? 'text-purple-400' : ''}`} />
              <span className="text-xs">AI Optimize</span>
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Add user stories in the order they occur in the journey. Stories can be reused.
      </p>
      <div
        ref={scrollContainerRef}
        className="border rounded-md bg-background h-[120px] w-[710px]"
        style={{ overflowX: 'auto', overflowY: 'hidden' }}
      >
          <div className="p-4 h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center gap-2 h-full pb-2 flex-nowrap"
                style={{ minWidth: 'min-content' }}
              >
              <SortableContext
                items={timelineItems.map((item) => item.id)}
                strategy={horizontalListSortingStrategy}
              >
                {timelineItems.map((item) => {
                  const story = userStories.find((s) => s.id === item.storyId)
                  if (!story) return null
                  return (
                    <SortableStoryItem
                      key={item.id}
                      item={item}
                      story={story}
                      onRemove={() => handleRemoveStory(item.id)}
                      disabled={disabled}
                    />
                  )
                })}
              </SortableContext>

              {/* Add button */}
              <div className="flex-shrink-0 pr-4">
                <Select
                  value=""
                  onValueChange={handleLocalAddStory}
                  open={localDropdownOpen}
                  onOpenChange={setLocalDropdownOpen}
                  disabled={disabled}
                >
                  <SelectTrigger className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-muted-foreground/25 rounded-md hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </SelectTrigger>
                  <SelectContent>
                    {userStories.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No stories available</div>
                    ) : (
                      userStories.map((story) => (
                        <SelectItem
                          key={story.id}
                          value={story.id}
                        >
                          {story.title} - {story.user_role}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </DndContext>
          </div>
        </div>
    </div>
  )
}
