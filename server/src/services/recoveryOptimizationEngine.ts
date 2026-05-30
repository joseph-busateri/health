// Recovery Optimization Engine
// HRV-based recovery scoring, sleep analysis, workout readiness, and deload recommendations

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface HRVMeasurement {
  userId: string;
  measurementDate: string;
  rmssd: number;
  sdnn?: number;
  pnn50?: number;
  hrvScore: number;
  restingHeartRate: number;
  measurementPosition?: string;
  deviceSource?: string;
}

export interface RecoveryScore {
  userId: string;
  scoreDate: string;
  overallRecoveryScore: number;
  recoveryStatus: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  hrvScore: number;
  sleepScore: number;
  sorenessScore: number;
  stressScore: number;
  fatigueScore: number;
  hrvBaseline: number;
  hrvCurrent: number;
  hrvDeviationPercent: number;
  hrvTrend: 'improving' | 'stable' | 'declining';
  acwr: number;
  workoutReadinessScore: number;
  recommendedIntensity: 'high' | 'moderate' | 'low' | 'rest';
  recoverySummary: string;
  keyFactors: string[];
}

export interface WorkoutReadiness {
  userId: string;
  readinessDate: string;
  readinessScore: number;
  readinessLevel: 'peak' | 'high' | 'moderate' | 'low' | 'rest_needed';
  recommendedWorkoutType: string;
  recommendedIntensityPercent: number;
  recommendedVolumePercent: number;
  injuryRiskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  overtrainingRisk: 'low' | 'moderate' | 'high';
  deloadRecommended: boolean;
  workoutGuidance: string;
  modifications: string[];
}

export interface DeloadRecommendation {
  userId: string;
  recommendationDate: string;
  deloadUrgency: 'immediate' | 'within_week' | 'within_2_weeks' | 'not_needed';
  deloadType: 'full_rest' | 'active_recovery' | 'reduced_volume' | 'reduced_intensity';
  triggerReasons: string[];
  primaryIndicator: string;
  recommendedStartDate: string;
  recommendedDurationDays: number;
  recommendedActivities: string[];
  volumeReductionPercent: number;
  intensityReductionPercent: number;
  expectedRecoveryImprovement: number;
}

export interface RecoveryStrategy {
  strategyType: string;
  strategyName: string;
  description: string;
  recommendedFrequency: string;
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  expectedRecoveryBoost: number;
  affectedMetrics: string[];
}

export class RecoveryOptimizationEngine {
  
  /**
   * Log HRV measurement
   */
  async logHRVMeasurement(measurement: HRVMeasurement): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('hrv_measurements')
        .insert({
          user_id: measurement.userId,
          measurement_date: measurement.measurementDate,
          rmssd: measurement.rmssd,
          sdnn: measurement.sdnn,
          pnn50: measurement.pnn50,
          hrv_score: measurement.hrvScore,
          resting_heart_rate: measurement.restingHeartRate,
          measurement_position: measurement.measurementPosition,
          device_source: measurement.deviceSource,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('HRV measurement logged', { userId: measurement.userId, date: measurement.measurementDate });

      // Trigger recovery score calculation
      await this.calculateRecoveryScore(measurement.userId, measurement.measurementDate);

      return data.id;
    } catch (error) {
      logger.error('Error logging HRV measurement', { error, measurement });
      throw error;
    }
  }

  /**
   * Calculate comprehensive recovery score
   */
  async calculateRecoveryScore(userId: string, date: string): Promise<RecoveryScore> {
    try {
      // Get HRV data
      const hrvData = await this.getHRVData(userId, date);
      const hrvBaseline = await this.calculateHRVBaseline(userId, date);
      const hrvScore = this.calculateHRVScore(hrvData.rmssd, hrvBaseline);
      const hrvDeviation = hrvBaseline > 0 ? ((hrvData.rmssd - hrvBaseline) / hrvBaseline) * 100 : 0;
      const hrvTrend = this.determineHRVTrend(userId, date);

      // Get sleep data
      const sleepData = await this.getSleepData(userId, date);
      const sleepScore = this.calculateSleepScore(sleepData);

      // Get subjective metrics
      const subjectiveData = await this.getSubjectiveMetrics(userId, date);
      const sorenessScore = this.calculateSorenessScore(subjectiveData.muscleSoreness);
      const stressScore = this.calculateStressScore(subjectiveData.stressLevel);
      const fatigueScore = this.calculateFatigueScore(subjectiveData.energyLevel);

      // Calculate workload metrics
      const acwr = await this.calculateACWR(userId, date);
      const trainingMonotony = await this.calculateTrainingMonotony(userId, date);

      // Calculate overall recovery score (weighted average)
      const overallScore = Math.round(
        hrvScore * 0.30 +
        sleepScore * 0.25 +
        sorenessScore * 0.15 +
        stressScore * 0.15 +
        fatigueScore * 0.15
      );

      // Determine recovery status
      const recoveryStatus = this.determineRecoveryStatus(overallScore);

      // Calculate workout readiness
      const readinessScore = this.calculateWorkoutReadinessScore(
        overallScore,
        hrvScore,
        sleepScore,
        acwr
      );

      // Determine recommended intensity
      const recommendedIntensity = this.determineRecommendedIntensity(readinessScore, acwr);

      // Generate recovery summary
      const recoverySummary = this.generateRecoverySummary(
        overallScore,
        hrvDeviation,
        sleepScore,
        acwr
      );

      // Identify key factors
      const keyFactors = this.identifyKeyFactors(
        hrvScore,
        sleepScore,
        sorenessScore,
        stressScore,
        fatigueScore,
        acwr
      );

      const recoveryScore: RecoveryScore = {
        userId,
        scoreDate: date,
        overallRecoveryScore: overallScore,
        recoveryStatus,
        hrvScore,
        sleepScore,
        sorenessScore,
        stressScore,
        fatigueScore,
        hrvBaseline,
        hrvCurrent: hrvData.rmssd,
        hrvDeviationPercent: hrvDeviation,
        hrvTrend,
        acwr,
        workoutReadinessScore: readinessScore,
        recommendedIntensity,
        recoverySummary,
        keyFactors,
      };

      // Save to database
      await this.saveRecoveryScore(recoveryScore);

      // Check if deload needed
      await this.checkAndCreateDeloadRecommendation(userId, date);

      logger.info('Recovery score calculated', { userId, date, score: overallScore });

      return recoveryScore;
    } catch (error) {
      logger.error('Error calculating recovery score', { error, userId, date });
      throw error;
    }
  }

  /**
   * Calculate workout readiness
   */
  async calculateWorkoutReadiness(userId: string, date: string): Promise<WorkoutReadiness> {
    try {
      // Get recovery score
      const recoveryScore = await this.getRecoveryScore(userId, date);

      // Calculate readiness score
      const readinessScore = recoveryScore.workoutReadinessScore;

      // Determine readiness level
      let readinessLevel: 'peak' | 'high' | 'moderate' | 'low' | 'rest_needed';
      if (readinessScore >= 85) readinessLevel = 'peak';
      else if (readinessScore >= 70) readinessLevel = 'high';
      else if (readinessScore >= 55) readinessLevel = 'moderate';
      else if (readinessScore >= 40) readinessLevel = 'low';
      else readinessLevel = 'rest_needed';

      // Determine workout recommendations
      const { workoutType, intensityPercent, volumePercent } = this.determineWorkoutRecommendations(
        readinessLevel,
        recoveryScore.acwr,
        recoveryScore.sorenessScore
      );

      // Assess injury risk
      const injuryRiskLevel = this.assessInjuryRisk(
        recoveryScore.acwr,
        recoveryScore.sorenessScore,
        recoveryScore.hrvDeviationPercent
      );

      // Assess overtraining risk
      const overtrainingRisk = this.assessOvertrainingRisk(
        recoveryScore.acwr,
        recoveryScore.hrvTrend,
        recoveryScore.sleepScore
      );

      // Check if deload recommended
      const deloadRecommended = recoveryScore.acwr > 1.3 || 
                                recoveryScore.overallRecoveryScore < 40 ||
                                overtrainingRisk === 'high';

      // Generate workout guidance
      const workoutGuidance = this.generateWorkoutGuidance(
        readinessLevel,
        injuryRiskLevel,
        deloadRecommended
      );

      // Generate modifications
      const modifications = this.generateWorkoutModifications(
        readinessLevel,
        recoveryScore.sorenessScore,
        injuryRiskLevel
      );

      const readiness: WorkoutReadiness = {
        userId,
        readinessDate: date,
        readinessScore,
        readinessLevel,
        recommendedWorkoutType: workoutType,
        recommendedIntensityPercent: intensityPercent,
        recommendedVolumePercent: volumePercent,
        injuryRiskLevel,
        overtrainingRisk,
        deloadRecommended,
        workoutGuidance,
        modifications,
      };

      // Save to database
      await this.saveWorkoutReadiness(readiness);

      logger.info('Workout readiness calculated', { userId, date, readinessScore });

      return readiness;
    } catch (error) {
      logger.error('Error calculating workout readiness', { error, userId, date });
      throw error;
    }
  }

  /**
   * Generate deload recommendation
   */
  async generateDeloadRecommendation(userId: string, date: string): Promise<DeloadRecommendation | null> {
    try {
      // Check if deload needed
      const { data: deloadCheck, error } = await supabase
        .rpc('check_deload_needed', {
          p_user_id: userId,
          p_date: date,
        });

      if (error) throw error;

      const check = deloadCheck[0];
      if (!check.deload_needed) {
        return null;
      }

      // Get recovery metrics
      const recoveryScore = await this.getRecoveryScore(userId, date);

      // Determine deload type
      const deloadType = this.determineDeloadType(
        check.urgency,
        recoveryScore.overallRecoveryScore,
        recoveryScore.acwr
      );

      // Generate trigger reasons
      const triggerReasons = this.generateTriggerReasons(
        recoveryScore.acwr,
        recoveryScore.hrvDeviationPercent,
        recoveryScore.sleepScore,
        recoveryScore.overallRecoveryScore
      );

      // Determine deload duration
      const durationDays = this.determineDeloadDuration(check.urgency, deloadType);

      // Generate recommended activities
      const activities = this.generateDeloadActivities(deloadType);

      // Determine volume/intensity reduction
      const { volumeReduction, intensityReduction } = this.determineReductions(deloadType);

      // Calculate expected improvement
      const expectedImprovement = this.calculateExpectedImprovement(
        recoveryScore.overallRecoveryScore,
        deloadType,
        durationDays
      );

      const recommendation: DeloadRecommendation = {
        userId,
        recommendationDate: date,
        deloadUrgency: check.urgency,
        deloadType,
        triggerReasons,
        primaryIndicator: check.primary_reason,
        recommendedStartDate: this.calculateStartDate(check.urgency),
        recommendedDurationDays: durationDays,
        recommendedActivities: activities,
        volumeReductionPercent: volumeReduction,
        intensityReductionPercent: intensityReduction,
        expectedRecoveryImprovement: expectedImprovement,
      };

      // Save to database
      await this.saveDeloadRecommendation(recommendation);

      logger.info('Deload recommendation generated', { userId, urgency: check.urgency });

      return recommendation;
    } catch (error) {
      logger.error('Error generating deload recommendation', { error, userId, date });
      throw error;
    }
  }

  /**
   * Generate personalized recovery strategies
   */
  async generateRecoveryStrategies(userId: string): Promise<RecoveryStrategy[]> {
    try {
      const strategies: RecoveryStrategy[] = [];

      // Get recent recovery scores
      const recentScores = await this.getRecentRecoveryScores(userId, 7);

      // Analyze weak areas
      const avgHRV = recentScores.reduce((sum, s) => sum + s.hrv_score, 0) / recentScores.length;
      const avgSleep = recentScores.reduce((sum, s) => sum + s.sleep_score, 0) / recentScores.length;
      const avgStress = recentScores.reduce((sum, s) => sum + s.stress_score, 0) / recentScores.length;

      // Sleep optimization strategy
      if (avgSleep < 70) {
        strategies.push({
          strategyType: 'sleep',
          strategyName: 'Sleep Optimization Protocol',
          description: 'Improve sleep quality and duration to enhance recovery',
          recommendedFrequency: 'daily',
          priorityLevel: 'critical',
          expectedRecoveryBoost: 25,
          affectedMetrics: ['sleep_score', 'overall_recovery', 'hrv_score'],
        });
      }

      // HRV improvement strategy
      if (avgHRV < 60) {
        strategies.push({
          strategyType: 'stress_management',
          strategyName: 'HRV Breathing Protocol',
          description: 'Daily breathing exercises to improve HRV and reduce stress',
          recommendedFrequency: 'twice_daily',
          priorityLevel: 'high',
          expectedRecoveryBoost: 20,
          affectedMetrics: ['hrv_score', 'stress_score', 'overall_recovery'],
        });
      }

      // Stress management strategy
      if (avgStress < 65) {
        strategies.push({
          strategyType: 'stress_management',
          strategyName: 'Stress Reduction Techniques',
          description: 'Meditation, mindfulness, and relaxation practices',
          recommendedFrequency: 'daily',
          priorityLevel: 'high',
          expectedRecoveryBoost: 18,
          affectedMetrics: ['stress_score', 'hrv_score', 'sleep_score'],
        });
      }

      // Active recovery strategy
      strategies.push({
        strategyType: 'active_recovery',
        strategyName: 'Active Recovery Sessions',
        description: 'Light movement, stretching, and mobility work',
        recommendedFrequency: 'twice_weekly',
        priorityLevel: 'medium',
        expectedRecoveryBoost: 15,
        affectedMetrics: ['soreness_score', 'overall_recovery'],
      });

      // Nutrition strategy
      strategies.push({
        strategyType: 'nutrition',
        strategyName: 'Recovery Nutrition Protocol',
        description: 'Optimize post-workout nutrition and hydration',
        recommendedFrequency: 'daily',
        priorityLevel: 'medium',
        expectedRecoveryBoost: 12,
        affectedMetrics: ['overall_recovery', 'fatigue_score'],
      });

      logger.info('Recovery strategies generated', { userId, count: strategies.length });

      return strategies;
    } catch (error) {
      logger.error('Error generating recovery strategies', { error, userId });
      throw error;
    }
  }

  /**
   * Helper: Get HRV data
   */
  private async getHRVData(userId: string, date: string): Promise<any> {
    const { data, error } = await supabase
      .from('hrv_measurements')
      .select('*')
      .eq('user_id', userId)
      .eq('measurement_date', date)
      .single();

    if (error || !data) {
      return { rmssd: 50, restingHeartRate: 60 }; // Default values
    }

    return data;
  }

  /**
   * Helper: Calculate HRV baseline
   */
  private async calculateHRVBaseline(userId: string, date: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_hrv_baseline', {
        p_user_id: userId,
        p_date: date,
      });

    if (error || !data) return 50; // Default baseline

    return data;
  }

  /**
   * Helper: Calculate HRV score
   */
  private calculateHRVScore(current: number, baseline: number): number {
    if (baseline === 0) return 50;

    const deviation = ((current - baseline) / baseline) * 100;
    
    // Score based on deviation from baseline
    if (deviation >= 10) return 100;
    if (deviation >= 5) return 90;
    if (deviation >= 0) return 80;
    if (deviation >= -5) return 70;
    if (deviation >= -10) return 60;
    if (deviation >= -15) return 50;
    if (deviation >= -20) return 40;
    return 30;
  }

  /**
   * Helper: Determine HRV trend
   */
  private async determineHRVTrend(userId: string, date: string): Promise<'improving' | 'stable' | 'declining'> {
    // Get last 7 days of HRV data
    const { data } = await supabase
      .from('hrv_measurements')
      .select('rmssd')
      .eq('user_id', userId)
      .lte('measurement_date', date)
      .order('measurement_date', { ascending: false })
      .limit(7);

    if (!data || data.length < 3) return 'stable';

    const recent = data.slice(0, 3).reduce((sum, d) => sum + d.rmssd, 0) / 3;
    const older = data.slice(3).reduce((sum, d) => sum + d.rmssd, 0) / (data.length - 3);

    const change = ((recent - older) / older) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  /**
   * Helper: Get sleep data
   */
  private async getSleepData(userId: string, date: string): Promise<any> {
    const { data } = await supabase
      .from('sleep_number_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_date', date)
      .single();

    return data || { total_sleep_time_minutes: 420, sleep_iq_score: 75 };
  }

  /**
   * Helper: Calculate sleep score
   */
  private calculateSleepScore(sleepData: any): number {
    const duration = sleepData.total_sleep_time_minutes || 420;
    const quality = sleepData.sleep_iq_score || 75;

    // Optimal sleep: 7-9 hours (420-540 minutes)
    let durationScore = 100;
    if (duration < 360) durationScore = (duration / 360) * 70; // < 6 hours
    else if (duration < 420) durationScore = 70 + ((duration - 360) / 60) * 15; // 6-7 hours
    else if (duration <= 540) durationScore = 100; // 7-9 hours
    else durationScore = 100 - ((duration - 540) / 60) * 10; // > 9 hours

    return Math.round((durationScore * 0.5) + (quality * 0.5));
  }

  /**
   * Helper: Get subjective metrics
   */
  private async getSubjectiveMetrics(userId: string, date: string): Promise<any> {
    // This would come from user input
    return {
      muscleSoreness: 5,
      stressLevel: 5,
      energyLevel: 7,
    };
  }

  /**
   * Helper: Calculate soreness score
   */
  private calculateSorenessScore(soreness: number): number {
    return Math.round((10 - soreness) * 10);
  }

  /**
   * Helper: Calculate stress score
   */
  private calculateStressScore(stress: number): number {
    return Math.round((10 - stress) * 10);
  }

  /**
   * Helper: Calculate fatigue score
   */
  private calculateFatigueScore(energy: number): number {
    return Math.round(energy * 10);
  }

  /**
   * Helper: Calculate ACWR
   */
  private async calculateACWR(userId: string, date: string): Promise<number> {
    const { data } = await supabase
      .rpc('calculate_acwr', {
        p_user_id: userId,
        p_date: date,
      });

    return data || 1.0;
  }

  /**
   * Helper: Calculate training monotony
   */
  private async calculateTrainingMonotony(userId: string, date: string): Promise<number> {
    // Simplified calculation
    return 1.5;
  }

  /**
   * Helper: Determine recovery status
   */
  private determineRecoveryStatus(score: number): 'excellent' | 'good' | 'moderate' | 'poor' | 'critical' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'moderate';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  /**
   * Helper: Calculate workout readiness score
   */
  private calculateWorkoutReadinessScore(
    recoveryScore: number,
    hrvScore: number,
    sleepScore: number,
    acwr: number
  ): number {
    let readiness = recoveryScore;

    // Adjust for ACWR
    if (acwr > 1.5) readiness -= 20;
    else if (acwr > 1.3) readiness -= 10;
    else if (acwr < 0.8) readiness -= 5;

    // Bonus for excellent HRV and sleep
    if (hrvScore >= 90 && sleepScore >= 90) readiness += 5;

    return Math.max(0, Math.min(100, Math.round(readiness)));
  }

  /**
   * Helper: Determine recommended intensity
   */
  private determineRecommendedIntensity(readiness: number, acwr: number): 'high' | 'moderate' | 'low' | 'rest' {
    if (acwr > 1.5 || readiness < 40) return 'rest';
    if (readiness >= 80 && acwr < 1.2) return 'high';
    if (readiness >= 60) return 'moderate';
    return 'low';
  }

  /**
   * Helper: Generate recovery summary
   */
  private generateRecoverySummary(
    score: number,
    hrvDeviation: number,
    sleepScore: number,
    acwr: number
  ): string {
    const status = this.determineRecoveryStatus(score);
    let summary = `Recovery is ${status} (${score}/100). `;

    if (hrvDeviation > 10) summary += 'HRV is elevated. ';
    else if (hrvDeviation < -10) summary += 'HRV is suppressed. ';

    if (sleepScore < 60) summary += 'Sleep quality needs improvement. ';
    if (acwr > 1.3) summary += 'Training load is high. ';

    return summary.trim();
  }

  /**
   * Helper: Identify key factors
   */
  private identifyKeyFactors(
    hrvScore: number,
    sleepScore: number,
    sorenessScore: number,
    stressScore: number,
    fatigueScore: number,
    acwr: number
  ): string[] {
    const factors: string[] = [];

    if (hrvScore < 60) factors.push('Low HRV');
    if (sleepScore < 60) factors.push('Poor sleep');
    if (sorenessScore < 60) factors.push('High muscle soreness');
    if (stressScore < 60) factors.push('Elevated stress');
    if (fatigueScore < 60) factors.push('High fatigue');
    if (acwr > 1.3) factors.push('High training load');

    return factors.length > 0 ? factors : ['All metrics normal'];
  }

  /**
   * Helper: Determine workout recommendations
   */
  private determineWorkoutRecommendations(
    readinessLevel: string,
    acwr: number,
    sorenessScore: number
  ): { workoutType: string; intensityPercent: number; volumePercent: number } {
    if (readinessLevel === 'peak') {
      return { workoutType: 'strength', intensityPercent: 100, volumePercent: 100 };
    } else if (readinessLevel === 'high') {
      return { workoutType: 'strength', intensityPercent: 90, volumePercent: 90 };
    } else if (readinessLevel === 'moderate') {
      return { workoutType: 'moderate_intensity', intensityPercent: 75, volumePercent: 75 };
    } else if (readinessLevel === 'low') {
      return { workoutType: 'active_recovery', intensityPercent: 50, volumePercent: 50 };
    } else {
      return { workoutType: 'rest', intensityPercent: 0, volumePercent: 0 };
    }
  }

  /**
   * Helper: Assess injury risk
   */
  private assessInjuryRisk(
    acwr: number,
    sorenessScore: number,
    hrvDeviation: number
  ): 'low' | 'moderate' | 'high' | 'very_high' {
    let riskScore = 0;

    if (acwr > 1.5) riskScore += 3;
    else if (acwr > 1.3) riskScore += 2;
    else if (acwr > 1.2) riskScore += 1;

    if (sorenessScore < 40) riskScore += 2;
    else if (sorenessScore < 60) riskScore += 1;

    if (hrvDeviation < -15) riskScore += 2;
    else if (hrvDeviation < -10) riskScore += 1;

    if (riskScore >= 5) return 'very_high';
    if (riskScore >= 3) return 'high';
    if (riskScore >= 1) return 'moderate';
    return 'low';
  }

  /**
   * Helper: Assess overtraining risk
   */
  private assessOvertrainingRisk(
    acwr: number,
    hrvTrend: string,
    sleepScore: number
  ): 'low' | 'moderate' | 'high' {
    let riskScore = 0;

    if (acwr > 1.5) riskScore += 2;
    else if (acwr > 1.3) riskScore += 1;

    if (hrvTrend === 'declining') riskScore += 2;
    if (sleepScore < 60) riskScore += 1;

    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'moderate';
    return 'low';
  }

  /**
   * Helper: Generate workout guidance
   */
  private generateWorkoutGuidance(
    readinessLevel: string,
    injuryRisk: string,
    deloadRecommended: boolean
  ): string {
    if (deloadRecommended) {
      return 'Deload week recommended. Focus on recovery and reduced training volume.';
    }

    if (readinessLevel === 'peak') {
      return 'Excellent readiness! This is a great day for high-intensity training or testing maxes.';
    } else if (readinessLevel === 'high') {
      return 'Good readiness. Proceed with planned training at normal intensity.';
    } else if (readinessLevel === 'moderate') {
      return 'Moderate readiness. Consider reducing intensity or volume slightly.';
    } else if (readinessLevel === 'low') {
      return 'Low readiness. Focus on active recovery or light training.';
    } else {
      return 'Rest needed. Take a full rest day or very light active recovery only.';
    }
  }

  /**
   * Helper: Generate workout modifications
   */
  private generateWorkoutModifications(
    readinessLevel: string,
    sorenessScore: number,
    injuryRisk: string
  ): string[] {
    const modifications: string[] = [];

    if (readinessLevel === 'low' || readinessLevel === 'rest_needed') {
      modifications.push('Reduce training volume by 30-50%');
      modifications.push('Lower intensity to 60-70% of max');
      modifications.push('Focus on technique and form');
    }

    if (sorenessScore < 60) {
      modifications.push('Extra warm-up and mobility work');
      modifications.push('Avoid exercises that aggravate sore areas');
    }

    if (injuryRisk === 'high' || injuryRisk === 'very_high') {
      modifications.push('Avoid max effort lifts');
      modifications.push('Include extra rest between sets');
      modifications.push('Consider postponing heavy training');
    }

    return modifications.length > 0 ? modifications : ['No modifications needed'];
  }

  /**
   * Helper: Determine deload type
   */
  private determineDeloadType(
    urgency: string,
    recoveryScore: number,
    acwr: number
  ): 'full_rest' | 'active_recovery' | 'reduced_volume' | 'reduced_intensity' {
    if (urgency === 'immediate' && recoveryScore < 40) return 'full_rest';
    if (urgency === 'immediate') return 'active_recovery';
    if (acwr > 1.4) return 'reduced_volume';
    return 'reduced_intensity';
  }

  /**
   * Helper: Generate trigger reasons
   */
  private generateTriggerReasons(
    acwr: number,
    hrvDeviation: number,
    sleepScore: number,
    recoveryScore: number
  ): string[] {
    const reasons: string[] = [];

    if (acwr > 1.5) reasons.push('Very high ACWR (>1.5)');
    else if (acwr > 1.3) reasons.push('Elevated ACWR (>1.3)');

    if (hrvDeviation < -15) reasons.push('Significant HRV decline (>15%)');
    if (sleepScore < 60) reasons.push('Poor sleep quality');
    if (recoveryScore < 50) reasons.push('Low overall recovery score');

    return reasons;
  }

  /**
   * Helper: Determine deload duration
   */
  private determineDeloadDuration(urgency: string, deloadType: string): number {
    if (deloadType === 'full_rest') return 7;
    if (urgency === 'immediate') return 5;
    if (urgency === 'within_week') return 4;
    return 3;
  }

  /**
   * Helper: Generate deload activities
   */
  private generateDeloadActivities(deloadType: string): string[] {
    if (deloadType === 'full_rest') {
      return ['Complete rest', 'Light walking only', 'Focus on sleep and nutrition'];
    } else if (deloadType === 'active_recovery') {
      return ['Light cardio (walking, cycling)', 'Yoga or stretching', 'Mobility work', 'Massage or foam rolling'];
    } else if (deloadType === 'reduced_volume') {
      return ['Reduce sets by 50%', 'Maintain intensity', 'Focus on key lifts only'];
    } else {
      return ['Reduce weight by 30-40%', 'Maintain volume', 'Focus on technique'];
    }
  }

  /**
   * Helper: Determine reductions
   */
  private determineReductions(deloadType: string): { volumeReduction: number; intensityReduction: number } {
    if (deloadType === 'full_rest') return { volumeReduction: 100, intensityReduction: 100 };
    if (deloadType === 'active_recovery') return { volumeReduction: 80, intensityReduction: 70 };
    if (deloadType === 'reduced_volume') return { volumeReduction: 50, intensityReduction: 10 };
    return { volumeReduction: 20, intensityReduction: 40 };
  }

  /**
   * Helper: Calculate expected improvement
   */
  private calculateExpectedImprovement(
    currentScore: number,
    deloadType: string,
    duration: number
  ): number {
    const baseImprovement = 100 - currentScore;
    let improvementPercent = 0.5; // 50% of gap

    if (deloadType === 'full_rest') improvementPercent = 0.7;
    else if (deloadType === 'active_recovery') improvementPercent = 0.6;

    // Longer deloads = more improvement
    improvementPercent += (duration / 7) * 0.1;

    return Math.round(baseImprovement * improvementPercent);
  }

  /**
   * Helper: Calculate start date
   */
  private calculateStartDate(urgency: string): string {
    const today = new Date();
    if (urgency === 'immediate') return today.toISOString().split('T')[0];
    if (urgency === 'within_week') {
      today.setDate(today.getDate() + 3);
      return today.toISOString().split('T')[0];
    }
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  }

  /**
   * Helper: Get recovery score
   */
  private async getRecoveryScore(userId: string, date: string): Promise<any> {
    const { data } = await supabase
      .from('recovery_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('score_date', date)
      .single();

    return data || {
      overall_recovery_score: 50,
      hrv_score: 50,
      sleep_score: 50,
      soreness_score: 50,
      stress_score: 50,
      fatigue_score: 50,
      acwr: 1.0,
      hrv_deviation_percent: 0,
      hrv_trend: 'stable',
      workout_readiness_score: 50,
    };
  }

  /**
   * Helper: Get recent recovery scores
   */
  private async getRecentRecoveryScores(userId: string, days: number): Promise<any[]> {
    const { data } = await supabase
      .from('recovery_scores')
      .select('*')
      .eq('user_id', userId)
      .order('score_date', { ascending: false })
      .limit(days);

    return data || [];
  }

  /**
   * Helper: Save recovery score
   */
  private async saveRecoveryScore(score: RecoveryScore): Promise<void> {
    await supabase.from('recovery_scores').upsert({
      user_id: score.userId,
      score_date: score.scoreDate,
      overall_recovery_score: score.overallRecoveryScore,
      recovery_status: score.recoveryStatus,
      hrv_score: score.hrvScore,
      sleep_score: score.sleepScore,
      soreness_score: score.sorenessScore,
      stress_score: score.stressScore,
      fatigue_score: score.fatigueScore,
      hrv_baseline: score.hrvBaseline,
      hrv_current: score.hrvCurrent,
      hrv_deviation_percent: score.hrvDeviationPercent,
      hrv_trend: score.hrvTrend,
      acwr: score.acwr,
      workout_readiness_score: score.workoutReadinessScore,
      recommended_intensity: score.recommendedIntensity,
      recovery_summary: score.recoverySummary,
      key_factors: score.keyFactors,
    }, {
      onConflict: 'user_id,score_date'
    });
  }

  /**
   * Helper: Save workout readiness
   */
  private async saveWorkoutReadiness(readiness: WorkoutReadiness): Promise<void> {
    await supabase.from('workout_readiness').upsert({
      user_id: readiness.userId,
      readiness_date: readiness.readinessDate,
      readiness_score: readiness.readinessScore,
      readiness_level: readiness.readinessLevel,
      recommended_workout_type: readiness.recommendedWorkoutType,
      recommended_intensity_percent: readiness.recommendedIntensityPercent,
      recommended_volume_percent: readiness.recommendedVolumePercent,
      injury_risk_level: readiness.injuryRiskLevel,
      overtraining_risk: readiness.overtrainingRisk,
      deload_recommended: readiness.deloadRecommended,
      workout_guidance: readiness.workoutGuidance,
      modifications: readiness.modifications,
    }, {
      onConflict: 'user_id,readiness_date'
    });
  }

  /**
   * Helper: Save deload recommendation
   */
  private async saveDeloadRecommendation(recommendation: DeloadRecommendation): Promise<void> {
    await supabase.from('deload_recommendations').insert({
      user_id: recommendation.userId,
      recommendation_date: recommendation.recommendationDate,
      deload_urgency: recommendation.deloadUrgency,
      deload_type: recommendation.deloadType,
      trigger_reasons: recommendation.triggerReasons,
      primary_indicator: recommendation.primaryIndicator,
      recommended_start_date: recommendation.recommendedStartDate,
      recommended_duration_days: recommendation.recommendedDurationDays,
      recommended_activities: recommendation.recommendedActivities,
      volume_reduction_percent: recommendation.volumeReductionPercent,
      intensity_reduction_percent: recommendation.intensityReductionPercent,
      expected_recovery_improvement: recommendation.expectedRecoveryImprovement,
    });
  }

  /**
   * Helper: Check and create deload recommendation
   */
  private async checkAndCreateDeloadRecommendation(userId: string, date: string): Promise<void> {
    const deload = await this.generateDeloadRecommendation(userId, date);
    if (deload) {
      logger.info('Deload recommendation created', { userId, urgency: deload.deloadUrgency });
    }
  }
}

export const recoveryOptimizationEngine = new RecoveryOptimizationEngine();
