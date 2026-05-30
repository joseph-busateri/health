// Injury Prevention Engine
// Joint health tracking, pain logging, mobility assessments, and injury risk scoring

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface JointHealthLog {
  userId: string;
  trackingDate: string;
  jointName: string;
  painLevel: number;
  painType?: string;
  painFrequency?: string;
  rangeOfMotionPercent?: number;
  stiffnessLevel?: number;
  swellingPresent?: boolean;
  affectsDailyActivities?: boolean;
  affectsWorkout?: boolean;
  treatmentsUsed?: string[];
  notes?: string;
}

export interface PainLog {
  userId: string;
  logDate: string;
  logTime: string;
  bodyPart: string;
  painLevel: number;
  painType?: string;
  onset?: string;
  durationMinutes?: number;
  aggravatingFactors?: string[];
  relievingFactors?: string[];
  associatedSymptoms?: string[];
  activityAtOnset?: string;
  functionalImpact?: number;
  immediateActions?: string[];
  notes?: string;
}

export interface MobilityAssessment {
  userId: string;
  assessmentDate: string;
  assessmentType: string;
  overallMobilityScore: number;
  jointScores: {
    ankleLeft?: number;
    ankleRight?: number;
    kneeLeft?: number;
    kneeRight?: number;
    hipLeft?: number;
    hipRight?: number;
    lowerBack?: number;
    upperBack?: number;
    shoulderLeft?: number;
    shoulderRight?: number;
  };
  functionalMovementScores?: {
    squat?: number;
    lunge?: number;
    push?: number;
    pull?: number;
    hinge?: number;
    rotation?: number;
  };
  asymmetriesDetected?: boolean;
  asymmetryDetails?: string[];
  limitations?: string[];
  recommendedExercises?: string[];
  notes?: string;
}

export interface InjuryRiskScore {
  userId: string;
  scoreDate: string;
  overallRiskScore: number;
  riskLevel: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  workloadRiskScore: number;
  recoveryRiskScore: number;
  painRiskScore: number;
  mobilityRiskScore: number;
  historyRiskScore: number;
  primaryRiskFactors: string[];
  highestRiskAreas: string[];
  immediateActions: string[];
  preventiveMeasures: string[];
}

export interface PreventiveRecommendation {
  userId: string;
  recommendationType: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'within_week' | 'within_month' | 'ongoing';
  targetBodyPart: string;
  title: string;
  description: string;
  frequency: string;
  expectedBenefit: string;
  riskReductionPercent: number;
}

export class InjuryPreventionEngine {
  
  /**
   * Log joint health status
   */
  async logJointHealth(log: JointHealthLog): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('joint_health_tracking')
        .insert({
          user_id: log.userId,
          tracking_date: log.trackingDate,
          joint_name: log.jointName,
          pain_level: log.painLevel,
          pain_type: log.painType,
          pain_frequency: log.painFrequency,
          range_of_motion_percent: log.rangeOfMotionPercent,
          stiffness_level: log.stiffnessLevel,
          swelling_present: log.swellingPresent,
          affects_daily_activities: log.affectsDailyActivities,
          affects_workout: log.affectsWorkout,
          treatments_used: log.treatmentsUsed,
          notes: log.notes,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Joint health logged', { userId: log.userId, joint: log.jointName });

      // Trigger injury risk calculation
      await this.calculateInjuryRisk(log.userId, log.trackingDate);

      return data.id;
    } catch (error) {
      logger.error('Error logging joint health', { error, log });
      throw error;
    }
  }

  /**
   * Log pain incident
   */
  async logPain(log: PainLog): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('pain_logs')
        .insert({
          user_id: log.userId,
          log_date: log.logDate,
          log_time: log.logTime,
          body_part: log.bodyPart,
          pain_level: log.painLevel,
          pain_type: log.painType,
          onset: log.onset,
          duration_minutes: log.durationMinutes,
          aggravating_factors: log.aggravatingFactors,
          relieving_factors: log.relievingFactors,
          associated_symptoms: log.associatedSymptoms,
          activity_at_onset: log.activityAtOnset,
          functional_impact: log.functionalImpact,
          immediate_actions: log.immediateActions,
          notes: log.notes,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Pain logged', { userId: log.userId, bodyPart: log.bodyPart, level: log.painLevel });

      // Trigger injury risk calculation
      await this.calculateInjuryRisk(log.userId, log.logDate);

      // Generate preventive recommendations if pain is severe
      if (log.painLevel >= 7) {
        await this.generatePreventiveRecommendations(log.userId, log.bodyPart);
      }

      return data.id;
    } catch (error) {
      logger.error('Error logging pain', { error, log });
      throw error;
    }
  }

  /**
   * Record mobility assessment
   */
  async recordMobilityAssessment(assessment: MobilityAssessment): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('mobility_assessments')
        .insert({
          user_id: assessment.userId,
          assessment_date: assessment.assessmentDate,
          assessment_type: assessment.assessmentType,
          overall_mobility_score: assessment.overallMobilityScore,
          ankle_mobility_left: assessment.jointScores.ankleLeft,
          ankle_mobility_right: assessment.jointScores.ankleRight,
          knee_mobility_left: assessment.jointScores.kneeLeft,
          knee_mobility_right: assessment.jointScores.kneeRight,
          hip_mobility_left: assessment.jointScores.hipLeft,
          hip_mobility_right: assessment.jointScores.hipRight,
          lower_back_mobility: assessment.jointScores.lowerBack,
          upper_back_mobility: assessment.jointScores.upperBack,
          shoulder_mobility_left: assessment.jointScores.shoulderLeft,
          shoulder_mobility_right: assessment.jointScores.shoulderRight,
          squat_pattern_score: assessment.functionalMovementScores?.squat,
          lunge_pattern_score: assessment.functionalMovementScores?.lunge,
          push_pattern_score: assessment.functionalMovementScores?.push,
          pull_pattern_score: assessment.functionalMovementScores?.pull,
          hinge_pattern_score: assessment.functionalMovementScores?.hinge,
          rotation_pattern_score: assessment.functionalMovementScores?.rotation,
          asymmetries_detected: assessment.asymmetriesDetected,
          asymmetry_details: assessment.asymmetryDetails,
          limitations: assessment.limitations,
          recommended_exercises: assessment.recommendedExercises,
          notes: assessment.notes,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Mobility assessment recorded', { userId: assessment.userId, score: assessment.overallMobilityScore });

      // Trigger injury risk calculation
      await this.calculateInjuryRisk(assessment.userId, assessment.assessmentDate);

      return data.id;
    } catch (error) {
      logger.error('Error recording mobility assessment', { error, assessment });
      throw error;
    }
  }

  /**
   * Calculate comprehensive injury risk score
   */
  async calculateInjuryRisk(userId: string, date: string): Promise<InjuryRiskScore> {
    try {
      // Calculate component risk scores
      const workloadRisk = await this.calculateWorkloadRisk(userId, date);
      const recoveryRisk = await this.calculateRecoveryRisk(userId, date);
      const painRisk = await this.calculatePainRisk(userId, date);
      const mobilityRisk = await this.calculateMobilityRisk(userId, date);
      const historyRisk = await this.calculateHistoryRisk(userId, date);

      // Calculate weighted overall risk
      const overallRisk = Math.round(
        workloadRisk * 0.25 +
        recoveryRisk * 0.25 +
        painRisk * 0.25 +
        mobilityRisk * 0.15 +
        historyRisk * 0.10
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallRisk);

      // Identify risk factors
      const primaryRiskFactors = this.identifyPrimaryRiskFactors(
        workloadRisk,
        recoveryRisk,
        painRisk,
        mobilityRisk,
        historyRisk
      );

      // Identify highest risk areas
      const highestRiskAreas = await this.identifyHighestRiskAreas(userId, date);

      // Generate immediate actions
      const immediateActions = this.generateImmediateActions(riskLevel, primaryRiskFactors);

      // Generate preventive measures
      const preventiveMeasures = this.generatePreventiveMeasures(primaryRiskFactors, highestRiskAreas);

      const riskScore: InjuryRiskScore = {
        userId,
        scoreDate: date,
        overallRiskScore: overallRisk,
        riskLevel,
        workloadRiskScore: workloadRisk,
        recoveryRiskScore: recoveryRisk,
        painRiskScore: painRisk,
        mobilityRiskScore: mobilityRisk,
        historyRiskScore: historyRisk,
        primaryRiskFactors,
        highestRiskAreas,
        immediateActions,
        preventiveMeasures,
      };

      // Save to database
      await this.saveInjuryRiskScore(riskScore);

      logger.info('Injury risk calculated', { userId, overallRisk, riskLevel });

      return riskScore;
    } catch (error) {
      logger.error('Error calculating injury risk', { error, userId, date });
      throw error;
    }
  }

  /**
   * Generate personalized preventive recommendations
   */
  async generatePreventiveRecommendations(userId: string, targetBodyPart?: string): Promise<PreventiveRecommendation[]> {
    try {
      const recommendations: PreventiveRecommendation[] = [];

      // Get current injury risk
      const riskScore = await this.getLatestInjuryRisk(userId);

      // Get active pain sites
      const painSites = await this.getActivePainSites(userId);

      // Get mobility limitations
      const mobilityLimitations = await this.getMobilityLimitations(userId);

      // Generate recommendations based on risk factors
      if (riskScore.workloadRiskScore > 60) {
        recommendations.push({
          userId,
          recommendationType: 'rest',
          priority: 'high',
          urgency: 'immediate',
          targetBodyPart: 'overall',
          title: 'Reduce Training Volume',
          description: 'Your training load is too high. Reduce volume by 30% for the next week.',
          frequency: 'ongoing',
          expectedBenefit: 'Reduce overuse injury risk by 40%',
          riskReductionPercent: 40,
        });
      }

      // Pain-specific recommendations
      for (const painSite of painSites) {
        if (painSite.avg_pain_level >= 5) {
          recommendations.push({
            userId,
            recommendationType: 'stretching',
            priority: 'high',
            urgency: 'immediate',
            targetBodyPart: painSite.body_part,
            title: `${this.formatBodyPart(painSite.body_part)} Mobility Work`,
            description: `Perform gentle stretching and mobility exercises for ${this.formatBodyPart(painSite.body_part)}`,
            frequency: 'twice_daily',
            expectedBenefit: 'Reduce pain and improve range of motion',
            riskReductionPercent: 30,
          });
        }
      }

      // Mobility-specific recommendations
      for (const limitation of mobilityLimitations) {
        recommendations.push({
          userId,
          recommendationType: 'exercise',
          priority: 'medium',
          urgency: 'within_week',
          targetBodyPart: limitation.joint,
          title: `Improve ${this.formatBodyPart(limitation.joint)} Mobility`,
          description: limitation.recommendation,
          frequency: '3x_per_week',
          expectedBenefit: 'Improve mobility by 20% in 4 weeks',
          riskReductionPercent: 25,
        });
      }

      // General preventive recommendations
      if (riskScore.riskLevel === 'high' || riskScore.riskLevel === 'very_high') {
        recommendations.push({
          userId,
          recommendationType: 'modification',
          priority: 'critical',
          urgency: 'immediate',
          targetBodyPart: 'overall',
          title: 'Modify Training Intensity',
          description: 'Reduce training intensity to 70% of normal for the next 5-7 days',
          frequency: 'ongoing',
          expectedBenefit: 'Significantly reduce injury risk',
          riskReductionPercent: 50,
        });
      }

      // Save recommendations to database
      for (const rec of recommendations) {
        await this.savePreventiveRecommendation(rec);
      }

      logger.info('Preventive recommendations generated', { userId, count: recommendations.length });

      return recommendations;
    } catch (error) {
      logger.error('Error generating preventive recommendations', { error, userId });
      throw error;
    }
  }

  /**
   * Calculate workload risk
   */
  private async calculateWorkloadRisk(userId: string, date: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('recovery_scores')
        .select('acwr')
        .eq('user_id', userId)
        .eq('score_date', date)
        .single();

      if (!data || !data.acwr) return 20;

      const acwr = data.acwr;

      if (acwr > 1.5) return 100;
      if (acwr > 1.3) return 80;
      if (acwr > 1.2) return 60;
      if (acwr < 0.8) return 40;
      return 20;
    } catch (error) {
      return 20;
    }
  }

  /**
   * Calculate recovery risk
   */
  private async calculateRecoveryRisk(userId: string, date: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('recovery_scores')
        .select('overall_recovery_score')
        .eq('user_id', userId)
        .eq('score_date', date)
        .single();

      if (!data) return 20;

      return 100 - data.overall_recovery_score;
    } catch (error) {
      return 20;
    }
  }

  /**
   * Calculate pain risk
   */
  private async calculatePainRisk(userId: string, date: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('pain_logs')
        .select('pain_level')
        .eq('user_id', userId)
        .gte('log_date', new Date(new Date(date).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .gte('pain_level', 5);

      if (!data) return 20;

      const count = data.length;
      if (count >= 5) return 100;
      if (count >= 3) return 80;
      if (count >= 1) return 60;
      return 20;
    } catch (error) {
      return 20;
    }
  }

  /**
   * Calculate mobility risk
   */
  private async calculateMobilityRisk(userId: string, date: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('mobility_assessments')
        .select('overall_mobility_score')
        .eq('user_id', userId)
        .lte('assessment_date', date)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();

      if (!data) return 20;

      return 100 - data.overall_mobility_score;
    } catch (error) {
      return 20;
    }
  }

  /**
   * Calculate history risk
   */
  private async calculateHistoryRisk(userId: string, date: string): Promise<number> {
    try {
      const sixMonthsAgo = new Date(new Date(date).getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data } = await supabase
        .from('injury_history')
        .select('severity')
        .eq('user_id', userId)
        .gte('injury_date', sixMonthsAgo)
        .in('severity', ['moderate', 'severe', 'critical']);

      if (!data) return 10;

      const count = data.length;
      if (count >= 3) return 100;
      if (count >= 2) return 70;
      if (count >= 1) return 50;
      return 10;
    } catch (error) {
      return 10;
    }
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(score: number): 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' {
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  /**
   * Identify primary risk factors
   */
  private identifyPrimaryRiskFactors(
    workload: number,
    recovery: number,
    pain: number,
    mobility: number,
    history: number
  ): string[] {
    const factors: string[] = [];

    if (workload > 60) factors.push('High training load (ACWR > 1.3)');
    if (recovery > 60) factors.push('Poor recovery status');
    if (pain > 60) factors.push('Multiple pain sites');
    if (mobility > 60) factors.push('Limited mobility');
    if (history > 50) factors.push('Recent injury history');

    return factors.length > 0 ? factors : ['No significant risk factors'];
  }

  /**
   * Identify highest risk areas
   */
  private async identifyHighestRiskAreas(userId: string, date: string): Promise<string[]> {
    try {
      const { data } = await supabase
        .rpc('get_active_pain_sites', {
          p_user_id: userId,
          p_days: 7,
        });

      if (!data || data.length === 0) return ['No high-risk areas identified'];

      return data.slice(0, 3).map((site: any) => this.formatBodyPart(site.body_part));
    } catch (error) {
      return ['No high-risk areas identified'];
    }
  }

  /**
   * Generate immediate actions
   */
  private generateImmediateActions(riskLevel: string, riskFactors: string[]): string[] {
    const actions: string[] = [];

    if (riskLevel === 'very_high' || riskLevel === 'high') {
      actions.push('Reduce training intensity by 30-50%');
      actions.push('Schedule rest day within next 2 days');
      actions.push('Focus on recovery strategies');
    }

    if (riskFactors.some(f => f.includes('pain'))) {
      actions.push('Address pain sites with ice/heat therapy');
      actions.push('Avoid aggravating activities');
    }

    if (riskFactors.some(f => f.includes('mobility'))) {
      actions.push('Perform daily mobility work');
      actions.push('Include dynamic warm-ups');
    }

    return actions.length > 0 ? actions : ['Continue current training approach'];
  }

  /**
   * Generate preventive measures
   */
  private generatePreventiveMeasures(riskFactors: string[], highRiskAreas: string[]): string[] {
    const measures: string[] = [];

    measures.push('Maintain proper warm-up routine (10-15 minutes)');
    measures.push('Include mobility work 3x per week');
    measures.push('Monitor pain levels daily');
    measures.push('Ensure adequate recovery between sessions');

    if (highRiskAreas.length > 0 && highRiskAreas[0] !== 'No high-risk areas identified') {
      measures.push(`Focus on strengthening exercises for ${highRiskAreas.join(', ')}`);
    }

    return measures;
  }

  /**
   * Get latest injury risk
   */
  private async getLatestInjuryRisk(userId: string): Promise<any> {
    const { data } = await supabase
      .from('injury_risk_scores')
      .select('*')
      .eq('user_id', userId)
      .order('score_date', { ascending: false })
      .limit(1)
      .single();

    return data || {
      overall_risk_score: 20,
      risk_level: 'low',
      workload_risk_score: 20,
      recovery_risk_score: 20,
      pain_risk_score: 20,
      mobility_risk_score: 20,
      history_risk_score: 10,
    };
  }

  /**
   * Get active pain sites
   */
  private async getActivePainSites(userId: string): Promise<any[]> {
    const { data } = await supabase
      .rpc('get_active_pain_sites', {
        p_user_id: userId,
        p_days: 7,
      });

    return data || [];
  }

  /**
   * Get mobility limitations
   */
  private async getMobilityLimitations(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('mobility_assessments')
      .select('limitations, asymmetry_details')
      .eq('user_id', userId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single();

    if (!data || !data.limitations) return [];

    return data.limitations.map((limitation: string) => ({
      joint: limitation,
      recommendation: `Perform targeted mobility exercises for ${limitation}`,
    }));
  }

  /**
   * Format body part name
   */
  private formatBodyPart(bodyPart: string): string {
    return bodyPart
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Save injury risk score
   */
  private async saveInjuryRiskScore(score: InjuryRiskScore): Promise<void> {
    await supabase.from('injury_risk_scores').upsert({
      user_id: score.userId,
      score_date: score.scoreDate,
      overall_risk_score: score.overallRiskScore,
      risk_level: score.riskLevel,
      workload_risk_score: score.workloadRiskScore,
      recovery_risk_score: score.recoveryRiskScore,
      pain_risk_score: score.painRiskScore,
      mobility_risk_score: score.mobilityRiskScore,
      history_risk_score: score.historyRiskScore,
      primary_risk_factors: score.primaryRiskFactors,
      highest_risk_areas: score.highestRiskAreas,
      immediate_actions: score.immediateActions,
      preventive_measures: score.preventiveMeasures,
    }, {
      onConflict: 'user_id,score_date'
    });
  }

  /**
   * Save preventive recommendation
   */
  private async savePreventiveRecommendation(rec: PreventiveRecommendation): Promise<void> {
    await supabase.from('preventive_recommendations').insert({
      user_id: rec.userId,
      recommendation_date: new Date().toISOString().split('T')[0],
      recommendation_type: rec.recommendationType,
      priority: rec.priority,
      urgency: rec.urgency,
      target_body_part: rec.targetBodyPart,
      title: rec.title,
      description: rec.description,
      frequency: rec.frequency,
      expected_benefit: rec.expectedBenefit,
      risk_reduction_percent: rec.riskReductionPercent,
    });
  }
}

export const injuryPreventionEngine = new InjuryPreventionEngine();
