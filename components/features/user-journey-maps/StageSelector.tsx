'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { FormLabel, FormDescription } from '@/components/ui/form'
import { AVAILABLE_STAGES, type StageName } from '@/lib/utils/journey-map-templates'

interface StageSelectorProps {
  selectedStages: StageName[]
  onChange: (stages: StageName[]) => void
  disabled?: boolean
}

export function StageSelector({ selectedStages, onChange, disabled = false }: StageSelectorProps) {
  const handleToggleStage = (stageName: StageName, checked: boolean) => {
    if (checked) {
      onChange([...selectedStages, stageName])
    } else {
      onChange(selectedStages.filter((s) => s !== stageName))
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <FormLabel>Journey Stages *</FormLabel>
        <FormDescription>
          Select which stages to include in your journey map. At least one stage is required.
        </FormDescription>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 border rounded-md">
        {AVAILABLE_STAGES.map((stageName) => {
          const isChecked = selectedStages.includes(stageName)
          return (
            <div key={stageName} className="flex items-center space-x-2">
              <Checkbox
                id={`stage-${stageName}`}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  handleToggleStage(stageName, checked as boolean)
                }
                disabled={disabled}
              />
              <label
                htmlFor={`stage-${stageName}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {stageName}
              </label>
            </div>
          )
        })}
      </div>
      {selectedStages.length === 0 && (
        <p className="text-sm text-destructive">At least one stage must be selected</p>
      )}
    </div>
  )
}
