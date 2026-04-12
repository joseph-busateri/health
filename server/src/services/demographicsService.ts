import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface DemographicProfile {
  userId: string;
  
  // Basic demographics
  dateOfBirth?: Date;
  age?: number;
  sex?: 'male' | 'female' | 'other';
  heightInches?: number;
  weightLbs?: number;
  bodyFatPercent?: number;
  
  // Extended demographics
  ethnicity?: 'caucasian' | 'african_american' | 'hispanic' | 'asian' | 'native_american' | 
               'pacific_islander' | 'middle_eastern' | 'mixed' | 'other' | 'prefer_not_to_say';
  race?: 'white' | 'black' | 'asian' | 'native_american' | 'pacific_islander' | 'mixed' | 'other';
  geographicRegion?: string;
  occupation?: string;
  educationLevel?: 'high_school' | 'some_college' | 'bachelors' | 'masters' | 'doctorate' | 
                  'professional' | 'other' | 'prefer_not_to_say';
  incomeLevel?: 'low' | 'lower_middle' | 'middle' | 'upper_middle' | 'high' | 'prefer_not_to_say';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'separated' | 'widowed' | 
                  'domestic_partnership' | 'prefer_not_to_say';
  childrenCount?: number;
  
  // Health behaviors
  smokingStatus?: 'never' | 'former' | 'current' | 'occasional' | 'prefer_not_to_say';
  alcoholConsumption?: 'none' | 'occasional' | 'moderate' | 'heavy' | 'prefer_not_to_say';
  drugUse?: 'none' | 'marijuana' | 'recreational' | 'prescribed' | 'prefer_not_to_say';
  dietaryRestrictions?: string[];
  foodAllergies?: string[];
  
  // Environmental factors
  sleepEnvironment?: 'dark_quiet' | 'some_light' | 'noisy' | 'variable' | 'shared' | 'prefer_not_to_say';
  workSchedule?: 'regular_9_5' | 'shifts' | 'flexible' | 'irregular' | 'remote' | 'prefer_not_to_say';
  commuteType?: 'none' | 'driving' | 'public_transport' | 'walking' | 'cycling' | 'mixed' | 'prefer_not_to_say';
  physicalJobActivity?: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'very_heavy' | 'prefer_not_to_say';
  recreationalActivities?: string[];
  sunExposure?: 'minimal' | 'low' | 'moderate' | 'high' | 'very_high' | 'prefer_not_to_say';
  skinType?: 'type_i' | 'type_ii' | 'type_iii' | 'type_iv' | 'type_v' | 'type_vi' | 'prefer_not_to_say';
  
  // Health conditions
  hairLossPattern?: 'none' | 'temporal_recession' | 'vertex_thinning' | 'diffuse_thinning' | 'complete' | 'prefer_not_to_say';
  skinConditions?: string[];
  digestiveHealth?: 'excellent' | 'good' | 'fair' | 'poor' | 'diagnosed_condition' | 'prefer_not_to_say';
  cognitiveHealth?: 'excellent' | 'good' | 'fair' | 'poor' | 'diagnosed_condition' | 'prefer_not_to_say';
  mentalHealthHistory?: string[];
  
  // Healthcare access
  preventiveCare?: 'regular' | 'occasional' | 'rare' | 'never' | 'prefer_not_to_say';
  healthInsurance?: 'private' | 'medicare' | 'medicaid' | 'employer' | 'none' | 'other' | 'prefer_not_to_say';
  primaryCareAccess?: 'excellent' | 'good' | 'fair' | 'poor' | 'none' | 'prefer_not_to_say';
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
  
  // Preferences
  preferredLanguage?: string;
  timezone?: string;
  measurementSystem?: 'imperial' | 'metric' | 'mixed';
  
  // Metadata
  dataQualityScore?: number;
  completionPercentage?: number;
  lastUpdated?: string;
}

export interface DemographicValidationRule {
  fieldName: string;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'date';
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
  regexPattern?: string;
  displayOrder: number;
  fieldGroup: string;
  fieldLabel: string;
  helpText?: string;
  sensitiveData: boolean;
}

export interface DemographicCollectionProgress {
  userId: string;
  totalFields: number;
  completedFields: number;
  completionPercentage: number;
  collectionStatus: 'not_started' | 'in_progress' | 'completed' | 'verified';
  lastUpdatedField?: string;
  lastUpdatedAt?: string;
  dataQualityScore?: number;
  missingRequiredFields: string[];
}

// Cache for demographic profiles
const demographicCache = new Map<string, { data: DemographicProfile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export async function getDemographicProfile(userId: string): Promise<DemographicProfile> {
  // Check cache first
  const cached = demographicCache.get(userId);
  if (cached && isCacheValid(cached.timestamp)) {
    logger.info('Demographic profile cache hit', { userId });
    return cached.data;
  }

  try {
    const { data, error } = await supabase
      .rpc('get_demographic_profile_complete', { p_user_id: userId });

    if (error) {
      logger.error('Failed to get demographic profile', { userId, error: error.message });
      throw error;
    }

    if (!data || data.length === 0) {
      logger.warn('No demographic profile found', { userId });
      return { userId };
    }

    const profileData = data[0];
    const profile: DemographicProfile = {
      userId: profileData.user_id,
      dateOfBirth: profileData.date_of_birth ? new Date(profileData.date_of_birth) : undefined,
      age: profileData.age,
      sex: profileData.sex,
      heightInches: profileData.height_inches,
      weightLbs: profileData.weight_lbs,
      bodyFatPercent: profileData.body_fat_percent,
      ethnicity: profileData.ethnicity,
      race: profileData.race,
      geographicRegion: profileData.geographic_region,
      occupation: profileData.occupation,
      educationLevel: profileData.education_level,
      incomeLevel: profileData.income_level,
      maritalStatus: profileData.marital_status,
      childrenCount: profileData.children_count,
      smokingStatus: profileData.smoking_status,
      alcoholConsumption: profileData.alcohol_consumption,
      drugUse: profileData.drug_use,
      dietaryRestrictions: profileData.dietary_restrictions,
      foodAllergies: profileData.food_allergies,
      sleepEnvironment: profileData.sleep_environment,
      workSchedule: profileData.work_schedule,
      commuteType: profileData.commute_type,
      physicalJobActivity: profileData.physical_job_activity,
      recreationalActivities: profileData.recreational_activities,
      sunExposure: profileData.sun_exposure,
      skinType: profileData.skin_type,
      hairLossPattern: profileData.hair_loss_pattern,
      skinConditions: profileData.skin_conditions,
      digestiveHealth: profileData.digestive_health,
      cognitiveHealth: profileData.cognitive_health,
      mentalHealthHistory: profileData.mental_health_history,
      preventiveCare: profileData.preventive_care,
      healthInsurance: profileData.health_insurance,
      primaryCareAccess: profileData.primary_care_access,
      emergencyContacts: profileData.emergency_contacts,
      preferredLanguage: profileData.preferred_language,
      timezone: profileData.timezone,
      measurementSystem: profileData.measurement_system,
      dataQualityScore: profileData.data_quality_score,
      completionPercentage: profileData.completion_percentage,
      lastUpdated: profileData.last_updated,
    };

    // Cache the result
    demographicCache.set(userId, { data: profile, timestamp: Date.now() });

    logger.info('Demographic profile loaded', { 
      userId, 
      completionPercentage: profile.completionPercentage,
      dataQualityScore: profile.dataQualityScore 
    });

    return profile;
  } catch (error) {
    logger.error('Error loading demographic profile', { 
      userId, 
      error: (error as Error).message 
    });
    return { userId };
  }
}

export async function updateDemographicProfile(
  userId: string, 
  updates: Partial<DemographicProfile>
): Promise<DemographicProfile> {
  try {
    const dbUpdates: Record<string, any> = {};

    // Map interface fields to database columns
    if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth;
    if (updates.age !== undefined) dbUpdates.age = updates.age;
    if (updates.sex !== undefined) dbUpdates.sex = updates.sex;
    if (updates.heightInches !== undefined) dbUpdates.height_inches = updates.heightInches;
    if (updates.weightLbs !== undefined) dbUpdates.weight_lbs = updates.weightLbs;
    if (updates.bodyFatPercent !== undefined) dbUpdates.body_fat_percent = updates.bodyFatPercent;
    if (updates.ethnicity !== undefined) dbUpdates.ethnicity = updates.ethnicity;
    if (updates.race !== undefined) dbUpdates.race = updates.race;
    if (updates.geographicRegion !== undefined) dbUpdates.geographic_region = updates.geographicRegion;
    if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;
    if (updates.educationLevel !== undefined) dbUpdates.education_level = updates.educationLevel;
    if (updates.incomeLevel !== undefined) dbUpdates.income_level = updates.incomeLevel;
    if (updates.maritalStatus !== undefined) dbUpdates.marital_status = updates.maritalStatus;
    if (updates.childrenCount !== undefined) dbUpdates.children_count = updates.childrenCount;
    if (updates.smokingStatus !== undefined) dbUpdates.smoking_status = updates.smokingStatus;
    if (updates.alcoholConsumption !== undefined) dbUpdates.alcohol_consumption = updates.alcoholConsumption;
    if (updates.drugUse !== undefined) dbUpdates.drug_use = updates.drugUse;
    if (updates.dietaryRestrictions !== undefined) dbUpdates.dietary_restrictions = updates.dietaryRestrictions;
    if (updates.foodAllergies !== undefined) dbUpdates.food_allergies = updates.foodAllergies;
    if (updates.sleepEnvironment !== undefined) dbUpdates.sleep_environment = updates.sleepEnvironment;
    if (updates.workSchedule !== undefined) dbUpdates.work_schedule = updates.workSchedule;
    if (updates.commuteType !== undefined) dbUpdates.commute_type = updates.commuteType;
    if (updates.physicalJobActivity !== undefined) dbUpdates.physical_job_activity = updates.physicalJobActivity;
    if (updates.recreationalActivities !== undefined) dbUpdates.recreational_activities = updates.recreationalActivities;
    if (updates.sunExposure !== undefined) dbUpdates.sun_exposure = updates.sunExposure;
    if (updates.skinType !== undefined) dbUpdates.skin_type = updates.skinType;
    if (updates.hairLossPattern !== undefined) dbUpdates.hair_loss_pattern = updates.hairLossPattern;
    if (updates.skinConditions !== undefined) dbUpdates.skin_conditions = updates.skinConditions;
    if (updates.digestiveHealth !== undefined) dbUpdates.digestive_health = updates.digestiveHealth;
    if (updates.cognitiveHealth !== undefined) dbUpdates.cognitive_health = updates.cognitiveHealth;
    if (updates.mentalHealthHistory !== undefined) dbUpdates.mental_health_history = updates.mentalHealthHistory;
    if (updates.preventiveCare !== undefined) dbUpdates.preventive_care = updates.preventiveCare;
    if (updates.healthInsurance !== undefined) dbUpdates.health_insurance = updates.healthInsurance;
    if (updates.primaryCareAccess !== undefined) dbUpdates.primary_care_access = updates.primaryCareAccess;
    if (updates.emergencyContacts !== undefined) dbUpdates.emergency_contacts = updates.emergencyContacts;
    if (updates.preferredLanguage !== undefined) dbUpdates.preferred_language = updates.preferredLanguage;
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
    if (updates.measurementSystem !== undefined) dbUpdates.measurement_system = updates.measurementSystem;

    const { data, error } = await supabase
      .from('baseline_profile')
      .upsert({ user_id: userId, ...dbUpdates }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      logger.error('Failed to update demographic profile', { userId, error: error.message });
      throw error;
    }

    // Invalidate cache
    demographicCache.delete(userId);

    logger.info('Demographic profile updated', { userId, fieldsUpdated: Object.keys(updates) });

    return await getDemographicProfile(userId);
  } catch (error) {
    logger.error('Error updating demographic profile', { 
      userId, 
      error: (error as Error).message 
    });
    throw error;
  }
}

export async function getDemographicValidationRules(): Promise<DemographicValidationRule[]> {
  try {
    const { data, error } = await supabase
      .from('demographics_validation_rules')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      logger.error('Failed to get validation rules', { error: error.message });
      throw error;
    }

    const rules: DemographicValidationRule[] = (data || []).map(rule => ({
      fieldName: rule.field_name,
      required: rule.required,
      dataType: rule.data_type,
      minValue: rule.min_value,
      maxValue: rule.max_value,
      minLength: rule.min_length,
      maxLength: rule.max_length,
      allowedValues: rule.allowed_values,
      regexPattern: rule.regex_pattern,
      displayOrder: rule.display_order,
      fieldGroup: rule.field_group,
      fieldLabel: rule.field_label,
      helpText: rule.help_text,
      sensitiveData: rule.sensitive_data,
    }));

    return rules;
  } catch (error) {
    logger.error('Error loading validation rules', { error: (error as Error).message });
    return [];
  }
}

export async function getDemographicCollectionProgress(userId: string): Promise<DemographicCollectionProgress> {
  try {
    const { data, error } = await supabase
      .from('demographics_collection_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to get collection progress', { userId, error: error.message });
      throw error;
    }

    if (!data) {
      // Initialize progress if not exists
      const initialProgress: DemographicCollectionProgress = {
        userId,
        totalFields: 0,
        completedFields: 0,
        completionPercentage: 0,
        collectionStatus: 'not_started',
        missingRequiredFields: [],
      };
      return initialProgress;
    }

    const progress: DemographicCollectionProgress = {
      userId: data.user_id,
      totalFields: data.total_fields,
      completedFields: data.completed_fields,
      completionPercentage: data.completion_percentage,
      collectionStatus: data.collection_status,
      lastUpdatedField: data.last_updated_field,
      lastUpdatedAt: data.last_updated_at,
      dataQualityScore: data.data_quality_score,
      missingRequiredFields: data.missing_required_fields || [],
    };

    return progress;
  } catch (error) {
    logger.error('Error loading collection progress', { 
      userId, 
      error: (error as Error).message 
    });
    return {
      userId,
      totalFields: 0,
      completedFields: 0,
      completionPercentage: 0,
      collectionStatus: 'not_started',
      missingRequiredFields: [],
    };
  }
}

export async function calculateDemographicQualityScore(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_demographic_quality_score', { p_user_id: userId });

    if (error) {
      logger.error('Failed to calculate quality score', { userId, error: error.message });
      throw error;
    }

    const score = data?.[0]?.calculate_demographic_quality_score || 0;
    
    logger.info('Demographic quality score calculated', { userId, score });
    
    return score;
  } catch (error) {
    logger.error('Error calculating quality score', { 
      userId, 
      error: (error as Error).message 
    });
    return 0;
  }
}

export async function validateDemographicField(
  fieldName: string, 
  value: any
): Promise<{ isValid: boolean; errors: string[] }> {
  try {
    const rules = await getDemographicValidationRules();
    const rule = rules.find(r => r.fieldName === fieldName);
    
    if (!rule) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    // Check if required
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`${rule.fieldLabel} is required`);
    }

    // Skip validation if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return { isValid: true, errors: [] };
    }

    // Type validation
    switch (rule.dataType) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`${rule.fieldLabel} must be a number`);
        } else {
          const numValue = Number(value);
          if (rule.minValue !== undefined && numValue < rule.minValue) {
            errors.push(`${rule.fieldLabel} must be at least ${rule.minValue}`);
          }
          if (rule.maxValue !== undefined && numValue > rule.maxValue) {
            errors.push(`${rule.fieldLabel} must be no more than ${rule.maxValue}`);
          }
        }
        break;
      
      case 'string':
        const strValue = String(value);
        if (rule.minLength !== undefined && strValue.length < rule.minLength) {
          errors.push(`${rule.fieldLabel} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength !== undefined && strValue.length > rule.maxLength) {
          errors.push(`${rule.fieldLabel} must be no more than ${rule.maxLength} characters`);
        }
        if (rule.allowedValues && !rule.allowedValues.includes(strValue)) {
          errors.push(`${rule.fieldLabel} must be one of: ${rule.allowedValues.join(', ')}`);
        }
        if (rule.regexPattern && !new RegExp(rule.regexPattern).test(strValue)) {
          errors.push(`${rule.fieldLabel} format is invalid`);
        }
        break;
      
      case 'json':
        if (typeof value !== 'object' || value === null) {
          errors.push(`${rule.fieldLabel} must be a valid object`);
        }
        break;
      
      case 'date':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push(`${rule.fieldLabel} must be a valid date`);
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    logger.error('Error validating demographic field', { 
      fieldName, 
      value, 
      error: (error as Error).message 
    });
    return { isValid: false, errors: ['Validation error occurred'] };
  }
}

// Helper function to get demographic data for engines
export async function getDemographicDataForEngines(userId: string): Promise<{
  age: number;
  sex: 'male' | 'female' | 'other';
  heightInches: number;
  weightLbs: number;
  bodyFatPercent?: number;
  ethnicity?: string;
  smokingStatus?: string;
  alcoholConsumption?: string;
  activityLevel?: string;
  geographicRegion?: string;
}> {
  const profile = await getDemographicProfile(userId);
  
  return {
    age: profile.age || 35, // Default fallback
    sex: profile.sex || 'male',
    heightInches: profile.heightInches || 70,
    weightLbs: profile.weightLbs || 180,
    bodyFatPercent: profile.bodyFatPercent,
    ethnicity: profile.ethnicity,
    smokingStatus: profile.smokingStatus,
    alcoholConsumption: profile.alcoholConsumption,
    activityLevel: profile.activityLevel,
    geographicRegion: profile.geographicRegion,
  };
}

// Clear cache utility
export function clearDemographicCache(userId?: string): void {
  if (userId) {
    demographicCache.delete(userId);
  } else {
    demographicCache.clear();
  }
}
