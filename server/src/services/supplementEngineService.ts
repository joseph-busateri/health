import { v4 as uuidv4 } from 'uuid';
import { getSupplementBaseline } from './supplementDocumentService';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import type {
  SupplementRecommendation,
  SupplementRecommendationAction,
  SupplementRecommendationSeverity,
  SupplementEngineContext,
  SupplementRecommendationResult,
} from '../types/supplementEngine';

const recommendationStore = new Map<string, SupplementRecommendation[]>();

const determineSeverity = (confidence: number, impact: string): SupplementRecommendationSeverity => {
  if (impact === 'critical' || confidence > 0.85) return 'high';
  if (confidence > 0.65) return 'moderate';
  return 'low';
};

export const generateSupplementRecommendations = async (
  userId: string,
  context?: Partial<SupplementEngineContext>
): Promise<SupplementRecommendationResult> => {
  const baseline = await getSupplementBaseline(userId);
  const engineState = await getEngineSnapshot(userId);

  const recommendations: SupplementRecommendation[] = [];

  const currentStack = baseline
    ? {
        stackName: baseline.stack_name,
        items: baseline.items.map(item => ({
          supplementName: item.supplement_name,
          dosage: item.dosage,
          dosageUnit: item.dosage_unit,
          frequency: item.frequency,
          timing: item.timing_notes ?? 'unspecified',
          status: 'active',
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
      entity_id: baseline?.id ?? `supplement-engine-${userId}`,
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
  const baseline = await getSupplementBaseline(userId);
  if (!baseline) {
    return null;
  }

  return {
    stackName: baseline.stack_name,
    stackNotes: baseline.stack_notes,
    totalActiveItems: baseline.total_active_items,
    timingNotes: baseline.timing_notes,
    frequencyNotes: baseline.frequency_notes,
    items: baseline.items.map(item => ({
      supplementName: item.supplement_name,
      dosage: item.dosage,
      dosageUnit: item.dosage_unit,
      frequency: item.frequency,
      timing: item.timing_notes ?? 'unspecified',
      notes: item.notes,
    })),
    createdAt: baseline.created_at,
    updatedAt: baseline.updated_at,
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
