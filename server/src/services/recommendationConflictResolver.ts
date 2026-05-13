import { logger } from '../utils/logger';
import type { PrioritizedRecommendation, PriorityLevel } from '../types/recommendationPrioritization';

const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  critical: 3,
  important: 2,
  optimization: 1,
};

function detectConflict(rec1: PrioritizedRecommendation, rec2: PrioritizedRecommendation): boolean {
  const conflictPatterns = [
    { pattern1: /train hard|increase.*intensity|push.*harder/i, pattern2: /reduce.*intensity|lower.*load|decrease/i },
    { pattern1: /add.*volume|increase.*volume/i, pattern2: /reduce.*volume|decrease.*volume/i },
    { pattern1: /max.*effort|train.*maximum/i, pattern2: /avoid.*max|reduce.*effort/i },
    { pattern1: /proceed.*planned|continue.*training/i, pattern2: /rest|skip.*session|avoid.*training/i },
  ];

  const summary1 = rec1.summary.toLowerCase();
  const summary2 = rec2.summary.toLowerCase();
  const actions1 = rec1.actions.join(' ').toLowerCase();
  const actions2 = rec2.actions.join(' ').toLowerCase();

  const text1 = `${summary1} ${actions1}`;
  const text2 = `${summary2} ${actions2}`;

  for (const { pattern1, pattern2 } of conflictPatterns) {
    if (
      (pattern1.test(text1) && pattern2.test(text2)) ||
      (pattern2.test(text1) && pattern1.test(text2))
    ) {
      return true;
    }
  }

  return false;
}

function resolveConflict(
  rec1: PrioritizedRecommendation,
  rec2: PrioritizedRecommendation,
): PrioritizedRecommendation {
  const weight1 = PRIORITY_WEIGHTS[rec1.priority];
  const weight2 = PRIORITY_WEIGHTS[rec2.priority];

  if (weight1 > weight2) {
    logger.info('⚖️  Conflict resolved: choosing higher priority', {
      winner: rec1.summary.substring(0, 50),
      winnerPriority: rec1.priority,
      loser: rec2.summary.substring(0, 50),
      loserPriority: rec2.priority,
    });
    return rec1;
  } else if (weight2 > weight1) {
    logger.info('⚖️  Conflict resolved: choosing higher priority', {
      winner: rec2.summary.substring(0, 50),
      winnerPriority: rec2.priority,
      loser: rec1.summary.substring(0, 50),
      loserPriority: rec1.priority,
    });
    return rec2;
  }

  if (rec1.source.includes('cross_engine') || rec1.source.includes('Cross-Engine')) {
    logger.info('⚖️  Conflict resolved: choosing cross-engine recommendation', {
      winner: rec1.summary.substring(0, 50),
      loser: rec2.summary.substring(0, 50),
    });
    return rec1;
  } else if (rec2.source.includes('cross_engine') || rec2.source.includes('Cross-Engine')) {
    logger.info('⚖️  Conflict resolved: choosing cross-engine recommendation', {
      winner: rec2.summary.substring(0, 50),
      loser: rec1.summary.substring(0, 50),
    });
    return rec2;
  }

  if (rec1.score >= rec2.score) {
    logger.info('⚖️  Conflict resolved: choosing higher score', {
      winner: rec1.summary.substring(0, 50),
      winnerScore: rec1.score,
      loser: rec2.summary.substring(0, 50),
      loserScore: rec2.score,
    });
    return rec1;
  } else {
    logger.info('⚖️  Conflict resolved: choosing higher score', {
      winner: rec2.summary.substring(0, 50),
      winnerScore: rec2.score,
      loser: rec1.summary.substring(0, 50),
      loserScore: rec1.score,
    });
    return rec2;
  }
}

export function resolveConflicts(
  recommendations: PrioritizedRecommendation[],
): PrioritizedRecommendation[] {
  if (recommendations.length === 0) {
    return [];
  }

  logger.info('🔵 Starting conflict resolution', {
    inputCount: recommendations.length,
  });

  const resolved: PrioritizedRecommendation[] = [];
  const removed = new Set<number>();

  for (let i = 0; i < recommendations.length; i++) {
    if (removed.has(i)) continue;

    let current = recommendations[i];
    let hasConflict = false;

    for (let j = i + 1; j < recommendations.length; j++) {
      if (removed.has(j)) continue;

      if (detectConflict(current, recommendations[j])) {
        logger.info('⚠️  Conflict detected', {
          rec1: current.summary.substring(0, 50),
          rec2: recommendations[j].summary.substring(0, 50),
        });

        const winner = resolveConflict(current, recommendations[j]);
        
        if (winner.id === current.id) {
          removed.add(j);
        } else {
          current = winner;
          removed.add(i);
          hasConflict = true;
          break;
        }
      }
    }

    if (!removed.has(i)) {
      resolved.push(current);
    }
  }

  logger.info('✅ Conflict resolution complete', {
    inputCount: recommendations.length,
    outputCount: resolved.length,
    conflictsResolved: recommendations.length - resolved.length,
  });

  return resolved;
}
