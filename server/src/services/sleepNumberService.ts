// Sleep Number Service
// Manages Sleep Number bed sleep tracking data

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { sleepNumberParser, ParsedSleepSession, ParsedSleepHourlyData } from '../utils/sleepNumberParser';

export interface SleepSession {
  id?: string;
  userId: string;
  sessionDate: string;
  bedId?: string;
  sleeperSide: 'left' | 'right' | 'both';
  
  inBedTime?: string;
  outOfBedTime?: string;
  totalTimeInBedMinutes?: number;
  
  totalSleepTimeMinutes?: number;
  awakeTimeMinutes?: number;
  restlessTimeMinutes?: number;
  restfulTimeMinutes?: number;
  
  sleepIQScore?: number;
  sleepEfficiencyPercent?: number;
  
  avgHeartRate?: number;
  minHeartRate?: number;
  maxHeartRate?: number;
  
  avgRespiratoryRate?: number;
  minRespiratoryRate?: number;
  maxRespiratoryRate?: number;
  
  totalMovements?: number;
  positionChanges?: number;
  timeOnLeftSideMinutes?: number;
  timeOnRightSideMinutes?: number;
  timeOnBackMinutes?: number;
  timeOnStomachMinutes?: number;
  
  lightSleepMinutes?: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  
  sleepNumberSetting?: number;
  avgSleepNumber?: number;
  
  roomTemperature?: number;
  notes?: string;
  dataSource?: string;
}

export interface SleepGoal {
  id?: string;
  userId: string;
  goalType: 'sleep_duration' | 'sleep_iq' | 'consistency' | 'deep_sleep';
  targetValue: number;
  currentValue?: number;
  targetDate?: string;
  status?: string;
}

export interface SleepStats {
  avgSleepDuration: number;
  avgSleepIQ: number;
  avgDeepSleep: number;
  avgHeartRate: number;
  totalNights: number;
  consistencyScore: number;
}

export class SleepNumberService {
  
  /**
   * Upload and parse Sleep Number data from file
   */
  async uploadSleepData(
    userId: string,
    fileContent: string,
    fileType: 'json' | 'csv'
  ): Promise<{ sessionCount: number; sessionIds: string[] }> {
    try {
      // Parse the file
      let sessions: ParsedSleepSession[];
      
      if (fileType === 'json') {
        const jsonData = JSON.parse(fileContent);
        sessions = sleepNumberParser.parseSleepNumberJSON(jsonData);
      } else {
        sessions = sleepNumberParser.parseSleepNumberCSV(fileContent);
      }

      if (sessions.length === 0) {
        throw new Error('No valid sleep sessions found in file');
      }

      // Validate and save sessions
      const sessionIds: string[] = [];
      
      for (const session of sessions) {
        const validation = sleepNumberParser.validateSession(session);
        if (!validation.valid) {
          logger.warn('Invalid sleep session skipped', { 
            date: session.sessionDate, 
            errors: validation.errors 
          });
          continue;
        }

        const sessionId = await this.saveSleepSession({
          userId,
          ...session,
          dataSource: 'file_upload',
        });
        
        sessionIds.push(sessionId);
      }

      logger.info('Sleep data uploaded', {
        userId,
        totalSessions: sessions.length,
        savedSessions: sessionIds.length,
      });

      return {
        sessionCount: sessionIds.length,
        sessionIds,
      };
    } catch (error) {
      logger.error('Error uploading sleep data', { error, userId });
      throw error;
    }
  }

  /**
   * Save a sleep session
   */
  async saveSleepSession(session: SleepSession): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('sleep_number_sessions')
        .insert({
          user_id: session.userId,
          session_date: session.sessionDate,
          bed_id: session.bedId,
          sleeper_side: session.sleeperSide,
          
          in_bed_time: session.inBedTime,
          out_of_bed_time: session.outOfBedTime,
          total_time_in_bed_minutes: session.totalTimeInBedMinutes,
          
          total_sleep_time_minutes: session.totalSleepTimeMinutes,
          awake_time_minutes: session.awakeTimeMinutes,
          restless_time_minutes: session.restlessTimeMinutes,
          restful_time_minutes: session.restfulTimeMinutes,
          
          sleep_iq_score: session.sleepIQScore,
          sleep_efficiency_percent: session.sleepEfficiencyPercent,
          
          avg_heart_rate: session.avgHeartRate,
          min_heart_rate: session.minHeartRate,
          max_heart_rate: session.maxHeartRate,
          
          avg_respiratory_rate: session.avgRespiratoryRate,
          min_respiratory_rate: session.minRespiratoryRate,
          max_respiratory_rate: session.maxRespiratoryRate,
          
          total_movements: session.totalMovements,
          position_changes: session.positionChanges,
          time_on_left_side_minutes: session.timeOnLeftSideMinutes,
          time_on_right_side_minutes: session.timeOnRightSideMinutes,
          time_on_back_minutes: session.timeOnBackMinutes,
          time_on_stomach_minutes: session.timeOnStomachMinutes,
          
          light_sleep_minutes: session.lightSleepMinutes,
          deep_sleep_minutes: session.deepSleepMinutes,
          rem_sleep_minutes: session.remSleepMinutes,
          
          sleep_number_setting: session.sleepNumberSetting,
          avg_sleep_number: session.avgSleepNumber,
          
          room_temperature: session.roomTemperature,
          notes: session.notes,
          data_source: session.dataSource || 'manual_entry',
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate (upsert instead)
        if (error.code === '23505') {
          return await this.updateSleepSession(session);
        }
        throw error;
      }

      logger.info('Sleep session saved', {
        userId: session.userId,
        sessionId: data.id,
        date: session.sessionDate,
      });

      return data.id;
    } catch (error) {
      logger.error('Error saving sleep session', { error, session });
      throw error;
    }
  }

  /**
   * Update existing sleep session
   */
  async updateSleepSession(session: SleepSession): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('sleep_number_sessions')
        .update({
          total_sleep_time_minutes: session.totalSleepTimeMinutes,
          sleep_iq_score: session.sleepIQScore,
          avg_heart_rate: session.avgHeartRate,
          deep_sleep_minutes: session.deepSleepMinutes,
          notes: session.notes,
        })
        .eq('user_id', session.userId)
        .eq('session_date', session.sessionDate)
        .eq('sleeper_side', session.sleeperSide)
        .select()
        .single();

      if (error) throw error;

      logger.info('Sleep session updated', {
        userId: session.userId,
        sessionId: data.id,
      });

      return data.id;
    } catch (error) {
      logger.error('Error updating sleep session', { error, session });
      throw error;
    }
  }

  /**
   * Get sleep trends
   */
  async getSleepTrends(userId: string, days: number = 30): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_sleep_trends', {
          p_user_id: userId,
          p_days: days,
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting sleep trends', { error, userId });
      throw error;
    }
  }

  /**
   * Calculate sleep statistics
   */
  async calculateSleepStats(userId: string, days: number = 30): Promise<SleepStats> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_sleep_stats', {
          p_user_id: userId,
          p_days: days,
        });

      if (error) throw error;

      const stats = data[0] || {
        avg_sleep_duration: 0,
        avg_sleep_iq: 0,
        avg_deep_sleep: 0,
        avg_heart_rate: 0,
        total_nights: 0,
        consistency_score: 0,
      };

      return {
        avgSleepDuration: stats.avg_sleep_duration,
        avgSleepIQ: stats.avg_sleep_iq,
        avgDeepSleep: stats.avg_deep_sleep,
        avgHeartRate: stats.avg_heart_rate,
        totalNights: stats.total_nights,
        consistencyScore: stats.consistency_score,
      };
    } catch (error) {
      logger.error('Error calculating sleep stats', { error, userId });
      throw error;
    }
  }

  /**
   * Get recent sleep sessions
   */
  async getRecentSessions(userId: string, limit: number = 7): Promise<SleepSession[]> {
    try {
      const { data, error } = await supabase
        .from('sleep_number_sessions')
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
   * Get sleep session by date
   */
  async getSessionByDate(userId: string, date: string, side: string = 'both'): Promise<SleepSession | null> {
    try {
      const { data, error } = await supabase
        .from('sleep_number_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('session_date', date)
        .eq('sleeper_side', side)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting session by date', { error, userId, date });
      throw error;
    }
  }

  /**
   * Get sleep quality breakdown
   */
  async getSleepQualityBreakdown(userId: string, date: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_sleep_quality_breakdown', {
          p_user_id: userId,
          p_session_date: date,
        });

      if (error) throw error;

      return data[0] || {
        light_sleep_percent: 0,
        deep_sleep_percent: 0,
        rem_sleep_percent: 0,
        awake_percent: 0,
      };
    } catch (error) {
      logger.error('Error getting sleep quality breakdown', { error, userId, date });
      throw error;
    }
  }

  /**
   * Create sleep goal
   */
  async createSleepGoal(goal: SleepGoal): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('sleep_goals')
        .insert({
          user_id: goal.userId,
          goal_type: goal.goalType,
          target_value: goal.targetValue,
          target_date: goal.targetDate,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Sleep goal created', {
        userId: goal.userId,
        goalId: data.id,
        goalType: goal.goalType,
      });

      return data.id;
    } catch (error) {
      logger.error('Error creating sleep goal', { error, goal });
      throw error;
    }
  }

  /**
   * Get active sleep goals
   */
  async getActiveGoals(userId: string): Promise<SleepGoal[]> {
    try {
      const { data, error } = await supabase
        .from('sleep_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting active goals', { error, userId });
      throw error;
    }
  }

  /**
   * Check goal progress
   */
  async checkGoalProgress(goalId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('check_sleep_goal_progress', {
          p_goal_id: goalId,
        });

      if (error) throw error;

      return data[0] || null;
    } catch (error) {
      logger.error('Error checking goal progress', { error, goalId });
      throw error;
    }
  }

  /**
   * Get sleep insights
   */
  async getSleepInsights(userId: string, days: number = 30): Promise<{
    bestNight: any;
    worstNight: any;
    averages: SleepStats;
    trends: string[];
  }> {
    try {
      // Get all sessions
      const { data: sessions } = await supabase
        .from('sleep_number_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('session_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('session_date', { ascending: false });

      if (!sessions || sessions.length === 0) {
        return {
          bestNight: null,
          worstNight: null,
          averages: {
            avgSleepDuration: 0,
            avgSleepIQ: 0,
            avgDeepSleep: 0,
            avgHeartRate: 0,
            totalNights: 0,
            consistencyScore: 0,
          },
          trends: [],
        };
      }

      // Find best and worst nights
      const bestNight = sessions.reduce((best, current) => 
        (current.sleep_iq_score || 0) > (best.sleep_iq_score || 0) ? current : best
      );

      const worstNight = sessions.reduce((worst, current) => 
        (current.sleep_iq_score || 100) < (worst.sleep_iq_score || 100) ? current : worst
      );

      // Get statistics
      const averages = await this.calculateSleepStats(userId, days);

      // Generate trends
      const trends: string[] = [];
      
      if (averages.avgSleepDuration < 420) { // Less than 7 hours
        trends.push('Consider increasing sleep duration for better recovery');
      }
      
      if (averages.avgSleepIQ < 70) {
        trends.push('Sleep quality could be improved - review sleep environment');
      }
      
      if (averages.consistencyScore < 70) {
        trends.push('Try to maintain a more consistent sleep schedule');
      }

      return {
        bestNight,
        worstNight,
        averages,
        trends,
      };
    } catch (error) {
      logger.error('Error getting sleep insights', { error, userId });
      throw error;
    }
  }
}

export const sleepNumberService = new SleepNumberService();
