// Temporary database types to fix TypeScript compilation
export interface Database {
  public: {
    Tables: {
      baseline_change_log: {
        Row: {
          id: string;
          user_id: string;
          baseline_profile_id: string;
          field_name: string;
          old_value: string | null;
          new_value: string | null;
          change_source: 'document_upload' | 'agent_refinement' | 'user_correction' | 'system_update';
          rationale: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          baseline_profile_id: string;
          field_name: string;
          old_value?: string | null;
          new_value?: string | null;
          change_source: 'document_upload' | 'agent_refinement' | 'user_correction' | 'system_update';
          rationale?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          baseline_profile_id?: string;
          field_name?: string;
          old_value?: string | null;
          new_value?: string | null;
          change_source?: 'document_upload' | 'agent_refinement' | 'user_correction' | 'system_update';
          rationale?: string | null;
          changed_at?: string;
        };
      };
      baseline_documents: {
        Row: {
          id: string;
          user_id: string;
          file_reference: string | null;
          storage_path: string | null;
          upload_date: string;
          document_type: 'pdf' | 'docx' | 'txt' | 'manual_entry';
          parse_status: 'pending' | 'processing' | 'completed' | 'failed';
          extraction_confidence: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_reference?: string | null;
          storage_path?: string | null;
          upload_date?: string;
          document_type: 'pdf' | 'docx' | 'txt' | 'manual_entry';
          parse_status?: 'pending' | 'processing' | 'completed' | 'failed';
          extraction_confidence?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_reference?: string | null;
          storage_path?: string | null;
          upload_date?: string;
          document_type?: 'pdf' | 'docx' | 'txt' | 'manual_entry';
          parse_status?: 'pending' | 'processing' | 'completed' | 'failed';
          extraction_confidence?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      baseline_extracted_sections: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          raw_text: string;
          normalized_name: string;
          extraction_confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          raw_text: string;
          normalized_name: string;
          extraction_confidence?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          raw_text?: string;
          normalized_name?: string;
          extraction_confidence?: number | null;
          created_at?: string;
        };
      };
      workout_daily_progressions: {
        Row: {
          id: string;
          user_id: string;
          exercise_key: string;
          exercise_name: string;
          plan_date: string;
          baseline_payload: Record<string, any>;
          applied_payload: Record<string, any>;
          progression_step: string | null;
          adjustment_source: 'baseline' | 'heuristic' | 'ai';
          readiness_snapshot: Record<string, any> | null;
          joint_snapshot: Record<string, any> | null;
          adherence_snapshot: Record<string, any> | null;
          ai_confidence: number | null;
          rationale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_key: string;
          exercise_name: string;
          plan_date: string;
          baseline_payload: Record<string, any>;
          applied_payload: Record<string, any>;
          progression_step?: string | null;
          adjustment_source: 'baseline' | 'heuristic' | 'ai';
          readiness_snapshot?: Record<string, any> | null;
          joint_snapshot?: Record<string, any> | null;
          adherence_snapshot?: Record<string, any> | null;
          ai_confidence?: number | null;
          rationale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_key?: string;
          exercise_name?: string;
          plan_date?: string;
          baseline_payload?: Record<string, any>;
          applied_payload?: Record<string, any>;
          progression_step?: string | null;
          adjustment_source?: 'baseline' | 'heuristic' | 'ai';
          readiness_snapshot?: Record<string, any> | null;
          joint_snapshot?: Record<string, any> | null;
          adherence_snapshot?: Record<string, any> | null;
          ai_confidence?: number | null;
          rationale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_weekly_progressions: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          week_label: string | null;
          block_label: string | null;
          summary_payload: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          week_label?: string | null;
          block_label?: string | null;
          summary_payload: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start_date?: string;
          week_label?: string | null;
          block_label?: string | null;
          summary_payload?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      baseline_profiles: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          demographics: Record<string, any> | null;
          training_context: Record<string, any> | null;
          lifestyle_context: Record<string, any> | null;
          overall_health_goals: Record<string, any> | null;
          sexual_performance_goals: Record<string, any> | null;
          workout_goals: Record<string, any> | null;
          secondary_goals: Record<string, any> | null;
          priority_order: Record<string, any> | null;
          extracted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          demographics?: Record<string, any> | null;
          training_context?: Record<string, any> | null;
          lifestyle_context?: Record<string, any> | null;
          overall_health_goals?: Record<string, any> | null;
          sexual_performance_goals?: Record<string, any> | null;
          workout_goals?: Record<string, any> | null;
          secondary_goals?: Record<string, any> | null;
          priority_order?: Record<string, any> | null;
          extracted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          demographics?: Record<string, any> | null;
          training_context?: Record<string, any> | null;
          lifestyle_context?: Record<string, any> | null;
          overall_health_goals?: Record<string, any> | null;
          sexual_performance_goals?: Record<string, any> | null;
          workout_goals?: Record<string, any> | null;
          secondary_goals?: Record<string, any> | null;
          priority_order?: Record<string, any> | null;
          extracted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bloodwork_documents: {
        Row: {
          id: string;
          user_id: string;
          file_url: string;
          file_name: string;
          file_size?: number;
          mime_type?: string;
          document_type: string;
          source: string;
          test_date?: string;
          upload_date: string;
          parse_status: string;
          extraction_confidence?: number;
          processing_status: string;
          processing_error?: string | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          processing_progress?: number | null;
          notes?: string;
          metadata?: any;
          created_at: string;
          updated_at: string;
          lab_name?: string;
          accession_number?: string;
          physician_name?: string;
          patient_sex?: string;
          patient_dob?: string;
          specimen_datetime?: string;
          final_reported_datetime?: string;
          report_status?: string;
          account_name?: string;
          panel_names_detected?: string[] | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_url: string;
          file_name: string;
          file_size?: number;
          mime_type?: string;
          document_type: string;
          source: string;
          test_date?: string;
          upload_date?: string;
          parse_status?: string;
          extraction_confidence?: number;
          processing_status?: string;
          processing_error?: string | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          processing_progress?: number | null;
          notes?: string;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
          lab_name?: string;
          accession_number?: string;
          physician_name?: string;
          patient_sex?: string;
          patient_dob?: string;
          specimen_datetime?: string;
          final_reported_datetime?: string;
          report_status?: string;
          account_name?: string;
          panel_names_detected?: string[] | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_url?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          document_type?: string;
          source?: string;
          test_date?: string;
          upload_date?: string;
          parse_status?: string;
          extraction_confidence?: number;
          processing_status?: string;
          processing_error?: string | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          processing_progress?: number | null;
          notes?: string;
          metadata?: any;
          updated_at?: string;
          lab_name?: string;
          accession_number?: string;
          physician_name?: string;
          patient_sex?: string;
          patient_dob?: string;
          specimen_datetime?: string;
          final_reported_datetime?: string;
          report_status?: string;
          account_name?: string;
          panel_names_detected?: string[] | null;
        };
      };
      bloodwork_panels: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          panel_name: string;
          panel_category?: string;
          panel_datetime?: string;
          panel_status?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          panel_name: string;
          panel_category?: string;
          panel_datetime?: string;
          panel_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          panel_name?: string;
          panel_category?: string;
          panel_datetime?: string;
          panel_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed
      supplement_documents: {
        Row: {
          id: string;
          user_id: string;
          file_reference: string;
          storage_path: string;
          upload_date: string;
          document_type: string;
          parse_status: string;
          extraction_confidence?: number;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_reference?: string;
          storage_path?: string;
          upload_date: string;
          document_type: string;
          parse_status?: string;
          extraction_confidence?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_reference?: string;
          storage_path?: string;
          upload_date?: string;
          document_type?: string;
          parse_status?: string;
          extraction_confidence?: number;
          notes?: string;
          updated_at?: string;
        };
      };
      supplement_baseline: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          stack_name: string;
          stack_notes?: string;
          total_active_items?: number;
          timing_notes?: string;
          frequency_notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          stack_name: string;
          stack_notes?: string;
          total_active_items?: number;
          timing_notes?: string;
          frequency_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          stack_name?: string;
          stack_notes?: string;
          total_active_items?: number;
          timing_notes?: string;
          frequency_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      supplement_items: {
        Row: {
          id: string;
          supplement_baseline_id: string;
          supplement_name: string;
          dosage?: string;
          dosage_unit?: string;
          frequency?: string;
          timing_notes?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplement_baseline_id: string;
          supplement_name: string;
          dosage?: string;
          dosage_unit?: string;
          frequency?: string;
          timing_notes?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplement_baseline_id?: string;
          supplement_name?: string;
          dosage?: string;
          dosage_unit?: string;
          frequency?: string;
          timing_notes?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      supplement_extracted_sections: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          raw_text: string;
          normalized_name?: string;
          extraction_confidence?: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          raw_text: string;
          normalized_name?: string;
          extraction_confidence?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          raw_text?: string;
          normalized_name?: string;
          extraction_confidence?: number;
          created_at?: string;
        };
      };
      supplement_change_log: {
        Row: {
          id: string;
          user_id: string;
          supplement_baseline_id: string;
          field_name: string;
          old_value?: string;
          new_value?: string;
          change_source: string;
          rationale?: string;
          changed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          supplement_baseline_id: string;
          field_name: string;
          old_value?: string;
          new_value?: string;
          change_source: string;
          rationale?: string;
          changed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          supplement_baseline_id?: string;
          field_name?: string;
          old_value?: string;
          new_value?: string;
          change_source?: string;
          rationale?: string;
          changed_at?: string;
          created_at?: string;
        };
      };
      change_events: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          field_name: string;
          old_value?: string;
          new_value?: string;
          change_source: string;
          rationale?: string;
          confidence?: number;
          effective_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          field_name: string;
          old_value?: string;
          new_value?: string;
          change_source: string;
          rationale?: string;
          confidence?: number;
          effective_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: string;
          entity_id?: string;
          field_name?: string;
          old_value?: string;
          new_value?: string;
          change_source?: string;
          rationale?: string;
          confidence?: number;
          effective_at?: string;
          created_at?: string;
        };
      };
      bloodwork_results: {
        Row: {
          id: string;
          document_id: string;
          panel_id?: string | null;
          user_id: string;
          panel_name?: string;
          raw_test_name: string;
          normalized_test_name?: string;
          category?: string;
          sub_category?: string;
          value_text?: string;
          value_numeric?: number;
          unit?: string;
          reference_range_low?: number;
          reference_range_high?: number;
          reference_range_text?: string;
          abnormal_flag?: string;
          abnormal_flag_source?: string;
          confidence?: number;
          test_date?: string;
          lab_timestamp?: string;
          source?: string;
          source_lab?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          panel_id?: string | null;
          user_id: string;
          panel_name?: string;
          raw_test_name: string;
          normalized_test_name?: string;
          category?: string;
          sub_category?: string;
          value_text?: string;
          value_numeric?: number;
          unit?: string;
          reference_range_low?: number;
          reference_range_high?: number;
          reference_range_text?: string;
          abnormal_flag?: string;
          abnormal_flag_source?: string;
          confidence?: number;
          test_date?: string;
          lab_timestamp?: string;
          source?: string;
          source_lab?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          panel_id?: string | null;
          user_id?: string;
          panel_name?: string;
          raw_test_name?: string;
          normalized_test_name?: string;
          category?: string;
          sub_category?: string;
          value_text?: string;
          value_numeric?: number;
          unit?: string;
          reference_range_low?: number;
          reference_range_high?: number;
          reference_range_text?: string;
          abnormal_flag?: string;
          abnormal_flag_source?: string;
          confidence?: number;
          test_date?: string;
          lab_timestamp?: string;
          source?: string;
          source_lab?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
