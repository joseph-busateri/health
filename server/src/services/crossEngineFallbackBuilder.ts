import type {
  CrossEngineInputs,
  CrossEngineRecommendation,
  CrossEnginePriority,
  CrossEngineOverallStatus,
} from '../types/crossEngine';

export function buildCrossEngineFallbackRecommendation(
  overallStatus: CrossEngineOverallStatus,
  inputs: CrossEngineInputs,
): CrossEngineRecommendation {
  const recoveryScore = inputs.recoveryScore ?? 70;
  const stressScore = inputs.stressScore ?? 30;
  const jointRisk = inputs.jointRiskLevel ?? 'low';

  // Rule 1: High Stress + Low Recovery
  if (stressScore >= 70 && recoveryScore < 50) {
    return {
      type: 'cross_engine',
      priority: 'critical',
      summary: 'High stress combined with low recovery requires immediate load reduction.',
      actions: [
        'Reduce training intensity by 30-40%.',
        'Prioritize recovery activities (sleep, nutrition, stress management).',
        'Shorten training session duration.',
        'Consider taking a rest day if symptoms persist.',
      ],
      source: 'fallback',
    };
  }

  // Rule 2: Joint Risk + Low Recovery
  if ((jointRisk === 'high' || jointRisk === 'moderate') && recoveryScore < 50) {
    return {
      type: 'cross_engine',
      priority: 'critical',
      summary: 'Joint risk combined with low recovery requires protective modifications.',
      actions: [
        'Avoid aggravating movements and exercises.',
        'Substitute high-risk exercises with joint-friendly alternatives.',
        'Reduce training volume by 20-30%.',
        'Focus on recovery and tissue health.',
      ],
      source: 'fallback',
    };
  }

  // Rule 3: High Stress + Joint Risk
  if (stressScore >= 70 && (jointRisk === 'high' || jointRisk === 'moderate')) {
    return {
      type: 'cross_engine',
      priority: 'critical',
      summary: 'High stress and joint risk require comprehensive load management.',
      actions: [
        'Reduce both intensity and volume.',
        'Use joint-friendly exercise variations.',
        'Prioritize stress management and recovery.',
        'Monitor symptoms closely.',
      ],
      source: 'fallback',
    };
  }

  // Rule 4: Moderate Stress + Moderate Recovery
  if (stressScore >= 40 && stressScore < 70 && recoveryScore >= 50 && recoveryScore < 70) {
    return {
      type: 'cross_engine',
      priority: 'important',
      summary: 'Moderate stress and recovery require careful monitoring.',
      actions: [
        'Monitor fatigue levels throughout session.',
        'Reduce accessory volume if needed.',
        'Maintain recovery practices.',
        'Adjust intensity based on daily readiness.',
      ],
      source: 'fallback',
    };
  }

  // Rule 5: Constrained Status
  if (overallStatus === 'constrained') {
    return {
      type: 'cross_engine',
      priority: 'important',
      summary: 'System constraints detected requiring training modifications.',
      actions: [
        'Reduce training load by 15-25%.',
        'Focus on movement quality over intensity.',
        'Prioritize recovery between sessions.',
        'Monitor symptoms and adjust as needed.',
      ],
      source: 'fallback',
    };
  }

  // Rule 6: High Risk Status
  if (overallStatus === 'high_risk') {
    return {
      type: 'cross_engine',
      priority: 'critical',
      summary: 'Multiple systems indicate elevated risk requiring immediate caution.',
      actions: [
        'Significantly reduce training load (30-50%).',
        'Prioritize recovery and stress management.',
        'Avoid high-risk movements and exercises.',
        'Consider rest day or active recovery session.',
        'Seek professional guidance if symptoms persist.',
      ],
      source: 'fallback',
    };
  }

  // Rule 7: All Systems Good (Optimal)
  return {
    type: 'cross_engine',
    priority: 'optimization',
    summary: 'All systems indicate readiness for training. Proceed as planned.',
    actions: [
      'Execute training session as programmed.',
      'Maintain current recovery and stress management habits.',
      'Monitor for any changes in readiness.',
      'Continue tracking key metrics.',
    ],
    source: 'fallback',
  };
}
