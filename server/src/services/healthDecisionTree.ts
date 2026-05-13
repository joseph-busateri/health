import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import type {
  UnifiedHealthProfile,
  DecisionTreeNode,
  DecisionTreeResult,
  HolisticRecommendation,
  HealthInterconnection
} from '../types/holisticHealth';

/**
 * Expert-designed decision tree for common health patterns
 * Focus on high-impact, well-understood relationships
 */
const HEALTH_DECISION_TREE: DecisionTreeNode[] = [
  // Pattern 1: Sleep Deprivation Cascade
  {
    id: 'sleep-deprivation-cascade',
    name: 'Sleep Deprivation Cascade',
    condition: (profile) => {
      return !!(profile.sleep && profile.sleep.avgDuration < 7);
    },
    priority: 1,
    confidence: 0.9,
    children: [
      {
        id: 'sleep-stress-hormonal',
        name: 'Sleep + Stress + Hormonal Issues',
        condition: (profile) => {
          const hasHighStress = profile.stress && profile.stress.avgDailyScore >= 7;
          const hasCortisolIssue = profile.bloodwork?.markers.some(
            m => m.normalizedName.toLowerCase().includes('cortisol') && m.isOutOfRange
          );
          return !!(hasHighStress || hasCortisolIssue);
        },
        priority: 1,
        confidence: 0.85,
        recommendation: {
          issue: 'Sleep-Stress-Hormone Cascade',
          rootCauses: [
            'Chronic sleep deprivation (<7 hours)',
            'Elevated stress levels',
            'Hormonal dysregulation'
          ],
          rationale: 'Poor sleep elevates cortisol, which suppresses other hormones and increases stress. This creates a negative feedback loop affecting metabolism, body composition, and overall health.',
          actions: [
            'Prioritize 7-8 hours of sleep nightly with consistent sleep/wake times',
            'Create a wind-down routine 1 hour before bed (no screens, dim lights)',
            'Practice stress management: 10 minutes daily meditation or breathwork',
            'Consider magnesium supplementation (consult healthcare provider)',
            'Schedule recovery days between intense activities'
          ],
          affectedSystems: ['sleep', 'stress', 'bloodwork', 'bodyComposition'],
          interconnections: [
            {
              from: 'Poor Sleep',
              to: 'High Cortisol',
              relationship: 'Sleep deprivation elevates cortisol production',
              confidence: 0.9
            },
            {
              from: 'High Cortisol',
              to: 'High Stress',
              relationship: 'Elevated cortisol increases stress response',
              confidence: 0.85
            },
            {
              from: 'High Cortisol',
              to: 'Hormonal Imbalance',
              relationship: 'Cortisol suppresses testosterone and other hormones',
              confidence: 0.8
            }
          ]
        }
      },
      {
        id: 'sleep-body-comp',
        name: 'Sleep + Body Composition Issues',
        condition: (profile) => {
          const bodyFatIncreasing = profile.bodyComposition?.metrics.some(
            m => m.name === 'Body Fat %' && m.trendDirection === 'worsening'
          );
          return !!bodyFatIncreasing;
        },
        priority: 2,
        confidence: 0.8,
        recommendation: {
          issue: 'Sleep-Metabolism Connection',
          rootCauses: [
            'Insufficient sleep affecting metabolism',
            'Increased body fat percentage'
          ],
          rationale: 'Poor sleep disrupts hunger hormones (ghrelin and leptin), leading to increased appetite and fat storage. Sleep is critical for metabolic health.',
          actions: [
            'Aim for 7-8 hours of quality sleep',
            'Avoid eating 2-3 hours before bed',
            'Increase protein intake to support satiety',
            'Add 2-3 strength training sessions per week',
            'Track sleep and body composition trends weekly'
          ],
          affectedSystems: ['sleep', 'bodyComposition', 'nutrition'],
          interconnections: [
            {
              from: 'Poor Sleep',
              to: 'Increased Body Fat',
              relationship: 'Sleep deprivation disrupts hunger hormones and metabolism',
              confidence: 0.85
            }
          ]
        }
      }
    ]
  },

  // Pattern 2: Cardiovascular Risk Cluster
  {
    id: 'cardiovascular-risk',
    name: 'Cardiovascular Risk Cluster',
    condition: (profile) => {
      const ldlHigh = profile.bloodwork?.markers.some(
        m => m.normalizedName === 'LDL' && m.latestValue > 130
      );
      const triglyceridesHigh = profile.bloodwork?.markers.some(
        m => m.normalizedName.toLowerCase().includes('triglyceride') && m.latestValue > 150
      );
      return !!(ldlHigh || triglyceridesHigh);
    },
    priority: 1,
    confidence: 0.9,
    children: [
      {
        id: 'cardio-sedentary',
        name: 'Cardiovascular + Sedentary Lifestyle',
        condition: (profile) => {
          return !!(profile.activity && profile.activity.weeklyExerciseDays < 3);
        },
        priority: 1,
        confidence: 0.85,
        recommendation: {
          issue: 'Cardiovascular Risk with Inactivity',
          rootCauses: [
            'Elevated LDL or triglycerides',
            'Insufficient physical activity (<3 days/week)'
          ],
          rationale: 'High cholesterol combined with low activity significantly increases cardiovascular risk. Regular exercise improves lipid profiles and heart health.',
          actions: [
            'Aim for 150 minutes of moderate cardio per week (30 min, 5 days)',
            'Incorporate more fiber: oats, beans, fruits, vegetables',
            'Replace saturated fats with healthy fats (avocado, nuts, olive oil)',
            'Add 2 strength training sessions per week',
            'Retest lipid panel in 3 months to track progress'
          ],
          affectedSystems: ['bloodwork', 'activity', 'nutrition'],
          interconnections: [
            {
              from: 'Low Activity',
              to: 'High LDL',
              relationship: 'Exercise helps lower LDL and raise HDL',
              confidence: 0.85
            },
            {
              from: 'Poor Diet',
              to: 'High Triglycerides',
              relationship: 'Excess carbs and saturated fats raise triglycerides',
              confidence: 0.8
            }
          ]
        }
      }
    ]
  },

  // Pattern 3: Metabolic Syndrome Indicators
  {
    id: 'metabolic-syndrome',
    name: 'Metabolic Syndrome Indicators',
    condition: (profile) => {
      const hba1cElevated = profile.bloodwork?.markers.some(
        m => m.normalizedName === 'HbA1c' && m.latestValue > 5.7
      );
      const glucoseElevated = profile.bloodwork?.markers.some(
        m => m.normalizedName.toLowerCase().includes('glucose') && m.latestValue > 100
      );
      const bodyFatHigh = profile.bodyComposition?.metrics.some(
        m => m.name === 'Body Fat %' && m.latestValue > 25
      );
      return !!(hba1cElevated || glucoseElevated || bodyFatHigh);
    },
    priority: 1,
    confidence: 0.85,
    recommendation: {
      issue: 'Metabolic Health Concerns',
      rootCauses: [
        'Elevated blood sugar markers',
        'Increased body fat percentage',
        'Potential insulin resistance'
      ],
      rationale: 'Elevated glucose/HbA1c with high body fat suggests developing insulin resistance. Early intervention can prevent progression to diabetes.',
      actions: [
        'Reduce refined carbohydrates and added sugars',
        'Increase protein and healthy fats for blood sugar stability',
        'Aim for 30 minutes of activity after meals (even walking)',
        'Focus on losing 5-10% body weight if overweight',
        'Consider continuous glucose monitoring to understand food impacts',
        'Consult healthcare provider about metabolic health'
      ],
      affectedSystems: ['bloodwork', 'bodyComposition', 'nutrition', 'activity'],
      interconnections: [
        {
          from: 'High Body Fat',
          to: 'Insulin Resistance',
          relationship: 'Excess fat, especially visceral, promotes insulin resistance',
          confidence: 0.85
        },
        {
          from: 'Insulin Resistance',
          to: 'High Blood Sugar',
          relationship: 'Insulin resistance causes elevated glucose and HbA1c',
          confidence: 0.9
        }
      ]
    }
  },

  // Pattern 4: Hormonal Decline with Lifestyle Factors
  {
    id: 'hormonal-decline',
    name: 'Hormonal Decline Pattern',
    condition: (profile) => {
      const testosteroneLow = profile.bloodwork?.markers.some(
        m => m.normalizedName.toLowerCase().includes('testosterone') && m.latestValue < 300
      );
      return !!testosteroneLow;
    },
    priority: 2,
    confidence: 0.8,
    children: [
      {
        id: 'testosterone-lifestyle',
        name: 'Testosterone + Lifestyle Factors',
        condition: (profile) => {
          const poorSleep = profile.sleep && profile.sleep.avgDuration < 7;
          const lowActivity = profile.activity && profile.activity.weeklyExerciseDays < 3;
          return !!(poorSleep || lowActivity);
        },
        priority: 2,
        confidence: 0.75,
        recommendation: {
          issue: 'Low Testosterone with Lifestyle Factors',
          rootCauses: [
            'Declining testosterone levels',
            'Insufficient sleep or physical activity',
            'Potential stress or metabolic factors'
          ],
          rationale: 'Testosterone production is heavily influenced by sleep quality, strength training, and stress management. Lifestyle optimization can significantly improve levels.',
          actions: [
            'Prioritize 7-9 hours of quality sleep (testosterone produced during sleep)',
            'Add 3-4 strength training sessions per week (compound movements)',
            'Ensure adequate protein intake (0.8-1g per lb body weight)',
            'Include healthy fats: avocados, nuts, olive oil, fatty fish',
            'Manage stress through meditation or relaxation techniques',
            'Consider zinc and vitamin D supplementation (consult provider)',
            'Retest in 3 months after lifestyle changes'
          ],
          affectedSystems: ['bloodwork', 'sleep', 'activity', 'nutrition', 'stress'],
          interconnections: [
            {
              from: 'Poor Sleep',
              to: 'Low Testosterone',
              relationship: 'Testosterone is primarily produced during deep sleep',
              confidence: 0.85
            },
            {
              from: 'Low Strength Training',
              to: 'Low Testosterone',
              relationship: 'Resistance exercise stimulates testosterone production',
              confidence: 0.8
            }
          ]
        }
      }
    ]
  },

  // Pattern 5: High Stress Impacting Multiple Systems
  {
    id: 'chronic-stress',
    name: 'Chronic Stress Pattern',
    condition: (profile) => {
      return !!(profile.stress && profile.stress.avgDailyScore >= 7);
    },
    priority: 2,
    confidence: 0.85,
    recommendation: {
      issue: 'Chronic Stress Affecting Health',
      rootCauses: [
        'Consistently high stress levels (≥7/10)',
        'Potential impact on sleep, hormones, and recovery'
      ],
      rationale: 'Chronic stress elevates cortisol, disrupts sleep, suppresses immune function, and affects nearly every health system. Stress management is foundational.',
      actions: [
        'Practice daily stress management: meditation, breathwork, or yoga (10-20 min)',
        'Identify and address stress sources where possible',
        'Ensure adequate recovery time between activities',
        'Prioritize sleep as stress recovery mechanism',
        'Consider professional support (therapist, coach)',
        'Limit caffeine and alcohol which can amplify stress response'
      ],
      affectedSystems: ['stress', 'sleep', 'bloodwork', 'bodyComposition'],
      interconnections: [
        {
          from: 'High Stress',
          to: 'Poor Sleep',
          relationship: 'Stress disrupts sleep quality and duration',
          confidence: 0.85
        },
        {
          from: 'High Stress',
          to: 'Elevated Cortisol',
          relationship: 'Chronic stress maintains elevated cortisol levels',
          confidence: 0.9
        }
      ]
    }
  }
];

/**
 * Evaluate decision tree against health profile
 */
function evaluateNode(node: DecisionTreeNode, profile: UnifiedHealthProfile): DecisionTreeNode[] {
  const matches: DecisionTreeNode[] = [];

  try {
    if (node.condition(profile)) {
      matches.push(node);

      if (node.children) {
        for (const child of node.children) {
          matches.push(...evaluateNode(child, profile));
        }
      }
    }
  } catch (error) {
    logger.error('Error evaluating decision tree node', { nodeId: node.id, error });
  }

  return matches;
}

/**
 * Evaluate complete decision tree and generate recommendations
 */
export function evaluateDecisionTree(profile: UnifiedHealthProfile): DecisionTreeResult {
  const startTime = Date.now();

  logger.info('Evaluating decision tree', { userId: profile.userId });

  const matchedNodes: DecisionTreeNode[] = [];

  for (const rootNode of HEALTH_DECISION_TREE) {
    const matches = evaluateNode(rootNode, profile);
    matchedNodes.push(...matches);
  }

  // Filter to nodes with recommendations (leaf nodes)
  const recommendationNodes = matchedNodes.filter(n => n.recommendation);

  // Sort by priority
  recommendationNodes.sort((a, b) => a.priority - b.priority);

  // Convert to holistic recommendations
  const recommendations: HolisticRecommendation[] = recommendationNodes.map(node => ({
    id: uuidv4(),
    userId: profile.userId,
    priority: node.priority as 1 | 2 | 3,
    issue: node.recommendation!.issue,
    rootCauses: node.recommendation!.rootCauses,
    interconnections: node.recommendation!.interconnections,
    rationale: node.recommendation!.rationale,
    actions: node.recommendation!.actions,
    affectedSystems: node.recommendation!.affectedSystems,
    confidence: node.confidence,
    generationMethod: 'decision_tree',
    createdAt: new Date().toISOString()
  }));

  // Calculate overall confidence
  const avgConfidence = recommendationNodes.length > 0
    ? recommendationNodes.reduce((sum, n) => sum + n.confidence, 0) / recommendationNodes.length
    : 0;

  // Determine if AI should be used
  // Use AI if: low confidence, no matches, or complex situation
  const shouldUseAI = 
    avgConfidence < 0.7 || 
    recommendations.length === 0 || 
    recommendations.length > 3;

  const processingTime = Date.now() - startTime;

  logger.info('Decision tree evaluation complete', {
    userId: profile.userId,
    matchedNodes: matchedNodes.length,
    recommendations: recommendations.length,
    avgConfidence,
    shouldUseAI,
    processingTime
  });

  return {
    matched: recommendations.length > 0,
    confidence: avgConfidence,
    matchedNodes: recommendationNodes,
    recommendations,
    shouldUseAI
  };
}
