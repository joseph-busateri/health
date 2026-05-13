import { v4 as uuidv4 } from 'uuid';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import { enrichSupplementRecommendationWithAI } from './supplementAIEnrichment';
import { normalizeSupplementRecommendation } from './supplementRecommendationNormalizer';
import { validateSupplementRecommendation } from './supplementRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { getBaselineFields } from './baselineContextService';
import { getLatestBloodworkContext, getMarkerValue, isMarkerAbnormal } from './bloodworkContextService';
import { getCurrentSupplementStackContext, getDoseCategory, formatSupplement, getGoalAlignedSupplements, hasIngredient } from './supplementContextService';
import { supplementManagementEngine } from './supplementManagementEngine';
import type {
  SupplementRecommendation,
  SupplementRecommendationAction,
  SupplementRecommendationSeverity,
  SupplementEngineContext,
  SupplementRecommendationResult,
  SupplementStatus,
  SupplementEngineInputs,
  SupplementEvidence,
  SupplementEvidenceSignal,
  SupplementRecommendationEnriched,
  SupplementRecord,
} from '../types/supplementEngine';
import type { RecommendationRequest } from '../types/recommendationEngine';

// Legacy store
const recommendationStore = new Map<string, SupplementRecommendation[]>();

// AI enrichment architecture store
const supplementRecordStore = new Map<string, SupplementRecord[]>();

const determineSeverity = (confidence: number, impact: string): SupplementRecommendationSeverity => {
  if (impact === 'critical' || confidence > 0.85) return 'high';
  if (confidence > 0.65) return 'moderate';
  return 'low';
};

export const generateSupplementRecommendations = async (
  userId: string,
  context?: Partial<SupplementEngineContext>
): Promise<SupplementRecommendationResult> => {
  const regimen = await supplementManagementEngine
    .getSupplementRegimen(userId)
    .catch(() => null);
  const engineState = await getEngineSnapshot(userId);

  const recommendations: SupplementRecommendation[] = [];

  const currentStack = regimen
    ? {
        stackName: regimen.stackVersion.versionName,
        items: regimen.supplements.map(item => ({
          supplementName: item.supplementName,
          dosage: item.dosageAmount.toString(),
          dosageUnit: item.dosageUnit,
          frequency: item.frequency,
          timing: item.timing ?? 'unspecified',
          status: item.status,
        })),
      }
    : undefined;

  const recoveryScore = context?.recoveryScore ?? engineState.recoveryCluster?.recoveryScore ?? 70;
  const stressScore = context?.stressScore ?? engineState.recoveryCluster?.stressScore ?? 70;
  const adherenceScore = context?.adherenceScore ?? engineState.supplement?.adherenceScore ?? 70;
  const bloodworkConcerns = context?.bloodworkConcerns ?? [];

  if (bloodworkConcerns.length > 0) {
    for (const concern of bloodworkConcerns) {
      if (concern.severity === 'high' || concern.severity === 'critical') {
        recommendations.push({
          id: uuidv4(),
          userId,
          supplementName: concern.marker,
          action: 'review',
          rationale: `Bloodwork shows ${concern.severity} concern for ${concern.marker}. ${concern.recommendation ?? 'Review supplement stack for potential interactions or adjustments.'}`,
          confidence: 0.85,
          severity: 'high',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  if (recoveryScore < 60) {
    const magnesiumPresent = currentStack?.items.some(item =>
      item.supplementName.toLowerCase().includes('magnesium')
    );

    if (!magnesiumPresent) {
      recommendations.push({
        id: uuidv4(),
        userId,
        supplementName: 'Magnesium Glycinate',
        action: 'add',
        rationale: 'Recovery score is low. Magnesium supports sleep quality and muscle recovery.',
        confidence: 0.75,
        severity: 'moderate',
        status: 'pending',
        recommendedDosage: '400',
        recommendedTiming: 'evening',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const magItem = currentStack.items.find(item =>
        item.supplementName.toLowerCase().includes('magnesium')
      );
      if (magItem && magItem.timing !== 'evening') {
        recommendations.push({
          id: uuidv4(),
          userId,
          supplementName: magItem.supplementName,
          action: 'adjust_timing',
          rationale: 'Recovery score is low. Shifting magnesium to evening may improve sleep and recovery.',
          confidence: 0.7,
          severity: 'moderate',
          status: 'pending',
          currentTiming: magItem.timing,
          recommendedTiming: 'evening',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  if (adherenceScore < 50 && currentStack && currentStack.items.length > 5) {
    recommendations.push({
      id: uuidv4(),
      userId,
      supplementName: 'Stack Simplification',
      action: 'review',
      rationale: `Low adherence detected (${adherenceScore}/100). Consider simplifying your stack from ${currentStack.items.length} items to improve consistency.`,
      confidence: 0.8,
      severity: 'moderate',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  if (currentStack) {
    const duplicates = findDuplicateSupplements(currentStack.items);
    for (const dup of duplicates) {
      recommendations.push({
        id: uuidv4(),
        userId,
        supplementName: dup.name,
        action: 'review',
        rationale: `Potential duplicate or overlapping supplement detected: ${dup.name}. Review for redundancy.`,
        confidence: 0.9,
        severity: 'low',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const existing = recommendationStore.get(userId) ?? [];
  recommendationStore.set(userId, [...recommendations, ...existing]);

  for (const rec of recommendations) {
    await createChangeEvent({
      user_id: userId,
      entity_type: 'supplement_baseline',
      entity_id: regimen?.stackVersion.id ?? `supplement-engine-${userId}`,
      field_name: `recommendation_${rec.action}`,
      new_value: rec.supplementName,
      change_source: 'agent_adjustment',
      rationale: rec.rationale,
      confidence: rec.confidence,
    }).catch(() => undefined);
  }

  const summary = {
    totalRecommendations: recommendations.length,
    addCount: recommendations.filter(r => r.action === 'add').length,
    removeCount: recommendations.filter(r => r.action === 'remove').length,
    adjustCount: recommendations.filter(r => r.action === 'adjust_dosage' || r.action === 'adjust_timing').length,
    reviewCount: recommendations.filter(r => r.action === 'review').length,
  };

  return { recommendations, summary };
};

export const getSupplementRecommendations = async (userId: string): Promise<SupplementRecommendation[]> => {
  return recommendationStore.get(userId) ?? [];
};

export const getCurrentSupplementStack = async (userId: string) => {
  const regimen = await supplementManagementEngine.getSupplementRegimen(userId);
  if (!regimen) {
    return null;
  }

  const activeCount = regimen.supplements.filter(item => item.status === 'active').length;
  const pausedCount = regimen.supplements.filter(item => item.status === 'paused').length;
  const discontinuedCount = regimen.supplements.filter(item => item.status === 'discontinued').length;

  return {
    stackVersion: regimen.stackVersion,
    supplements: regimen.supplements,
    metrics: {
      totalCount: regimen.supplements.length,
      activeCount,
      pausedCount,
      discontinuedCount,
    },
    adherenceSummary: {
      windowDays: 30,
      totalScheduled: regimen.supplements.reduce((acc, item) => acc + (item.adherence?.totalScheduled ?? 0), 0),
      totalTaken: regimen.supplements.reduce((acc, item) => acc + (item.adherence?.totalTaken ?? 0), 0),
      totalMissed: regimen.supplements.reduce((acc, item) => acc + (item.adherence?.totalMissed ?? 0), 0),
      sideEffects: regimen.supplements.reduce((acc, item) => acc + (item.adherence?.sideEffects ?? 0), 0),
    },
  };
};

const findDuplicateSupplements = (
  items: Array<{ supplementName: string }>
): Array<{ name: string; count: number }> => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const normalized = item.supplementName.toLowerCase().trim();
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([name, count]) => ({ name, count }));
};

export const seedSupplementRecommendationOverride = (
  userId: string,
  recommendations: SupplementRecommendation[]
) => {
  recommendationStore.set(userId, recommendations);
};

// ============================================================================
// AI ENRICHMENT ARCHITECTURE
// ============================================================================

/**
 * Determine supplement status based on inputs
 */
function determineSupplementStatus(inputs: SupplementEngineInputs): SupplementStatus {
  const { supplements, adherenceScore, goals } = inputs;

  // Check for conflicts
  const hasConflicts = checkForConflicts(supplements);
  if (hasConflicts) {
    return 'conflicted';
  }

  // Check for inefficiency (redundancy or complexity)
  const isInefficient = checkForInefficiency(supplements, adherenceScore);
  if (isInefficient) {
    return 'inefficient';
  }

  // Check for suboptimal (missing key supplements)
  const isSuboptimal = checkForSuboptimal(supplements, inputs);
  if (isSuboptimal) {
    return 'suboptimal';
  }

  return 'optimal';
}

/**
 * Check for conflicting supplements
 */
function checkForConflicts(supplements: any[]): boolean {
  // Check for known conflicts
  const supplementNames = supplements.map(s => s.name.toLowerCase());
  
  // Example: High-dose calcium and magnesium compete for absorption
  const hasCalcium = supplementNames.some(n => n.includes('calcium'));
  const hasMagnesium = supplementNames.some(n => n.includes('magnesium'));
  const hasIron = supplementNames.some(n => n.includes('iron'));
  
  // Iron and calcium conflict
  if (hasIron && hasCalcium) {
    return true;
  }

  return false;
}

/**
 * Check for inefficiency (redundancy or excessive complexity)
 */
function checkForInefficiency(supplements: any[], adherenceScore?: number): boolean {
  // Too many supplements with low adherence
  if (supplements.length > 8 && adherenceScore && adherenceScore < 60) {
    return true;
  }

  // Check for redundant supplements
  const supplementNames = supplements.map(s => s.name.toLowerCase());
  
  // Multiple omega-3 sources
  const omega3Count = supplementNames.filter(n => 
    n.includes('omega') || n.includes('fish oil') || n.includes('dha') || n.includes('epa')
  ).length;
  if (omega3Count > 1) {
    return true;
  }

  // Multiple magnesium forms
  const magnesiumCount = supplementNames.filter(n => n.includes('magnesium')).length;
  if (magnesiumCount > 1) {
    return true;
  }

  return false;
}

/**
 * Check for suboptimal stack (missing key supplements)
 */
function checkForSuboptimal(supplements: any[], inputs: SupplementEngineInputs): boolean {
  const supplementNames = supplements.map(s => s.name.toLowerCase());
  
  // Missing foundational supplements
  const hasVitaminD = supplementNames.some(n => n.includes('vitamin d') || n.includes('d3'));
  const hasOmega3 = supplementNames.some(n => 
    n.includes('omega') || n.includes('fish oil') || n.includes('dha') || n.includes('epa')
  );
  const hasMagnesium = supplementNames.some(n => n.includes('magnesium'));

  // Low recovery score but no magnesium
  if (inputs.recoveryScore && inputs.recoveryScore < 60 && !hasMagnesium) {
    return true;
  }

  // Missing basic foundational supplements
  if (!hasVitaminD || !hasOmega3) {
    return true;
  }

  return false;
}

/**
 * Build supplement evidence
 */
function buildSupplementEvidence(
  inputs: SupplementEngineInputs, 
  bloodwork?: ReturnType<typeof getLatestBloodworkContext> extends Promise<infer T> ? T : never,
  supplementStack?: ReturnType<typeof getCurrentSupplementStackContext> extends Promise<infer T> ? T : never
): SupplementEvidence {
  const supplementStatus = determineSupplementStatus(inputs);
  const signals: SupplementEvidenceSignal[] = [];

  // Ingredient-aware stack analysis
  if (supplementStack?.hasSupplementStack) {
    // Stack composition signal
    signals.push({
      name: 'Stack Composition',
      value: `${supplementStack.totalSupplements} supplements, ${supplementStack.totalDailyPills} daily pills`,
      interpretation: supplementStack.totalDailyPills > 15 
        ? 'High pill burden may reduce adherence'
        : supplementStack.totalDailyPills < 5
        ? 'Minimal daily pill burden'
        : 'Moderate daily pill burden',
    });

    // Ingredient overlap detection
    if (supplementStack.potentialOverlaps.length > 0) {
      signals.push({
        name: 'Ingredient Overlaps',
        value: supplementStack.potentialOverlaps.join(', '),
        interpretation: `Detected ${supplementStack.potentialOverlaps.length} potential ingredient overlap(s) - review for redundancy`,
      });
    }

    // Dose-aware analysis for key ingredients
    for (const ingredient of supplementStack.ingredients) {
      const doseCategory = getDoseCategory(ingredient);
      if (doseCategory !== 'unknown') {
        const name = ingredient.name;
        if (name.toLowerCase().includes('vitamin d') || 
            name.toLowerCase().includes('magnesium') || 
            name.toLowerCase().includes('omega')) {
          signals.push({
            name: `${name} Dose`,
            value: `${ingredient.dosageAmount}${ingredient.dosageUnit}`,
            interpretation: `${doseCategory.charAt(0).toUpperCase() + doseCategory.slice(1)} dose - ${ingredient.timing}, ${ingredient.frequency}`,
          });
        }
      }
    }

    // Goal alignment analysis
    const goals = Array.from(supplementStack.supplementsByGoal.keys());
    if (goals.length > 0) {
      signals.push({
        name: 'Goal Alignment',
        value: goals.join(', '),
        interpretation: `Stack targets: ${goals.join(', ')}`,
      });
    }

    // Timing distribution
    const timings = Array.from(supplementStack.supplementsByTiming.keys());
    if (timings.length > 0) {
      signals.push({
        name: 'Timing Distribution',
        value: timings.join(', '),
        interpretation: timings.length > 3 
          ? 'Multiple timing windows - may improve adherence complexity'
          : 'Simple timing schedule',
      });
    }
  }

  // Stack size signal
  signals.push({
    name: 'Stack Size',
    value: inputs.supplements.length,
    interpretation: inputs.supplements.length > 8 
      ? 'Large stack may reduce adherence'
      : inputs.supplements.length < 3
      ? 'Minimal stack - may be missing key supplements'
      : 'Reasonable stack size',
  });

  // Adherence signal
  if (inputs.adherenceScore !== undefined) {
    signals.push({
      name: 'Adherence Score',
      value: inputs.adherenceScore,
      interpretation: inputs.adherenceScore < 60
        ? 'Low adherence - consider simplifying stack'
        : inputs.adherenceScore < 80
        ? 'Moderate adherence'
        : 'Good adherence',
    });
  }

  // Recovery alignment
  if (inputs.recoveryScore !== undefined) {
    const hasMagnesium = inputs.supplements.some(s => 
      s.name.toLowerCase().includes('magnesium')
    );
    signals.push({
      name: 'Recovery Support',
      value: hasMagnesium ? 'Present' : 'Missing',
      interpretation: inputs.recoveryScore < 60 && !hasMagnesium
        ? 'Low recovery - magnesium supplementation recommended'
        : 'Recovery support adequate',
    });
  }

  // Stress alignment
  if (inputs.stressScore !== undefined) {
    const hasAdaptogen = inputs.supplements.some(s => {
      const name = s.name.toLowerCase();
      return name.includes('ashwagandha') || name.includes('rhodiola') || name.includes('l-theanine');
    });
    signals.push({
      name: 'Stress Support',
      value: hasAdaptogen ? 'Present' : 'Missing',
      interpretation: inputs.stressScore > 70 && !hasAdaptogen
        ? 'High stress - adaptogen supplementation may help'
        : 'Stress support adequate',
    });
  }

  // Metabolic alignment
  if (inputs.metabolicStatus) {
    const hasBerberine = inputs.supplements.some(s => 
      s.name.toLowerCase().includes('berberine')
    );
    const hasAlphaLipoic = inputs.supplements.some(s => 
      s.name.toLowerCase().includes('alpha lipoic') || s.name.toLowerCase().includes('ala')
    );
    signals.push({
      name: 'Metabolic Support',
      value: hasBerberine || hasAlphaLipoic ? 'Present' : 'Missing',
      interpretation: (inputs.metabolicStatus === 'elevated_risk' || inputs.metabolicStatus === 'high_risk') && !hasBerberine
        ? 'Metabolic concerns - consider berberine or alpha-lipoic acid'
        : 'Metabolic support adequate',
    });
  }

  // Cardiovascular alignment
  if (inputs.cardiovascularStatus) {
    const hasOmega3 = inputs.supplements.some(s => {
      const name = s.name.toLowerCase();
      return name.includes('omega') || name.includes('fish oil') || name.includes('epa') || name.includes('dha');
    });
    const hasCoQ10 = inputs.supplements.some(s => 
      s.name.toLowerCase().includes('coq10') || s.name.toLowerCase().includes('ubiquinol')
    );
    signals.push({
      name: 'Cardiovascular Support',
      value: hasOmega3 ? 'Present' : 'Missing',
      interpretation: !hasOmega3
        ? 'Omega-3 supplementation recommended for cardiovascular health'
        : 'Cardiovascular support adequate',
    });
  }

  // Sexual health alignment
  if (inputs.sexualHealthStatus) {
    const hasZinc = inputs.supplements.some(s => s.name.toLowerCase().includes('zinc'));
    const hasVitaminD = inputs.supplements.some(s => 
      s.name.toLowerCase().includes('vitamin d') || s.name.toLowerCase().includes('d3')
    );
    signals.push({
      name: 'Hormonal Support',
      value: hasZinc && hasVitaminD ? 'Present' : 'Partial',
      interpretation: !hasZinc || !hasVitaminD
        ? 'Zinc and Vitamin D support hormonal health'
        : 'Hormonal support adequate',
    });
  }

  // Redundancy check
  const redundancySignal = checkRedundancy(inputs.supplements);
  if (redundancySignal) {
    signals.push(redundancySignal);
  }

  const summary = `Supplement status: ${supplementStatus}. ${signals.length} signals analyzed.`;

  return {
    supplementStatus,
    signals,
    summary,
  };
}

/**
 * Check for redundant supplements
 */
function checkRedundancy(supplements: any[]): SupplementEvidenceSignal | null {
  const supplementNames = supplements.map(s => s.name.toLowerCase());
  
  // Check omega-3 redundancy
  const omega3Count = supplementNames.filter(n => 
    n.includes('omega') || n.includes('fish oil') || n.includes('dha') || n.includes('epa')
  ).length;
  if (omega3Count > 1) {
    return {
      name: 'Redundancy Detected',
      value: 'Multiple omega-3 sources',
      interpretation: 'Consider consolidating omega-3 supplements',
    };
  }

  // Check magnesium redundancy
  const magnesiumCount = supplementNames.filter(n => n.includes('magnesium')).length;
  if (magnesiumCount > 1) {
    return {
      name: 'Redundancy Detected',
      value: 'Multiple magnesium forms',
      interpretation: 'Consider using single magnesium form',
    };
  }

  return null;
}

/**
 * Build fallback supplement recommendation
 */
function buildSupplementFallbackRecommendation(
  supplementStatus: SupplementStatus,
  inputs: SupplementEngineInputs,
): SupplementRecommendationEnriched {
  let priority: 'critical' | 'important' | 'optimization';
  let summary: string;
  let actions: string[];

  switch (supplementStatus) {
    case 'conflicted':
      priority = 'critical';
      summary = 'Supplement stack contains conflicting supplements';
      actions = [
        'Remove conflicting supplements',
        'Separate timing of competing nutrients',
        'Consult healthcare provider for guidance',
      ];
      break;

    case 'inefficient':
      priority = 'important';
      summary = 'Supplement stack is inefficient with redundancy or excessive complexity';
      actions = [
        'Simplify supplement stack',
        'Remove redundant supplements',
        'Consolidate overlapping supplements',
        'Improve adherence through simplification',
      ];
      break;

    case 'suboptimal':
      priority = 'important';
      summary = 'Supplement stack is missing key supplements';
      actions = [
        'Add foundational supplements (Vitamin D, Omega-3, Magnesium)',
        'Align supplements with health goals',
        'Consider metabolic and cardiovascular support',
      ];
      break;

    case 'optimal':
    default:
      priority = 'optimization';
      summary = 'Supplement stack is well-optimized';
      actions = [
        'Maintain current supplement stack',
        'Fine-tune timing for optimal absorption',
        'Monitor adherence and effectiveness',
      ];
      break;
  }

  return {
    type: 'supplement',
    priority,
    summary,
    actions,
    source: 'deterministic',
  };
}

/**
 * Get supplement recommendation with AI enrichment
 */
export async function getSupplementRecommendation(
  userId: string,
  inputs: SupplementEngineInputs,
): Promise<SupplementRecord> {
  logger.info('🔵 [SUPPLEMENT ENGINE] Recommendation generation started', { userId });

  // Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [SUPPLEMENT ENGINE] Baseline profile loaded', {
    userId,
    age: baseline.age,
    sex: baseline.sex,
    conditions: baseline.conditions.length,
    medications: baseline.medications.length,
  });

  // Load current supplement stack for ingredient-aware analysis
  const supplementStack = await getCurrentSupplementStackContext(userId);
  if (supplementStack.hasSupplementStack) {
    logger.info('✅ [SUPPLEMENT ENGINE] Supplement stack loaded', {
      userId,
      totalSupplements: supplementStack.totalSupplements,
      totalDailyPills: supplementStack.totalDailyPills,
      potentialOverlaps: supplementStack.potentialOverlaps.length,
      goals: Array.from(supplementStack.supplementsByGoal.keys()),
    });
  } else {
    logger.info('⚠️ [SUPPLEMENT ENGINE] No supplement stack found', { userId });
  }

  // Load bloodwork for vitamin/mineral markers
  const bloodwork = await getLatestBloodworkContext(userId);
  if (bloodwork.hasBloodwork) {
    logger.info('✅ [SUPPLEMENT ENGINE] Bloodwork loaded', {
      userId,
      latestTestDate: bloodwork.latestTestDate,
      hasVitaminD: !!bloodwork.markers.vitaminD,
      hasB12: !!bloodwork.markers.b12,
      hasFolate: !!bloodwork.markers.folate,
      hasFerritin: !!bloodwork.markers.ferritin,
      hasMagnesium: !!bloodwork.markers.magnesium,
    });

    // Add bloodwork-informed deficiencies to inputs
    const bloodworkDeficiencies: string[] = [];

    // Check Vitamin D
    if (bloodwork.markers.vitaminD) {
      const vitDValue = getMarkerValue(bloodwork.markers.vitaminD);
      if (vitDValue !== null && vitDValue < 30) {
        bloodworkDeficiencies.push('Vitamin D');
        logger.info('📊 [SUPPLEMENT ENGINE] Vitamin D deficiency detected', { value: vitDValue });
      }
    }

    // Check B12
    if (bloodwork.markers.b12) {
      const b12Value = getMarkerValue(bloodwork.markers.b12);
      if (b12Value !== null && b12Value < 400) {
        bloodworkDeficiencies.push('Vitamin B12');
        logger.info('📊 [SUPPLEMENT ENGINE] B12 deficiency detected', { value: b12Value });
      }
    }

    // Check Folate
    if (bloodwork.markers.folate) {
      const folateValue = getMarkerValue(bloodwork.markers.folate);
      if (folateValue !== null && folateValue < 5) {
        bloodworkDeficiencies.push('Folate');
        logger.info('📊 [SUPPLEMENT ENGINE] Folate deficiency detected', { value: folateValue });
      }
    }

    // Check Ferritin (iron storage)
    if (bloodwork.markers.ferritin) {
      const ferritinValue = getMarkerValue(bloodwork.markers.ferritin);
      if (ferritinValue !== null && ferritinValue < 30) {
        bloodworkDeficiencies.push('Iron');
        logger.info('📊 [SUPPLEMENT ENGINE] Ferritin/Iron deficiency detected', { value: ferritinValue });
      }
    }

    // Check Magnesium
    if (bloodwork.markers.magnesium) {
      const magnesiumValue = getMarkerValue(bloodwork.markers.magnesium);
      if (magnesiumValue !== null && magnesiumValue < 2.0) {
        bloodworkDeficiencies.push('Magnesium');
        logger.info('📊 [SUPPLEMENT ENGINE] Magnesium deficiency detected', { value: magnesiumValue });
      }
    }

    // Merge bloodwork deficiencies with user-provided deficiencies
    if (bloodworkDeficiencies.length > 0) {
      inputs.deficiencies = [...new Set([...(inputs.deficiencies || []), ...bloodworkDeficiencies])];
      logger.info('✅ [SUPPLEMENT ENGINE] Bloodwork deficiencies added to inputs', {
        bloodworkDeficiencies,
        totalDeficiencies: inputs.deficiencies.length,
      });
    }
  } else {
    logger.info('⚠️ [SUPPLEMENT ENGINE] No bloodwork available, using provided inputs only', { userId });
  }

  // Build evidence (include bloodwork and supplement stack)
  const evidence = buildSupplementEvidence(inputs, bloodwork, supplementStack);
  logger.info('✅ [SUPPLEMENT ENGINE] Evidence built', {
    userId,
    supplementStatus: evidence.supplementStatus,
    signalCount: evidence.signals.length,
  });

  // Build fallback recommendation
  const fallbackRecommendation = buildSupplementFallbackRecommendation(
    evidence.supplementStatus,
    inputs,
  );
  logger.info('✅ [SUPPLEMENT ENGINE] Fallback recommendation built', {
    userId,
    priority: fallbackRecommendation.priority,
  });

  // AI enrichment (if enabled)
  let recommendation = fallbackRecommendation;
  const useAI = process.env.USE_AI_ENRICHMENT_SUPPLEMENT === 'true';
  if (useAI) {
    recommendation = await enrichSupplementRecommendationWithAI(evidence, fallbackRecommendation);
  } else {
    logger.info('⚠️ [SUPPLEMENT ENGINE] AI enrichment disabled', { userId });
  }

  // Normalize
  recommendation = normalizeSupplementRecommendation(recommendation);
  logger.info('✅ [SUPPLEMENT ENGINE] Recommendation normalized', { userId });

  // Validate
  const isValid = validateSupplementRecommendation(recommendation);
  if (!isValid) {
    logger.warn('⚠️ [SUPPLEMENT ENGINE] Validation failed, using fallback', { userId });
    recommendation = fallbackRecommendation;
  } else {
    logger.info('✅ [SUPPLEMENT ENGINE] Recommendation validated', { userId });
  }

  // Create record
  const record: SupplementRecord = {
    id: uuidv4(),
    userId,
    date: new Date().toISOString().split('T')[0],
    supplementStatus: evidence.supplementStatus,
    evidence,
    recommendation,
    createdAt: new Date().toISOString(),
  };

  // Persist to in-memory store
  const history = supplementRecordStore.get(userId) ?? [];
  supplementRecordStore.set(userId, [record, ...history]);
  logger.info('✅ [SUPPLEMENT ENGINE] Record persisted to in-memory store', { userId });

  // Persist to RecommendationEngine
  try {
    const recommendationRequest: RecommendationRequest = {
      sourceEngine: 'supplement',
      title: 'Supplement Stack Optimization',
      description: recommendation.summary,
      rationale: recommendation.rationale,
      priority: recommendation.priority,
      category: 'supplement_adjustment',
      confidenceLevel: 'high',
      supportingMetrics: evidence.signals.map(signal => ({
        name: signal.name,
        value: signal.value?.toString() || signal.interpretation,
        status: 'normal' as const,
      })),
    };

    await createRecommendation({
      userId,
      request: recommendationRequest,
    });

    logger.info('✅ [SUPPLEMENT ENGINE] Persisted to RecommendationEngine', { userId });
  } catch (error) {
    logger.error('❌ [SUPPLEMENT ENGINE] Failed to persist to RecommendationEngine', {
      userId,
      error: (error as Error).message,
    });
  }

  logger.info('✅ [SUPPLEMENT ENGINE] Recommendation generation complete', {
    userId,
    supplementStatus: record.supplementStatus,
    priority: recommendation.priority,
    source: recommendation.source,
  });

  return record;
}

/**
 * Get today's supplement recommendation
 */
export async function getSupplementToday(userId: string): Promise<SupplementRecord | null> {
  const date = new Date().toISOString().split('T')[0];
  const history = supplementRecordStore.get(userId) ?? [];
  const existing = history.find(record => record.date === date);

  if (existing) {
    logger.info('📋 [SUPPLEMENT ENGINE] Returning cached record', { userId, date });
    return existing;
  }

  // Generate new recommendation with default inputs
  const inputs: SupplementEngineInputs = {
    supplements: [],
    recoveryScore: 70,
    stressScore: 50,
    adherenceScore: 70,
  };

  return getSupplementRecommendation(userId, inputs);
}

/**
 * Get supplement history
 */
export async function getSupplementHistory(userId: string): Promise<SupplementRecord[]> {
  return supplementRecordStore.get(userId) ?? [];
}
