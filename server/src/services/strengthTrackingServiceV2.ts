// Strength Tracking Service V2
// Comprehensive strength tracking with database integration

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface StrengthRecord {
  id?: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  recordDate: string;
  weightLb: number;
  reps: number;
  estimatedOneRM?: number;
  rpe?: number;
  notes?: string;
  isPR?: boolean;
  sessionId?: string;
}

export interface StrengthSession {
  id?: string;
  userId: string;
  sessionDate: string;
  sessionName?: string;
  totalVolumeLb?: number;
  totalSets?: number;
  totalReps?: number;
  durationMinutes?: number;
  avgRPE?: number;
  notes?: string;
}

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  recordType: string;
  recordValue: number;
  recordDate: string;
  improvementPercent?: number;
}

export interface StrengthProgress {
  recordDate: string;
  weightLb: number;
  reps: number;
  estimatedOneRM: number;
  isPR: boolean;
}

export class StrengthTrackingService {
  
  /**
   * Log a strength record
   */
  async logStrengthRecord(record: StrengthRecord): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('strength_records')
        .insert({
          user_id: record.userId,
          exercise_id: record.exerciseId,
          exercise_name: record.exerciseName,
          record_date: record.recordDate,
          weight_lb: record.weightLb,
          reps: record.reps,
          rpe: record.rpe,
          notes: record.notes,
          session_id: record.sessionId,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Strength record logged', {
        userId: record.userId,
        exercise: record.exerciseName,
        recordId: data.id,
      });

      return data.id;
    } catch (error) {
      logger.error('Error logging strength record', { error, record });
      throw error;
    }
  }

  /**
   * Get strength progress for an exercise
   */
  async getStrengthProgress(
    userId: string,
    exerciseId: string,
    days: number = 90
  ): Promise<StrengthProgress[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_strength_progress', {
          p_user_id: userId,
          p_exercise_id: exerciseId,
          p_days: days,
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting strength progress', { error, userId, exerciseId });
      throw error;
    }
  }

  /**
   * Get all personal records for a user
   */
  async getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_all_personal_records', {
          p_user_id: userId,
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting personal records', { error, userId });
      throw error;
    }
  }

  /**
   * Get recent personal records (last 30 days)
   */
  async getRecentPRs(userId: string, days: number = 30): Promise<PersonalRecord[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .gte('record_date', startDate.toISOString().split('T')[0])
        .order('record_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting recent PRs', { error, userId });
      throw error;
    }
  }

  /**
   * Create a strength session
   */
  async createSession(session: StrengthSession): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('strength_sessions')
        .insert({
          user_id: session.userId,
          session_date: session.sessionDate,
          session_name: session.sessionName,
          total_volume_lb: session.totalVolumeLb,
          total_sets: session.totalSets,
          total_reps: session.totalReps,
          duration_minutes: session.durationMinutes,
          avg_rpe: session.avgRPE,
          notes: session.notes,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Strength session created', {
        userId: session.userId,
        sessionId: data.id,
      });

      return data.id;
    } catch (error) {
      logger.error('Error creating strength session', { error, session });
      throw error;
    }
  }

  /**
   * Get recent strength sessions
   */
  async getRecentSessions(userId: string, limit: number = 10): Promise<StrengthSession[]> {
    try {
      const { data, error } = await supabase
        .from('strength_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting recent sessions', { error, userId });
      throw error;
    }
  }

  /**
   * Get all exercises
   */
  async getAllExercises(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('strength_exercises')
        .select('*')
        .order('exercise_name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting exercises', { error });
      throw error;
    }
  }

  /**
   * Get exercises by muscle group
   */
  async getExercisesByMuscleGroup(muscleGroup: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('strength_exercises')
        .select('*')
        .eq('muscle_group', muscleGroup)
        .order('exercise_name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting exercises by muscle group', { error, muscleGroup });
      throw error;
    }
  }

  /**
   * Calculate strength trends
   */
  async calculateStrengthTrends(
    userId: string,
    exerciseId: string,
    days: number = 90
  ): Promise<{
    averageOneRM: number;
    maxOneRM: number;
    totalSessions: number;
    averageRPE: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
  }> {
    try {
      const progress = await this.getStrengthProgress(userId, exerciseId, days);

      if (progress.length === 0) {
        throw new Error('No data available for trend calculation');
      }

      const oneRMs = progress.map(p => p.estimatedOneRM);
      const averageOneRM = oneRMs.reduce((a, b) => a + b, 0) / oneRMs.length;
      const maxOneRM = Math.max(...oneRMs);

      // Calculate trend (compare first half to second half)
      const midpoint = Math.floor(progress.length / 2);
      const firstHalf = progress.slice(0, midpoint);
      const secondHalf = progress.slice(midpoint);

      const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.estimatedOneRM, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.estimatedOneRM, 0) / secondHalf.length;

      const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (trendPercentage > 5) trend = 'increasing';
      else if (trendPercentage < -5) trend = 'decreasing';

      // Get average RPE from records
      const { data: records } = await supabase
        .from('strength_records')
        .select('rpe')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .not('rpe', 'is', null);

      const averageRPE = records && records.length > 0
        ? records.reduce((sum: number, r: any) => sum + r.rpe, 0) / records.length
        : 0;

      return {
        averageOneRM: Math.round(averageOneRM * 100) / 100,
        maxOneRM: Math.round(maxOneRM * 100) / 100,
        totalSessions: progress.length,
        averageRPE: Math.round(averageRPE * 10) / 10,
        trend,
        trendPercentage: Math.round(trendPercentage * 100) / 100,
      };
    } catch (error) {
      logger.error('Error calculating strength trends', { error, userId, exerciseId });
      throw error;
    }
  }

  /**
   * Get strength summary for user
   */
  async getStrengthSummary(userId: string): Promise<{
    totalPRs: number;
    recentPRs: number;
    totalSessions: number;
    totalVolumeLb: number;
    topExercises: Array<{ exerciseName: string; maxOneRM: number }>;
  }> {
    try {
      // Get total PRs
      const { data: allPRs } = await supabase
        .from('personal_records')
        .select('id')
        .eq('user_id', userId);

      // Get recent PRs (last 30 days)
      const recentPRs = await this.getRecentPRs(userId, 30);

      // Get total sessions
      const { data: sessions } = await supabase
        .from('strength_sessions')
        .select('id, total_volume_lb')
        .eq('user_id', userId);

      const totalVolumeLb = sessions
        ? sessions.reduce((sum, s) => sum + (s.total_volume_lb || 0), 0)
        : 0;

      // Get top exercises by max 1RM
      const { data: topRecords } = await supabase
        .from('strength_records')
        .select('exercise_name, estimated_1rm')
        .eq('user_id', userId)
        .order('estimated_1rm', { ascending: false })
        .limit(5);

      const topExercises = topRecords
        ? topRecords.map(r => ({
            exerciseName: r.exercise_name,
            maxOneRM: r.estimated_1rm,
          }))
        : [];

      return {
        totalPRs: allPRs?.length || 0,
        recentPRs: recentPRs.length,
        totalSessions: sessions?.length || 0,
        totalVolumeLb: Math.round(totalVolumeLb),
        topExercises,
      };
    } catch (error) {
      logger.error('Error getting strength summary', { error, userId });
      throw error;
    }
  }
}

export const strengthTrackingService = new StrengthTrackingService();
