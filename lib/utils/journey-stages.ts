import { JourneyStage } from '@/lib/types/database'

/**
 * Fixed logical order for journey stages
 */
export const STAGE_ORDER = [
  'Awareness',
  'Consideration',
  'Decision',
  'Onboarding',
  'Regular Use',
  'Support & Growth',
] as const

/**
 * Sort journey stages in their logical order
 */
export function sortStagesByOrder(stages: JourneyStage[]): JourneyStage[] {
  return [...stages].sort((a, b) => {
    const indexA = STAGE_ORDER.indexOf(a.name as typeof STAGE_ORDER[number])
    const indexB = STAGE_ORDER.indexOf(b.name as typeof STAGE_ORDER[number])

    // If both stages are in the predefined order, sort by that order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }

    // If only one stage is in the predefined order, prioritize it
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1

    // If neither stage is in the predefined order, maintain original order
    return 0
  })
}
