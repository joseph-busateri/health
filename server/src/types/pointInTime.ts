import { Database } from './database';

// Change Event Types
export type ChangeEvent = Database['public']['Tables']['change_events']['Row'];
export type ChangeEventInsert = Database['public']['Tables']['change_events']['Insert'];
export type ChangeEventUpdate = Database['public']['Tables']['change_events']['Update'];

// Entity Types for Change Events
export type EntityType = 'baseline_profile' | 'workout_baseline' | 'supplement_baseline' | 'supplement_item' | 'goal';

// Change Sources
export type ChangeSource = 'document_upload' | 'agent_adjustment' | 'user_confirmation' | 'system_update';

// Reconstructed State Types
export interface ReconstructedState {
  entity_type: EntityType;
  entity_id: string;
  reconstructed_fields: Record<string, any>;
  last_updated: string;
}

export interface CurrentEffectiveState {
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  current_fields: Record<string, any>;
  last_updated: string;
}

// Complete State Response Types
export interface CurrentStateResponse {
  user_id: string;
  as_of_date: string;
  goals: ReconstructedGoal[];
  workout_baseline: ReconstructedWorkoutBaseline | null;
  supplement_baseline: ReconstructedSupplementBaseline | null;
  supplement_items: ReconstructedSupplementItem[];
}

export interface HistoricalStateResponse {
  user_id: string;
  as_of_date: string;
  is_current: boolean;
  goals: ReconstructedGoal[];
  workout_baseline: ReconstructedWorkoutBaseline | null;
  supplement_baseline: ReconstructedSupplementBaseline | null;
  supplement_items: ReconstructedSupplementItem[];
  changes_since: ChangeEvent[];
}

// Reconstructed Entity Types
export interface ReconstructedGoal {
  id: string;
  category: string;
  title: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
  status?: 'active' | 'completed' | 'paused' | 'adjusted';
  priority?: 'high' | 'medium' | 'low';
  created_at?: string;
  updated_at?: string;
}

export interface ReconstructedWorkoutBaseline {
  id: string;
  user_id: string;
  document_id: string;
  split_type?: string;
  training_days?: number;
  rest_days?: number;
  session_duration?: number;
  focus_areas?: string[];
  experience_level?: string;
  notes?: string;
  extracted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReconstructedSupplementBaseline {
  id: string;
  user_id: string;
  document_id: string;
  stack_name: string;
  stack_notes?: string;
  total_active_items?: number;
  timing_notes?: string;
  frequency_notes?: string;
  extracted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReconstructedSupplementItem {
  id: string;
  supplement_baseline_id: string;
  supplement_name: string;
  dosage: number;
  dosage_unit: string;
  frequency: string;
  timing: string;
  status?: 'active' | 'paused' | 'removed';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// State Comparison Types
export interface StateComparison {
  user_id: string;
  current_date: string;
  historical_date: string;
  differences: StateDifference[];
}

export interface StateDifference {
  entity_type: EntityType;
  entity_id: string;
  entity_name?: string;
  field_name: string;
  current_value: any;
  historical_value: any;
  change_type: 'added' | 'removed' | 'modified';
  changed_at?: string;
}

// Request/Response Types for API
export interface StateRequest {
  user_id: string;
  date?: string; // YYYY-MM-DD format, optional for current state
}

export interface StateQueryParams {
  date?: string; // YYYY-MM-DD format
  include_changes?: boolean; // Whether to include change events
}

// Service Layer Types
export interface StateReconstructionOptions {
  include_deleted?: boolean;
  include_metadata?: boolean;
  max_changes?: number;
}

export interface ChangeEventCreateParams {
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  change_source: ChangeSource;
  rationale?: string;
  confidence?: number;
  effective_at?: string;
}

// Database View Types
export interface CurrentEffectiveStateView {
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  current_fields: Record<string, any>;
  last_updated: string;
}

// Constants
export const VALID_ENTITY_TYPES: EntityType[] = [
  'baseline_profile',
  'workout_baseline', 
  'supplement_baseline',
  'supplement_item',
  'goal'
];

export const VALID_CHANGE_SOURCES: ChangeSource[] = [
  'document_upload',
  'agent_adjustment',
  'user_confirmation',
  'system_update'
];

export const DEFAULT_STATE_OPTIONS: StateReconstructionOptions = {
  include_deleted: false,
  include_metadata: true,
  max_changes: 1000
};
