/**
 * Predictive Behavior Service - Phase 16
 * 
 * Purpose: Manage predictive behavior intelligence with safe fallbacks
 * Rules:
 * - Never throw errors
 * - Provide graceful degradation
 * - Support offline-first operation
 */

import api from './api';
import type {
  PredictiveBehaviorIntelligence,
  BehaviorPrediction,
  BehaviorRisk,
  BehaviorInsight,
} from '../types/predictiveBehavior';

// ============================================================================
// PREDICTIVE BEHAVIOR SERVICE
// ============================================================================

export const predictiveBehaviorService = {
  /**
   * Get behavior predictions for today
   * Falls back to null if endpoint unavailable
   */
  getBehaviorPredictions: async (userId: string): Promise<BehaviorPrediction[] | null> => {
    try {
      const response = await api.get<{ success: boolean; data: BehaviorPrediction[] }>(
        `/predictive-behavior/${userId}/predictions`
      );
      return response.data.data;
    } catch (error) {
      console.log('Behavior predictions endpoint not available, will generate client-side');
      return null;
    }
  },

  /**
   * Get behavior risks
   * Falls back to null if endpoint unavailable
   */
  getBehaviorRisks: async (userId: string): Promise<BehaviorRisk[] | null> => {
    try {
      const response = await api.get<{ success: boolean; data: BehaviorRisk[] }>(
        `/predictive-behavior/${userId}/risks`
      );
      return response.data.data;
    } catch (error) {
      console.log('Behavior risks endpoint not available');
      return null;
    }
  },

  /**
   * Get behavior insights
   * Falls back to null if endpoint unavailable
   */
  getBehaviorInsights: async (userId: string): Promise<BehaviorInsight[] | null> => {
    try {
      const response = await api.get<{ success: boolean; data: BehaviorInsight[] }>(
        `/predictive-behavior/${userId}/insights`
      );
      return response.data.data;
    } catch (error) {
      console.log('Behavior insights endpoint not available');
      return null;
    }
  },

  /**
   * Get complete predictive behavior intelligence
   * Falls back to null if endpoint unavailable
   */
  getPredictiveBehaviorIntelligence: async (
    userId: string
  ): Promise<PredictiveBehaviorIntelligence | null> => {
    try {
      const response = await api.get<{ success: boolean; data: PredictiveBehaviorIntelligence }>(
        `/predictive-behavior/${userId}/intelligence`
      );
      return response.data.data;
    } catch (error) {
      console.log('Predictive behavior intelligence endpoint not available');
      return null;
    }
  },
};

export default predictiveBehaviorService;
