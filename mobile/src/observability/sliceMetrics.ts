/**
 * Slice Metrics - Phase 18
 * 
 * Purpose: Track observability metrics for vertical slice integration
 * Monitors ingestion success, processing time, and intelligence generation
 */

import type { IngestionResult, SourceType } from '../types/source';

// ============================================================================
// METRICS TRACKER
// ============================================================================

export class SliceMetrics {
  private static metrics: MetricsStore = {
    totalIngestions: 0,
    successfulIngestions: 0,
    failedIngestions: 0,
    bySourceType: {},
    averageProcessingTime: 0,
    totalIntelligenceGenerated: 0,
    totalControlTowerUpdates: 0,
    totalExecutionTasksCreated: 0,
    totalPredictionsGenerated: 0,
    totalAdjustmentsGenerated: 0,
    lastUpdated: new Date().toISOString(),
  };

  /**
   * Track ingestion result
   */
  static trackIngestion(result: IngestionResult, sourceType: SourceType): void {
    this.metrics.totalIngestions++;
    
    if (result.success) {
      this.metrics.successfulIngestions++;
    } else {
      this.metrics.failedIngestions++;
    }

    // Track by source type
    if (!this.metrics.bySourceType[sourceType]) {
      this.metrics.bySourceType[sourceType] = {
        total: 0,
        successful: 0,
        failed: 0,
        averageProcessingTime: 0,
      };
    }

    const sourceMetrics = this.metrics.bySourceType[sourceType];
    sourceMetrics.total++;
    
    if (result.success) {
      sourceMetrics.successful++;
    } else {
      sourceMetrics.failed++;
    }

    // Update processing time
    const currentAvg = sourceMetrics.averageProcessingTime;
    const count = sourceMetrics.total;
    sourceMetrics.averageProcessingTime = 
      (currentAvg * (count - 1) + result.processingTime) / count;

    // Update overall processing time
    const totalCount = this.metrics.totalIngestions;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (totalCount - 1) + result.processingTime) / totalCount;

    // Track intelligence generation
    if (result.intelligenceGenerated) {
      this.metrics.totalIntelligenceGenerated++;
    }

    if (result.controlTowerUpdated) {
      this.metrics.totalControlTowerUpdates++;
    }

    this.metrics.totalExecutionTasksCreated += result.executionTasksCreated || 0;
    this.metrics.totalPredictionsGenerated += result.predictionsGenerated || 0;
    this.metrics.totalAdjustmentsGenerated += result.adjustmentsGenerated || 0;

    this.metrics.lastUpdated = new Date().toISOString();
  }

  /**
   * Get current metrics
   */
  static getMetrics(): MetricsStore {
    return { ...this.metrics };
  }

  /**
   * Get metrics by source type
   */
  static getMetricsBySourceType(sourceType: SourceType): SourceTypeMetrics | null {
    return this.metrics.bySourceType[sourceType] || null;
  }

  /**
   * Get success rate
   */
  static getSuccessRate(): number {
    if (this.metrics.totalIngestions === 0) return 0;
    return (this.metrics.successfulIngestions / this.metrics.totalIngestions) * 100;
  }

  /**
   * Get intelligence generation rate
   */
  static getIntelligenceRate(): number {
    if (this.metrics.totalIngestions === 0) return 0;
    return (this.metrics.totalIntelligenceGenerated / this.metrics.totalIngestions) * 100;
  }

  /**
   * Reset metrics
   */
  static reset(): void {
    this.metrics = {
      totalIngestions: 0,
      successfulIngestions: 0,
      failedIngestions: 0,
      bySourceType: {},
      averageProcessingTime: 0,
      totalIntelligenceGenerated: 0,
      totalControlTowerUpdates: 0,
      totalExecutionTasksCreated: 0,
      totalPredictionsGenerated: 0,
      totalAdjustmentsGenerated: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get metrics summary
   */
  static getSummary(): MetricsSummary {
    return {
      totalIngestions: this.metrics.totalIngestions,
      successRate: this.getSuccessRate(),
      intelligenceRate: this.getIntelligenceRate(),
      averageProcessingTime: this.metrics.averageProcessingTime,
      executionTasksCreated: this.metrics.totalExecutionTasksCreated,
      predictionsGenerated: this.metrics.totalPredictionsGenerated,
      adjustmentsGenerated: this.metrics.totalAdjustmentsGenerated,
      controlTowerUpdates: this.metrics.totalControlTowerUpdates,
    };
  }

  /**
   * Log metrics to console
   */
  static logMetrics(): void {
    const summary = this.getSummary();
    console.log('=== Slice Metrics Summary ===');
    console.log(`Total Ingestions: ${summary.totalIngestions}`);
    console.log(`Success Rate: ${summary.successRate.toFixed(2)}%`);
    console.log(`Intelligence Rate: ${summary.intelligenceRate.toFixed(2)}%`);
    console.log(`Avg Processing Time: ${summary.averageProcessingTime.toFixed(2)}ms`);
    console.log(`Execution Tasks Created: ${summary.executionTasksCreated}`);
    console.log(`Predictions Generated: ${summary.predictionsGenerated}`);
    console.log(`Adjustments Generated: ${summary.adjustmentsGenerated}`);
    console.log(`Control Tower Updates: ${summary.controlTowerUpdates}`);
    console.log('============================');
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface MetricsStore {
  totalIngestions: number;
  successfulIngestions: number;
  failedIngestions: number;
  bySourceType: Record<string, SourceTypeMetrics>;
  averageProcessingTime: number;
  totalIntelligenceGenerated: number;
  totalControlTowerUpdates: number;
  totalExecutionTasksCreated: number;
  totalPredictionsGenerated: number;
  totalAdjustmentsGenerated: number;
  lastUpdated: string;
}

interface SourceTypeMetrics {
  total: number;
  successful: number;
  failed: number;
  averageProcessingTime: number;
}

interface MetricsSummary {
  totalIngestions: number;
  successRate: number;
  intelligenceRate: number;
  averageProcessingTime: number;
  executionTasksCreated: number;
  predictionsGenerated: number;
  adjustmentsGenerated: number;
  controlTowerUpdates: number;
}
