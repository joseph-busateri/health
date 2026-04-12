// Demographics type definitions for Phase 0-20
// These types align with the enhanced database schema

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

export interface DemographicAuditLog {
  id: string;
  userId: string;
  changeType: 'create' | 'update' | 'delete';
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: 'user' | 'agent' | 'admin' | 'system';
  changeReason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Engine-specific demographic data interface
export interface DemographicDataForEngines {
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
}

// Database row types for Supabase integration
export interface BaselineProfileRow {
  id: string;
  user_id: string;
  date_of_birth?: string;
  age?: number;
  sex?: string;
  height_inches?: number;
  weight_lbs?: number;
  body_fat_percent?: number;
  ethnicity?: string;
  race?: string;
  geographic_region?: string;
  occupation?: string;
  education_level?: string;
  income_level?: string;
  marital_status?: string;
  children_count?: number;
  smoking_status?: string;
  alcohol_consumption?: string;
  drug_use?: string;
  dietary_restrictions?: any;
  food_allergies?: any;
  sleep_environment?: string;
  work_schedule?: string;
  commute_type?: string;
  physical_job_activity?: string;
  recreational_activities?: any;
  sun_exposure?: string;
  skin_type?: string;
  hair_loss_pattern?: string;
  skin_conditions?: any;
  digestive_health?: string;
  cognitive_health?: string;
  mental_health_history?: any;
  preventive_care?: string;
  health_insurance?: string;
  primary_care_access?: string;
  emergency_contacts?: any;
  preferred_language?: string;
  timezone?: string;
  measurement_system?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface DemographicsValidationRuleRow {
  id: string;
  field_name: string;
  required: boolean;
  data_type: string;
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
  allowed_values?: any;
  regex_pattern?: string;
  display_order: number;
  field_group: string;
  field_label: string;
  help_text?: string;
  sensitive_data: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DemographicsCollectionProgressRow {
  id: string;
  user_id: string;
  total_fields: number;
  completed_fields: number;
  completion_percentage: number;
  collection_status: string;
  last_updated_field?: string;
  last_updated_at?: string;
  data_quality_score?: number;
  missing_required_fields?: any;
  created_at: string;
  updated_at: string;
}

export interface DemographicsAuditLogRow {
  id: string;
  user_id: string;
  change_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
  change_reason?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
