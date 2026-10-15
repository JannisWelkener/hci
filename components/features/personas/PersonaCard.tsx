'use client'

import { Persona } from '@/lib/types/database'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, Pencil, Trash2, MoreVertical } from 'lucide-react'

interface PersonaCardProps {
  persona: Persona
  onView?: (persona: Persona) => void
  onEdit?: (persona: Persona) => void
  onDelete?: (persona: Persona) => void
}

export function PersonaCard({ persona, onView, onEdit, onDelete }: PersonaCardProps) {
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
      return
    }
    onView?.(persona)
  }

  return (
    <Card
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          {persona.photo_url && (
            <img
              src={persona.photo_url}
              alt={persona.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div>
            <h3 className="font-bold text-lg">{persona.name}</h3>
            <p className="text-muted-foreground text-sm">
              {persona.role}
              {persona.age && `, ${persona.age}`}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              data-radix-dropdown-menu-trigger
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onView?.(persona)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(persona)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(persona)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm">
          {persona.occupation && (
            <p className="text-muted-foreground">{persona.occupation}</p>
          )}
          {persona.location && (
            <p className="text-muted-foreground">{persona.location}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
