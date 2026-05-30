import { logger } from '../utils/logger';
import { getDeviceContext } from './deviceContextService';
import type { DeviceContext } from '../types/deviceIntelligence';

/**
 * Device Intelligence Integration Service - Phase 12
 * 
 * Provides device intelligence signals for all engines and intelligence layers
 * Enables real-time autonomous intelligence using device data
 */

export interface DeviceRecoverySignals {
  sleepDurationHours?: number;
  sleepQuality?: number; // 1-5 scale
  sleepScore?: number; // 0-100
  sleepDebt?: number; // minutes
  hrv?: number;
  restingHR?: number;
  readinessScore?: number;
  recoveryStatus?: 'recovered' | 'recovering' | 'strained';
  hasDeviceData: boolean;
  dataQuality: 'high' | 'medium' | 'low' | 'none';
  sources: string[];
}

export interface DeviceWorkoutSignals {
  recoveryScore?: number;
  readinessScore?: number;
  hrv?: number;
  sleepQuality?: number;
  activityFatigue?: number; // 0-100, higher = more fatigued
  recentWorkoutCount?: number;
  recommendedIntensity?: 'high' | 'moderate' | 'low' | 'recovery';
  hasDeviceData: boolean;
  dataQuality: 'high' | 'medium' | 'low' | 'none';
  sources: string[];
}

export interface DeviceCardiovascularSignals {
  restingHRTrend?: 'increasing' | 'stable' | 'decreasing';
  hrvTrend?: 'increasing' | 'stable' | 'decreasing';
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    trend?: 'increasing' | 'stable' | 'decreasing';
  };
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  cardiovascularStress?: 'low' | 'moderate' | 'high';
  fatigueRisk?: 'low' | 'moderate' | 'high';
  hasDeviceData: boolean;
  dataQuality: 'high' | 'medium' | 'low' | 'none';
  sources: string[];
}

export interface DeviceMetabolicSignals {
  sleepQuality?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  steps?: number;
  activeCalories?: number;
  recoveryStatus?: 'recovered' | 'recovering' | 'strained';
  metabolicRisk?: 'low' | 'moderate' | 'high';
  hasDeviceData: boolean;
  dataQuality: 'high' | 'medium' | 'low' | 'none';
  sources: string[];
}

export interface DeviceFusionSignals {
  poorSleepWithDecliningHRV?: boolean;
  highHRVWithStrongActivity?: boolean;
  highBPWithLowActivity?: boolean;
  lowSleepWithHeavyTraining?: boolean;
  recoveryAlert?: boolean;
  performanceOpportunity?: boolean;
  cardiovascularRisk?: boolean;
  overtrainingDetection?: boolean;
  signals: string[];
  hasDeviceData: boolean;
}

export interface DevicePredictiveSignals {
  poorSleepTrend?: boolean;
  lowActivityTrend?: boolean;
  hrvDeclineTrend?: boolean;
  bpIncreaseTrend?: boolean;
  predictedFatigue?: 'low' | 'moderate' | 'high';
  predictedMetabolicSlowdown?: boolean;
  predictedRecoveryDecline?: boolean;
  predictedCardiovascularRisk?: 'low' | 'moderate' | 'high';
  hasDeviceData: boolean;
  dataQuality: 'high' | 'medium' | 'low' | 'none';
}

export interface DeviceOptimizationTriggers {
  poorSleepTrigger?: boolean;
  lowStepsTrigger?: boolean;
  lowHRVTrigger?: boolean;
  highBPTrigger?: boolean;
  fatigueTrigger?: boolean;
  recoveryOptimizationNeeded?: boolean;
  movementOptimizationNeeded?: boolean;
  stressOptimizationNeeded?: boolean;
  cardiovascularOptimizationNeeded?: boolean;
  workoutAdjustmentNeeded?: boolean;
  triggers: string[];
  hasDeviceData: boolean;
}

export class DeviceIntelligenceIntegrationService {
  
  /**
   * Get device recovery signals for Recovery Engine
   */
  async getDeviceRecoverySignals(userId: string): Promise<DeviceRecoverySignals> {
    try {
      const deviceContext = await getDeviceContext(userId);
      
      if (!deviceContext.flags.hasSleepData && !deviceContext.flags.hasCardiovascularData && !deviceContext.flags.hasRecoveryData) {
        return this.getEmptyRecoverySignals();
      }
      
      const signals: DeviceRecoverySignals = {
        hasDeviceData: true,
        dataQuality: deviceContext.dataQuality === 'incomplete' ? 'none' : deviceContext.dataQuality,
        sources: deviceContext.sourceSummary.activeSources,
      };
      
      // Sleep signals
      if (deviceContext.sleep) {
        signals.sleepDurationHours = deviceContext.sleep.lastNightDuration ? deviceContext.sleep.lastNightDuration / 60 : undefined;
        signals.sleepScore = deviceContext.sleep.lastNightScore;
        signals.sleepDebt = deviceContext.sleep.sleepDebt;
        
        // Map sleep quality to 1-5 scale
        if (deviceContext.sleep.lastNightQuality) {
          const qualityMap = { excellent: 5, good: 4, fair: 3, poor: 2 };
          signals.sleepQuality = qualityMap[deviceContext.sleep.lastNightQuality] || 3;
        }
      }
      
      // Cardiovascular signals
      if (deviceContext.cardiovascular) {
        signals.hrv = deviceContext.cardiovascular.hrv;
        signals.restingHR = deviceContext.cardiovascular.restingHR;
      }
      
      // Recovery signals
      if (deviceContext.recovery) {
        signals.readinessScore = deviceContext.recovery.readinessScore;
        signals.recoveryStatus = deviceContext.recovery.recoveryStatus;
      }
      
      logger.info('[DeviceIntelligence] Recovery signals generated', {
        userId,
        hasData: signals.hasDeviceData,
        dataQuality: signals.dataQuality,
        sources: signals.sources.length,
      });
      
      return signals;
    } catch (error) {
      logger.warn('[DeviceIntelligence] Failed to get recovery signals', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.getEmptyRecoverySignals();
    }
  }
  
  /**
   * Get device workout signals for Workout Engine
   */
  async getDeviceWorkoutSignals(userId: string): Promise<DeviceWorkoutSignals> {
    try {
      const deviceContext = await getDeviceContext(userId);
      
      if (!deviceContext.flags.hasRecoveryData && !deviceContext.flags.hasCardiovascularData) {
        return this.getEmptyWorkoutSignals();
      }
      
      const signals: DeviceWorkoutSignals = {
        hasDeviceData: true,
        dataQuality: deviceContext.dataQuality === 'incomplete' ? 'none' : deviceContext.dataQuality,
        sources: deviceContext.sourceSummary.activeSources,
      };
      
      // Recovery-based signals
      if (deviceContext.recovery) {
        signals.recoveryScore = deviceContext.recovery.readinessScore;
        signals.readinessScore = deviceContext.recovery.readinessScore;
        
        // Determine recommended intensity
        if (deviceContext.recovery.readinessScore) {
          const readiness = deviceContext.recovery.readinessScore;
          if (readiness >= 85) signals.recommendedIntensity = 'high';
          else if (readiness >= 70) signals.recommendedIntensity = 'moderate';
          else if (readiness >= 55) signals.recommendedIntensity = 'low';
          else signals.recommendedIntensity = 'recovery';
        }
      }
      
      // Cardiovascular signals
      if (deviceContext.cardiovascular) {
        signals.hrv = deviceContext.cardiovascular.hrv;
      }
      
      // Sleep quality
      if (deviceContext.sleep?.lastNightQuality) {
        const qualityMap = { excellent: 5, good: 4, fair: 3, poor: 2 };
        signals.sleepQuality = qualityMap[deviceContext.sleep.lastNightQuality] || 3;
      }
      
      // Activity fatigue (based on recent activity)
      if (deviceContext.activity) {
        // Calculate fatigue based on activity level
        const activityLevel = deviceContext.activity.activityLevel;
        if (activityLevel === 'very_active') signals.activityFatigue = 80;
        else if (activityLevel === 'active') signals.activityFatigue = 60;
        else if (activityLevel === 'moderate') signals.activityFatigue = 40;
        else if (activityLevel === 'light') signals.activityFatigue = 20;
        else signals.activityFatigue = 10;
      }
      
      // Recent workout count
      if (deviceContext.workouts) {
        signals.recentWorkoutCount = deviceContext.workouts.todayWorkoutCount;
      }
      
      logger.info('[DeviceIntelligence] Workout signals generated', {
        userId,
        recommendedIntensity: signals.recommendedIntensity,
        recoveryScore: signals.recoveryScore,
      });
      
      return signals;
    } catch (error) {
      logger.warn('[DeviceIntelligence] Failed to get workout signals', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.getEmptyWorkoutSignals();
    }
  }
  
  /**
   * Get device cardiovascular signals
   */
  async getDeviceCardiovascularSignals(userId: string): Promise<DeviceCardiovascularSignals> {
    try {
      const deviceContext = await getDeviceContext(userId);
      
      if (!deviceContext.flags.hasCardiovascularData) {
        return this.getEmptyCardiovascularSignals();
      }
      
      const signals: DeviceCardiovascularSignals = {
        hasDeviceData: true,
        dataQuality: deviceContext.dataQuality === 'incomplete' ? 'none' : deviceContext.dataQuality,
        sources: deviceContext.sourceSummary.activeSources,
      };
      
      // Resting HR trend (would need historical data for true trend)
      if (deviceContext.cardiovascular?.restingHR) {
        signals.restingHRTrend = 'stable'; // Placeholder - would calculate from trends
      }
      
      // HRV trend
      if (deviceContext.cardiovascular?.hrv) {
        signals.hrvTrend = 'stable'; // Placeholder - would calculate from trends
      }
      
      // Blood pressure
      if (deviceContext.cardiovascular?.recentBP) {
        signals.bloodPressure = {
          systolic: deviceContext.cardiovascular.recentBP.systolic!,
          diastolic: deviceContext.cardiovascular.recentBP.diastolic!,
          trend: 'stable', // Placeholder
        };
      }
      
      // Activity level
      if (deviceContext.activity) {
        signals.activityLevel = deviceContext.activity.activityLevel;
      }
      
      // Cardiovascular stress assessment
      const restingHR = deviceContext.cardiovascular?.restingHR;
      const hrv = deviceContext.cardiovascular?.hrv;
      
      if (restingHR && restingHR > 75) {
        signals.cardiovascularStress = 'high';
        signals.fatigueRisk = 'high';
      } else if (hrv && hrv < 30) {
        signals.cardiovascularStress = 'moderate';
        signals.fatigueRisk = 'moderate';
      } else {
        signals.cardiovascularStress = 'low';
        signals.fatigueRisk = 'low';
      }
      
      logger.info('[DeviceIntelligence] Cardiovascular signals generated', {
        userId,
        cardiovascularStress: signals.cardiovascularStress,
        fatigueRisk: signals.fatigueRisk,
      });
      
      return signals;
    } catch (error) {
      logger.warn('[DeviceIntelligence] Failed to get cardiovascular signals', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.getEmptyCardiovascularSignals();
    }
  }
  
  /**
   * Get device metabolic signals
   */
  async getDeviceMetabolicSignals(userId: string): Promise<DeviceMetabolicSignals> {
    try {
      const deviceContext = await getDeviceContext(userId);
      
      if (!deviceContext.flags.hasSleepData && !deviceContext.flags.hasActivityData) {
        return this.getEmptyMetabolicSignals();
      }
      
      const signals: DeviceMetabolicSignals = {
        hasDeviceData: true,
        dataQuality: deviceContext.dataQuality === 'incomplete' ? 'none' : deviceContext.dataQuality,
        sources: deviceContext.sourceSummary.activeSources,
      };
      
      // Sleep quality
      if (deviceContext.sleep?.lastNightQuality) {
        const qualityMap = { excellent: 5, good: 4, fair: 3, poor: 2 };
        signals.sleepQuality = qualityMap[deviceContext.sleep.lastNightQuality] || 3;
      }
      
      // Activity level
      if (deviceContext.activity) {
        signals.activityLevel = deviceContext.activity.activityLevel;
        signals.steps = deviceContext.activity.todaySteps;
        signals.activeCalories = deviceContext.activity.todayCalories;
      }
      
      // Recovery status
      if (deviceContext.recovery) {
        signals.recoveryStatus = deviceContext.recovery.recoveryStatus;
      }
      
      // Metabolic risk assessment
      const poorSleep = signals.sleepQuality && signals.sleepQuality <= 2;
      const lowActivity = signals.activityLevel === 'sedentary' || signals.activityLevel === 'light';
      
      if (poorSleep && lowActivity) {
        signals.metabolicRisk = 'high';
      } else if (poorSleep || lowActivity) {
        signals.metabolicRisk = 'moderate';
      } else {
        signals.metabolicRisk = 'low';
      }
      
      logger.info('[DeviceIntelligence] Metabolic signals generated', {
        userId,
        metabolicRisk: signals.metabolicRisk,
        activityLevel: signals.activityLevel,
      });
      
      return signals;
    } catch (error) {
      logger.warn('[DeviceIntelligence] Failed to get metabolic signals', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.getEmptyMetabolicSignals();
    }
  }
  
  /**
   * Get device fusion signals for Cross-Engine Fusion
   */
  async getDeviceFusionSignals(userId: string): Promise<DeviceFusionSignals> {
    try {
      const deviceContext = await getDeviceContext(userId);
      
      if (deviceContext.completenessScore < 20) {
        return {
          signals: [],
          hasDeviceData: false,
        };
      }
      
      const signals: DeviceFusionSignals = {
        signals: [],
        hasDeviceData: true,
      };
      
      const sleep = deviceContext.sleep;
      const recovery = deviceContext.recovery;
      const activity = deviceContext.activity;
      const cardiovascular = deviceContext.cardiovascular;
      
      // Poor sleep + declining HRV → recovery alert
      if (sleep?.lastNightQuality === 'poor' && recovery?.hrvStatus === 'low') {
        signals.poorSleepWithDecliningHRV = true;
        signals.recoveryAlert = true;
        signals.signals.push('poor_sleep_low_hrv');
      }
      
      // High HRV + strong activity → performance opportunity
      if (recovery?.hrvStatus === 'high' && activity?.activityLevel === 'active') {
        signals.highHRVWithStrongActivity = true;
        signals.performanceOpportunity = true;
        signals.signals.push('high_hrv_strong_activity');
      }
      
      // High BP + low activity → cardiovascular risk
      if (cardiovascular?.recentBP?.systolic && cardiovascular.recentBP.systolic > 140 && activity?.activityLevel === 'sedentary') {
        signals.highBPWithLowActivity = true;
        signals.cardiovascularRisk = true;
        signals.signals.push('high_bp_low_activity');
      }
      
      // Low sleep + heavy training → overtraining detection
      if (sleep?.sleepDebt && sleep.sleepDebt > 120 && activity?.activityLevel === 'very_active') {
        signals.lowSleepWithHeavyTraining = true;
        signals.overtrainingDetection = true;
        signals.signals.push('low_sleep_heavy_training');
      }
      
      logger.info('[DeviceIntelligence] Fusion signals generated', {
        userId,
        signalCount: signals.signals.length,
        signals: signals.signals,
      });
      
      return signals;
    } catch (error) {
      logger.warn('[DeviceIntelligence] Failed to get fusion signals', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        signals: [],
        hasDeviceData: false,
      };
    }
  }
  
  /**
   * Get device predictive signals
   */
  async getDevicePredictiveSignals(userId: string): Promise<DevicePredictiveSignals> {
    try {
      const deviceContext = await getDeviceContext(userId);
      
      if (deviceContext.completenessScore < 20) {
        return this.getEmptyPredictiveSignals();
      }
      
      const signals: DevicePredictiveSignals = {
        hasDeviceData: true,
        dataQuality: deviceContext.dataQuality === 'incomplete' ? 'none' : deviceContext.dataQuality,
      };
      
      // Poor sleep trend (would need historical data for true trend)
      if (deviceContext.sleep?.lastNightQuality === 'poor') {
        signals.poorSleepTrend = true;
        signals.predictedFatigue = 'high';
      }
      
      // Low activity trend
      if (deviceContext.activity?.activityLevel === 'sedentary') {
        signals.lowActivityTrend = true;
        signals.predictedMetabolicSlowdown = true;
      }
      
      // HRV decline trend
      if (deviceContext.recovery?.hrvStatus === 'low') {
        signals.hrvDeclineTrend = true;
        signals.predictedRecoveryDecline = true;
      }
      
      // BP increase trend
      if (deviceContext.cardiovascular?.recentBP?.systolic && deviceContext.cardiovascular.recentBP.systolic > 140) {
        signals.bpIncreaseTrend = true;
        signals.predictedCardiovascularRisk = 'high';
      }
      
      logger.info('[DeviceIntelligence] Predictive signals generated', {
        userId,
        predictedFatigue: signals.predictedFatigue,
        predictedCardiovascularRisk: signals.predictedCardiovascularRisk,
      });
      
      return signals;
    } catch (error) {
      logger.warn('[DeviceIntelligence] Failed to get predictive signals', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.getEmptyPredictiveSignals();
    }
  }
  
  /**
   * Get device optimization triggers
   */
  async getDeviceOptimizationTriggers(userId: string): Promise<DeviceOptimizationTriggers> {
    try {
      const deviceContext = await getDeviceContext(userId);
      
      if (deviceContext.completenessScore < 20) {
        return {
          triggers: [],
          hasDeviceData: false,
        };
      }
      
      const triggers: DeviceOptimizationTriggers = {
        triggers: [],
        hasDeviceData: true,
      };
      
      // Poor sleep trigger
      if (deviceContext.sleep?.lastNightQuality === 'poor' || (deviceContext.sleep?.sleepDebt && deviceContext.sleep.sleepDebt > 120)) {
        triggers.poorSleepTrigger = true;
        triggers.recoveryOptimizationNeeded = true;
        triggers.triggers.push('poor_sleep');
      }
      
      // Low steps trigger
      if (deviceContext.activity?.todaySteps && deviceContext.activity.todaySteps < 5000) {
        triggers.lowStepsTrigger = true;
        triggers.movementOptimizationNeeded = true;
        triggers.triggers.push('low_steps');
      }
      
      // Low HRV trigger
      if (deviceContext.recovery?.hrvStatus === 'low') {
        triggers.lowHRVTrigger = true;
        triggers.stressOptimizationNeeded = true;
        triggers.triggers.push('low_hrv');
      }
      
      // High BP trigger
      if (deviceContext.cardiovascular?.recentBP?.systolic && deviceContext.cardiovascular.recentBP.systolic > 140) {
        triggers.highBPTrigger = true;
        triggers.cardiovascularOptimizationNeeded = true;
        triggers.triggers.push('high_bp');
      }
      
      // Fatigue trigger
      if (deviceContext.recovery?.recoveryStatus === 'strained') {
        triggers.fatigueTrigger = true;
        triggers.workoutAdjustmentNeeded = true;
        triggers.triggers.push('fatigue');
      }
      
      logger.info('[DeviceIntelligence] Optimization triggers generated', {
        userId,
        triggerCount: triggers.triggers.length,
        triggers: triggers.triggers,
      });
      
      return triggers;
    } catch (error) {
      logger.warn('[DeviceIntelligence] Failed to get optimization triggers', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        triggers: [],
        hasDeviceData: false,
      };
    }
  }
  
  /**
   * Get complete device context (convenience method)
   */
  async getCompleteDeviceContext(userId: string): Promise<DeviceContext> {
    return getDeviceContext(userId);
  }
  
  // Empty signal generators for fallback
  
  private getEmptyRecoverySignals(): DeviceRecoverySignals {
    return {
      hasDeviceData: false,
      dataQuality: 'none',
      sources: [],
    };
  }
  
  private getEmptyWorkoutSignals(): DeviceWorkoutSignals {
    return {
      hasDeviceData: false,
      dataQuality: 'none',
      sources: [],
    };
  }
  
  private getEmptyCardiovascularSignals(): DeviceCardiovascularSignals {
    return {
      hasDeviceData: false,
      dataQuality: 'none',
      sources: [],
    };
  }
  
  private getEmptyMetabolicSignals(): DeviceMetabolicSignals {
    return {
      hasDeviceData: false,
      dataQuality: 'none',
      sources: [],
    };
  }
  
  private getEmptyPredictiveSignals(): DevicePredictiveSignals {
    return {
      hasDeviceData: false,
      dataQuality: 'none',
    };
  }
}

export const deviceIntelligenceIntegrationService = new DeviceIntelligenceIntegrationService();

// Convenience exports
export const getDeviceRecoverySignals = (userId: string) => 
  deviceIntelligenceIntegrationService.getDeviceRecoverySignals(userId);

export const getDeviceWorkoutSignals = (userId: string) => 
  deviceIntelligenceIntegrationService.getDeviceWorkoutSignals(userId);

export const getDeviceCardiovascularSignals = (userId: string) => 
  deviceIntelligenceIntegrationService.getDeviceCardiovascularSignals(userId);

export const getDeviceMetabolicSignals = (userId: string) => 
  deviceIntelligenceIntegrationService.getDeviceMetabolicSignals(userId);

export const getDeviceFusionSignals = (userId: string) => 
  deviceIntelligenceIntegrationService.getDeviceFusionSignals(userId);

export const getDevicePredictiveSignals = (userId: string) => 
  deviceIntelligenceIntegrationService.getDevicePredictiveSignals(userId);

export const getDeviceOptimizationTriggers = (userId: string) => 
  deviceIntelligenceIntegrationService.getDeviceOptimizationTriggers(userId);
