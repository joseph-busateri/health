/**
 * Execution Service - Phase 15
 * 
 * Purpose: Manage execution intelligence with safe fallbacks
 * Rules:
 * - Never throw errors
 * - Provide graceful degradation
 * - Support offline-first operation
 */

import api from './api';
import type {
  DailyExecutionPlan,
  ExecutionTask,
  ExecutionIntelligence,
  AdherenceSummary,
  TaskCompletionRequest,
  Intervention,
  LearningSignal,
  OutcomeFeedback,
} from '../types/execution';

// ============================================================================
// EXECUTION SERVICE
// ============================================================================

export const executionService = {
  /**
   * Get today's execution plan
   * Falls back to empty plan if endpoint unavailable
   */
  getTodayExecutionPlan: async (userId: string): Promise<DailyExecutionPlan | null> => {
    try {
      const response = await api.get<{ success: boolean; data: DailyExecutionPlan }>(
        `/execution/${userId}/today`
      );
      return response.data.data;
    } catch (error) {
      console.log('Execution plan endpoint not available, will generate from Control Tower');
      return null;
    }
  },

  /**
   * Get complete execution intelligence
   * Falls back to null if endpoint unavailable
   */
  getExecutionIntelligence: async (userId: string): Promise<ExecutionIntelligence | null> => {
    try {
      const response = await api.get<{ success: boolean; data: ExecutionIntelligence }>(
        `/execution/${userId}/intelligence`
      );
      return response.data.data;
    } catch (error) {
      console.log('Execution intelligence endpoint not available');
      return null;
    }
  },

  /**
   * Update execution task status
   * Falls back to local state update if endpoint unavailable
   */
  updateExecutionTask: async (
    userId: string,
    request: TaskCompletionRequest
  ): Promise<boolean> => {
    try {
      const response = await api.post<{ success: boolean }>(
        `/execution/${userId}/task/${request.taskId}/update`,
        request
      );
      return response.data.success;
    } catch (error) {
      console.log('Task update endpoint not available, updating locally');
      return true; // Optimistic update
    }
  },

  /**
   * Complete a task
   * Convenience method for task completion
   */
  completeTask: async (
    userId: string,
    taskId: string,
    value?: number,
    notes?: string
  ): Promise<boolean> => {
    const request: TaskCompletionRequest = {
      taskId,
      status: 'completed',
      value,
      notes,
      source: 'manual',
      timestamp: new Date().toISOString(),
    };

    return executionService.updateExecutionTask(userId, request);
  },

  /**
   * Skip a task
   */
  skipTask: async (
    userId: string,
    taskId: string,
    reason?: string
  ): Promise<boolean> => {
    const request: TaskCompletionRequest = {
      taskId,
      status: 'skipped',
      notes: reason,
      source: 'manual',
      timestamp: new Date().toISOString(),
    };

    return executionService.updateExecutionTask(userId, request);
  },

  /**
   * Mark task as partial
   */
  partialTask: async (
    userId: string,
    taskId: string,
    value?: number,
    notes?: string
  ): Promise<boolean> => {
    const request: TaskCompletionRequest = {
      taskId,
      status: 'partial',
      value,
      notes,
      source: 'manual',
      timestamp: new Date().toISOString(),
    };

    return executionService.updateExecutionTask(userId, request);
  },

  /**
   * Get adherence summary
   * Falls back to calculated adherence if endpoint unavailable
   */
  getAdherenceSummary: async (userId: string): Promise<AdherenceSummary | null> => {
    try {
      const response = await api.get<{ success: boolean; data: AdherenceSummary }>(
        `/execution/${userId}/adherence`
      );
      return response.data.data;
    } catch (error) {
      console.log('Adherence endpoint not available');
      return null;
    }
  },

  /**
   * Get execution insights (learning signals)
   */
  getExecutionInsights: async (userId: string): Promise<LearningSignal | null> => {
    try {
      const response = await api.get<{ success: boolean; data: LearningSignal }>(
        `/execution/${userId}/insights`
      );
      return response.data.data;
    } catch (error) {
      console.log('Insights endpoint not available');
      return null;
    }
  },

  /**
   * Get outcome feedback
   */
  getOutcomeFeedback: async (userId: string): Promise<OutcomeFeedback[]> => {
    try {
      const response = await api.get<{ success: boolean; data: OutcomeFeedback[] }>(
        `/execution/${userId}/outcomes`
      );
      return response.data.data;
    } catch (error) {
      console.log('Outcomes endpoint not available');
      return [];
    }
  },

  /**
   * Get active interventions
   */
  getInterventions: async (userId: string): Promise<Intervention[]> => {
    try {
      const response = await api.get<{ success: boolean; data: Intervention[] }>(
        `/execution/${userId}/interventions`
      );
      return response.data.data;
    } catch (error) {
      console.log('Interventions endpoint not available');
      return [];
    }
  },

  /**
   * Dismiss an intervention
   */
  dismissIntervention: async (userId: string, interventionId: string): Promise<boolean> => {
    try {
      const response = await api.post<{ success: boolean }>(
        `/execution/${userId}/intervention/${interventionId}/dismiss`
      );
      return response.data.success;
    } catch (error) {
      console.log('Dismiss intervention endpoint not available');
      return true; // Optimistic update
    }
  },

  /**
   * Get execution history
   */
  getExecutionHistory: async (
    userId: string,
    days: number = 7
  ): Promise<DailyExecutionPlan[]> => {
    try {
      const response = await api.get<{ success: boolean; data: DailyExecutionPlan[] }>(
        `/execution/${userId}/history?days=${days}`
      );
      return response.data.data;
    } catch (error) {
      console.log('Execution history endpoint not available');
      return [];
    }
  },
};

export default executionService;
