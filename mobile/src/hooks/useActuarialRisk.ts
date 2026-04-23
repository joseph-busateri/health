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

// ============================================================================
// TYPES
// ============================================================================

export interface ActuarialRiskRecord {
  id: string;
  userId: string;
  date: string;
  timestamp: string;
  overallRisk: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
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
  }>;
  evidence: {
    signals: any[];
    summary: string;
    interpretation: string;
  };
  recommendation: {
    type: string;
    priority: 'critical' | 'important' | 'optimization';
    summary: string;
    actions: string[];
    riskReductionPotential: number;
    primaryRiskDrivers: string[];
    preventionStrategies: string[];
    rationale?: string;
    source: 'deterministic' | 'ai_enriched' | 'fallback';
  };
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
