import { z } from 'zod';

/**
 * Schema for a single subapp statistics
 */
export const subappStatsSchema = z.object({
  count: z.number().int().min(0),
  lastUpdated: z.string().nullable(),
});

/**
 * Schema for project dashboard statistics response
 */
export const projectStatsSchema = z.object({
  userStories: subappStatsSchema,
  personas: subappStatsSchema,
  userJourneys: subappStatsSchema,
  mockups: subappStatsSchema,
  wireframes: subappStatsSchema,
});

export type SubappStats = z.infer<typeof subappStatsSchema>;
export type ProjectStats = z.infer<typeof projectStatsSchema>;
