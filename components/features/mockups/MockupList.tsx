'use client'

import { Mockup } from '@/lib/types/database'
import { MockupCard } from './MockupCard'

interface MockupListProps {
  mockups: Mockup[]
  onView: (mockup: Mockup) => void
  onEdit: (mockup: Mockup) => void
  onDelete: (mockup: Mockup) => void
}

export function MockupList({
  mockups,
  onView,
  onEdit,
  onDelete,
}: MockupListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mockups.map((mockup) => (
        <MockupCard
          key={mockup.id}
          mockup={mockup}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
