'use client'

import { UserJourneyMap, JourneyStage, UserJourneyMapWithTimeline } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Smile, Frown, Meh, Save, X, Edit2, User, List, Sparkles, Calendar } from 'lucide-react'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { useUpdateUserJourneyMap } from '@/lib/hooks/use-user-journey-maps'
import { usePersonas } from '@/lib/hooks/use-personas'
import { useUserStories } from '@/lib/hooks/use-user-stories'
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/lib/hooks/use-debounce'
import Image from 'next/image'
import { sortStagesByOrder } from '@/lib/utils/journey-stages'

interface UserJourneyMapVisualEditableProps {
  journeyMap: UserJourneyMap
  projectId: string
  onSaveComplete?: () => void
  onJourneyMapChange?: (journeyMap: UserJourneyMap) => void
  onEditingChange?: (isEditing: boolean) => void
  hideTopEditButton?: boolean
  actions?: React.ReactNode
  isEditing?: boolean
}

function EmotionIcon({ value }: { value: number }) {
  if (value >= 4) return <Smile className="h-5 w-5 text-green-500" />
  if (value >= 3) return <Meh className="h-5 w-5 text-yellow-500" />
  return <Frown className="h-5 w-5 text-red-500" />
}

export function UserJourneyMapVisualEditable({
  journeyMap,
  projectId,
  onSaveComplete,
  onJourneyMapChange,
  onEditingChange, // <-- neu: Prop entnehmen
  hideTopEditButton = false,
  actions,
  isEditing: externalIsEditing,
}: UserJourneyMapVisualEditableProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(journeyMap.title)
  const [editedDescription, setEditedDescription] = useState(journeyMap.description || '')
  const [editedStages, setEditedStages] = useState<JourneyStage[]>(sortStagesByOrder(journeyMap.stages))
  const [draggedStageIndex, setDraggedStageIndex] = useState<number | null>(null)

  // Track if the change is coming from external prop to prevent infinite loop
  const isExternalUpdate = useRef(false)
  const prevExternalIsEditing = useRef(externalIsEditing)

  const { mutate: updateJourneyMap, isPending } = useUpdateUserJourneyMap(projectId, journeyMap.id)
  const { toast } = useToast()

  // Fetch persona and user stories
  const { data: personas = [] } = usePersonas(projectId)
  const { data: userStoriesData } = useUserStories(projectId)

  // Get the persona for this journey map
  const persona = personas.find(p => p.id === journeyMap.persona_id)

  // Get user stories from timeline (if timeline exists)
  const journeyMapWithTimeline = journeyMap as UserJourneyMapWithTimeline
  const timelineUserStories = useMemo(() => {
    const userStories = userStoriesData?.items ?? []
    if (!journeyMapWithTimeline.timeline || journeyMapWithTimeline.timeline.length === 0) {
      return []
    }
    // Sort by position and get the stories
    const sortedTimeline = [...journeyMapWithTimeline.timeline].sort((a, b) => a.position - b.position)
    return sortedTimeline
      .map(entry => userStories.find(story => story.id === entry.user_story_id))
      .filter(Boolean) as typeof userStories
  }, [journeyMapWithTimeline.timeline, userStoriesData?.items])

  // Create a current journey map with edited values for live preview
  const currentJourneyMap = useMemo(() => ({
    ...journeyMap,
    title: editedTitle,
    description: editedDescription,
    stages: editedStages,
  }), [journeyMap, editedTitle, editedDescription, editedStages])

  // Debounce the journey map changes to reduce re-renders
  const debouncedJourneyMap = useDebounce(currentJourneyMap, 300)

  // Notify parent component when journey map changes (debounced)
  useEffect(() => {
    if (onJourneyMapChange) {
      onJourneyMapChange(debouncedJourneyMap)
    }
  }, [debouncedJourneyMap, onJourneyMapChange])

  // Synchronize with external isEditing prop
  useEffect(() => {
    // Only update if the external prop actually changed (not just re-rendered with same value)
    if (externalIsEditing !== undefined && externalIsEditing !== prevExternalIsEditing.current) {
      prevExternalIsEditing.current = externalIsEditing
      isExternalUpdate.current = true
      setIsEditing(externalIsEditing)
    }
  }, [externalIsEditing])

  // Inform parent when edit mode changes (only if not from external update)
  useEffect(() => {
    if (isExternalUpdate.current) {
      // Reset the flag after processing external update
      isExternalUpdate.current = false
      return
    }

    if (onEditingChange) {
      onEditingChange(isEditing)
    }
  }, [isEditing, onEditingChange])

  // Update a specific stage field
  const updateStage = useCallback((stageIndex: number, updates: Partial<JourneyStage>) => {
    setEditedStages(prev => {
      const newStages = [...prev]
      newStages[stageIndex] = { ...newStages[stageIndex], ...updates }
      return newStages
    })
  }, [])

  // Handle emoji drag to update emotions
  const handleEmojiDrag = useCallback((stageIndex: number, clientY: number, containerRect: DOMRect) => {
    const relativeY = clientY - containerRect.top
    const containerHeight = containerRect.height

    // Calculate emotion value based on Y position (inverted: top = 5, bottom = 1)
    const emotionValue = 5 - ((relativeY / containerHeight) * 4)
    const clampedEmotion = Math.max(1, Math.min(5, emotionValue))
    const roundedEmotion = Math.round(clampedEmotion * 10) / 10 // Round to 1 decimal

    updateStage(stageIndex, { emotions: roundedEmotion })
  }, [updateStage])

  // Save changes
  const handleSave = useCallback(() => {
    // Clean up empty lines before saving
    const cleanedStages = editedStages.map(stage => ({
      ...stage,
      touchpoints: stage.touchpoints.filter(item => item.trim() !== ''),
      actions: stage.actions.filter(item => item.trim() !== ''),
      thoughts: stage.thoughts.filter(item => item.trim() !== ''),
      painPoints: stage.painPoints.filter(item => item.trim() !== ''),
    }))

    // Sort stages before saving
    const sortedStages = sortStagesByOrder(cleanedStages)

    updateJourneyMap({
      title: editedTitle,
      description: editedDescription,
      stages: sortedStages,
    }, {
      onSuccess: () => {
        // Update edited stages with sorted and cleaned data
        setEditedStages(sortedStages)
        toast({
          title: 'Success',
          description: 'Journey map updated successfully',
        })
        setIsEditing(false)
        onSaveComplete?.()
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update journey map',
          variant: 'destructive',
        })
      }
    })
  }, [editedTitle, editedDescription, editedStages, updateJourneyMap, toast, onSaveComplete])

  // Cancel editing
  const handleCancel = useCallback(() => {
    setEditedTitle(journeyMap.title)
    setEditedDescription(journeyMap.description || '')
    setEditedStages(journeyMap.stages)
    setIsEditing(false)
  }, [journeyMap])

  // Calculate emotion curve path for SVG
  const emotionCurvePath = useMemo(() => {
    const stages = editedStages
    if (stages.length === 0) return { path: '', points: [], width: 100, height: 100 }

    const width = 100
    const height = 100
    const paddingTop = 15
    const paddingBottom = 10
    const paddingLeft = 5
    const paddingRight = 5

    const availableWidth = width - paddingLeft - paddingRight
    const availableHeight = height - paddingTop - paddingBottom
    const stepWidth = stages.length > 1 ? availableWidth / (stages.length - 1) : 0

    // Check if all emotions are the same - if yes, nudge first one slightly to avoid flat line rendering issues
    const allSameEmotion = stages.length > 1 && stages.every(s => s.emotions === stages[0].emotions)
    const adjustedStages = allSameEmotion
      ? stages.map((stage, index) => ({
          ...stage,
          emotions: index === 0 ? stage.emotions + 0.001 : stage.emotions
        }))
      : stages

    const points = adjustedStages.map((stage, index) => {
      const x = adjustedStages.length === 1 ? width / 2 : paddingLeft + index * stepWidth
      const y = paddingTop + availableHeight - ((stage.emotions - 1) / 4) * availableHeight
      return { x, y, emotion: stage.emotions }
    })

    // Use cubic bezier curves for smoother lines
    let path = `M ${points[0].x} ${points[0].y}`

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]

      // Calculate control points for smooth cubic bezier curve
      const tension = 0.3 // Tension factor (0 = straight, 1 = very curved)

      // Control point 1: extends from current point
      const cp1x = current.x + (next.x - current.x) * tension
      const cp1y = current.y

      // Control point 2: approaches next point
      const cp2x = next.x - (next.x - current.x) * tension
      const cp2y = next.y

      // Create cubic bezier curve
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
    }

    return { path, points, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom }
  }, [editedStages])

  return (
    <div className="space-y-6">
      {/* Header with Edit/Save controls */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold"
                placeholder="Journey map title"
              />
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="text-muted-foreground"
                placeholder="Journey map description (optional)"
                rows={2}
              />
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">{editedTitle}</h2>
              {editedDescription && (
                <p className="text-muted-foreground">{editedDescription}</p>
              )}
            </>
          )}
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            <Badge variant="secondary">{editedStages.length} stages</Badge>
            {journeyMap.ai_optimize_timeline && (
              <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Optimized
              </Badge>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created: {format(new Date(journeyMap.created_at), "MMM dd, yyyy")}</span>
            </div>
            {/* Edit/Save buttons here on small screens */}
            {(!hideTopEditButton || isEditing) && (
              <div className="flex gap-2 ml-auto sm:hidden">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      disabled={isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : !hideTopEditButton ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Actions buttons at title level */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}

        {/* Edit/Save buttons on larger screens */}
        {(!hideTopEditButton || isEditing) && (
          <div className="hidden sm:flex gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : !hideTopEditButton ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <Separator />

      {/* Persona and User Stories Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
        {/* Persona Card */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <User className="h-4 w-4 text-primary" />
            <span>Persona</span>
          </div>
          {persona ? (
            <div className="space-y-2 p-3 bg-background rounded-md border">
              <div className="flex items-start gap-3">
                {persona.photo_url && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={persona.photo_url}
                      alt={persona.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{persona.name}</h4>
                  {persona.role && (
                    <p className="text-xs text-muted-foreground">{persona.role}</p>
                  )}
                  {persona.age && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {persona.age} Jahre {persona.location && `• ${persona.location}`}
                    </p>
                  )}
                </div>
              </div>
              {persona.goals && persona.goals.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs font-medium mb-1">Ziele:</p>
                  <ul className="space-y-0.5">
                    {persona.goals.slice(0, 2).map((goal, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span className="line-clamp-1">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Persona nicht gefunden</p>
          )}
        </div>

        {/* User Stories Timeline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <List className="h-4 w-4 text-primary" />
            <span>User Story Timeline</span>
            {timelineUserStories.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {timelineUserStories.length}
              </Badge>
            )}
          </div>
          {timelineUserStories.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {timelineUserStories.map((story, idx) => (
                <div key={`timeline-story-${idx}-${story.id}`} className="p-2 bg-background rounded-md border text-xs">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {idx + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{story.title}</p>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2">
                        Als <span className="font-medium">{story.user_role}</span> möchte ich{' '}
                        <span className="font-medium">{story.action}</span>
                        {story.benefit && (
                          <>, um <span className="font-medium">{story.benefit}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Keine User Stories in der Timeline
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Visual Journey Map Grid */}
      <div className="relative w-full">
        <div className="w-full overflow-x-auto pb-4 scroll-smooth" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--primary)) transparent'
        }}>
          <div className="min-w-max">
            <div className="grid gap-0 border rounded-lg overflow-hidden bg-card"
                 style={{
                   gridTemplateColumns: `200px repeat(${editedStages.length}, minmax(220px, 1fr))`
                 }}>

            {/* Header Row - Stage Names */}
            <div className="bg-muted p-4 border-b border-r font-semibold sticky left-0 z-10">
              Journey Stages
            </div>
            {editedStages.map((stage, stageIndex) => (
              <div key={stageIndex} className="bg-primary p-4 border-b border-r last:border-r-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">Stage {stageIndex + 1}</Badge>
                  <EmotionIcon value={stage.emotions} />
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={stage.name}
                      onChange={(e) => updateStage(stageIndex, { name: e.target.value })}
                      className="font-bold text-sm h-8 bg-white text-black"
                      placeholder="Stage name"
                      disabled
                    />
                    <Textarea
                      value={stage.description}
                      onChange={(e) => updateStage(stageIndex, { description: e.target.value })}
                      className="text-xs min-h-[60px] bg-white text-black"
                      placeholder="Stage description"
                      rows={3}
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-sm mb-1.5 leading-tight text-white">{stage.name}</h3>
                    <p className="text-xs text-white/90 line-clamp-3 leading-relaxed">{stage.description}</p>
                  </>
                )}
              </div>
            ))}

            {/* Touchpoints Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                Touchpoints
              </span>
            </div>
            {editedStages.map((stage, stageIndex) => (
              <div key={stageIndex} className="p-4 border-b border-r last:border-r-0 bg-card">
                {isEditing ? (
                  <div className="space-y-1">
                    <Textarea
                      value={stage.touchpoints.join('\n')}
                      onChange={(e) => {
                        const items = e.target.value.split('\n').slice(0, 5).map(item => item.slice(0, 50))
                        updateStage(stageIndex, { touchpoints: items })
                      }}
                      className="text-xs min-h-[100px]"
                      placeholder="Enter touchpoints (one per line, max 5, 50 chars each)"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">{stage.touchpoints.length}/5 items</p>
                  </div>
                ) : stage.touchpoints.length > 0 ? (
                  <ul className="space-y-1.5">
                    {stage.touchpoints.map((touchpoint, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span className="leading-relaxed">{touchpoint}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No touchpoints</span>
                )}
              </div>
            ))}

            {/* Actions Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Actions
              </span>
            </div>
            {editedStages.map((stage, stageIndex) => (
              <div key={stageIndex} className="p-4 border-b border-r last:border-r-0 bg-card">
                {isEditing ? (
                  <div className="space-y-1">
                    <Textarea
                      value={stage.actions.join('\n')}
                      onChange={(e) => {
                        const items = e.target.value.split('\n').slice(0, 5).map(item => item.slice(0, 50))
                        updateStage(stageIndex, { actions: items })
                      }}
                      className="text-xs min-h-[100px]"
                      placeholder="Enter actions (one per line, max 5, 50 chars each)"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">{stage.actions.length}/5 items</p>
                  </div>
                ) : stage.actions.length > 0 ? (
                  <ul className="space-y-1.5">
                    {stage.actions.map((action, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span className="leading-relaxed">{action}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No actions</span>
                )}
              </div>
            ))}

            {/* Thoughts Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">💭</span>
                Thoughts
              </span>
            </div>
            {editedStages.map((stage, stageIndex) => (
              <div key={stageIndex} className="p-4 border-b border-r last:border-r-0 bg-card">
                {isEditing ? (
                  <div className="space-y-1">
                    <Textarea
                      value={stage.thoughts.join('\n')}
                      onChange={(e) => {
                        const items = e.target.value.split('\n').slice(0, 5).map(item => item.slice(0, 50))
                        updateStage(stageIndex, { thoughts: items })
                      }}
                      className="text-xs min-h-[100px]"
                      placeholder="Enter thoughts (one per line, max 5, 50 chars each)"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">{stage.thoughts.length}/5 items</p>
                  </div>
                ) : stage.thoughts.length > 0 ? (
                  <ul className="space-y-1.5">
                    {stage.thoughts.map((thought, i) => (
                      <li key={i} className="text-xs italic text-muted-foreground leading-relaxed">
                        &quot;{thought}&quot;
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No thoughts</span>
                )}
              </div>
            ))}

            {/* Pain Points Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Pain Points
              </span>
            </div>
            {editedStages.map((stage, stageIndex) => (
              <div key={stageIndex} className="p-4 border-b border-r last:border-r-0 bg-card">
                {isEditing ? (
                  <div className="space-y-1">
                    <Textarea
                      value={stage.painPoints.join('\n')}
                      onChange={(e) => {
                        const items = e.target.value.split('\n').slice(0, 5).map(item => item.slice(0, 50))
                        updateStage(stageIndex, { painPoints: items })
                      }}
                      className="text-xs min-h-[100px]"
                      placeholder="Enter pain points (one per line, max 5, 50 chars each)"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">{stage.painPoints.length}/5 items</p>
                  </div>
                ) : stage.painPoints.length > 0 ? (
                  <ul className="space-y-1.5">
                    {stage.painPoints.map((pain, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span className="leading-relaxed">{pain}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No pain points</span>
                )}
              </div>
            ))}

            {/* Emotional Curve Row */}
            <div className="bg-muted p-4 border-b border-r font-medium text-sm sticky left-0 z-10 flex flex-col justify-center">
              <div className="space-y-3 mt-15">
                <span className="flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  Emotional Curve
                </span>
                {/* Emotion scale legend */}
                <div className="flex flex-col gap-2 items-center">
                  <div className="flex items-center gap-1.5">
                    <Smile className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-muted-foreground">3.5 - 5 Satisfied</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Meh className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">2.5 - 3.4 Neutral</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Frown className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-muted-foreground">1 - 2.4 Frustrated</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="p-6 border-b border-r-0 relative"
              style={{ gridColumn: '2 / -1' }}
            >
              <div className="w-full h-48 relative pl-6">
                <svg
                  viewBox={`0 0 ${emotionCurvePath.width} ${emotionCurvePath.height}`}
                  className="w-full h-full"
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', left: '1.5rem', right: 0, top: 0, bottom: 0, width: 'calc(100% - 1.5rem)' }}
                >
                  {/* Background gradient zones */}
                  <defs>
                    <linearGradient id="emotionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#eab308" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>

                  {/* Background fill */}
                  <rect x="0" y="0" width="100" height="100" fill="url(#emotionGradient)" />

                  {/* Grid lines */}
                  {[1, 2, 3, 4, 5].map((level) => {
                    const availableHeight = emotionCurvePath.height - emotionCurvePath.paddingTop - emotionCurvePath.paddingBottom
                    const y = emotionCurvePath.paddingTop + availableHeight - ((level - 1) / 4) * availableHeight
                    return (
                      <line
                        key={level}
                        x1={emotionCurvePath.paddingLeft}
                        y1={y}
                        x2={emotionCurvePath.width - emotionCurvePath.paddingRight}
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                    )
                  })}

                  {/* Area under curve */}
                  {editedStages.length > 0 && (
                    <path
                      d={`${emotionCurvePath.path} L ${emotionCurvePath.width - emotionCurvePath.paddingRight} ${emotionCurvePath.height - emotionCurvePath.paddingBottom} L ${emotionCurvePath.paddingLeft} ${emotionCurvePath.height - emotionCurvePath.paddingBottom} Z`}
                      fill="url(#lineGradient)"
                      fillOpacity="0.1"
                    />
                  )}

                  {/* Main emotion curve line */}
                  {editedStages.length > 0 && (
                    <path
                      d={emotionCurvePath.path}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))"
                    />
                  )}
                </svg>

                {/* Emoji markers */}
                {emotionCurvePath.points.map((point, index) => {
                  const emotion = point.emotion
                  let emoji = '😊'
                  if (emotion >= 4.5) emoji = '😊'
                  else if (emotion >= 3.5) emoji = '🙂'
                  else if (emotion >= 2.5) emoji = '😐'
                  else if (emotion >= 1.5) emoji = '😕'
                  else emoji = '😢'

                  const leftPercent = (point.x / emotionCurvePath.width) * 100
                  const topPercent = (point.y / emotionCurvePath.height) * 100

                  return isEditing ? (
                    <div
                      key={index}
                      className="absolute flex flex-col items-center gap-2 select-none"
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: draggedStageIndex === index ? 'grabbing' : 'grab',
                        transition: draggedStageIndex === index ? 'none' : 'top 0.2s ease-out',
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setDraggedStageIndex(index)
                        const container = e.currentTarget.parentElement
                        if (container) {
                          const rect = container.getBoundingClientRect()
                          handleEmojiDrag(index, e.clientY, rect)

                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            handleEmojiDrag(index, moveEvent.clientY, rect)
                          }

                          const handleMouseUp = () => {
                            setDraggedStageIndex(null)
                            document.removeEventListener('mousemove', handleMouseMove)
                            document.removeEventListener('mouseup', handleMouseUp)
                          }

                          document.addEventListener('mousemove', handleMouseMove)
                          document.addEventListener('mouseup', handleMouseUp)
                        }
                      }}
                    >
                      <span className="text-3xl pointer-events-none" style={{ filter: draggedStageIndex === index ? 'brightness(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none' }}>
                        {emoji}
                      </span>
                      <span className="text-xs font-bold text-primary bg-background/90 px-2 py-0.5 rounded-full border border-primary/20">
                        {editedStages[index].emotions.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <div
                      key={index}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: '28px',
                        lineHeight: 1,
                      }}
                    >
                      {emoji}
                    </div>
                  )
                })}

                {/* Scale numbers (1-5) as HTML overlays */}
                {[1, 2, 3, 4, 5].map((level) => {
                  const availableHeight = emotionCurvePath.height - (emotionCurvePath.paddingTop ?? 0) - (emotionCurvePath.paddingBottom ?? 0)
                  const y = (emotionCurvePath.paddingTop ?? 0) + availableHeight - ((level - 1) / 4) * availableHeight
                  const topPercent = (y / emotionCurvePath.height) * 100

                  return (
                    <div
                      key={level}
                      className="absolute left-0 text-xs font-semibold text-gray-600"
                      style={{
                        top: `${topPercent}%`,
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {level}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Opportunities Row */}
            <div className="bg-muted p-4 border-r font-medium text-sm flex items-center sticky left-0 z-10">
              <span className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                Opportunities
              </span>
            </div>
            {editedStages.map((stage, index) => (
              <div key={index} className="p-4 border-r last:border-r-0 bg-card">
                <ul className="space-y-1.5">
                  {stage.opportunities && stage.opportunities.length > 0 ? (
                    stage.opportunities.map((opportunity, oppIndex) => (
                      <li key={oppIndex} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span className="leading-relaxed">{opportunity}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-muted-foreground italic list-none">
                      No opportunities identified
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
