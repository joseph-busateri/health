/**
 * Unit Tests for Sexual Health Engine Service V2
 * Tests trend-aware status determination, evidence building, and recommendation generation
 */

import {
  determineSexualHealthStatusV2,
  buildSexualHealthEvidenceV2,
  buildSexualHealthFallbackRecommendation,
} from '../sexualHealthEngineServiceV2';
import type {
  SexualHealthInputsV2,
  SexualHealthStatus,
} from '../../types/sexualHealthEngineV2';

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('../baselineContextService');
jest.mock('../bloodworkContextService');
jest.mock('../bloodworkTrendService');

// ============================================================================
// TEST DATA
// ============================================================================

const optimalInputs: SexualHealthInputsV2 = {
  recoveryScore: 85,
  stressScore: 25,
  cardiovascularStatus: 'optimal',
  metabolicStatus: 'optimal',
  sleepHours: 8,
  fatigueScore: 20,
  hrv: 65,
  adherenceScore: 90,
  testosteroneTrend: {
    marker_name: 'testosterone',
    trend_direction: 'stable' as const,
    percent_change: 2,
    data_points: 3,
    first_test_date: '2025-01-01',
    latest_test_date: '2025-04-01',
    latest_value: 600,
    prior_value: 588,
  },
  freeTestosteroneTrend: {
    marker_name: 'free testosterone',
    trend_direction: 'improving' as const,
    percent_change: 5,
    data_points: 3,
    first_test_date: '2025-01-01',
    latest_test_date: '2025-04-01',
    latest_value: 15,
    prior_value: 14.3,
  },
};

const moderateInputs: SexualHealthInputsV2 = {
  recoveryScore: 60,
  stressScore: 50,
  cardiovascularStatus: 'optimal',
  metabolicStatus: 'optimal',
  sleepHours: 6.5,
  fatigueScore: 50,
  hrv: 50,
  adherenceScore: 75,
  testosteroneTrend: {
    marker_name: 'testosterone',
    trend_direction: 'stable' as const,
    percent_change: 0,
    data_points: 3,
    first_test_date: '2025-01-01',
    latest_test_date: '2025-04-01',
    latest_value: 500,
    prior_value: 500,
  },
};

const reducedInputs: SexualHealthInputsV2 = {
  recoveryScore: 45,
  stressScore: 70,
  cardiovascularStatus: 'optimal',
  metabolicStatus: 'optimal',
  sleepHours: 5.5,
  fatigueScore: 70,
  hrv: 40,
  adherenceScore: 60,
  testosteroneTrend: {
    marker_name: 'testosterone',
    trend_direction: 'worsening' as const,
    percent_change: 8,
    data_points: 3,
    first_test_date: '2025-01-01',
    latest_test_date: '2025-04-01',
    latest_value: 450,
    prior_value: 489,
  },
};

const highRiskInputs: SexualHealthInputsV2 = {
  recoveryScore: 25,
  stressScore: 85,
  cardiovascularStatus: 'high_risk',
  metabolicStatus: 'high_risk',
  sleepHours: 4,
  fatigueScore: 85,
  hrv: 30,
  adherenceScore: 40,
  testosteroneTrend: {
    marker_name: 'testosterone',
    trend_direction: 'worsening' as const,
    percent_change: 15,
    data_points: 3,
    first_test_date: '2025-01-01',
    latest_test_date: '2025-04-01',
    latest_value: 400,
    prior_value: 471,
  },
  freeTestosteroneTrend: {
    marker_name: 'free testosterone',
    trend_direction: 'worsening' as const,
    percent_change: 12,
    data_points: 3,
    first_test_date: '2025-01-01',
    latest_test_date: '2025-04-01',
    latest_value: 10,
    prior_value: 11.4,
  },
};

const testosteroneMetrics = {
  totalTestosterone: 600,
  freeTestosterone: 15,
  testosteroneStatus: 'optimal' as const,
};

// ============================================================================
// UNIT TESTS: determineSexualHealthStatusV2
// ============================================================================

describe('determineSexualHealthStatusV2', () => {
  it('should return optimal status for healthy inputs with stable/improving trends', () => {
    const status = determineSexualHealthStatusV2(optimalInputs, testosteroneMetrics);
    expect(status).toBe('optimal');
  });

  it('should return moderate status for mixed signals', () => {
    const status = determineSexualHealthStatusV2(moderateInputs, testosteroneMetrics);
    expect(status).toBe('moderate');
  });

  it('should return reduced status for concerning signals', () => {
    const status = determineSexualHealthStatusV2(reducedInputs, testosteroneMetrics);
    expect(status).toBe('reduced');
  });

  it('should return high_risk status for multiple severe signals', () => {
    const status = determineSexualHealthStatusV2(highRiskInputs, testosteroneMetrics);
    expect(status).toBe('high_risk');
  });

  it('should increase risk when testosterone trend is worsening significantly (>10%)', () => {
    const inputsWithWorseningTrend = {
      ...moderateInputs,
      testosteroneTrend: {
        marker_name: 'testosterone',
        trend_direction: 'worsening' as const,
        percent_change: 12,
        data_points: 3,
        first_test_date: '2025-01-01',
        latest_test_date: '2025-04-01',
        latest_value: 440,
        prior_value: 500,
      },
    };
    const status = determineSexualHealthStatusV2(inputsWithWorseningTrend, testosteroneMetrics);
    expect(status).toBe('reduced');
  });

  it('should not increase risk when testosterone trend is worsening but <10%', () => {
    const inputsWithSlightWorsening = {
      ...moderateInputs,
      testosteroneTrend: {
        marker_name: 'testosterone',
        trend_direction: 'worsening' as const,
        percent_change: 5,
        data_points: 3,
        first_test_date: '2025-01-01',
        latest_test_date: '2025-04-01',
        latest_value: 475,
        prior_value: 500,
      },
    };
    const status = determineSexualHealthStatusV2(inputsWithSlightWorsening, testosteroneMetrics);
    expect(status).toBe('moderate');
  });

  it('should handle missing trend data gracefully', () => {
    const inputsWithoutTrends = {
      ...moderateInputs,
      testosteroneTrend: undefined,
      freeTestosteroneTrend: undefined,
    };
    const status = determineSexualHealthStatusV2(inputsWithoutTrends, testosteroneMetrics);
    expect(status).toBe('moderate');
  });

  it('should handle insufficient_data trend direction', () => {
    const inputsWithInsufficientData = {
      ...moderateInputs,
      testosteroneTrend: {
        marker_name: 'testosterone',
        trend_direction: 'insufficient_data' as const,
        percent_change: undefined,
        data_points: 1,
        first_test_date: '2025-04-01',
        latest_test_date: '2025-04-01',
        latest_value: 500,
        prior_value: 500,
      },
    };
    const status = determineSexualHealthStatusV2(inputsWithInsufficientData, testosteroneMetrics);
    expect(status).toBe('moderate');
  });
});

// ============================================================================
// UNIT TESTS: buildSexualHealthEvidenceV2
// ============================================================================

describe('buildSexualHealthEvidenceV2', () => {
  it('should build evidence with trend signals when trends available', () => {
    const evidence = buildSexualHealthEvidenceV2(optimalInputs, 'optimal');
    
    expect(evidence).toBeDefined();
    expect(evidence.sexualHealthStatus).toBe('optimal');
    expect(evidence.signals).toBeDefined();
    expect(evidence.trendMetadata).toBeDefined();
    
    // Check trend signals
    const testosteroneTrendSignal = evidence.signals.find(s => s.name === 'Testosterone Trend');
    expect(testosteroneTrendSignal).toBeDefined();
    expect(testosteroneTrendSignal?.trendDirection).toBe('stable');
    expect(testosteroneTrendSignal?.trendPercentChange).toBe(2);
    
    const freeTestosteroneTrendSignal = evidence.signals.find(s => s.name === 'Free Testosterone Trend');
    expect(freeTestosteroneTrendSignal).toBeDefined();
    expect(freeTestosteroneTrendSignal?.trendDirection).toBe('improving');
  });

  it('should build evidence without trend signals when trends unavailable', () => {
    const inputsWithoutTrends = {
      ...optimalInputs,
      testosteroneTrend: undefined,
      freeTestosteroneTrend: undefined,
    };
    const evidence = buildSexualHealthEvidenceV2(inputsWithoutTrends, 'optimal');
    
    expect(evidence).toBeDefined();
    expect(evidence.trendMetadata).toBeDefined();
    expect(Object.keys(evidence.trendMetadata || {}).length).toBe(0);
    
    const testosteroneTrendSignal = evidence.signals.find(s => s.name === 'Testosterone Trend');
    expect(testosteroneTrendSignal).toBeUndefined();
  });

  it('should include trend metadata for quick access', () => {
    const evidence = buildSexualHealthEvidenceV2(optimalInputs, 'optimal');
    
    expect(evidence.trendMetadata?.testosterone).toBeDefined();
    expect(evidence.trendMetadata?.testosterone?.direction).toBe('stable');
    expect(evidence.trendMetadata?.testosterone?.percentChange).toBe(2);
    expect(evidence.trendMetadata?.testosterone?.dataPoints).toBe(3);
    expect(evidence.trendMetadata?.testosterone?.timespanDays).toBeGreaterThan(0);
    
    expect(evidence.trendMetadata?.freeTestosterone).toBeDefined();
    expect(evidence.trendMetadata?.freeTestosterone?.direction).toBe('improving');
  });

  it('should calculate timespan days correctly', () => {
    const evidence = buildSexualHealthEvidenceV2(optimalInputs, 'optimal');
    
    // From 2025-01-01 to 2025-04-01 is 90 days
    expect(evidence.trendMetadata?.testosterone?.timespanDays).toBe(90);
  });

  it('should include non-trend signals (recovery, stress, sleep, etc.)', () => {
    const evidence = buildSexualHealthEvidenceV2(optimalInputs, 'optimal');
    
    expect(evidence.signals.some(s => s.name === 'Recovery Score')).toBe(true);
    expect(evidence.signals.some(s => s.name === 'Stress Score')).toBe(true);
    expect(evidence.signals.some(s => s.name === 'Sleep Hours')).toBe(true);
    expect(evidence.signals.some(s => s.name === 'Fatigue Score')).toBe(true);
  });

  it('should handle worsening trends with appropriate interpretation', () => {
    const evidence = buildSexualHealthEvidenceV2(reducedInputs, 'reduced');
    
    const testosteroneTrendSignal = evidence.signals.find(s => s.name === 'Testosterone Trend');
    expect(testosteroneTrendSignal?.interpretation).toContain('declining');
    expect(testosteroneTrendSignal?.interpretation).toContain('early warning');
  });

  it('should handle improving trends with appropriate interpretation', () => {
    const evidence = buildSexualHealthEvidenceV2(optimalInputs, 'optimal');
    
    const freeTestosteroneTrendSignal = evidence.signals.find(s => s.name === 'Free Testosterone Trend');
    expect(freeTestosteroneTrendSignal?.interpretation).toContain('improving');
  });
});

// ============================================================================
// UNIT TESTS: buildSexualHealthFallbackRecommendation
// ============================================================================

describe('buildSexualHealthFallbackRecommendation', () => {
  it('should return critical priority for high_risk status', () => {
    const recommendation = buildSexualHealthFallbackRecommendation('high_risk');
    
    expect(recommendation.type).toBe('sexual_health');
    expect(recommendation.priority).toBe('critical');
    expect(recommendation.source).toBe('deterministic');
    expect(recommendation.actions).toContain('Focus on recovery and stress reduction');
  });

  it('should return important priority for reduced status', () => {
    const recommendation = buildSexualHealthFallbackRecommendation('reduced');
    
    expect(recommendation.priority).toBe('important');
    expect(recommendation.actions).toContain('Reduce training strain');
  });

  it('should return important priority for moderate status', () => {
    const recommendation = buildSexualHealthFallbackRecommendation('moderate');
    
    expect(recommendation.priority).toBe('important');
    expect(recommendation.actions).toContain('Improve sleep quality');
  });

  it('should return optimization priority for optimal status', () => {
    const recommendation = buildSexualHealthFallbackRecommendation('optimal');
    
    expect(recommendation.priority).toBe('optimization');
    expect(recommendation.actions).toContain('Maintain recovery practices');
  });

  it('should include appropriate actions for high_risk status', () => {
    const recommendation = buildSexualHealthFallbackRecommendation('high_risk');
    
    expect(recommendation.actions).toContain('Consider medical consultation for hormonal assessment');
    expect(recommendation.actions).toContain('Prioritize hydration and nutrition');
  });

  it('should include appropriate summary for each status', () => {
    const highRiskRec = buildSexualHealthFallbackRecommendation('high_risk');
    expect(highRiskRec.summary).toContain('significantly reduced');
    
    const optimalRec = buildSexualHealthFallbackRecommendation('optimal');
    expect(optimalRec.summary).toContain('optimal');
  });
});
