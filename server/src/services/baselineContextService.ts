import { getBaselineProfile, getUserPreferences, type BaselineProfile, type UserPreferences } from './baselineProfileService';
import { logger } from '../utils/logger';
import { getCachedBaselineContext, setCachedBaselineContext, invalidateBaselineContext as invalidateCache } from './cacheManager';

export interface BaselineContext {
  profile: BaselineProfile;
  preferences: UserPreferences;
  loadedAt: Date;
}

/**
 * Load complete baseline context (profile + preferences) for a user
 * This should be called once per request and shared across all engines
 * to avoid multiple database calls
 */
export async function getBaselineContext(userId: string): Promise<BaselineContext> {
  // Check cache first
  const cached = getCachedBaselineContext(userId);
  if (cached) {
    logger.info('📋 [BASELINE CONTEXT] Cache hit', { userId });
    return cached;
  }

  logger.info('🔵 [BASELINE CONTEXT] Loading baseline context', { userId });

  // Load both profile and preferences in parallel
  const [profile, preferences] = await Promise.all([
    getBaselineProfile(userId),
    getUserPreferences(userId),
  ]);

  const context: BaselineContext = {
    profile,
    preferences,
    loadedAt: new Date(),
  };

  // Cache the result
  setCachedBaselineContext(userId, context);

  logger.info('✅ [BASELINE CONTEXT] Context loaded', {
    userId,
    hasProfile: !!profile.age,
    hasPreferences: !!preferences.riskTolerance,
  });

  return context;
}

/**
 * Invalidate baseline context cache for a user
 * Call this when profile or preferences are updated
 */
export function invalidateBaselineContext(userId: string): void {
  invalidateCache(userId);
}

/**
 * Helper to get specific baseline fields with safe fallbacks
 */
export async function getBaselineFields(userId: string): Promise<{
  age: number;
  sex: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  activityLevel: string;
  trainingExperience: string;
  trtUsage: boolean;
  diabetesStatus: string;
  sleepTarget: number;
  trainingDaysPerWeek: number;
  conditions: string[];
  medications: string[];
  familyHistory: Record<string, any>;
  riskTolerance: string;
  aggressiveness: string;
  dietQuality?: 'poor' | 'fair' | 'good' | 'excellent';
}> {
  const context = await getBaselineContext(userId);
  const { profile, preferences } = context;

  return {
    age: profile.age ?? 35,
    sex: profile.sex ?? 'male',
    weight: profile.weightLbs ?? 180,
    height: profile.heightInches ?? 70,
    activityLevel: profile.activityLevel ?? 'moderately_active',
    trainingExperience: profile.trainingExperienceLevel ?? 'intermediate',
    trtUsage: profile.trtUsage ?? false,
    diabetesStatus: profile.diabetesStatus ?? 'none',
    sleepTarget: profile.sleepTargetHours ?? 7.5,
    trainingDaysPerWeek: profile.trainingDaysPerWeek ?? 4,
    conditions: profile.conditions ?? [],
    medications: profile.medications ?? [],
    familyHistory: profile.familyHistory ?? {},
    riskTolerance: preferences?.riskTolerance ?? 'moderate',
    aggressiveness: preferences?.aggressivenessLevel ?? 'moderate',
    dietQuality: profile.dietQuality,
  };
}
