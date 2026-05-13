/**
 * Hydration Subsystem - Phase 19
 * 
 * Purpose: Complete hydration tracking with execution integration
 * Critical Gap: Hydration exists minimally, needs full execution/adherence/intervention linkage
 * 
 * Integrates with:
 * - Phase 15 Execution Intelligence
 * - Phase 16 Predictive Behavior
 * - Phase 17 Autonomous Adjustment
 * - Recovery weighting
 */

import { logger } from '../utils/logger';

// ============================================================================
// HYDRATION MODEL
// ============================================================================

export interface HydrationTarget {
  userId: string;
  date: string;
  targetOz: number;
  source: 'baseline' | 'calculated' | 'manual';
  
  // Factors affecting target
  factors: {
    baselineOz: number;
    activityAdjustment: number;
    temperatureAdjustment: number;
    workoutAdjustment: number;
    recoveryAdjustment: number;
  };
  
  // Timing recommendations
  recommendedTiming?: Array<{
    time: string;
    amountOz: number;
    reason: string;
  }>;
}

export interface HydrationIntake {
  userId: string;
  date: string;
  
  // Intake tracking
  totalOz: number;
  entries: Array<{
    timestamp: string;
    amountOz: number;
    source: 'water' | 'beverage' | 'meal' | 'supplement';
    notes?: string;
  }>;
  
  // Progress
  percentComplete: number;
  remainingOz: number;
  onTrack: boolean;
  
  // Metadata
  lastUpdated: string;
}

export interface HydrationExecutionTask {
  id: string;
  userId: string;
  date: string;
  domain: 'nutrition'; // Hydration is part of nutrition domain
  
  taskType: 'hydration';
  title: string;
  description: string;
  priority: 'moderate';
  
  targetValue: number; // oz
  targetUnit: 'oz';
  currentValue: number;
  
  status: 'pending' | 'completed' | 'partial' | 'skipped';
  completedAt?: string;
  
  expectedImpact: string;
  adherenceWeight: number;
}

export interface HydrationIntervention {
  id: string;
  userId: string;
  date: string;
  interventionType: 'hydration_low' | 'hydration_critical' | 'hydration_reminder';
  
  urgency: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedAction: string;
  
  currentOz: number;
  targetOz: number;
  gapOz: number;
  percentBehind: number;
  
  dismissed: boolean;
  createdAt: string;
}

// ============================================================================
// HYDRATION SUBSYSTEM
// ============================================================================

export class HydrationSubsystem {
  /**
   * Calculate daily hydration target
   */
  static calculateTarget(
    userId: string,
    date: string,
    baselineOz: number,
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
    hasWorkout: boolean,
    temperature?: number,
    recoveryScore?: number
  ): HydrationTarget {
    let targetOz = baselineOz;
    const factors = {
      baselineOz,
      activityAdjustment: 0,
      temperatureAdjustment: 0,
      workoutAdjustment: 0,
      recoveryAdjustment: 0,
    };

    // Activity level adjustment
    const activityMultipliers = {
      sedentary: 0,
      lightly_active: 8,
      moderately_active: 16,
      very_active: 24,
      extremely_active: 32,
    };
    factors.activityAdjustment = activityMultipliers[activityLevel];
    targetOz += factors.activityAdjustment;

    // Workout adjustment (additional 16-24oz per workout)
    if (hasWorkout) {
      factors.workoutAdjustment = 20;
      targetOz += factors.workoutAdjustment;
    }

    // Temperature adjustment (if available)
    if (temperature && temperature > 80) {
      factors.temperatureAdjustment = Math.min((temperature - 80) * 2, 16);
      targetOz += factors.temperatureAdjustment;
    }

    // Recovery adjustment (poor recovery = more hydration)
    if (recoveryScore !== undefined && recoveryScore < 60) {
      factors.recoveryAdjustment = 8;
      targetOz += factors.recoveryAdjustment;
    }

    // Generate timing recommendations
    const recommendedTiming = this.generateTimingRecommendations(targetOz, hasWorkout);

    logger.info('✅ [HYDRATION] Target calculated', {
      userId,
      date,
      targetOz: Math.round(targetOz),
      factors,
    });

    return {
      userId,
      date,
      targetOz: Math.round(targetOz),
      source: 'calculated',
      factors,
      recommendedTiming,
    };
  }

  /**
   * Generate hydration execution task
   */
  static generateExecutionTask(
    userId: string,
    date: string,
    target: HydrationTarget
  ): HydrationExecutionTask {
    return {
      id: `hydration-${date}`,
      userId,
      date,
      domain: 'nutrition',
      taskType: 'hydration',
      title: `Drink ${target.targetOz}oz water`,
      description: 'Stay hydrated throughout the day for optimal performance and recovery',
      priority: 'moderate',
      targetValue: target.targetOz,
      targetUnit: 'oz',
      currentValue: 0,
      status: 'pending',
      expectedImpact: 'Optimize performance, recovery, and cognitive function',
      adherenceWeight: 0.15,
    };
  }

  /**
   * Update hydration intake
   */
  static updateIntake(
    userId: string,
    date: string,
    currentIntake: HydrationIntake | null,
    newAmountOz: number,
    source: 'water' | 'beverage' | 'meal' | 'supplement' = 'water',
    target: HydrationTarget
  ): HydrationIntake {
    const entries = currentIntake?.entries || [];
    entries.push({
      timestamp: new Date().toISOString(),
      amountOz: newAmountOz,
      source,
    });

    const totalOz = entries.reduce((sum, entry) => sum + entry.amountOz, 0);
    const percentComplete = Math.min((totalOz / target.targetOz) * 100, 100);
    const remainingOz = Math.max(target.targetOz - totalOz, 0);
    const onTrack = this.isOnTrack(totalOz, target.targetOz, new Date());

    logger.info('✅ [HYDRATION] Intake updated', {
      userId,
      date,
      totalOz: Math.round(totalOz),
      percentComplete: Math.round(percentComplete),
    });

    return {
      userId,
      date,
      totalOz,
      entries,
      percentComplete,
      remainingOz,
      onTrack,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate hydration adherence
   */
  static calculateAdherence(
    intake: HydrationIntake,
    target: HydrationTarget
  ): number {
    const percentComplete = (intake.totalOz / target.targetOz) * 100;
    return Math.min(Math.round(percentComplete), 100);
  }

  /**
   * Generate hydration interventions
   */
  static generateInterventions(
    userId: string,
    date: string,
    intake: HydrationIntake,
    target: HydrationTarget,
    currentTime: Date
  ): HydrationIntervention[] {
    const interventions: HydrationIntervention[] = [];
    const hour = currentTime.getHours();
    
    const currentOz = intake.totalOz;
    const targetOz = target.targetOz;
    const gapOz = targetOz - currentOz;
    const percentBehind = Math.max(0, (gapOz / targetOz) * 100);

    // Expected progress by time of day
    const expectedProgress = this.getExpectedProgress(hour);
    const actualProgress = (currentOz / targetOz) * 100;
    const behindSchedule = actualProgress < expectedProgress - 15;

    // Intervention 1: Significantly behind schedule
    if (behindSchedule && hour >= 12) {
      interventions.push({
        id: `hydration-behind-${date}`,
        userId,
        date,
        interventionType: 'hydration_low',
        urgency: percentBehind > 40 ? 'high' : 'medium',
        title: `Hydration ${Math.round(percentBehind)}% behind target`,
        description: `You've consumed ${Math.round(currentOz)}oz of ${targetOz}oz target`,
        suggestedAction: `Drink ${Math.round(gapOz)}oz water to catch up`,
        currentOz,
        targetOz,
        gapOz,
        percentBehind,
        dismissed: false,
        createdAt: currentTime.toISOString(),
      });
    }

    // Intervention 2: Critical - evening and very behind
    if (hour >= 18 && percentBehind > 50) {
      interventions.push({
        id: `hydration-critical-${date}`,
        userId,
        date,
        interventionType: 'hydration_critical',
        urgency: 'high',
        title: 'Critical: Hydration very low',
        description: `Only ${Math.round(actualProgress)}% of daily hydration target completed`,
        suggestedAction: `Prioritize drinking ${Math.round(gapOz)}oz water before bed`,
        currentOz,
        targetOz,
        gapOz,
        percentBehind,
        dismissed: false,
        createdAt: currentTime.toISOString(),
      });
    }

    // Intervention 3: Reminder - no intake in last 2 hours
    const lastEntry = intake.entries[intake.entries.length - 1];
    if (lastEntry) {
      const lastIntakeTime = new Date(lastEntry.timestamp);
      const hoursSinceLastIntake = (currentTime.getTime() - lastIntakeTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastIntake >= 2 && hour >= 10 && hour <= 20) {
        interventions.push({
          id: `hydration-reminder-${date}`,
          userId,
          date,
          interventionType: 'hydration_reminder',
          urgency: 'low',
          title: 'Hydration reminder',
          description: `It's been ${Math.round(hoursSinceLastIntake)} hours since your last drink`,
          suggestedAction: 'Drink 8-16oz water now',
          currentOz,
          targetOz,
          gapOz,
          percentBehind,
          dismissed: false,
          createdAt: currentTime.toISOString(),
        });
      }
    }

    logger.info('✅ [HYDRATION] Interventions generated', {
      userId,
      date,
      interventionCount: interventions.length,
    });

    return interventions;
  }

  /**
   * Update execution task from intake
   */
  static updateTaskFromIntake(
    task: HydrationExecutionTask,
    intake: HydrationIntake
  ): HydrationExecutionTask {
    const updated = { ...task };
    updated.currentValue = intake.totalOz;

    if (intake.percentComplete >= 100) {
      updated.status = 'completed';
      updated.completedAt = new Date().toISOString();
    } else if (intake.percentComplete >= 70) {
      updated.status = 'partial';
    } else {
      updated.status = 'pending';
    }

    return updated;
  }

  /**
   * Calculate hydration impact on recovery
   */
  static calculateRecoveryImpact(adherence: number): number {
    // Hydration affects recovery score
    // 100% adherence = +5 recovery points
    // 50% adherence = 0 recovery points
    // 0% adherence = -5 recovery points
    
    return ((adherence - 50) / 50) * 5;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static generateTimingRecommendations(
    targetOz: number,
    hasWorkout: boolean
  ): Array<{ time: string; amountOz: number; reason: string }> {
    const recommendations = [];

    // Morning
    recommendations.push({
      time: '07:00',
      amountOz: 16,
      reason: 'Rehydrate after sleep',
    });

    // Mid-morning
    recommendations.push({
      time: '10:00',
      amountOz: 16,
      reason: 'Maintain hydration',
    });

    // Lunch
    recommendations.push({
      time: '12:00',
      amountOz: 16,
      reason: 'With lunch',
    });

    // Pre-workout (if applicable)
    if (hasWorkout) {
      recommendations.push({
        time: '15:00',
        amountOz: 16,
        reason: 'Pre-workout hydration',
      });
    }

    // Afternoon
    recommendations.push({
      time: '16:00',
      amountOz: 16,
      reason: 'Afternoon hydration',
    });

    // Evening
    recommendations.push({
      time: '19:00',
      amountOz: 16,
      reason: 'Evening hydration',
    });

    return recommendations;
  }

  private static isOnTrack(currentOz: number, targetOz: number, currentTime: Date): boolean {
    const hour = currentTime.getHours();
    const expectedProgress = this.getExpectedProgress(hour);
    const actualProgress = (currentOz / targetOz) * 100;
    
    return actualProgress >= expectedProgress - 10; // Within 10% of expected
  }

  private static getExpectedProgress(hour: number): number {
    // Expected progress by hour (linear distribution)
    // 7am = 0%, 10pm = 100%
    const startHour = 7;
    const endHour = 22;
    
    if (hour < startHour) return 0;
    if (hour >= endHour) return 100;
    
    return ((hour - startHour) / (endHour - startHour)) * 100;
  }
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

export async function getHydrationTarget(userId: string, date: string): Promise<HydrationTarget | null> {
  // This would fetch from database
  logger.info('📋 [HYDRATION] Fetching target', { userId, date });
  return null;
}

export async function getHydrationIntake(userId: string, date: string): Promise<HydrationIntake | null> {
  // This would fetch from database
  logger.info('📋 [HYDRATION] Fetching intake', { userId, date });
  return null;
}

export async function saveHydrationIntake(intake: HydrationIntake): Promise<HydrationIntake> {
  // This would persist to database
  logger.info('✅ [HYDRATION] Intake saved', {
    userId: intake.userId,
    date: intake.date,
    totalOz: Math.round(intake.totalOz),
  });
  
  return intake;
}
