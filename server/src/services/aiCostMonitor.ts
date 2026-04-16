/**
 * AI Cost Monitor
 * 
 * CRITICAL COST TRACKING for AI services
 * 
 * Purpose:
 * - Track AI costs per service in real-time
 * - Monitor token usage and spending
 * - Alert on cost spikes and budget overruns
 * - Provide cost analytics and optimization insights
 * - Support cost attribution per user/service
 * 
 * This is a PRODUCTION COST CRITICAL component.
 */

import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface AICostEntry {
  timestamp: Date;
  serviceName: string;
  userId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  latencyMs: number;
  success: boolean;
  errorType?: string;
}

export interface CostMetrics {
  serviceName: string;
  period: 'hour' | 'day' | 'week' | 'month';
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  avgCostPerCall: number;
  avgTokensPerCall: number;
  avgLatencyMs: number;
  costByModel: Record<string, number>;
  costByUser?: Record<string, number>;
}

export interface CostAlert {
  type: 'daily_limit' | 'spike' | 'budget_exceeded' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentCost: number;
  threshold: number;
  serviceName?: string;
  timestamp: Date;
}

export interface CostBudget {
  serviceName?: string; // undefined = global budget
  dailyLimit?: number;
  monthlyLimit?: number;
  alertThreshold: number; // percentage (e.g., 0.8 = 80%)
}

// ============================================================================
// PRICING (as of April 2026)
// ============================================================================

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4-turbo-preview': {
    input: 0.01,   // $0.01 per 1K input tokens
    output: 0.03,  // $0.03 per 1K output tokens
  },
  'gpt-4': {
    input: 0.03,   // $0.03 per 1K input tokens
    output: 0.06,  // $0.06 per 1K output tokens
  },
  'gpt-4o': {
    input: 0.0025, // $0.0025 per 1K input tokens
    output: 0.01,  // $0.01 per 1K output tokens
  },
  'gpt-3.5-turbo': {
    input: 0.0005, // $0.0005 per 1K input tokens
    output: 0.0015, // $0.0015 per 1K output tokens
  },
};

// ============================================================================
// STORAGE
// ============================================================================

const costEntries: AICostEntry[] = [];
const budgets: CostBudget[] = [];
const alerts: CostAlert[] = [];

// Keep last 10,000 entries in memory (rolling window)
const MAX_ENTRIES = 10000;

// ============================================================================
// MAIN TRACKING FUNCTION
// ============================================================================

/**
 * Track AI cost for a service call
 * 
 * @param entry - Cost entry details
 */
export async function trackAICost(entry: Omit<AICostEntry, 'inputCost' | 'outputCost' | 'totalCost' | 'totalTokens'>): Promise<void> {
  // Calculate costs
  const pricing = MODEL_PRICING[entry.model] || MODEL_PRICING['gpt-4-turbo-preview'];
  const inputCost = (entry.inputTokens / 1000) * pricing.input;
  const outputCost = (entry.outputTokens / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;
  const totalTokens = entry.inputTokens + entry.outputTokens;
  
  const fullEntry: AICostEntry = {
    ...entry,
    inputCost,
    outputCost,
    totalCost,
    totalTokens,
  };
  
  // Store entry
  costEntries.push(fullEntry);
  
  // Trim old entries if needed
  if (costEntries.length > MAX_ENTRIES) {
    costEntries.splice(0, costEntries.length - MAX_ENTRIES);
  }
  
  // Check for alerts
  await checkCostAlerts(entry.serviceName, totalCost);
  
  logger.info('[AI COST MONITOR] Cost tracked', {
    serviceName: entry.serviceName,
    model: entry.model,
    tokens: totalTokens,
    cost: totalCost.toFixed(4),
    latencyMs: entry.latencyMs,
  });
}

// ============================================================================
// COST QUERIES
// ============================================================================

/**
 * Get cost metrics for a service
 */
export function getCostMetrics(
  serviceName: string,
  period: 'hour' | 'day' | 'week' | 'month' = 'day'
): CostMetrics {
  const now = new Date();
  const periodMs = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  }[period];
  
  const cutoff = new Date(now.getTime() - periodMs);
  
  const entries = costEntries.filter(
    e => e.serviceName === serviceName && e.timestamp >= cutoff
  );
  
  if (entries.length === 0) {
    return {
      serviceName,
      period,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
      avgCostPerCall: 0,
      avgTokensPerCall: 0,
      avgLatencyMs: 0,
      costByModel: {},
    };
  }
  
  const totalCalls = entries.length;
  const successfulCalls = entries.filter(e => e.success).length;
  const failedCalls = totalCalls - successfulCalls;
  const totalTokens = entries.reduce((sum, e) => sum + e.totalTokens, 0);
  const inputTokens = entries.reduce((sum, e) => sum + e.inputTokens, 0);
  const outputTokens = entries.reduce((sum, e) => sum + e.outputTokens, 0);
  const totalCost = entries.reduce((sum, e) => sum + e.totalCost, 0);
  const avgCostPerCall = totalCost / totalCalls;
  const avgTokensPerCall = totalTokens / totalCalls;
  const avgLatencyMs = entries.reduce((sum, e) => sum + e.latencyMs, 0) / totalCalls;
  
  const costByModel: Record<string, number> = {};
  entries.forEach(e => {
    costByModel[e.model] = (costByModel[e.model] || 0) + e.totalCost;
  });
  
  return {
    serviceName,
    period,
    totalCalls,
    successfulCalls,
    failedCalls,
    totalTokens,
    inputTokens,
    outputTokens,
    totalCost,
    avgCostPerCall,
    avgTokensPerCall,
    avgLatencyMs,
    costByModel,
  };
}

/**
 * Get total cost across all services
 */
export function getTotalCost(period: 'hour' | 'day' | 'week' | 'month' = 'day'): {
  totalCost: number;
  byService: Record<string, number>;
  byModel: Record<string, number>;
  totalCalls: number;
  totalTokens: number;
} {
  const now = new Date();
  const periodMs = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  }[period];
  
  const cutoff = new Date(now.getTime() - periodMs);
  const entries = costEntries.filter(e => e.timestamp >= cutoff);
  
  const totalCost = entries.reduce((sum, e) => sum + e.totalCost, 0);
  const totalCalls = entries.length;
  const totalTokens = entries.reduce((sum, e) => sum + e.totalTokens, 0);
  
  const byService: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  
  entries.forEach(e => {
    byService[e.serviceName] = (byService[e.serviceName] || 0) + e.totalCost;
    byModel[e.model] = (byModel[e.model] || 0) + e.totalCost;
  });
  
  return {
    totalCost,
    byService,
    byModel,
    totalCalls,
    totalTokens,
  };
}

/**
 * Get cost per user
 */
export function getCostPerUser(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Record<string, number> {
  const now = new Date();
  const periodMs = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  }[period];
  
  const cutoff = new Date(now.getTime() - periodMs);
  const entries = costEntries.filter(e => e.timestamp >= cutoff && e.userId);
  
  const costPerUser: Record<string, number> = {};
  entries.forEach(e => {
    if (e.userId) {
      costPerUser[e.userId] = (costPerUser[e.userId] || 0) + e.totalCost;
    }
  });
  
  return costPerUser;
}

/**
 * Get daily cost report
 */
export function getDailyCostReport(): {
  date: string;
  totalCost: number;
  totalCalls: number;
  totalTokens: number;
  byService: Record<string, { cost: number; calls: number; tokens: number }>;
  topServices: Array<{ service: string; cost: number; percentage: number }>;
} {
  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today);
  const entries = costEntries.filter(e => e.timestamp >= todayStart);
  
  const totalCost = entries.reduce((sum, e) => sum + e.totalCost, 0);
  const totalCalls = entries.length;
  const totalTokens = entries.reduce((sum, e) => sum + e.totalTokens, 0);
  
  const byService: Record<string, { cost: number; calls: number; tokens: number }> = {};
  entries.forEach(e => {
    if (!byService[e.serviceName]) {
      byService[e.serviceName] = { cost: 0, calls: 0, tokens: 0 };
    }
    byService[e.serviceName].cost += e.totalCost;
    byService[e.serviceName].calls++;
    byService[e.serviceName].tokens += e.totalTokens;
  });
  
  const topServices = Object.entries(byService)
    .map(([service, data]) => ({
      service,
      cost: data.cost,
      percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);
  
  return {
    date: today,
    totalCost,
    totalCalls,
    totalTokens,
    byService,
    topServices,
  };
}

// ============================================================================
// BUDGET MANAGEMENT
// ============================================================================

/**
 * Set cost budget
 */
export function setBudget(budget: CostBudget): void {
  // Remove existing budget for same service
  const index = budgets.findIndex(b => b.serviceName === budget.serviceName);
  if (index >= 0) {
    budgets.splice(index, 1);
  }
  
  budgets.push(budget);
  
  logger.info('[AI COST MONITOR] Budget set', {
    serviceName: budget.serviceName || 'global',
    dailyLimit: budget.dailyLimit,
    monthlyLimit: budget.monthlyLimit,
    alertThreshold: budget.alertThreshold,
  });
}

/**
 * Get current budget status
 */
export function getBudgetStatus(serviceName?: string): {
  budget: CostBudget | null;
  dailySpend: number;
  monthlySpend: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  dailyPercentage: number;
  monthlyPercentage: number;
  alertTriggered: boolean;
} {
  const budget = budgets.find(b => b.serviceName === serviceName) || null;
  
  if (!budget) {
    return {
      budget: null,
      dailySpend: 0,
      monthlySpend: 0,
      dailyRemaining: 0,
      monthlyRemaining: 0,
      dailyPercentage: 0,
      monthlyPercentage: 0,
      alertTriggered: false,
    };
  }
  
  const dailyMetrics = serviceName 
    ? getCostMetrics(serviceName, 'day')
    : getTotalCost('day');
  const monthlyMetrics = serviceName
    ? getCostMetrics(serviceName, 'month')
    : getTotalCost('month');
  
  const dailySpend = serviceName ? dailyMetrics.totalCost : dailyMetrics.totalCost;
  const monthlySpend = serviceName ? monthlyMetrics.totalCost : monthlyMetrics.totalCost;
  
  const dailyRemaining = budget.dailyLimit ? budget.dailyLimit - dailySpend : 0;
  const monthlyRemaining = budget.monthlyLimit ? budget.monthlyLimit - monthlySpend : 0;
  
  const dailyPercentage = budget.dailyLimit ? (dailySpend / budget.dailyLimit) * 100 : 0;
  const monthlyPercentage = budget.monthlyLimit ? (monthlySpend / budget.monthlyLimit) * 100 : 0;
  
  const alertTriggered = 
    (budget.dailyLimit && dailyPercentage >= budget.alertThreshold * 100) ||
    (budget.monthlyLimit && monthlyPercentage >= budget.alertThreshold * 100);
  
  return {
    budget,
    dailySpend,
    monthlySpend,
    dailyRemaining,
    monthlyRemaining,
    dailyPercentage,
    monthlyPercentage,
    alertTriggered,
  };
}

// ============================================================================
// ALERTS
// ============================================================================

/**
 * Check for cost alerts
 */
async function checkCostAlerts(serviceName: string, currentCost: number): Promise<void> {
  // Check service-specific budget
  const serviceBudget = budgets.find(b => b.serviceName === serviceName);
  if (serviceBudget) {
    const status = getBudgetStatus(serviceName);
    
    if (status.dailyPercentage >= serviceBudget.alertThreshold * 100) {
      const alert: CostAlert = {
        type: 'daily_limit',
        severity: status.dailyPercentage >= 100 ? 'critical' : 'high',
        message: `Service ${serviceName} has reached ${status.dailyPercentage.toFixed(0)}% of daily budget`,
        currentCost: status.dailySpend,
        threshold: serviceBudget.dailyLimit || 0,
        serviceName,
        timestamp: new Date(),
      };
      
      alerts.push(alert);
      
      logger.warn('[AI COST MONITOR] Cost alert triggered', alert as unknown as Record<string, unknown>);
    }
  }
  
  // Check global budget
  const globalBudget = budgets.find(b => !b.serviceName);
  if (globalBudget) {
    const status = getBudgetStatus();
    
    if (status.dailyPercentage >= globalBudget.alertThreshold * 100) {
      const alert: CostAlert = {
        type: 'daily_limit',
        severity: status.dailyPercentage >= 100 ? 'critical' : 'high',
        message: `Global AI costs have reached ${status.dailyPercentage.toFixed(0)}% of daily budget`,
        currentCost: status.dailySpend,
        threshold: globalBudget.dailyLimit || 0,
        timestamp: new Date(),
      };
      
      alerts.push(alert);
      
      logger.warn('[AI COST MONITOR] Global cost alert triggered', alert as unknown as Record<string, unknown>);
    }
  }
  
  // Check for cost spikes (2x normal)
  const recentMetrics = getCostMetrics(serviceName, 'hour');
  const dailyMetrics = getCostMetrics(serviceName, 'day');
  
  if (recentMetrics.totalCalls > 0 && dailyMetrics.totalCalls > 0) {
    const hourlyAvgCost = recentMetrics.avgCostPerCall;
    const dailyAvgCost = dailyMetrics.avgCostPerCall;
    
    if (hourlyAvgCost > dailyAvgCost * 2) {
      const alert: CostAlert = {
        type: 'spike',
        severity: 'medium',
        message: `Cost spike detected for ${serviceName}: ${hourlyAvgCost.toFixed(4)} vs ${dailyAvgCost.toFixed(4)} avg`,
        currentCost: hourlyAvgCost,
        threshold: dailyAvgCost * 2,
        serviceName,
        timestamp: new Date(),
      };
      
      alerts.push(alert);
      
      logger.warn('[AI COST MONITOR] Cost spike detected', alert as unknown as Record<string, unknown>);
    }
  }
}

/**
 * Get recent alerts
 */
export function getRecentAlerts(limit: number = 10): CostAlert[] {
  return alerts.slice(-limit).reverse();
}

/**
 * Clear old alerts
 */
export function clearOldAlerts(olderThanHours: number = 24): void {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const initialLength = alerts.length;
  
  for (let i = alerts.length - 1; i >= 0; i--) {
    if (alerts[i].timestamp < cutoff) {
      alerts.splice(i, 1);
    }
  }
  
  const removed = initialLength - alerts.length;
  if (removed > 0) {
    logger.info('[AI COST MONITOR] Cleared old alerts', { removed });
  }
}

// ============================================================================
// OPTIMIZATION INSIGHTS
// ============================================================================

/**
 * Get cost optimization recommendations
 */
export function getOptimizationRecommendations(): Array<{
  type: 'model_downgrade' | 'caching' | 'prompt_optimization' | 'service_consolidation';
  service: string;
  currentCost: number;
  potentialSavings: number;
  recommendation: string;
}> {
  const recommendations: Array<{
    type: 'model_downgrade' | 'caching' | 'prompt_optimization' | 'service_consolidation';
    service: string;
    currentCost: number;
    potentialSavings: number;
    recommendation: string;
  }> = [];
  
  const dailyCost = getTotalCost('day');
  
  // Check each service for optimization opportunities
  Object.entries(dailyCost.byService).forEach(([service, cost]) => {
    const metrics = getCostMetrics(service, 'day');
    
    // Model downgrade opportunity (using GPT-4 when GPT-3.5 might work)
    if (metrics.costByModel['gpt-4'] || metrics.costByModel['gpt-4-turbo-preview']) {
      const gpt4Cost = (metrics.costByModel['gpt-4'] || 0) + (metrics.costByModel['gpt-4-turbo-preview'] || 0);
      const potentialSavings = gpt4Cost * 0.7; // 70% savings with GPT-3.5
      
      if (potentialSavings > 0.10) { // Only recommend if savings > $0.10/day
        recommendations.push({
          type: 'model_downgrade',
          service,
          currentCost: gpt4Cost,
          potentialSavings,
          recommendation: `Consider using GPT-3.5-turbo for ${service} to save ~$${potentialSavings.toFixed(2)}/day (70% reduction)`,
        });
      }
    }
    
    // Prompt optimization (high token usage)
    if (metrics.avgTokensPerCall > 2000) {
      const potentialSavings = cost * 0.2; // 20% savings from prompt optimization
      
      recommendations.push({
        type: 'prompt_optimization',
        service,
        currentCost: cost,
        potentialSavings,
        recommendation: `${service} uses ${Math.round(metrics.avgTokensPerCall)} tokens/call. Optimize prompts to save ~$${potentialSavings.toFixed(2)}/day`,
      });
    }
  });
  
  return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  trackAICost,
  getCostMetrics,
  getTotalCost,
  getCostPerUser,
  getDailyCostReport,
  setBudget,
  getBudgetStatus,
  getRecentAlerts,
  clearOldAlerts,
  getOptimizationRecommendations,
};
