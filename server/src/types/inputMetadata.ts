/**
 * Input Metadata Types
 * 
 * Standardized structure for tracking input sources and metadata
 * across all health engine detail screens (Recovery, Cardiovascular, 
 * Metabolic, Performance, Sexual Health)
 */

export type InputSource = 
  | 'ACTUAL'        // Real data from database/integrations
  | 'MOCK'          // Mock/demo data for testing
  | 'HARDCODED'     // Hardcoded fallback values
  | 'DERIVED'       // Calculated from other inputs
  | 'NOT_AVAILABLE'; // Data not available

export interface InputSourceDetails {
  table?: string;           // Database table name (e.g., 'blood_pressure_readings')
  field?: string;           // Database field name (e.g., 'systolic_bp')
  integration?: string;     // Integration source (e.g., 'oura', 'apple_watch', 'sleepnumber')
  derivedFrom?: string[];   // List of inputs this was derived from
  formula?: string;         // Formula used for derivation (if applicable)
}

export interface InputMetadata {
  name: string;                      // Display name of the input
  value: any;                        // The actual value
  source: InputSource;               // Classification of data source
  sourceDetails?: InputSourceDetails; // Additional source information
  lastUpdated?: string;              // ISO timestamp of last update
  unit?: string;                     // Unit of measurement (e.g., 'mmHg', 'mg/dL', 'bpm')
  category?: string;                 // Grouping category (e.g., 'vitals', 'bloodwork', 'wearables')
  score?: number;                    // Individual score contribution (0-100) based on input value
}

export interface DetailedInputs {
  inputs: InputMetadata[];           // Array of all inputs with metadata
}
