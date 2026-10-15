"use client"

import * as React from "react"
import { useFieldArray, type Control } from "react-hook-form"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface AcceptanceCriteriaInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  name: string
}

export function AcceptanceCriteriaInput({
  control,
  name,
}: AcceptanceCriteriaInputProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel>Acceptance Criteria</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append("")}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Criterion
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No acceptance criteria yet. Click &quot;Add Criterion&quot; to add one.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <FormField
            key={field.id}
            control={control}
            name={`${name}.${index}`}
            render={({ field: inputField }) => (
              <FormItem>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-9 flex items-center justify-center text-sm text-muted-foreground">
                    {index + 1}.
                  </div>
                  <FormControl>
                    <Input
                      {...inputField}
                      placeholder="Enter acceptance criterion"
                      className="flex-1"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-9 w-9 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove criterion</span>
                  </Button>
                </div>
                <FormMessage className="ml-8" />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  )
}
