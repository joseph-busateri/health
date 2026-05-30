import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import type {
  DeviceContext,
  DeviceDailySummary,
  DeviceSource,
  DataQuality,
  DEFAULT_SOURCE_PRIORITY,
} from '../types/deviceIntelligence';

/**
 * Device Context Service - Phase 11
 * 
 * Unified read layer for device intelligence
 * Provides normalized device data to engines and intelligence services
 * Handles source priority and reconciliation
 */

export class DeviceContextService {
  
  /**
   * Get device context for a user on a specific date
   */
  async getDeviceContext(userId: string, date?: string): Promise<DeviceContext> {
    try {
      const contextDate = date || new Date().toISOString().split('T')[0];
      
      logger.info('[DeviceContext] Loading device context', { userId, contextDate });
      
      // Load daily summary
      const dailySummary = await this.getDailySummary(userId, contextDate);
      
      // Load recent trends (7-day)
      const recentTrends = await this.getRecentTrends(userId, contextDate);
      
      // Build context components
      const sleep = this.buildSleepContext(dailySummary);
      const recovery = this.buildRecoveryContext(dailySummary);
      const activity = this.buildActivityContext(dailySummary);
      const cardiovascular = this.buildCardiovascularContext(dailySummary);
      const workouts = this.buildWorkoutContext(dailySummary);
      
      // Get source summary
      const sourceSummary = await this.getSourceSummary(userId);
      
      // Calculate completeness
      const completenessScore = this.calculateContextCompleteness(dailySummary);
      const dataQuality = this.assessContextQuality(dailySummary);
      
      // Build flags
      const flags = {
        hasSleepData: !!dailySummary.sleepDurationMinutes,
        hasActivityData: !!dailySummary.steps,
        hasCardiovascularData: !!dailySummary.restingHeartRate,
        hasRecoveryData: !!dailySummary.readinessScore,
        hasWorkoutData: !!dailySummary.workoutCount && dailySummary.workoutCount > 0,
        hasBPData: !!dailySummary.systolicBP,
      };
      
      const context: DeviceContext = {
        userId,
        contextDate,
        timestamp: new Date().toISOString(),
        dailySummary,
        recentTrends,
        sleep,
        recovery,
        activity,
        cardiovascular,
        workouts,
        sourceSummary,
        completenessScore,
        dataQuality,
        flags,
      };
      
      logger.info('[DeviceContext] Device context loaded', {
        userId,
        contextDate,
        completenessScore,
        dataQuality,
        activeSources: sourceSummary.activeSources.length,
      });
      
      return context;
    } catch (error) {
      logger.error('[DeviceContext] Failed to load device context', { error, userId });
      
      // Return empty context on error
      return this.getEmptyContext(userId, date);
    }
  }
  
  /**
   * Get daily summary for a user
   */
  private async getDailySummary(userId: string, date: string): Promise<DeviceDailySummary> {
    try {
      // Try to get from device_daily_summary table (if it exists)
      const { data, error } = await supabase
        .from('device_daily_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('summary_date', date)
        .single();
      
      if (data && !error) {
        return this.mapDatabaseToSummary(data);
      }
      
      // If not found, aggregate from individual device tables
      return await this.aggregateDailySummary(userId, date);
    } catch (error) {
      logger.warn('[DeviceContext] Failed to get daily summary, using aggregation', { error, userId, date });
      return await this.aggregateDailySummary(userId, date);
    }
  }
  
  /**
   * Aggregate daily summary from individual device tables
   */
  private async aggregateDailySummary(userId: string, date: string): Promise<DeviceDailySummary> {
    const summary: DeviceDailySummary = {
      userId,
      summaryDate: date,
      dataCompleteness: {
        hasSleep: false,
        hasActivity: false,
        hasCardiovascular: false,
        hasWorkout: false,
        hasRecovery: false,
        hasBP: false,
        completenessScore: 0,
      },
      activeSources: [],
    };
    
    // Aggregate Sleep Number data
    const sleepNumberData = await this.getSleepNumberData(userId, date);
    if (sleepNumberData) {
      summary.sleepDurationMinutes = sleepNumberData.total_sleep_time_minutes;
      summary.sleepScore = sleepNumberData.sleep_iq_score;
      summary.deepSleepMinutes = sleepNumberData.deep_sleep_minutes;
      summary.sleepEfficiency = sleepNumberData.sleep_efficiency_percent;
      summary.dataCompleteness.hasSleep = true;
      summary.activeSources.push('sleep_number');
      summary.primarySleepSource = 'sleep_number';
    }
    
    // Aggregate Apple Watch data
    const appleWatchData = await this.getAppleWatchData(userId, date);
    if (appleWatchData) {
      summary.steps = appleWatchData.steps;
      summary.activeCalories = appleWatchData.active_calories;
      summary.exerciseMinutes = appleWatchData.exercise_minutes;
      summary.standHours = appleWatchData.stand_hours;
      summary.restingHeartRate = appleWatchData.resting_heart_rate;
      summary.averageHeartRate = appleWatchData.average_heart_rate;
      summary.hrv = appleWatchData.hrv;
      summary.vo2Max = appleWatchData.vo2_max;
      summary.dataCompleteness.hasActivity = true;
      summary.dataCompleteness.hasCardiovascular = true;
      summary.activeSources.push('apple_watch');
      summary.primaryActivitySource = 'apple_watch';
      summary.primaryCardioSource = 'apple_watch';
    }
    
    // Aggregate Oura data
    const ouraData = await this.getOuraData(userId, date);
    if (ouraData) {
      // Oura sleep takes priority if Sleep Number not available
      if (ouraData.sleep) {
        if (!summary.sleepDurationMinutes) {
          summary.sleepDurationMinutes = ouraData.sleep.total_sleep_duration;
          summary.sleepScore = ouraData.sleep.score;
          summary.deepSleepMinutes = ouraData.sleep.deep_sleep_duration;
          summary.remSleepMinutes = ouraData.sleep.rem_sleep_duration ?? summary.remSleepMinutes;
          summary.dataCompleteness.hasSleep = true;
          summary.primarySleepSource = 'oura_ring';
        }

        if (ouraData.sleep.breath_average && !summary.respiratoryRate) {
          summary.respiratoryRate = Number(ouraData.sleep.breath_average);
        }

        if (ouraData.sleep.temperature_delta !== null && ouraData.sleep.temperature_delta !== undefined && summary.temperatureDeviation === undefined) {
          summary.temperatureDeviation = Number(ouraData.sleep.temperature_delta);
        }

        if (!summary.restingHeartRate && ouraData.sleep.hr_lowest) {
          summary.restingHeartRate = Number(ouraData.sleep.hr_lowest);
        }

        if (!summary.hrv && (ouraData.sleep.rmssd || ouraData.sleep.hrv_average)) {
          summary.hrv = Number(ouraData.sleep.rmssd ?? ouraData.sleep.hrv_average);
        }
      }
      
      // Oura readiness
      if (ouraData.readiness) {
        summary.readinessScore = ouraData.readiness.score;
        summary.dataCompleteness.hasRecovery = true;

        if (ouraData.readiness.resting_heart_rate && (!summary.restingHeartRate || summary.primaryCardioSource !== 'oura_ring')) {
          summary.restingHeartRate = Number(ouraData.readiness.resting_heart_rate);
        }

        if (!summary.hrv && ouraData.readiness.hrv_average) {
          summary.hrv = Number(ouraData.readiness.hrv_average);
        }

        if (ouraData.readiness.temperature_deviation !== null && ouraData.readiness.temperature_deviation !== undefined) {
          summary.temperatureDeviation = Number(ouraData.readiness.temperature_deviation);
        }
      }
      
      // Oura activity (supplement Apple Watch if not available)
      if (ouraData.activity && !summary.steps) {
        summary.steps = ouraData.activity.steps;
        summary.activeCalories = ouraData.activity.active_calories;
        summary.activityScore = ouraData.activity.score;
        summary.dataCompleteness.hasActivity = true;
        summary.primaryActivitySource = 'oura_ring';
      }
      
      // Ensure cardiovascular completeness when Oura provides detailed metrics
      if (
        ouraData.readiness?.hrv_average ||
        ouraData.sleep?.rmssd ||
        ouraData.sleep?.hrv_average ||
        ouraData.readiness?.resting_heart_rate ||
        ouraData.sleep?.hr_lowest
      ) {
        if (!summary.hrv) {
          const hrvCandidate = ouraData.readiness?.hrv_average ?? ouraData.sleep?.rmssd ?? ouraData.sleep?.hrv_average;
          if (hrvCandidate) {
            summary.hrv = Number(hrvCandidate);
          }
        }

        if (ouraData.readiness?.resting_heart_rate && (!summary.restingHeartRate || summary.primaryCardioSource !== 'oura_ring')) {
          summary.restingHeartRate = Number(ouraData.readiness.resting_heart_rate);
        }

        summary.dataCompleteness.hasCardiovascular = true;
        summary.primaryCardioSource = 'oura_ring';
      }

      if (ouraData.spo2 && (ouraData.spo2.spo2_average || ouraData.spo2.spo2_min || ouraData.spo2.spo2_max)) {
        summary.spo2Average = ouraData.spo2.spo2_average ?? summary.spo2Average;
        summary.spo2Min = ouraData.spo2.spo2_min ?? summary.spo2Min;
        summary.spo2Max = ouraData.spo2.spo2_max ?? summary.spo2Max;
      }

      if (!summary.activeSources.includes('oura_ring') && (ouraData.sleep || ouraData.readiness || ouraData.activity || ouraData.spo2)) {
        summary.activeSources.push('oura_ring');
      }
    }
    
    // Aggregate Blood Pressure data
    const bpData = await this.getBPData(userId, date);
    if (bpData) {
      summary.systolicBP = bpData.systolic;
      summary.diastolicBP = bpData.diastolic;
      summary.bpMeasurementCount = bpData.measurement_count || 1;
      summary.dataCompleteness.hasBP = true;
      summary.activeSources.push('bp_monitor');
    }
    
    // Calculate sleep quality
    if (summary.sleepScore) {
      if (summary.sleepScore >= 85) summary.sleepQuality = 'excellent';
      else if (summary.sleepScore >= 70) summary.sleepQuality = 'good';
      else if (summary.sleepScore >= 55) summary.sleepQuality = 'fair';
      else summary.sleepQuality = 'poor';
    }
    
    // Calculate completeness score
    const completenessFactors = [
      summary.dataCompleteness.hasSleep ? 30 : 0,
      summary.dataCompleteness.hasActivity ? 25 : 0,
      summary.dataCompleteness.hasCardiovascular ? 20 : 0,
      summary.dataCompleteness.hasRecovery ? 15 : 0,
      summary.dataCompleteness.hasWorkout ? 5 : 0,
      summary.dataCompleteness.hasBP ? 5 : 0,
    ];
    summary.dataCompleteness.completenessScore = completenessFactors.reduce((sum, val) => sum + val, 0);
    
    return summary;
  }
  
  /**
   * Get Sleep Number data for date
   */
  private async getSleepNumberData(userId: string, date: string): Promise<any> {
    try {
      const { data } = await supabase
        .from('sleep_number_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('session_date', date)
        .single();
      
      return data;
    } catch {
      return null;
    }
  }
  
  /**
   * Get Apple Watch data for date
   */
  private async getAppleWatchData(userId: string, date: string): Promise<any> {
    try {
      const { data } = await supabase
        .from('apple_watch_health_data')
        .select('*')
        .eq('user_id', userId)
        .eq('data_date', date)
        .single();
      
      return data;
    } catch {
      return null;
    }
  }
  
  /**
   * Get Oura data for date
   */
  private async getOuraData(userId: string, date: string): Promise<any> {
    try {
      const [sleepData, readinessData, activityData, spo2Data] = await Promise.all([
        supabase
          .from('oura_sleep_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('sleep_date', date)
          .maybeSingle(),
        supabase
          .from('oura_readiness_data')
          .select('*')
          .eq('user_id', userId)
          .eq('readiness_date', date)
          .maybeSingle(),
        supabase
          .from('oura_activity_data')
          .select('*')
          .eq('user_id', userId)
          .eq('activity_date', date)
          .maybeSingle(),
        supabase
          .from('oura_spo2_data')
          .select('*')
          .eq('user_id', userId)
          .eq('spo2_date', date)
          .maybeSingle(),
      ]);

      return {
        sleep: sleepData.data ?? null,
        readiness: readinessData.data ?? null,
        activity: activityData.data ?? null,
        spo2: spo2Data.data ?? null,
      };
    } catch {
      return null;
    }
  }
  
  /**
   * Get Blood Pressure data for date
   */
  private async getBPData(userId: string, date: string): Promise<any> {
    try {
      // Check structured daily log for BP data
      const { data } = await supabase
        .from('structured_daily_logs')
        .select('blood_pressure_systolic, blood_pressure_diastolic')
        .eq('user_id', userId)
        .eq('log_date', date)
        .single();
      
      if (data?.blood_pressure_systolic) {
        return {
          systolic: data.blood_pressure_systolic,
          diastolic: data.blood_pressure_diastolic,
          measurement_count: 1,
        };
      }
      
      return null;
    } catch {
      return null;
    }
  }
  
  /**
   * Get recent trends (7-day average)
   */
  private async getRecentTrends(userId: string, endDate: string): Promise<any> {
    try {
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // This would ideally query aggregated data
      // For now, return placeholder
      return {
        avgSleepDuration: undefined,
        avgSleepScore: undefined,
        avgSteps: undefined,
        avgRestingHR: undefined,
        avgHRV: undefined,
        avgReadinessScore: undefined,
        trendDirection: 'stable',
      };
    } catch {
      return undefined;
    }
  }
  
  /**
   * Build sleep context
   */
  private buildSleepContext(summary: DeviceDailySummary): any {
    if (!summary.sleepDurationMinutes) return undefined;
    
    return {
      lastNightDuration: summary.sleepDurationMinutes,
      lastNightScore: summary.sleepScore,
      lastNightQuality: summary.sleepQuality,
      sleepDebt: summary.sleepDurationMinutes < 420 ? 420 - summary.sleepDurationMinutes : 0,
      sleepConsistency: undefined, // Would need historical data
      source: summary.primarySleepSource,
    };
  }
  
  /**
   * Build recovery context
   */
  private buildRecoveryContext(summary: DeviceDailySummary): any {
    if (!summary.readinessScore && !summary.hrv) return undefined;
    
    let recoveryStatus: 'recovered' | 'recovering' | 'strained' = 'recovering';
    if (summary.readinessScore) {
      if (summary.readinessScore >= 85) recoveryStatus = 'recovered';
      else if (summary.readinessScore < 70) recoveryStatus = 'strained';
    }
    
    let hrvStatus: 'high' | 'normal' | 'low' = 'normal';
    if (summary.hrv) {
      if (summary.hrv >= 60) hrvStatus = 'high';
      else if (summary.hrv < 30) hrvStatus = 'low';
    }
    
    let restingHRStatus: 'low' | 'normal' | 'elevated' = 'normal';
    if (summary.restingHeartRate) {
      if (summary.restingHeartRate < 60) restingHRStatus = 'low';
      else if (summary.restingHeartRate > 75) restingHRStatus = 'elevated';
    }
    
    return {
      readinessScore: summary.readinessScore,
      recoveryStatus,
      hrvStatus,
      restingHRStatus,
      source: summary.primaryCardioSource || 'oura_ring',
    };
  }
  
  /**
   * Build activity context
   */
  private buildActivityContext(summary: DeviceDailySummary): any {
    if (!summary.steps) return undefined;
    
    let activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' = 'sedentary';
    if (summary.steps >= 15000) activityLevel = 'very_active';
    else if (summary.steps >= 10000) activityLevel = 'active';
    else if (summary.steps >= 7500) activityLevel = 'moderate';
    else if (summary.steps >= 5000) activityLevel = 'light';
    
    return {
      todaySteps: summary.steps,
      todayCalories: summary.activeCalories,
      todayExerciseMinutes: summary.exerciseMinutes,
      activityLevel,
      source: summary.primaryActivitySource,
    };
  }
  
  /**
   * Build cardiovascular context
   */
  private buildCardiovascularContext(summary: DeviceDailySummary): any {
    if (!summary.restingHeartRate && !summary.hrv) return undefined;
    
    return {
      restingHR: summary.restingHeartRate,
      hrv: summary.hrv,
      vo2Max: summary.vo2Max,
      cardioFitnessLevel: undefined,
      recentBP: summary.systolicBP ? {
        systolic: summary.systolicBP,
        diastolic: summary.diastolicBP,
        measurementDate: summary.summaryDate,
      } : undefined,
      source: summary.primaryCardioSource,
    };
  }
  
  /**
   * Build workout context
   */
  private buildWorkoutContext(summary: DeviceDailySummary): any {
    if (!summary.workoutCount) return undefined;
    
    return {
      todayWorkoutCount: summary.workoutCount,
      todayWorkoutMinutes: summary.totalWorkoutMinutes,
      lastWorkout: undefined, // Would need workout details
      source: summary.primaryActivitySource,
    };
  }
  
  /**
   * Get source summary
   */
  private async getSourceSummary(userId: string): Promise<any> {
    const activeSources: DeviceSource[] = [];
    const connectedDevices: DeviceSource[] = [];
    const lastSyncTimes: Partial<Record<DeviceSource, string>> = {};
    
    // Check Sleep Number connection
    try {
      const { data: sleepNumber } = await supabase
        .from('sleep_number_sessions')
        .select('session_date')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .limit(1)
        .single();
      
      if (sleepNumber) {
        connectedDevices.push('sleep_number');
        activeSources.push('sleep_number');
        lastSyncTimes['sleep_number'] = sleepNumber.session_date;
      }
    } catch {}
    
    // Check Apple Watch connection
    try {
      const { data: appleWatch } = await supabase
        .from('apple_watch_connections')
        .select('last_sync_at, is_connected')
        .eq('user_id', userId)
        .single();
      
      if (appleWatch?.is_connected) {
        connectedDevices.push('apple_watch');
        if (appleWatch.last_sync_at) {
          activeSources.push('apple_watch');
          lastSyncTimes['apple_watch'] = appleWatch.last_sync_at;
        }
      }
    } catch {}
    
    // Check Oura connection
    try {
      const { data: oura } = await supabase
        .from('oura_connections')
        .select('last_sync_at, connection_status')
        .eq('user_id', userId)
        .single();
      
      if (oura?.connection_status === 'active') {
        connectedDevices.push('oura_ring');
        if (oura.last_sync_at) {
          activeSources.push('oura_ring');
          lastSyncTimes['oura_ring'] = oura.last_sync_at;
        }
      }
    } catch {}
    
    const dataFreshness = activeSources.length > 0 ? 'current' : 'missing';
    
    return {
      activeSources,
      connectedDevices,
      lastSyncTimes,
      dataFreshness,
    };
  }
  
  /**
   * Calculate context completeness
   */
  private calculateContextCompleteness(summary: DeviceDailySummary): number {
    return summary.dataCompleteness.completenessScore;
  }
  
  /**
   * Assess context quality
   */
  private assessContextQuality(summary: DeviceDailySummary): DataQuality {
    const score = summary.dataCompleteness.completenessScore;
    
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'incomplete';
  }
  
  /**
   * Map database record to summary
   */
  private mapDatabaseToSummary(data: any): DeviceDailySummary {
    return {
      id: data.id,
      userId: data.user_id,
      summaryDate: data.summary_date,
      sleepDurationMinutes: data.sleep_duration_minutes,
      sleepScore: data.sleep_score,
      sleepQuality: data.sleep_quality,
      deepSleepMinutes: data.deep_sleep_minutes,
      remSleepMinutes: data.rem_sleep_minutes,
      sleepEfficiency: data.sleep_efficiency,
      steps: data.steps,
      activeCalories: data.active_calories,
      exerciseMinutes: data.exercise_minutes,
      standHours: data.stand_hours,
      activityScore: data.activity_score,
      restingHeartRate: data.resting_heart_rate,
      averageHeartRate: data.average_heart_rate,
      hrv: data.hrv,
      vo2Max: data.vo2_max,
      readinessScore: data.readiness_score,
      recoveryScore: data.recovery_score,
      stressLevel: data.stress_level,
      workoutCount: data.workout_count,
      totalWorkoutMinutes: data.total_workout_minutes,
      workoutCalories: data.workout_calories,
      systolicBP: data.systolic_bp,
      diastolicBP: data.diastolic_bp,
      bpMeasurementCount: data.bp_measurement_count,
      dataCompleteness: data.data_completeness || {
        hasSleep: false,
        hasActivity: false,
        hasCardiovascular: false,
        hasWorkout: false,
        hasRecovery: false,
        hasBP: false,
        completenessScore: 0,
      },
      activeSources: data.active_sources || [],
      primarySleepSource: data.primary_sleep_source,
      primaryActivitySource: data.primary_activity_source,
      primaryCardioSource: data.primary_cardio_source,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
  
  /**
   * Get empty context (fallback)
   */
  private getEmptyContext(userId: string, date?: string): DeviceContext {
    const contextDate = date || new Date().toISOString().split('T')[0];
    
    return {
      userId,
      contextDate,
      timestamp: new Date().toISOString(),
      dailySummary: {
        userId,
        summaryDate: contextDate,
        dataCompleteness: {
          hasSleep: false,
          hasActivity: false,
          hasCardiovascular: false,
          hasWorkout: false,
          hasRecovery: false,
          hasBP: false,
          completenessScore: 0,
        },
        activeSources: [],
      },
      sourceSummary: {
        activeSources: [],
        connectedDevices: [],
        lastSyncTimes: {} as Partial<Record<DeviceSource, string>>,
        dataFreshness: 'missing' as const,
      },
      completenessScore: 0,
      dataQuality: 'incomplete',
      flags: {
        hasSleepData: false,
        hasActivityData: false,
        hasCardiovascularData: false,
        hasRecoveryData: false,
        hasWorkoutData: false,
        hasBPData: false,
      },
    };
  }
}

export const deviceContextService = new DeviceContextService();

/**
 * Convenience function for getting device context
 */
export async function getDeviceContext(userId: string, date?: string): Promise<DeviceContext> {
  return deviceContextService.getDeviceContext(userId, date);
}
