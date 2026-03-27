// Point-in-Time State Types for Mobile App

export interface PointInTimeState {
  user_id: string;
  as_of_date: string;
  is_current?: boolean;
  goals: ReconstructedGoal[];
  workout_baseline: ReconstructedWorkoutBaseline | null;
  supplement_baseline: ReconstructedSupplementBaseline | null;
  supplement_items: ReconstructedSupplementItem[];
  changes_since?: ChangeEvent[];
}

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

export interface ChangeEvent {
  id: string;
  user_id: string;
  entity_type: 'baseline_profile' | 'workout_baseline' | 'supplement_baseline' | 'supplement_item' | 'goal';
  entity_id: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  change_source: 'document_upload' | 'agent_adjustment' | 'user_confirmation' | 'system_update';
  rationale?: string;
  confidence?: number;
  effective_at: string;
  created_at: string;
}

export interface StateComparison {
  user_id: string;
  current_date: string;
  historical_date: string;
  differences: StateDifference[];
}

export interface StateDifference {
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  field_name: string;
  current_value: any;
  historical_value: any;
  change_type: 'added' | 'removed' | 'modified';
  changed_at?: string;
}

export interface AvailableDates {
  available_dates: string[];
  earliest_date: string | null;
  latest_date: string;
  total_changes: number;
}

// UI State Types
export interface PointInTimeScreenState {
  currentDate: string;
  selectedDate: string | null;
  currentState: PointInTimeState | null;
  historicalState: PointInTimeState | null;
  availableDates: AvailableDates | null;
  isLoading: boolean;
  error: string | null;
  viewMode: 'current' | 'historical' | 'comparison';
}

export interface DateSelectionProps {
  selectedDate: string | null;
  availableDates: string[];
  onDateSelect: (date: string) => void;
  onCurrentDateSelect: () => void;
}

export interface StateDisplayProps {
  state: PointInTimeState;
  isHistorical?: boolean;
  comparison?: StateComparison;
}
