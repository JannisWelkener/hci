'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import type { JourneyStage } from '@/lib/types/database'
import { FormLabel, FormDescription } from '@/components/ui/form'
import { STAGE_ORDER } from '@/lib/utils/journey-stages'

interface ManualStageEditorProps {
  stages: JourneyStage[]
  onChange: (stages: JourneyStage[]) => void
  disabled?: boolean
}

export function ManualStageEditor({ stages, onChange, disabled = false }: ManualStageEditorProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(0)

  const addStage = (stageName: string) => {
    if (!stageName) return

    const newStage: JourneyStage = {
      name: stageName,
      description: '',
      touchpoints: [''],
      actions: [''],
      thoughts: [''],
      painPoints: [''],
      emotions: 3,
      opportunities: [''],
    }

    // Find the correct position to insert the stage based on STAGE_ORDER
    const stageOrderIndex = STAGE_ORDER.indexOf(stageName as typeof STAGE_ORDER[number])
    let insertIndex = stages.length

    if (stageOrderIndex !== -1) {
      // Find the first stage that should come after this one
      insertIndex = stages.findIndex((stage) => {
        const existingIndex = STAGE_ORDER.indexOf(stage.name as typeof STAGE_ORDER[number])
        return existingIndex !== -1 && existingIndex > stageOrderIndex
      })

      // If no stage should come after, append to the end
      if (insertIndex === -1) {
        insertIndex = stages.length
      }
    }

    const newStages = [...stages]
    newStages.splice(insertIndex, 0, newStage)
    onChange(newStages)
    setExpandedStage(insertIndex)
  }

  // Get available stages that haven't been added yet
  const availableStages = STAGE_ORDER.filter(
    (stageName) => !stages.some((stage) => stage.name === stageName)
  )

  const removeStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index)
    onChange(newStages)
    if (expandedStage === index) {
      setExpandedStage(null)
    }
  }

  const updateStage = (index: number, updates: Partial<JourneyStage>) => {
    const newStages = [...stages]
    newStages[index] = { ...newStages[index], ...updates }
    onChange(newStages)
  }

  const addArrayItem = (stageIndex: number, field: keyof Pick<JourneyStage, 'touchpoints' | 'actions' | 'thoughts' | 'painPoints' | 'opportunities'>) => {
    const stage = stages[stageIndex]
    const array = stage[field] as string[]
    updateStage(stageIndex, { [field]: [...array, ''] })
  }

  const removeArrayItem = (stageIndex: number, field: keyof Pick<JourneyStage, 'touchpoints' | 'actions' | 'thoughts' | 'painPoints' | 'opportunities'>, itemIndex: number) => {
    const stage = stages[stageIndex]
    const array = stage[field] as string[]
    const newArray = array.filter((_, i) => i !== itemIndex)
    updateStage(stageIndex, { [field]: newArray })
  }

  const updateArrayItem = (stageIndex: number, field: keyof Pick<JourneyStage, 'touchpoints' | 'actions' | 'thoughts' | 'painPoints' | 'opportunities'>, itemIndex: number, value: string) => {
    const stage = stages[stageIndex]
    const array = [...(stage[field] as string[])]
    array[itemIndex] = value
    updateStage(stageIndex, { [field]: array })
  }

  const getEmotionLabel = (value: number) => {
    if (value >= 4.5) return 'Very Happy'
    if (value >= 3.5) return 'Happy'
    if (value >= 2.5) return 'Neutral'
    if (value >= 1.5) return 'Frustrated'
    return 'Very Frustrated'
  }

  return (
    <div className="space-y-4">
      <div>
        <FormLabel>Journey Stages *</FormLabel>
        <FormDescription>
          Create your journey stages manually. Add stages, define touchpoints, actions, thoughts, pain points, and emotional levels.
        </FormDescription>
      </div>

      <div className="space-y-3">
        {stages.map((stage, stageIndex) => (
          <Card key={stageIndex} className="p-4">
            <div className="space-y-4">
              {/* Stage Header */}
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedStage(expandedStage === stageIndex ? null : stageIndex)}
                      className="p-0 h-auto font-semibold text-base hover:bg-transparent"
                    >
                      {expandedStage === stageIndex ? '▼' : '▶'} {stage.name || `Stage ${stageIndex + 1}`}
                    </Button>
                  </div>

                  {expandedStage === stageIndex && (
                    <div className="space-y-4 pl-6">
                      {/* Stage Name - Read Only */}
                      <div className="space-y-2">
                        <Label>Stage Name</Label>
                        <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                          {stage.name}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                          value={stage.description}
                          onChange={(e) => updateStage(stageIndex, { description: e.target.value })}
                          placeholder="Describe this stage of the journey"
                          rows={2}
                          disabled={disabled}
                        />
                      </div>

                      {/* Emotions */}
                      <div className="space-y-2">
                        <Label>Emotional Level: {getEmotionLabel(stage.emotions)} ({stage.emotions.toFixed(1)})</Label>
                        <Slider
                          value={[stage.emotions]}
                          onValueChange={([value]) => updateStage(stageIndex, { emotions: value })}
                          min={1}
                          max={5}
                          step={0.1}
                          disabled={disabled}
                          className="py-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Very Frustrated</span>
                          <span>Neutral</span>
                          <span>Very Happy</span>
                        </div>
                      </div>

                      {/* Touchpoints */}
                      <ArrayFieldEditor
                        label="Touchpoints"
                        items={stage.touchpoints}
                        onAdd={() => addArrayItem(stageIndex, 'touchpoints')}
                        onRemove={(itemIndex) => removeArrayItem(stageIndex, 'touchpoints', itemIndex)}
                        onUpdate={(itemIndex, value) => updateArrayItem(stageIndex, 'touchpoints', itemIndex, value)}
                        placeholder="e.g., Website, Mobile App, Email"
                        disabled={disabled}
                      />

                      {/* Actions */}
                      <ArrayFieldEditor
                        label="Actions"
                        items={stage.actions}
                        onAdd={() => addArrayItem(stageIndex, 'actions')}
                        onRemove={(itemIndex) => removeArrayItem(stageIndex, 'actions', itemIndex)}
                        onUpdate={(itemIndex, value) => updateArrayItem(stageIndex, 'actions', itemIndex, value)}
                        placeholder="e.g., Browse products, Add to cart"
                        disabled={disabled}
                      />

                      {/* Thoughts */}
                      <ArrayFieldEditor
                        label="Thoughts"
                        items={stage.thoughts}
                        onAdd={() => addArrayItem(stageIndex, 'thoughts')}
                        onRemove={(itemIndex) => removeArrayItem(stageIndex, 'thoughts', itemIndex)}
                        onUpdate={(itemIndex, value) => updateArrayItem(stageIndex, 'thoughts', itemIndex, value)}
                        placeholder="e.g., Is this the right product for me?"
                        disabled={disabled}
                      />

                      {/* Pain Points */}
                      <ArrayFieldEditor
                        label="Pain Points"
                        items={stage.painPoints}
                        onAdd={() => addArrayItem(stageIndex, 'painPoints')}
                        onRemove={(itemIndex) => removeArrayItem(stageIndex, 'painPoints', itemIndex)}
                        onUpdate={(itemIndex, value) => updateArrayItem(stageIndex, 'painPoints', itemIndex, value)}
                        placeholder="e.g., Too many options, Confusing navigation"
                        disabled={disabled}
                      />

                      {/* Opportunities */}
                      <ArrayFieldEditor
                        label="Opportunities"
                        items={stage.opportunities}
                        onAdd={() => addArrayItem(stageIndex, 'opportunities')}
                        onRemove={(itemIndex) => removeArrayItem(stageIndex, 'opportunities', itemIndex)}
                        onUpdate={(itemIndex, value) => updateArrayItem(stageIndex, 'opportunities', itemIndex, value)}
                        placeholder="e.g., Add product comparison tool"
                        disabled={disabled}
                      />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStage(stageIndex)}
                  disabled={disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Select
        value=""
        onValueChange={addStage}
        disabled={disabled || availableStages.length === 0}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center justify-center w-full">
            <Plus className="h-4 w-4 mr-2" />
            <SelectValue placeholder={availableStages.length === 0 ? "All stages added" : "Add Stage"} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {availableStages.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">All stages have been added</div>
          ) : (
            availableStages.map((stageName) => (
              <SelectItem key={stageName} value={stageName}>
                {stageName}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {stages.length === 0 && (
        <p className="text-sm text-destructive">At least one stage is required</p>
      )}
    </div>
  )
}

// Helper component for array fields
function ArrayFieldEditor({
  label,
  items,
  onAdd,
  onRemove,
  onUpdate,
  placeholder,
  disabled = false,
}: {
  label: string
  items: string[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, value: string) => void
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAdd}
          disabled={disabled || items.length >= 5}
          className="h-6 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              disabled={disabled || items.length === 1}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{items.length}/5 items</p>
    </div>
  )
}
