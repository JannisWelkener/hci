'use client'

import { UserJourneyMapCard } from './UserJourneyMapCard'
import { UserJourneyMap } from '@/lib/types/database'

interface UserJourneyMapListProps {
  journeyMaps: UserJourneyMap[]
}

export function UserJourneyMapList({ journeyMaps }: UserJourneyMapListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {journeyMaps.map((journeyMap) => (
        <UserJourneyMapCard
          key={journeyMap.id}
          journeyMap={journeyMap}
        />
      ))}
    </div>
  )
}
