'use client'

import { Wireframe } from '@/lib/types/database'
import { WireframeCard } from './WireframeCard'

interface WireframeListProps {
  wireframes: Wireframe[]
  onClick: (wireframe: Wireframe) => void
  onDelete: (e: React.MouseEvent, id: string) => void
  onEdit?: (wireframe: Wireframe) => void
}

export function WireframeList({
  wireframes,
  onClick,
  onDelete,
  onEdit,
}: WireframeListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wireframes.map((wireframe) => (
        <WireframeCard
          key={wireframe.id}
          wireframe={wireframe}
          onClick={() => onClick(wireframe)}
          onDelete={(e) => onDelete(e, wireframe.id)}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
