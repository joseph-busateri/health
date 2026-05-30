/**
 * Autonomous Adjustment Service - Phase 17
 * 
 * Purpose: Manage autonomous plan adjustments with safe fallbacks
 * Rules:
 * - Never throw errors
 * - Provide graceful degradation
 * - Support offline-first operation
 */

import api from './api';
import type {
  AutonomousAdjustmentIntelligence,
  AutonomousAdjustment,
  AdjustmentApplicationRequest,
  AdjustmentDismissalRequest,
} from '../types/autonomousAdjustment';

// ============================================================================
// AUTONOMOUS ADJUSTMENT SERVICE
// ============================================================================

export const autonomousAdjustmentService = {
  /**
   * Get autonomous adjustments for today
   * Falls back to null if endpoint unavailable
   */
  getAutonomousAdjustments: async (
    userId: string
  ): Promise<AutonomousAdjustmentIntelligence | null> => {
    try {
      const response = await api.get<{ success: boolean; data: AutonomousAdjustmentIntelligence }>(
        `/autonomous-adjustment/${userId}/today`
      );
      return response.data.data;
    } catch (error) {
      console.log('Autonomous adjustments endpoint not available, will generate client-side');
      return null;
    }
  },

  /**
   * Apply an adjustment
   * Falls back to optimistic update if endpoint unavailable
   */
  applyAdjustment: async (
    userId: string,
    request: AdjustmentApplicationRequest
  ): Promise<boolean> => {
    try {
      const response = await api.post<{ success: boolean }>(
        `/autonomous-adjustment/${userId}/apply`,
        request
      );
      return response.data.success;
    } catch (error) {
      console.log('Apply adjustment endpoint not available, updating locally');
      return true; // Optimistic update
    }
  },

  /**
   * Dismiss an adjustment
   * Falls back to optimistic update if endpoint unavailable
   */
  dismissAdjustment: async (
    userId: string,
    request: AdjustmentDismissalRequest
  ): Promise<boolean> => {
    try {
      const response = await api.post<{ success: boolean }>(
        `/autonomous-adjustment/${userId}/dismiss`,
        request
      );
      return response.data.success;
    } catch (error) {
      console.log('Dismiss adjustment endpoint not available, updating locally');
      return true; // Optimistic update
    }
  },

  /**
   * Get adjustment history
   * Falls back to empty array if endpoint unavailable
   */
  getAdjustmentHistory: async (
    userId: string,
    days: number = 7
  ): Promise<AutonomousAdjustment[]> => {
    try {
      const response = await api.get<{ success: boolean; data: AutonomousAdjustment[] }>(
        `/autonomous-adjustment/${userId}/history?days=${days}`
      );
      return response.data.data;
    } catch (error) {
      console.log('Adjustment history endpoint not available');
      return [];
    }
  },
};

export default autonomousAdjustmentService;
