/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for production-safe rollouts.
 * All flags default to safe/conservative values.
 */

export interface FeatureFlags {
  // Bloodwork Recommendation Enhancements
  USE_RECOMMENDATION_V2: boolean;
  USE_UNIFIED_ENGINE: boolean;
  AI_ENHANCEMENT_ENABLED: boolean;
  
  // Future flags can be added here
}

/**
 * Get feature flag value from environment with safe defaults
 */
function getFlag(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Feature flags with safe defaults
 */
export const featureFlags: FeatureFlags = {
  // Start with V2 disabled for safe rollout
  USE_RECOMMENDATION_V2: getFlag('USE_RECOMMENDATION_V2', false),
  
  // Unified engine is optional enhancement
  USE_UNIFIED_ENGINE: getFlag('USE_UNIFIED_ENGINE', false),
  
  // AI enhancement enabled when V2 is active
  AI_ENHANCEMENT_ENABLED: getFlag('AI_ENHANCEMENT_ENABLED', true),
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag];
}

/**
 * Get all feature flags for logging/debugging
 */
export function getAllFeatureFlags(): FeatureFlags {
  return { ...featureFlags };
}
