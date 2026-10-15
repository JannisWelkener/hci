// File: lib/utils/ai-prompt-generator.ts

import type { Persona, UserStory } from '@/lib/types/database'
import type { StageName } from './journey-map-templates'

interface StoryOccurrence {
  story: UserStory
  occurrences: number
  positions: number[] // Positions in timeline (0-indexed)
}

/**
 * Generates an AI prompt for creating a personalized User Journey Map
 */
export function generateJourneyMapPrompt(params: {
  title: string
  description: string | null
  persona: Persona
  userStories: UserStory[]
  timelineStoryIds: string[] // The ordered timeline with duplicates
  selectedStages: StageName[]
  aiOptimizeTimeline?: boolean // If true, AI can optimize the timeline order
}): string {
  const { title, description, persona, userStories, timelineStoryIds, selectedStages, aiOptimizeTimeline = false } = params

  // Analyze story occurrences in timeline
  const storyOccurrences = analyzeStoryOccurrences(userStories, timelineStoryIds)

  // Timeline instructions based on mode
  const timelineInstructions = aiOptimizeTimeline
    ? `
## Timeline Mode: AI-Optimized

**IMPORTANT:** You have the flexibility to **optimize and reorder the timeline** to create the most logical and effective user journey.

- The provided timeline is a suggestion based on user's story selection
- You may reorder, group, or restructure the user stories as needed
- Optimize the flow to best match ${persona.name}'s natural journey
- Ensure the journey makes sense from a user experience perspective
- You can adjust story frequency and positions to improve the flow
`
    : `
## Timeline Mode: Fixed Sequence

**CRITICAL:** You MUST **strictly follow the provided timeline order**.

- The timeline sequence is EXACTLY as the user defined it
- Do NOT reorder or change the sequence of user stories
- Do NOT add or remove story occurrences
- Follow the exact positions provided (Step 1, Step 2, Step 3, etc.)
- Respect repeated stories at their designated positions
- The timeline order is non-negotiable and must be maintained
`

  // Build the prompt
  const prompt = `
# User Journey Map Generation Request

## Journey Map Overview
**Title:** ${title}
${description ? `**Description:** ${description}` : ''}

---

## Persona Profile

**Name:** ${persona.name}
**Age:** ${persona.age}
**Role:** ${persona.role}

### Goals
${(persona.goals || []).map((goal, i) => `${i + 1}. ${goal}`).join('\n')}

### Frustrations
${(persona.frustrations || []).map((frust, i) => `${i + 1}. ${frust}`).join('\n')}

### Behaviors
${(persona.behaviors || []).map((behavior, i) => `${i + 1}. ${behavior}`).join('\n')}

### Bio
${persona.bio}

---

## User Stories & Timeline

The journey follows this timeline sequence (${timelineStoryIds.length} steps total):

### Timeline Order
${timelineStoryIds.map((id, index) => {
  const story = userStories.find(s => s.id === id)
  return `${index + 1}. ${story?.title || 'Unknown Story'}`
}).join('\n')}

### User Stories Details

${storyOccurrences.map(({ story, occurrences, positions }) => `
**Story: ${story.title}**
- **Occurs:** ${occurrences} time(s) in the journey (at position${occurrences > 1 ? 's' : ''}: ${positions.map(p => p + 1).join(', ')})
- **User Role:** ${story.user_role}
- **Action:** ${story.action}
- **Benefit:** ${story.benefit}
${story.acceptance_criteria && story.acceptance_criteria.length > 0 ? `- **Acceptance Criteria:**
${story.acceptance_criteria.map(c => `  - ${c}`).join('\n')}` : ''}
${story.priority ? `- **Priority:** ${story.priority}` : ''}
${story.status ? `- **Status:** ${story.status}` : ''}
`).join('\n')}

---

${timelineInstructions}

---

## Journey Stages to Generate

Please create detailed journey stage information for the following ${selectedStages.length} stage(s):

${selectedStages.map((stage, i) => `${i + 1}. **${stage}**`).join('\n')}

---

## Expected Output Format

For each journey stage, provide:

1. **Stage Name:** [Stage name]
2. **Description:** A personalized description based on ${persona.name}'s context
3. **Actions:** 3-5 specific actions ${persona.name} would take in this stage (as array, max 5 items, 50 chars each)
4. **Thoughts:** 3-5 thoughts/questions ${persona.name} would have (as array, max 5 items, 50 chars each)
5. **Emotions:** A decimal rating from 1.0-5.0 (e.g., 3.7, 4.2) representing ${persona.name}'s emotional state. Use decimals for precision (1.0=very negative, 5.0=very positive)
6. **Pain Points:** 3-5 specific pain points ${persona.name} experiences (as array, max 5 items, 50 chars each)
7. **Opportunities:** For EACH pain point above, provide a corresponding solution approach or opportunity to address it (as array, same number as pain points, 50 chars each). These should be actionable improvements or solutions.
8. **Touchpoints:** 3-5 touchpoints/channels ${persona.name} interacts with (as array, max 5 items, 50 chars each)

---

## Instructions

- **Personalize everything** based on ${persona.name}'s profile (age: ${persona.age}, role: ${persona.role})
- Consider ${persona.name}'s goals, frustrations, and behaviors when creating content
- Ensure the journey flows logically through the timeline of user stories
- Make actions, thoughts, and pain points **specific and realistic** for ${persona.name}
- Account for the frequency and position of user stories in the timeline
- Keep language natural and human-like
- Focus on ${persona.name}'s perspective throughout the journey

Generate the personalized journey map stages now.
`.trim()

  return prompt
}

/**
 * Analyzes how often each story appears in the timeline and at which positions
 */
function analyzeStoryOccurrences(
  userStories: UserStory[],
  timelineStoryIds: string[]
): StoryOccurrence[] {
  const occurrenceMap = new Map<string, { story: UserStory; positions: number[] }>()

  // Count occurrences and track positions
  timelineStoryIds.forEach((storyId, index) => {
    const story = userStories.find(s => s.id === storyId)
    if (!story) return

    if (!occurrenceMap.has(storyId)) {
      occurrenceMap.set(storyId, { story, positions: [] })
    }
    occurrenceMap.get(storyId)!.positions.push(index)
  })

  // Convert to array format
  return Array.from(occurrenceMap.values()).map(({ story, positions }) => ({
    story,
    occurrences: positions.length,
    positions,
  }))
}

/**
 * Parses AI response and extracts journey stages
 * (To be implemented when AI integration is ready)
 */
export function parseAIResponse(aiResponse: string) {
  // TODO: Implement parsing logic when AI integration is ready
  // This will parse the AI's response and extract structured journey stage data
  return {
    stages: [],
    rawResponse: aiResponse,
  }
}
