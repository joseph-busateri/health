import { logger } from '../utils/logger';
import type { AutonomousPlan } from '../types/autonomousOptimization';

function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function normalizePriority(priority?: string): 'critical' | 'important' | 'optimization' {
  if (!priority) return 'important';
  
  const normalized = priority.toLowerCase();
  if (normalized === 'critical' || normalized === 'high') return 'critical';
  if (normalized === 'important' || normalized === 'moderate') return 'important';
  if (normalized === 'optimization' || normalized === 'low') return 'optimization';
  
  return 'important';
}

export function normalizeAutonomousPlan(
  rawOutput: any,
  fallback: AutonomousPlan,
): AutonomousPlan {
  logger.info('🔵 Normalizing autonomous plan');

  const normalized: AutonomousPlan = {
    adjustments: fallback.adjustments, // Keep original adjustments
    summary: sanitizeText(rawOutput?.summary || fallback.summary),
    priority: normalizePriority(rawOutput?.priority || fallback.priority),
    source: rawOutput?.source || 'ai_enriched',
  };

  logger.info('✅ Autonomous plan normalized', {
    adjustmentCount: normalized.adjustments.length,
    priority: normalized.priority,
    summaryLength: normalized.summary.length,
    source: normalized.source,
  });

  return normalized;
}
