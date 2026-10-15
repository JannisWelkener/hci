/**
 * Development Environment Configuration
 *
 * Granular control for development vs production features
 */

/**
 * Use mock data for Personas and User Stories
 * - true: Frontend mock data (no Supabase needed)
 * - false: Fetch from Supabase API
 */
export const USE_MOCK_DATA = false

/**
 * Use AI API for Journey Map generation
 * - true: Call AIML API (requires credits)
 * - false: Use template-based stages
 */
export const USE_AI_API = true

/**
 * Legacy API_MODE for backwards compatibility
 */
export const API_MODE: 'mock' | 'production' = USE_MOCK_DATA ? 'mock' : 'production'

/**
 * Helper function to check if we're in mock mode
 */
export const isMockMode = () => USE_MOCK_DATA

/**
 * Helper function to check if we're in production mode
 */
export const isProductionMode = () => !USE_MOCK_DATA
