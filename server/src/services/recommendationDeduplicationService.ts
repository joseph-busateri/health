import { logger } from '../utils/logger';
import type { PrioritizedRecommendation } from '../types/recommendationPrioritization';

function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

function areActionsSimilar(actions1: string[], actions2: string[]): boolean {
  if (actions1.length === 0 && actions2.length === 0) return true;
  if (actions1.length === 0 || actions2.length === 0) return false;

  let matchCount = 0;
  for (const action1 of actions1) {
    for (const action2 of actions2) {
      if (calculateStringSimilarity(action1, action2) > 0.6) {
        matchCount++;
        break;
      }
    }
  }

  return matchCount / Math.max(actions1.length, actions2.length) > 0.5;
}

function areSummariesSimilar(summary1: string, summary2: string): boolean {
  const similarity = calculateStringSimilarity(summary1, summary2);
  return similarity > 0.7;
}

function shouldMerge(rec1: PrioritizedRecommendation, rec2: PrioritizedRecommendation): boolean {
  const summarySimilar = areSummariesSimilar(rec1.summary, rec2.summary);
  const actionsSimilar = areActionsSimilar(rec1.actions, rec2.actions);

  return summarySimilar || actionsSimilar;
}

function mergeRecommendations(
  rec1: PrioritizedRecommendation,
  rec2: PrioritizedRecommendation,
): PrioritizedRecommendation {
  const higherPriority = rec1.score >= rec2.score ? rec1 : rec2;
  const lowerPriority = rec1.score >= rec2.score ? rec2 : rec1;

  const mergedActions = [...new Set([...higherPriority.actions, ...lowerPriority.actions])];

  const sources = [rec1.source, rec2.source].filter((s, i, arr) => arr.indexOf(s) === i);

  return {
    ...higherPriority,
    source: sources.join(' + '),
    actions: mergedActions,
    rationale: higherPriority.rationale || lowerPriority.rationale,
  };
}

export function deduplicateRecommendations(
  recommendations: PrioritizedRecommendation[],
): PrioritizedRecommendation[] {
  if (recommendations.length === 0) {
    return [];
  }

  logger.info('🔵 Starting deduplication', {
    inputCount: recommendations.length,
  });

  const deduplicated: PrioritizedRecommendation[] = [];
  const merged = new Set<number>();

  for (let i = 0; i < recommendations.length; i++) {
    if (merged.has(i)) continue;

    let current = recommendations[i];
    const mergedWith: number[] = [];

    for (let j = i + 1; j < recommendations.length; j++) {
      if (merged.has(j)) continue;

      if (shouldMerge(current, recommendations[j])) {
        logger.info('🔀 Merging similar recommendations', {
          rec1: current.summary.substring(0, 50),
          rec2: recommendations[j].summary.substring(0, 50),
        });

        current = mergeRecommendations(current, recommendations[j]);
        merged.add(j);
        mergedWith.push(j);
      }
    }

    deduplicated.push(current);
  }

  logger.info('✅ Deduplication complete', {
    inputCount: recommendations.length,
    outputCount: deduplicated.length,
    mergedCount: recommendations.length - deduplicated.length,
  });

  return deduplicated;
}
