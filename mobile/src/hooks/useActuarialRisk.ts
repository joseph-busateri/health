/**
 * useActuarialRisk Hook
 * Custom hook for fetching actuarial risk data from the API
 *
 * Features:
 * - Fetch latest risk record
 * - Fetch risk history
 * - Loading and error states
 * - Automatic retry on failure
 */

import { useState, useEffect, useCallback } from 'react';
import { healthApi } from '../services/api';
import type { InputMetadata } from '../types/inputMetadata';

// ============================================================================
// TYPES
// ============================================================================

export interface ModelInputMetadata {
  key: string;
  label: string;
  value: any;
  unit?: string;
  source: 'ACTUAL' | 'DERIVED' | 'NOT_AVAILABLE';
  sourceTable?: string;
  sourceField?: string;
  required: boolean;
  available: boolean;
  lastUpdated?: string;
  contribution?: number;  // Percentage contribution to risk score
}

export interface ASCVDModelData {
  riskPercentage: number;
  riskCategory: string;
  inputs: ModelInputMetadata[];
  missingInputs: string[];
  confidence?: number;
}

export interface FraminghamModelData {
  riskPercentage: number;
  riskCategory: string;
  inputs: ModelInputMetadata[];
  missingInputs: string[];
  confidence?: number;
}

export interface ActuarialRiskRecord {
  id: string;
  userId: string;
  date: string;
  timestamp: string;
  overallRisk: number;
  baselineRisk?: number;  // Unadjusted clinical risk (average of ASCVD + Framingham)
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high' | 'low_risk' | 'moderate_risk' | 'high_risk' | 'very_high_risk';
  riskModels: {
    framingham: {
      score: number;
      category: string;
      tenYearRisk: number;
    };
    ascvd: {
      score: number;
      category: string;
      tenYearRisk: number;
    };
    lifestyleModified: {
      score: number;
      category: string;
      tenYearRisk: number;
      modificationFactor: number;
    };
  };
  riskFactorContributions: Array<{
    factor: string;
    contribution: number;
    severity: string;
    modifiable: boolean;
    value?: string;
    interpretation?: string;
  }>;
  lifestyleFactors?: {
    exerciseFrequency: { value: number; unit: string; adjustment: number };
    vo2Max?: { value: number; unit: string; adjustment: number };
    bmi: { value: number; unit: string; adjustment: number };
    bodyFatPercent?: { value: number; unit: string; adjustment: number };
    dietQuality: { value: string; adjustment: number };
    sleepQuality: { value: number; unit: string; adjustment: number };
    stressLevel: { value: number; unit: string; adjustment: number };
    alcoholConsumption?: { value: string; adjustment: number };
  };
  inputs: any;
  evidence: any;
  recommendation: any;
  detailedInputs?: InputMetadata[];
  ascvdModelData?: ASCVDModelData;
  framinghamModelData?: FraminghamModelData;
  createdAt: string;
  updatedAt: string;
}

export interface UseActuarialRiskResult {
  record: ActuarialRiskRecord | null;
  history: ActuarialRiskRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to fetch actuarial risk data for a user
 */
export function useActuarialRisk(userId: string): UseActuarialRiskResult {
  const [record, setRecord] = useState<ActuarialRiskRecord | null>(null);
  const [history, setHistory] = useState<ActuarialRiskRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch latest record
      const recordResponse = await healthApi.actuarial.getRecord(userId);

      if (recordResponse.data.success && recordResponse.data.data) {
        setRecord(recordResponse.data.data);
      } else {
        setRecord(null);
      }

      // If no record exists, auto-calculate
      if (!recordResponse.data.success || !recordResponse.data.data) {
        console.log('No risk record found, auto-calculating...');
        try {
          const calculateResponse = await healthApi.actuarial.calculateAuto(userId);
          if (calculateResponse.data.success && calculateResponse.data.data) {
            setRecord(calculateResponse.data.data);
          }
        } catch (calcError: any) {
          console.error('Auto-calculation failed:', calcError);
          // Don't block UI if auto-calc fails, user can manually retry
        }
      }

      // Fetch history (last 30 days)
      const historyResponse = await healthApi.actuarial.getHistory(userId, 30);

      if (historyResponse.data.success && historyResponse.data.data) {
        setHistory(historyResponse.data.data);
      } else {
        setHistory([]);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch actuarial risk data:', err);

      if (err.response?.status === 404) {
        // No data available - try auto-calculate
        console.log('No risk record found (404), auto-calculating...');
        try {
          const calculateResponse = await healthApi.actuarial.calculateAuto(userId);
          if (calculateResponse.data.success && calculateResponse.data.data) {
            setRecord(calculateResponse.data.data);
          }
        } catch (calcError: any) {
          console.error('Auto-calculation failed:', calcError);
        }

        // Fetch history after calculation
        try {
          const historyResponse = await healthApi.actuarial.getHistory(userId, 30);
          if (historyResponse.data.success && historyResponse.data.data) {
            setHistory(historyResponse.data.data);
          } else {
            setHistory([]);
          }
        } catch (historyError) {
          setHistory([]);
        }

        setError(null);
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to load actuarial risk data');
      }

      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    record,
    history,
    loading,
    error,
    refetch: fetchData,
  };
}
