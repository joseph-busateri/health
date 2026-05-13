// Supplement Optimization Agent
// Analyzes supplement adherence, bloodwork, and side effects to optimize supplement stack

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

interface SupplementAnalysis {
  userId: string;
  stackVersionId: string;
  analysisDate: string;
  recommendations: SupplementRecommendation[];
  overallAssessment: string;
  confidenceScore: number;
}

interface SupplementRecommendation {
  type: 'increase_dosage' | 'decrease_dosage' | 'add_supplement' | 'remove_supplement' | 
        'change_timing' | 'pause_supplement' | 'resume_supplement' | 'split_dosage';
  supplementId?: string;
  supplementName?: string;
  currentDosage?: string;
  recommendedDosage?: string;
  currentTiming?: string;
  recommendedTiming?: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  basedOn: {
    adherencePattern?: string;
    sideEffects?: string[];
    bloodworkCorrelation?: string;
    effectivenessRating?: string;
  };
}

export class SupplementOptimizationAgent {
  
  /**
   * Analyze supplement stack performance and generate recommendations
   */
  async analyzeSupplementStack(userId: string, days: number = 30): Promise<SupplementAnalysis> {
    try {
      // Get current supplement stack
      const { data: currentStack } = await supabase
        .from('supplement_stack_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single();

      if (!currentStack) {
        throw new Error('No current supplement stack found');
      }

      // Get supplements in stack
      const { data: supplements } = await supabase
        .from('supplements')
        .select('*')
        .eq('stack_version_id', currentStack.id);

      if (!supplements || supplements.length === 0) {
        return {
          userId,
          stackVersionId: currentStack.id,
          analysisDate: new Date().toISOString(),
          recommendations: [],
          overallAssessment: 'No supplements in current stack.',
          confidenceScore: 0,
        };
      }

      // Get adherence logs
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: adherenceLogs } = await supabase
        .from('supplement_adherence_log')
        .select('*')
        .eq('user_id', userId)
        .eq('stack_version_id', currentStack.id)
        .gte('scheduled_date', startDate.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: false });

      // Get recent bloodwork (if available)
      const { data: recentBloodwork } = await supabase
        .from('bloodwork_results')
        .select('*')
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(2);

      // Analyze each supplement
      const recommendations: SupplementRecommendation[] = [];

      for (const supplement of supplements) {
        const supplementLogs = adherenceLogs?.filter(l => l.supplement_id === supplement.id) || [];
        const supplementRecs = await this.analyzeSupplement(
          supplement,
          supplementLogs,
          recentBloodwork || []
        );
        recommendations.push(...supplementRecs);
      }

      // Check for interactions
      const interactionRecs = await this.checkInteractions(supplements);
      recommendations.push(...interactionRecs);

      // Check for missing supplements based on bloodwork
      if (recentBloodwork && recentBloodwork.length > 0) {
        const bloodworkRecs = await this.analyzeBloodworkGaps(userId, supplements, recentBloodwork[0]);
        recommendations.push(...bloodworkRecs);
      }

      // Generate overall assessment
      const overallAssessment = this.generateOverallAssessment(
        recommendations,
        supplements,
        adherenceLogs || []
      );
      const confidenceScore = this.calculateConfidenceScore(
        adherenceLogs?.length || 0,
        days,
        recentBloodwork?.length || 0
      );

      logger.info('Supplement stack analysis complete', {
        userId,
        recommendationCount: recommendations.length,
        confidenceScore,
      });

      return {
        userId,
        stackVersionId: currentStack.id,
        analysisDate: new Date().toISOString(),
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
        overallAssessment,
        confidenceScore,
      };
    } catch (error) {
      logger.error('Error analyzing supplement stack', { error, userId });
      throw error;
    }
  }

  /**
   * Analyze individual supplement performance
   */
  private async analyzeSupplement(
    supplement: any,
    logs: any[],
    bloodwork: any[]
  ): Promise<SupplementRecommendation[]> {
    const recommendations: SupplementRecommendation[] = [];

    if (logs.length < 7) {
      return recommendations; // Need at least 1 week of data
    }

    // Calculate adherence rate
    const takenCount = logs.filter(l => l.taken).length;
    const adherenceRate = (takenCount / logs.length) * 100;

    // Analyze side effects
    const sideEffects = logs
      .filter(l => l.side_effects && l.side_effects.trim() !== '')
      .map(l => l.side_effects);

    if (sideEffects.length >= 3) {
      // Frequent side effects → reduce dosage or pause
      const uniqueSideEffects = [...new Set(sideEffects)];
      recommendations.push({
        type: 'decrease_dosage',
        supplementId: supplement.id,
        supplementName: supplement.supplement_name,
        currentDosage: `${supplement.dosage}${supplement.dosage_unit}`,
        recommendedDosage: 'Reduce by 25-50%',
        reason: `Frequent side effects reported: ${uniqueSideEffects.join(', ')}. Consider reducing dosage.`,
        priority: 'high',
        basedOn: {
          sideEffects: uniqueSideEffects,
          adherencePattern: `${sideEffects.length}/${logs.length} logs with side effects`,
        },
      });
    }

    // Analyze effectiveness ratings
    const effectivenessRatings = logs
      .filter(l => l.perceived_effectiveness !== null)
      .map(l => l.perceived_effectiveness);

    if (effectivenessRatings.length >= 7) {
      const avgEffectiveness = effectivenessRatings.reduce((a, b) => a + b, 0) / effectivenessRatings.length;

      // Low effectiveness → consider removal
      if (avgEffectiveness < 4 && adherenceRate > 80) {
        recommendations.push({
          type: 'remove_supplement',
          supplementId: supplement.id,
          supplementName: supplement.supplement_name,
          reason: `Low perceived effectiveness (avg ${avgEffectiveness.toFixed(1)}/10) despite good adherence (${adherenceRate.toFixed(0)}%). Consider removing or replacing.`,
          priority: 'medium',
          basedOn: {
            effectivenessRating: `${avgEffectiveness.toFixed(1)}/10`,
            adherencePattern: `${adherenceRate.toFixed(0)}% adherence`,
          },
        });
      }

      // High effectiveness but low adherence → adjust timing
      if (avgEffectiveness >= 7 && adherenceRate < 60) {
        recommendations.push({
          type: 'change_timing',
          supplementId: supplement.id,
          supplementName: supplement.supplement_name,
          currentTiming: supplement.timing,
          recommendedTiming: 'Consider more convenient timing',
          reason: `High effectiveness (${avgEffectiveness.toFixed(1)}/10) but low adherence (${adherenceRate.toFixed(0)}%). Timing adjustment may help.`,
          priority: 'medium',
          basedOn: {
            effectivenessRating: `${avgEffectiveness.toFixed(1)}/10`,
            adherencePattern: `${adherenceRate.toFixed(0)}% adherence`,
          },
        });
      }
    }

    // Very low adherence → pause or remove
    if (adherenceRate < 40) {
      recommendations.push({
        type: 'pause_supplement',
        supplementId: supplement.id,
        supplementName: supplement.supplement_name,
        reason: `Very low adherence (${adherenceRate.toFixed(0)}%). Consider pausing until ready to commit or removing from stack.`,
        priority: 'low',
        basedOn: {
          adherencePattern: `${takenCount}/${logs.length} doses taken`,
        },
      });
    }

    return recommendations;
  }

  /**
   * Check for supplement interactions
   */
  private async checkInteractions(supplements: any[]): Promise<SupplementRecommendation[]> {
    const recommendations: SupplementRecommendation[] = [];

    // Get known interactions from database
    const supplementNames = supplements.map(s => s.supplement_name.toLowerCase());

    const { data: interactions } = await supabase
      .from('supplement_interactions')
      .select('*')
      .or(
        supplementNames
          .map(name => `supplement_a.ilike.%${name}%,supplement_b.ilike.%${name}%`)
          .join(',')
      );

    if (interactions && interactions.length > 0) {
      for (const interaction of interactions) {
        if (interaction.severity === 'high') {
          recommendations.push({
            type: 'remove_supplement',
            reason: `High-severity interaction detected: ${interaction.supplement_a} + ${interaction.supplement_b}. ${interaction.interaction_description}`,
            priority: 'high',
            basedOn: {},
          });
        } else if (interaction.severity === 'medium') {
          recommendations.push({
            type: 'change_timing',
            reason: `Medium-severity interaction: ${interaction.supplement_a} + ${interaction.supplement_b}. ${interaction.interaction_description}. Consider separating timing.`,
            priority: 'medium',
            basedOn: {},
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Analyze bloodwork for supplement gaps
   */
  private async analyzeBloodworkGaps(
    userId: string,
    currentSupplements: any[],
    bloodwork: any
  ): Promise<SupplementRecommendation[]> {
    const recommendations: SupplementRecommendation[] = [];

    // Get bloodwork results
    const { data: results } = await supabase
      .from('bloodwork_result_values')
      .select('*')
      .eq('result_id', bloodwork.id);

    if (!results) return recommendations;

    // Check for deficiencies
    const deficiencies = results.filter(r => 
      r.status === 'low' || r.status === 'critically_low'
    );

    for (const deficiency of deficiencies) {
      const markerName = deficiency.marker_name.toLowerCase();
      
      // Check if already supplementing
      const alreadySupplementing = currentSupplements.some(s => 
        s.supplement_name.toLowerCase().includes(markerName) ||
        s.goal?.toLowerCase().includes(markerName)
      );

      if (!alreadySupplementing) {
        // Suggest adding supplement
        const supplementMap: Record<string, string> = {
          'vitamin d': 'Vitamin D3 (2000-5000 IU daily)',
          'vitamin b12': 'Vitamin B12 (1000 mcg daily)',
          'iron': 'Iron supplement (consult doctor for dosage)',
          'magnesium': 'Magnesium (400mg daily)',
          'zinc': 'Zinc (15-30mg daily)',
        };

        const suggestion = supplementMap[markerName] || `${deficiency.marker_name} supplement`;

        recommendations.push({
          type: 'add_supplement',
          recommendedDosage: suggestion,
          reason: `Bloodwork shows ${deficiency.status} ${deficiency.marker_name} (${deficiency.value} ${deficiency.unit}). Consider supplementation.`,
          priority: deficiency.status === 'critically_low' ? 'high' : 'medium',
          basedOn: {
            bloodworkCorrelation: `${deficiency.marker_name}: ${deficiency.value} ${deficiency.unit} (${deficiency.status})`,
          },
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(
    recommendations: SupplementRecommendation[],
    supplements: any[],
    logs: any[]
  ): string {
    if (recommendations.length === 0) {
      return 'Supplement stack is well-optimized. Continue current regimen.';
    }

    const highPriority = recommendations.filter(r => r.priority === 'high').length;
    const addSupplements = recommendations.filter(r => r.type === 'add_supplement').length;
    const removeSupplements = recommendations.filter(r => r.type === 'remove_supplement').length;

    if (highPriority >= 2) {
      return `Immediate attention needed. ${highPriority} high-priority issues detected including side effects or interactions. Review recommendations carefully.`;
    }

    if (addSupplements > 0 && removeSupplements > 0) {
      return `Stack optimization recommended. Consider adding ${addSupplements} supplement(s) and removing ${removeSupplements} supplement(s) based on bloodwork and adherence patterns.`;
    }

    if (addSupplements > 0) {
      return `Potential gaps identified. ${addSupplements} supplement(s) recommended based on bloodwork analysis.`;
    }

    return `Minor adjustments recommended to optimize effectiveness and adherence.`;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(logCount: number, days: number, bloodworkCount: number): number {
    const expectedLogs = days * 3; // Assuming 3 supplements average
    const adherenceScore = Math.min(logCount / expectedLogs, 1) * 70;
    const bloodworkScore = Math.min(bloodworkCount / 2, 1) * 30;
    return Math.round(adherenceScore + bloodworkScore);
  }

  /**
   * Apply recommendations to create new supplement stack version
   */
  async applyRecommendations(
    userId: string,
    recommendations: SupplementRecommendation[],
    reason: string
  ): Promise<string> {
    try {
      // Get current stack
      const { data: currentStack } = await supabase
        .from('supplement_stack_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single();

      if (!currentStack) {
        throw new Error('No current supplement stack found');
      }

      // Create new version
      const { data: newVersion } = await supabase
        .from('supplement_stack_versions')
        .insert({
          user_id: userId,
          version_number: currentStack.version_number + 1,
          created_by: 'agent',
          created_reason: reason,
          effective_from: new Date().toISOString().split('T')[0],
          is_current: true,
        })
        .select()
        .single();

      // Mark old version as not current
      await supabase
        .from('supplement_stack_versions')
        .update({ 
          is_current: false, 
          effective_to: new Date().toISOString().split('T')[0] 
        })
        .eq('id', currentStack.id);

      // Log changes
      for (const rec of recommendations) {
        await supabase
          .from('supplement_stack_changes')
          .insert({
            from_version_id: currentStack.id,
            to_version_id: newVersion.id,
            change_type: rec.type,
            change_description: rec.reason,
            supplement_name: rec.supplementName,
            old_dosage: rec.currentDosage,
            new_dosage: rec.recommendedDosage,
            reason: rec.reason,
            triggered_by_bloodwork: rec.basedOn.bloodworkCorrelation ? true : false,
            triggered_by_side_effects: rec.basedOn.sideEffects ? true : false,
          });
      }

      logger.info('Supplement recommendations applied', {
        userId,
        newVersionId: newVersion.id,
        recommendationCount: recommendations.length,
      });

      return newVersion.id;
    } catch (error) {
      logger.error('Error applying supplement recommendations', { error, userId });
      throw error;
    }
  }
}

export const supplementOptimizationAgent = new SupplementOptimizationAgent();
