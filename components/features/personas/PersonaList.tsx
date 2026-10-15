'use client'

import { Persona } from '@/lib/types/database'
import { PersonaCard } from './PersonaCard'

interface PersonaListProps {
  personas: Persona[]
  onView?: (persona: Persona) => void
  onEdit?: (persona: Persona) => void
  onDelete?: (persona: Persona) => void
}

export function PersonaList({
  personas,
  onView,
  onEdit,
  onDelete,
}: PersonaListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {personas.map((persona) => (
        <PersonaCard
          key={persona.id}
          persona={persona}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
