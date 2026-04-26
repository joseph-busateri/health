import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { invalidateBaselineContext } from './cacheManager';

export interface BaselineProfile {
  userId: string;
  dateOfBirth?: Date;
  age?: number;
  sex?: 'male' | 'female' | 'other';
  race?: 'white' | 'black' | 'asian' | 'hispanic' | 'other';
  heightInches?: number;
  weightLbs?: number;
  bodyFatPercent?: number;
  trainingExperienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  trainingYears?: number;
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  primarySport?: string;
  conditions?: string[];
  medications?: string[];
  allergies?: string[];
  injuries?: string[];
  surgeries?: string[];
  familyHistory?: Record<string, any>;
  trtUsage?: boolean;
  diabetesStatus?: 'none' | 'prediabetic' | 'type1' | 'type2';
  bloodPressureHistory?: 'normal' | 'elevated' | 'hypertension_stage1' | 'hypertension_stage2';
  smokingStatus?: 'never' | 'former' | 'current';
  sleepTargetHours?: number;
  trainingDaysPerWeek?: number;
  travelFrequency?: 'never' | 'rarely' | 'monthly' | 'weekly' | 'daily';
  stressEnvironment?: 'low' | 'moderate' | 'high' | 'very_high';
  dietQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  baselineCalories?: number;
  baselineProteinG?: number;
  baselineCarbsG?: number;
  baselineFatsG?: number;
  baselineHydrationOz?: number;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  userId: string;
  preferredTrainingDays?: string[];
  preferredTrainingTime?: 'morning' | 'afternoon' | 'evening';
  preferredWorkoutDuration?: number;
  preferredTrainingStyle?: string;
  preferredSleepWindow?: { start: string; end: string };
  nutritionPreferences?: Record<string, any>;
  mealTimingPreference?: 'intermittent_fasting' | 'regular' | 'frequent_small_meals';
  supplementPreferences?: Record<string, any>;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  optimizationPriority?: 'health' | 'performance' | 'aesthetics' | 'longevity';
  aggressivenessLevel?: 'maintenance' | 'moderate' | 'aggressive' | 'extreme';
  notificationPreferences?: Record<string, any>;
  reminderPreferences?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// In-memory cache with 5-minute TTL
const baselineProfileCache = new Map<string, { data: BaselineProfile; timestamp: number }>();
const userPreferencesCache = new Map<string, { data: UserPreferences; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Default baseline for fallback
const DEFAULT_BASELINE: Partial<BaselineProfile> = {
  age: 35,
  sex: 'male',
  heightInches: 70,
  weightLbs: 180,
  bodyFatPercent: 18,
  trainingExperienceLevel: 'intermediate',
  activityLevel: 'moderately_active',
  sleepTargetHours: 7.5,
  trainingDaysPerWeek: 4,
  trtUsage: false,
  diabetesStatus: 'none',
  bloodPressureHistory: 'normal',
  baselineCalories: 2800,
  baselineProteinG: 200,
  baselineCarbsG: 280,
  baselineFatsG: 80,
  baselineHydrationOz: 100,
};

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export async function getBaselineProfile(userId: string): Promise<BaselineProfile> {
  // Check cache first
  const cached = baselineProfileCache.get(userId);
  if (cached && isCacheValid(cached.timestamp)) {
    logger.info('📋 [BASELINE PROFILE] Cache hit', { userId });
    return cached.data;
  }

  try {
    const { data, error } = await supabase
      .from('baseline_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found, return defaults with warning
        logger.warn('⚠️ [BASELINE PROFILE] No profile found, using defaults', { userId });
        const defaultProfile: BaselineProfile = {
          userId,
          ...DEFAULT_BASELINE,
        };
        return defaultProfile;
      }
      throw error;
    }

    const profile: BaselineProfile = {
      userId: data.user_id,
      dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
      age: data.age,
      sex: data.sex,
      race: data.race,
      heightInches: data.height_inches,
      weightLbs: data.weight_lbs,
      bodyFatPercent: data.body_fat_percent,
      trainingExperienceLevel: data.training_experience_level,
      trainingYears: data.training_years,
      activityLevel: data.activity_level,
      primarySport: data.primary_sport,
      conditions: data.conditions,
      medications: data.medications,
      allergies: data.allergies,
      injuries: data.injuries,
      surgeries: data.surgeries,
      familyHistory: data.family_history,
      trtUsage: data.trt_usage,
      diabetesStatus: data.diabetes_status,
      bloodPressureHistory: data.blood_pressure_history,
      smokingStatus: data.smoking_status,
      sleepTargetHours: data.sleep_target_hours,
      trainingDaysPerWeek: data.training_days_per_week,
      travelFrequency: data.travel_frequency,
      stressEnvironment: data.stress_environment,
      dietQuality: data.diet_quality,
      baselineCalories: data.baseline_calories,
      baselineProteinG: data.baseline_protein_g,
      baselineCarbsG: data.baseline_carbs_g,
      baselineFatsG: data.baseline_fats_g,
      baselineHydrationOz: data.baseline_hydration_oz,
      source: data.source,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Cache the result
    baselineProfileCache.set(userId, { data: profile, timestamp: Date.now() });
    
    logger.info('✅ [BASELINE PROFILE] Profile loaded', { 
      userId, 
      age: profile.age,
      sex: profile.sex,
      source: profile.source 
    });

    return profile;
  } catch (error) {
    logger.error('❌ [BASELINE PROFILE] Failed to load profile', { 
      userId, 
      error: (error as Error).message 
    });
    
    // Return defaults on error
    const defaultProfile: BaselineProfile = {
      userId,
      ...DEFAULT_BASELINE,
    };
    return defaultProfile;
  }
}

export async function upsertBaselineProfile(profile: Partial<BaselineProfile> & { userId: string }): Promise<BaselineProfile> {
  try {
    const dbProfile = {
      user_id: profile.userId,
      date_of_birth: profile.dateOfBirth,
      age: profile.age,
      sex: profile.sex,
      height_inches: profile.heightInches,
      weight_lbs: profile.weightLbs,
      body_fat_percent: profile.bodyFatPercent,
      training_experience_level: profile.trainingExperienceLevel,
      training_years: profile.trainingYears,
      activity_level: profile.activityLevel,
      primary_sport: profile.primarySport,
      conditions: profile.conditions,
      medications: profile.medications,
      allergies: profile.allergies,
      injuries: profile.injuries,
      surgeries: profile.surgeries,
      family_history: profile.familyHistory,
      trt_usage: profile.trtUsage,
      diabetes_status: profile.diabetesStatus,
      blood_pressure_history: profile.bloodPressureHistory,
      sleep_target_hours: profile.sleepTargetHours,
      training_days_per_week: profile.trainingDaysPerWeek,
      travel_frequency: profile.travelFrequency,
      stress_environment: profile.stressEnvironment,
      diet_quality: profile.dietQuality,
      baseline_calories: profile.baselineCalories,
      baseline_protein_g: profile.baselineProteinG,
      baseline_carbs_g: profile.baselineCarbsG,
      baseline_fats_g: profile.baselineFatsG,
      baseline_hydration_oz: profile.baselineHydrationOz,
      source: profile.source || 'manual',
    };

    const { data, error } = await supabase
      .from('baseline_profile')
      .upsert(dbProfile, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    // Invalidate caches
    baselineProfileCache.delete(profile.userId);
    invalidateBaselineContext(profile.userId);

    logger.info('✅ [BASELINE PROFILE] Profile saved', {
      userId: profile.userId,
      source: profile.source
    });

    return await getBaselineProfile(profile.userId);
  } catch (error) {
    logger.error('❌ [BASELINE PROFILE] Failed to save profile', { 
      userId: profile.userId, 
      error: (error as Error).message 
    });
    throw error;
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  // Check cache first
  const cached = userPreferencesCache.get(userId);
  if (cached && isCacheValid(cached.timestamp)) {
    logger.info('📋 [USER PREFERENCES] Cache hit', { userId });
    return cached.data;
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return empty
        logger.warn('⚠️ [USER PREFERENCES] No preferences found', { userId });
        return { userId };
      }
      throw error;
    }

    const preferences: UserPreferences = {
      userId: data.user_id,
      preferredTrainingDays: data.preferred_training_days,
      preferredTrainingTime: data.preferred_training_time,
      preferredWorkoutDuration: data.preferred_workout_duration,
      preferredTrainingStyle: data.preferred_training_style,
      preferredSleepWindow: data.preferred_sleep_window,
      nutritionPreferences: data.nutrition_preferences,
      mealTimingPreference: data.meal_timing_preference,
      supplementPreferences: data.supplement_preferences,
      riskTolerance: data.risk_tolerance,
      optimizationPriority: data.optimization_priority,
      aggressivenessLevel: data.aggressiveness_level,
      notificationPreferences: data.notification_preferences,
      reminderPreferences: data.reminder_preferences,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Cache the result
    userPreferencesCache.set(userId, { data: preferences, timestamp: Date.now() });
    
    logger.info('✅ [USER PREFERENCES] Preferences loaded', { userId });

    return preferences;
  } catch (error) {
    logger.error('❌ [USER PREFERENCES] Failed to load preferences', { 
      userId, 
      error: (error as Error).message 
    });
    
    // Return empty preferences on error
    return { userId };
  }
}

export async function upsertUserPreferences(preferences: Partial<UserPreferences> & { userId: string }): Promise<UserPreferences> {
  try {
    const dbPreferences = {
      user_id: preferences.userId,
      preferred_training_days: preferences.preferredTrainingDays,
      preferred_training_time: preferences.preferredTrainingTime,
      preferred_workout_duration: preferences.preferredWorkoutDuration,
      preferred_training_style: preferences.preferredTrainingStyle,
      preferred_sleep_window: preferences.preferredSleepWindow,
      nutrition_preferences: preferences.nutritionPreferences,
      meal_timing_preference: preferences.mealTimingPreference,
      supplement_preferences: preferences.supplementPreferences,
      risk_tolerance: preferences.riskTolerance,
      optimization_priority: preferences.optimizationPriority,
      aggressiveness_level: preferences.aggressivenessLevel,
      notification_preferences: preferences.notificationPreferences,
      reminder_preferences: preferences.reminderPreferences,
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(dbPreferences, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    // Invalidate caches
    userPreferencesCache.delete(preferences.userId);
    invalidateBaselineContext(preferences.userId);

    logger.info('✅ [USER PREFERENCES] Preferences saved', { userId: preferences.userId });

    return await getUserPreferences(preferences.userId);
  } catch (error) {
    logger.error('❌ [USER PREFERENCES] Failed to save preferences', { 
      userId: preferences.userId, 
      error: (error as Error).message 
    });
    throw error;
  }
}

// Helper function to get baseline with safe fallbacks for specific fields
export async function getBaselineWithFallbacks(userId: string): Promise<Required<Pick<BaselineProfile, 'age' | 'sex' | 'heightInches' | 'weightLbs' | 'activityLevel' | 'sleepTargetHours' | 'baselineCalories' | 'baselineProteinG'>>> {
  const profile = await getBaselineProfile(userId);
  
  return {
    age: profile.age ?? DEFAULT_BASELINE.age!,
    sex: profile.sex ?? DEFAULT_BASELINE.sex!,
    heightInches: profile.heightInches ?? DEFAULT_BASELINE.heightInches!,
    weightLbs: profile.weightLbs ?? DEFAULT_BASELINE.weightLbs!,
    activityLevel: profile.activityLevel ?? DEFAULT_BASELINE.activityLevel!,
    sleepTargetHours: profile.sleepTargetHours ?? DEFAULT_BASELINE.sleepTargetHours!,
    baselineCalories: profile.baselineCalories ?? DEFAULT_BASELINE.baselineCalories!,
    baselineProteinG: profile.baselineProteinG ?? DEFAULT_BASELINE.baselineProteinG!,
  };
}
