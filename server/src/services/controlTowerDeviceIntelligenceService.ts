import { logger } from '../utils/logger';
import { getDeviceContext } from './deviceContextService';
import { 
  getDeviceRecoverySignals, 
  getDeviceCardiovascularSignals, 
  getDeviceMetabolicSignals,
  getDeviceFusionSignals,
  getDevicePredictiveSignals,
  getDeviceOptimizationTriggers,
  type DeviceRecoverySignals,
  type DeviceCardiovascularSignals,
  type DeviceMetabolicSignals,
  type DeviceFusionSignals,
  type DevicePredictiveSignals,
  type DeviceOptimizationTriggers
} from './deviceIntelligenceIntegrationService';

/**
 * Control Tower Device Intelligence Service - Phase 13
 * 
 * Purpose: Transform Control Tower into Real-Time AI Health Command Center
 * Aggregates device intelligence signals for centralized health monitoring
 */

// ============================================================================
// TYPES
// ============================================================================

export type RecoveryStatus = 'excellent' | 'good' | 'moderate' | 'poor';
export type FatigueRisk = 'low' | 'moderate' | 'high' | 'critical';
export type PerformanceOpportunity = 'low' | 'moderate' | 'high';
export type CardiovascularRisk = 'low' | 'moderate' | 'elevated' | 'high';
export type SleepStatus = 'excellent' | 'good' | 'fair' | 'poor';
export type ActivityStatus = 'underactive' | 'optimal' | 'overtraining';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface RecoveryIntelligence {
  status: RecoveryStatus;
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  risk: 'none' | 'low' | 'moderate' | 'high';
  factors: {
    sleepQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    hrvStatus: 'high' | 'normal' | 'low' | 'unknown';
    readiness: number | null;
    sleepDebt: number | null; // minutes
  };
  recommendation?: string;
}

export interface FatigueIntelligence {
  risk: FatigueRisk;
  score: number; // 0-100, higher = more fatigued
  trend: 'improving' | 'stable' | 'worsening';
  reasons: string[];
  recommendation?: string;
}

export interface PerformanceIntelligence {
  opportunity: PerformanceOpportunity;
  score: number; // 0-100
  factors: string[];
  recommendation?: string;
}

export interface CardiovascularIntelligence {
  risk: CardiovascularRisk;
  factors: {
    restingHRTrend: 'decreasing' | 'stable' | 'increasing' | 'unknown';
    bpTrend: 'decreasing' | 'stable' | 'increasing' | 'unknown';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | 'unknown';
  };
  alerts: string[];
  recommendation?: string;
}

export interface SleepIntelligence {
  status: SleepStatus;
  duration: number | null; // hours
  quality: number | null; // 1-5 scale
  consistency: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  debt: number | null; // minutes
  recommendation?: string;
}

export interface ActivityIntelligence {
  status: ActivityStatus;
  steps: number | null;
  calories: number | null;
  workoutIntensity: 'none' | 'low' | 'moderate' | 'high' | 'very_high';
  recommendation?: string;
}

export interface DevicePrediction {
  type: 'fatigue' | 'recovery_decline' | 'performance_opportunity' | 'cardiovascular_risk' | 'metabolic_slowdown';
  severity: 'low' | 'moderate' | 'high';
  timeframe: '24h' | '3d' | '7d';
  confidence: number; // 0-1
  description: string;
}

export interface DeviceOptimization {
  category: 'recovery' | 'movement' | 'stress' | 'cardiovascular' | 'workout';
  priority: PriorityLevel;
  title: string;
  action: string;
  reason: string;
}

export interface TopPriority {
  type: 'risk' | 'opportunity' | 'optimization';
  priority: PriorityLevel;
  title: string;
  description: string;
  action?: string;
  source: string;
}

export interface ControlTowerDeviceIntelligence {
  userId: string;
  timestamp: string;
  
  // Core Intelligence Sections
  recovery: RecoveryIntelligence;
  fatigue: FatigueIntelligence;
  performance: PerformanceIntelligence;
  cardiovascular: CardiovascularIntelligence;
  sleep: SleepIntelligence;
  activity: ActivityIntelligence;
  
  // Predictions & Optimizations
  predictions: DevicePrediction[];
  optimizations: DeviceOptimization[];
  
  // Prioritized Actions
  topPriorities: TopPriority[];
  
  // Data Availability
  hasDeviceData: boolean;
  dataQuality: 'high' | 'medium' | 'low' | 'none';
  activeSources: string[];
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class ControlTowerDeviceIntelligenceService {
  
  /**
   * Get comprehensive Control Tower device intelligence
   */
  async getControlTowerDeviceIntelligence(userId: string): Promise<ControlTowerDeviceIntelligence> {
    logger.info('[ControlTowerDevice] Loading device intelligence', { userId });
    
    try {
      // Load all device intelligence signals in parallel
      const [
        deviceContext,
        recoverySignals,
        cardioSignals,
        metabolicSignals,
        fusionSignals,
        predictiveSignals,
        optimizationTriggers
      ] = await Promise.all([
        getDeviceContext(userId),
        getDeviceRecoverySignals(userId),
        getDeviceCardiovascularSignals(userId),
        getDeviceMetabolicSignals(userId),
        getDeviceFusionSignals(userId),
        getDevicePredictiveSignals(userId),
        getDeviceOptimizationTriggers(userId)
      ]);
      
      logger.info('[ControlTowerDevice] Device signals loaded', {
        userId,
        hasDeviceData: deviceContext.completenessScore > 0,
        completenessScore: deviceContext.completenessScore,
        activeSources: deviceContext.sourceSummary.activeSources.length
      });
      
      // Generate intelligence sections
      const recovery = this.generateRecoveryIntelligence(recoverySignals, deviceContext);
      const fatigue = this.generateFatigueIntelligence(recoverySignals, cardioSignals, fusionSignals);
      const performance = this.generatePerformanceIntelligence(recoverySignals, fusionSignals);
      const cardiovascular = this.generateCardiovascularIntelligence(cardioSignals, deviceContext);
      const sleep = this.generateSleepIntelligence(deviceContext);
      const activity = this.generateActivityIntelligence(metabolicSignals, deviceContext);
      const predictions = this.generatePredictions(predictiveSignals, fusionSignals);
      const optimizations = this.generateOptimizations(optimizationTriggers);
      const topPriorities = this.generateTopPriorities(
        recovery, fatigue, performance, cardiovascular, 
        predictions, optimizations, fusionSignals
      );
      
      logger.info('[ControlTowerDevice] Intelligence generated', {
        userId,
        recoveryStatus: recovery.status,
        fatigueRisk: fatigue.risk,
        performanceOpportunity: performance.opportunity,
        cardiovascularRisk: cardiovascular.risk,
        predictionCount: predictions.length,
        optimizationCount: optimizations.length,
        topPriorityCount: topPriorities.length
      });
      
      return {
        userId,
        timestamp: new Date().toISOString(),
        recovery,
        fatigue,
        performance,
        cardiovascular,
        sleep,
        activity,
        predictions,
        optimizations,
        topPriorities,
        hasDeviceData: deviceContext.completenessScore > 0,
        dataQuality: deviceContext.dataQuality === 'incomplete' ? 'none' : deviceContext.dataQuality,
        activeSources: deviceContext.sourceSummary.activeSources
      };
      
    } catch (error) {
      logger.error('[ControlTowerDevice] Failed to load device intelligence', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return empty intelligence on error
      return this.getEmptyIntelligence(userId);
    }
  }
  
  /**
   * Generate Recovery Intelligence
   */
  private generateRecoveryIntelligence(
    signals: DeviceRecoverySignals,
    deviceContext: any
  ): RecoveryIntelligence {
    
    if (!signals.hasDeviceData) {
      return {
        status: 'moderate',
        score: 65,
        trend: 'stable',
        risk: 'none',
        factors: {
          sleepQuality: 'unknown',
          hrvStatus: 'unknown',
          readiness: null,
          sleepDebt: null
        }
      };
    }
    
    // Calculate recovery score
    let recoveryScore = 65; // Default moderate
    
    if (signals.readinessScore) {
      recoveryScore = signals.readinessScore;
    } else {
      // Calculate from available signals
      const factors: number[] = [];
      
      if (signals.sleepDurationHours) {
        const sleepScore = Math.min(100, (signals.sleepDurationHours / 8) * 100);
        factors.push(sleepScore);
      }
      
      if (signals.hrv) {
        const hrvScore = Math.min(100, ((signals.hrv - 20) / 80) * 100);
        factors.push(hrvScore);
      }
      
      if (signals.sleepQuality) {
        const qualityScore = (signals.sleepQuality / 5) * 100;
        factors.push(qualityScore);
      }
      
      if (factors.length > 0) {
        recoveryScore = factors.reduce((sum, val) => sum + val, 0) / factors.length;
      }
    }
    
    // Determine status
    let status: RecoveryStatus;
    if (recoveryScore >= 85) status = 'excellent';
    else if (recoveryScore >= 70) status = 'good';
    else if (recoveryScore >= 50) status = 'moderate';
    else status = 'poor';
    
    // Determine risk
    let risk: 'none' | 'low' | 'moderate' | 'high';
    if (recoveryScore >= 70) risk = 'none';
    else if (recoveryScore >= 55) risk = 'low';
    else if (recoveryScore >= 40) risk = 'moderate';
    else risk = 'high';
    
    // Map sleep quality
    let sleepQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' = 'unknown';
    if (signals.sleepQuality) {
      if (signals.sleepQuality >= 4.5) sleepQuality = 'excellent';
      else if (signals.sleepQuality >= 3.5) sleepQuality = 'good';
      else if (signals.sleepQuality >= 2.5) sleepQuality = 'fair';
      else sleepQuality = 'poor';
    }
    
    // Map HRV status
    let hrvStatus: 'high' | 'normal' | 'low' | 'unknown' = 'unknown';
    if (signals.hrv) {
      if (signals.hrv >= 60) hrvStatus = 'high';
      else if (signals.hrv >= 40) hrvStatus = 'normal';
      else hrvStatus = 'low';
    }
    
    // Generate recommendation
    let recommendation: string | undefined;
    if (status === 'poor') {
      recommendation = 'Take a recovery day or reduce training intensity by 40-50%. Prioritize sleep quality tonight.';
    } else if (status === 'moderate') {
      recommendation = 'Use conservative training approach. Cap intensity and extend warm-up.';
    }
    
    return {
      status,
      score: Math.round(recoveryScore),
      trend: 'stable', // Would need historical data for true trend
      risk,
      factors: {
        sleepQuality,
        hrvStatus,
        readiness: signals.readinessScore || null,
        sleepDebt: signals.sleepDebt || null
      },
      recommendation
    };
  }
  
  /**
   * Generate Fatigue Intelligence
   */
  private generateFatigueIntelligence(
    recoverySignals: DeviceRecoverySignals,
    cardioSignals: DeviceCardiovascularSignals,
    fusionSignals: DeviceFusionSignals
  ): FatigueIntelligence {
    
    const reasons: string[] = [];
    let fatigueScore = 0;
    
    // Check sleep debt
    if (recoverySignals.sleepDebt && recoverySignals.sleepDebt > 120) {
      fatigueScore += 30;
      reasons.push(`Sleep debt: ${Math.round(recoverySignals.sleepDebt / 60)} hours`);
    }
    
    // Check HRV
    if (recoverySignals.hrv && recoverySignals.hrv < 35) {
      fatigueScore += 25;
      reasons.push('Low HRV indicating stress/fatigue');
    }
    
    // Check resting HR
    if (recoverySignals.restingHR && recoverySignals.restingHR > 70) {
      fatigueScore += 20;
      reasons.push('Elevated resting heart rate');
    }
    
    // Check cardiovascular stress
    if (cardioSignals.cardiovascularStress === 'high') {
      fatigueScore += 25;
      reasons.push('High cardiovascular stress detected');
    }
    
    // Check overtraining signal
    if (fusionSignals.overtrainingDetection) {
      fatigueScore += 40;
      reasons.push('Overtraining pattern detected');
    }
    
    // Determine risk level
    let risk: FatigueRisk;
    if (fatigueScore >= 80) risk = 'critical';
    else if (fatigueScore >= 60) risk = 'high';
    else if (fatigueScore >= 35) risk = 'moderate';
    else risk = 'low';
    
    // Generate recommendation
    let recommendation: string | undefined;
    if (risk === 'critical') {
      recommendation = 'Immediate rest required. Reduce training volume by 50%+ and prioritize recovery for 3-5 days.';
    } else if (risk === 'high') {
      recommendation = 'Significant fatigue detected. Take a recovery day or light active recovery only.';
    } else if (risk === 'moderate') {
      recommendation = 'Moderate fatigue present. Reduce training intensity by 30% and monitor recovery closely.';
    }
    
    return {
      risk,
      score: Math.min(100, fatigueScore),
      trend: 'stable', // Would need historical data
      reasons,
      recommendation
    };
  }
  
  /**
   * Generate Performance Intelligence
   */
  private generatePerformanceIntelligence(
    recoverySignals: DeviceRecoverySignals,
    fusionSignals: DeviceFusionSignals
  ): PerformanceIntelligence {
    
    const factors: string[] = [];
    let performanceScore = 0;
    
    // Check readiness
    if (recoverySignals.readinessScore && recoverySignals.readinessScore >= 85) {
      performanceScore += 35;
      factors.push('High readiness score');
    }
    
    // Check HRV
    if (recoverySignals.hrv && recoverySignals.hrv >= 60) {
      performanceScore += 30;
      factors.push('High HRV indicating excellent recovery');
    }
    
    // Check sleep quality
    if (recoverySignals.sleepQuality && recoverySignals.sleepQuality >= 4) {
      performanceScore += 20;
      factors.push('Excellent sleep quality');
    }
    
    // Check recovery status
    if (recoverySignals.recoveryStatus === 'recovered') {
      performanceScore += 15;
      factors.push('Fully recovered state');
    }
    
    // Check fusion signal
    if (fusionSignals.performanceOpportunity) {
      performanceScore += 25;
      factors.push('Performance opportunity detected by fusion intelligence');
    }
    
    // Determine opportunity level
    let opportunity: PerformanceOpportunity;
    if (performanceScore >= 75) opportunity = 'high';
    else if (performanceScore >= 45) opportunity = 'moderate';
    else opportunity = 'low';
    
    // Generate recommendation
    let recommendation: string | undefined;
    if (opportunity === 'high') {
      recommendation = 'Optimal state for high-intensity training or attempting personal records. Recovery is excellent.';
    } else if (opportunity === 'moderate') {
      recommendation = 'Good state for normal training. Consider moderate intensity work.';
    }
    
    return {
      opportunity,
      score: Math.min(100, performanceScore),
      factors,
      recommendation
    };
  }
  
  /**
   * Generate Cardiovascular Intelligence
   */
  private generateCardiovascularIntelligence(
    cardioSignals: DeviceCardiovascularSignals,
    deviceContext: any
  ): CardiovascularIntelligence {
    
    const alerts: string[] = [];
    let riskScore = 0;
    
    // Check blood pressure
    if (cardioSignals.bloodPressure) {
      const { systolic, diastolic } = cardioSignals.bloodPressure;
      
      if (systolic >= 140 || diastolic >= 90) {
        riskScore += 40;
        alerts.push(`Elevated blood pressure: ${systolic}/${diastolic} mmHg`);
      } else if (systolic >= 130 || diastolic >= 85) {
        riskScore += 20;
        alerts.push(`Blood pressure trending high: ${systolic}/${diastolic} mmHg`);
      }
    }
    
    // Check resting HR trend
    if (cardioSignals.restingHRTrend === 'increasing') {
      riskScore += 15;
      alerts.push('Resting heart rate trending upward');
    }
    
    // Check activity level
    if (cardioSignals.activityLevel === 'sedentary') {
      riskScore += 20;
      alerts.push('Sedentary activity level increases cardiovascular risk');
    }
    
    // Check cardiovascular stress
    if (cardioSignals.cardiovascularStress === 'high') {
      riskScore += 25;
      alerts.push('High cardiovascular stress detected');
    }
    
    // Determine risk level
    let risk: CardiovascularRisk;
    if (riskScore >= 60) risk = 'high';
    else if (riskScore >= 40) risk = 'elevated';
    else if (riskScore >= 20) risk = 'moderate';
    else risk = 'low';
    
    // Generate recommendation
    let recommendation: string | undefined;
    if (risk === 'high') {
      recommendation = 'Consult healthcare provider. Increase daily movement to 8,000+ steps and add moderate cardio 3-4x per week.';
    } else if (risk === 'elevated') {
      recommendation = 'Monitor closely. Increase daily activity and consider stress management practices.';
    }
    
    return {
      risk,
      factors: {
        restingHRTrend: cardioSignals.restingHRTrend || 'unknown',
        bpTrend: cardioSignals.bloodPressure?.trend || 'unknown',
        activityLevel: cardioSignals.activityLevel || 'unknown'
      },
      alerts,
      recommendation
    };
  }
  
  /**
   * Generate Sleep Intelligence
   */
  private generateSleepIntelligence(deviceContext: any): SleepIntelligence {
    
    if (!deviceContext.sleep) {
      return {
        status: 'fair',
        duration: null,
        quality: null,
        consistency: 'unknown',
        debt: null
      };
    }
    
    const sleep = deviceContext.sleep;
    const duration = sleep.lastNightDuration ? sleep.lastNightDuration / 60 : null;
    const debt = sleep.sleepDebt || null;
    
    // Map quality
    let quality: number | null = null;
    if (sleep.lastNightQuality) {
      const qualityMap = { excellent: 5, good: 4, fair: 3, poor: 2 };
      quality = qualityMap[sleep.lastNightQuality] || 3;
    }
    
    // Determine status
    let status: SleepStatus;
    if (sleep.lastNightQuality === 'excellent' && duration && duration >= 7.5) {
      status = 'excellent';
    } else if (sleep.lastNightQuality === 'good' || (duration && duration >= 7)) {
      status = 'good';
    } else if (sleep.lastNightQuality === 'fair' || (duration && duration >= 6)) {
      status = 'fair';
    } else {
      status = 'poor';
    }
    
    // Generate recommendation
    let recommendation: string | undefined;
    if (status === 'poor') {
      recommendation = 'Prioritize sleep quality tonight. Target 8+ hours with good sleep hygiene.';
    } else if (debt && debt > 120) {
      recommendation = `Sleep debt is ${Math.round(debt / 60)} hours. Prioritize earlier bedtime for next 3-5 nights.`;
    }
    
    return {
      status,
      duration,
      quality,
      consistency: 'unknown', // Would need historical data
      debt,
      recommendation
    };
  }
  
  /**
   * Generate Activity Intelligence
   */
  private generateActivityIntelligence(
    metabolicSignals: DeviceMetabolicSignals,
    deviceContext: any
  ): ActivityIntelligence {
    
    const steps = deviceContext.activity?.todaySteps || null;
    const calories = deviceContext.activity?.todayCalories || null;
    const activityLevel = metabolicSignals.activityLevel || 'light';
    
    // Determine workout intensity
    let workoutIntensity: 'none' | 'low' | 'moderate' | 'high' | 'very_high' = 'none';
    if (deviceContext.workouts?.todayWorkoutCount > 0) {
      if (activityLevel === 'very_active') workoutIntensity = 'very_high';
      else if (activityLevel === 'active') workoutIntensity = 'high';
      else if (activityLevel === 'moderate') workoutIntensity = 'moderate';
      else workoutIntensity = 'low';
    }
    
    // Determine status
    let status: ActivityStatus;
    if (activityLevel === 'very_active' && deviceContext.recovery?.recoveryStatus === 'strained') {
      status = 'overtraining';
    } else if (activityLevel === 'sedentary' || (steps && steps < 5000)) {
      status = 'underactive';
    } else {
      status = 'optimal';
    }
    
    // Generate recommendation
    let recommendation: string | undefined;
    if (status === 'overtraining') {
      recommendation = 'Activity level is very high with poor recovery. Reduce training volume and prioritize rest.';
    } else if (status === 'underactive') {
      recommendation = 'Increase daily movement. Target 8,000+ steps and add regular movement breaks.';
    }
    
    return {
      status,
      steps,
      calories,
      workoutIntensity,
      recommendation
    };
  }
  
  /**
   * Generate Predictions
   */
  private generatePredictions(
    predictiveSignals: DevicePredictiveSignals,
    fusionSignals: DeviceFusionSignals
  ): DevicePrediction[] {
    
    const predictions: DevicePrediction[] = [];
    
    // Fatigue prediction
    if (predictiveSignals.predictedFatigue) {
      predictions.push({
        type: 'fatigue',
        severity: predictiveSignals.predictedFatigue === 'high' ? 'high' : 
                  predictiveSignals.predictedFatigue === 'moderate' ? 'moderate' : 'low',
        timeframe: '24h',
        confidence: 0.75,
        description: `Fatigue predicted within 24 hours based on current recovery trends`
      });
    }
    
    // Recovery decline prediction
    if (predictiveSignals.predictedRecoveryDecline) {
      predictions.push({
        type: 'recovery_decline',
        severity: 'moderate',
        timeframe: '3d',
        confidence: 0.7,
        description: 'Recovery decline predicted over next 3 days based on HRV and sleep trends'
      });
    }
    
    // Performance opportunity prediction
    if (fusionSignals.performanceOpportunity) {
      predictions.push({
        type: 'performance_opportunity',
        severity: 'low',
        timeframe: '24h',
        confidence: 0.85,
        description: 'Optimal performance window predicted for next 24 hours based on recovery state'
      });
    }
    
    // Cardiovascular risk prediction
    if (predictiveSignals.predictedCardiovascularRisk && predictiveSignals.predictedCardiovascularRisk !== 'low') {
      predictions.push({
        type: 'cardiovascular_risk',
        severity: predictiveSignals.predictedCardiovascularRisk === 'high' ? 'high' : 'moderate',
        timeframe: '7d',
        confidence: 0.65,
        description: 'Cardiovascular risk elevation predicted based on BP and activity trends'
      });
    }
    
    // Metabolic slowdown prediction
    if (predictiveSignals.predictedMetabolicSlowdown) {
      predictions.push({
        type: 'metabolic_slowdown',
        severity: 'moderate',
        timeframe: '7d',
        confidence: 0.6,
        description: 'Metabolic slowdown predicted based on low activity and poor sleep trends'
      });
    }
    
    return predictions;
  }
  
  /**
   * Generate Optimizations
   */
  private generateOptimizations(triggers: DeviceOptimizationTriggers): DeviceOptimization[] {
    
    const optimizations: DeviceOptimization[] = [];
    
    if (triggers.recoveryOptimizationNeeded) {
      optimizations.push({
        category: 'recovery',
        priority: 'high',
        title: 'Recovery Optimization Needed',
        action: 'Prioritize sleep quality and reduce training intensity',
        reason: 'Poor sleep or high sleep debt detected'
      });
    }
    
    if (triggers.movementOptimizationNeeded) {
      optimizations.push({
        category: 'movement',
        priority: 'medium',
        title: 'Movement Optimization Needed',
        action: 'Increase daily steps to 8,000+ and add movement breaks',
        reason: 'Low daily step count detected'
      });
    }
    
    if (triggers.stressOptimizationNeeded) {
      optimizations.push({
        category: 'stress',
        priority: 'high',
        title: 'Stress Optimization Needed',
        action: 'Add stress management practices and reduce training load',
        reason: 'Low HRV indicating elevated stress'
      });
    }
    
    if (triggers.cardiovascularOptimizationNeeded) {
      optimizations.push({
        category: 'cardiovascular',
        priority: 'high',
        title: 'Cardiovascular Optimization Needed',
        action: 'Increase cardio activity and monitor blood pressure',
        reason: 'Elevated blood pressure detected'
      });
    }
    
    if (triggers.workoutAdjustmentNeeded) {
      optimizations.push({
        category: 'workout',
        priority: 'critical',
        title: 'Workout Adjustment Needed',
        action: 'Reduce workout intensity or take recovery day',
        reason: 'Fatigue signals indicate inadequate recovery'
      });
    }
    
    return optimizations;
  }
  
  /**
   * Generate Top Priorities
   */
  private generateTopPriorities(
    recovery: RecoveryIntelligence,
    fatigue: FatigueIntelligence,
    performance: PerformanceIntelligence,
    cardiovascular: CardiovascularIntelligence,
    predictions: DevicePrediction[],
    optimizations: DeviceOptimization[],
    fusionSignals: DeviceFusionSignals
  ): TopPriority[] {
    
    const priorities: TopPriority[] = [];
    
    // Critical fatigue risk
    if (fatigue.risk === 'critical') {
      priorities.push({
        type: 'risk',
        priority: 'critical',
        title: 'Critical Fatigue Risk',
        description: `Fatigue score: ${fatigue.score}/100. ${fatigue.reasons.join(', ')}`,
        action: fatigue.recommendation,
        source: 'fatigue_detection'
      });
    }
    
    // Overtraining detection
    if (fusionSignals.overtrainingDetection) {
      priorities.push({
        type: 'risk',
        priority: 'critical',
        title: 'Overtraining Pattern Detected',
        description: 'Sleep debt combined with heavy training load indicates overtraining risk',
        action: 'Reduce training volume by 50% and prioritize sleep recovery for 3-5 days',
        source: 'fusion_signals'
      });
    }
    
    // High cardiovascular risk
    if (cardiovascular.risk === 'high') {
      priorities.push({
        type: 'risk',
        priority: 'high',
        title: 'High Cardiovascular Risk',
        description: cardiovascular.alerts.join(', '),
        action: cardiovascular.recommendation,
        source: 'cardiovascular_intelligence'
      });
    }
    
    // Poor recovery
    if (recovery.risk === 'high') {
      priorities.push({
        type: 'risk',
        priority: 'high',
        title: 'Poor Recovery State',
        description: `Recovery score: ${recovery.score}/100. Inadequate recovery detected.`,
        action: recovery.recommendation,
        source: 'recovery_intelligence'
      });
    }
    
    // High fatigue risk
    if (fatigue.risk === 'high') {
      priorities.push({
        type: 'risk',
        priority: 'high',
        title: 'High Fatigue Risk',
        description: fatigue.reasons.join(', '),
        action: fatigue.recommendation,
        source: 'fatigue_detection'
      });
    }
    
    // Performance opportunity
    if (performance.opportunity === 'high') {
      priorities.push({
        type: 'opportunity',
        priority: 'medium',
        title: 'High Performance Opportunity',
        description: performance.factors.join(', '),
        action: performance.recommendation,
        source: 'performance_intelligence'
      });
    }
    
    // Critical optimizations
    for (const opt of optimizations.filter(o => o.priority === 'critical')) {
      priorities.push({
        type: 'optimization',
        priority: 'critical',
        title: opt.title,
        description: opt.reason,
        action: opt.action,
        source: 'autonomous_optimization'
      });
    }
    
    // High priority predictions
    for (const pred of predictions.filter(p => p.severity === 'high')) {
      priorities.push({
        type: 'risk',
        priority: 'high',
        title: `Predicted ${pred.type.replace('_', ' ')}`,
        description: pred.description,
        source: 'predictive_intelligence'
      });
    }
    
    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    priorities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Return top 10 priorities
    return priorities.slice(0, 10);
  }
  
  /**
   * Get empty intelligence (fallback)
   */
  private getEmptyIntelligence(userId: string): ControlTowerDeviceIntelligence {
    return {
      userId,
      timestamp: new Date().toISOString(),
      recovery: {
        status: 'moderate',
        score: 65,
        trend: 'stable',
        risk: 'none',
        factors: {
          sleepQuality: 'unknown',
          hrvStatus: 'unknown',
          readiness: null,
          sleepDebt: null
        }
      },
      fatigue: {
        risk: 'low',
        score: 0,
        trend: 'stable',
        reasons: []
      },
      performance: {
        opportunity: 'moderate',
        score: 50,
        factors: []
      },
      cardiovascular: {
        risk: 'low',
        factors: {
          restingHRTrend: 'unknown',
          bpTrend: 'unknown',
          activityLevel: 'unknown'
        },
        alerts: []
      },
      sleep: {
        status: 'fair',
        duration: null,
        quality: null,
        consistency: 'unknown',
        debt: null
      },
      activity: {
        status: 'optimal',
        steps: null,
        calories: null,
        workoutIntensity: 'none'
      },
      predictions: [],
      optimizations: [],
      topPriorities: [],
      hasDeviceData: false,
      dataQuality: 'none',
      activeSources: []
    };
  }
}

export const controlTowerDeviceIntelligenceService = new ControlTowerDeviceIntelligenceService();

// Convenience export
export const getControlTowerDeviceIntelligence = (userId: string) =>
  controlTowerDeviceIntelligenceService.getControlTowerDeviceIntelligence(userId);
