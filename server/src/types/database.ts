// Temporary database types to fix TypeScript compilation
export interface Database {
  public: {
    Tables: {
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
          notes?: string;
          metadata?: any;
          created_at: string;
          updated_at: string;
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
          notes?: string;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
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
          notes?: string;
          metadata?: any;
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
