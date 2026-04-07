/**
 * Phase 18 Validation - Vertical Slice Integration
 * 
 * Purpose: Validate end-to-end vertical slice functionality
 * Tests: Ingestion → Intelligence → Control Tower → Execution → Prediction → Adjustment
 */

import type { IngestionRequest, IngestionResult } from '../types/source';
import { SliceOrchestrator } from '../slices/sliceOrchestrator';
import { SliceMetrics } from '../observability/sliceMetrics';

// ============================================================================
// VALIDATION SUITE
// ============================================================================

export class Phase18Validator {
  /**
   * Run complete validation suite
   */
  static async validate(): Promise<ValidationReport> {
    console.log('Starting Phase 18 Validation...\n');

    const report: ValidationReport = {
      passed: true,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      results: [],
      timestamp: new Date().toISOString(),
    };

    // Initialize orchestrator
    SliceOrchestrator.initialize();

    // Test each vertical slice
    await this.testBloodworkSlice(report);
    await this.testWorkoutSlice(report);
    await this.testRecoverySlice(report);
    await this.testBodyCompositionSlice(report);
    await this.testNutritionSlice(report);
    await this.testSupplementsSlice(report);
    await this.testDailyInterviewSlice(report);
    await this.testExecutionSlice(report);

    // Test metrics
    this.testMetrics(report);

    // Calculate final results
    report.passed = report.failedTests === 0;

    console.log('\n=== Phase 18 Validation Report ===');
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.passedTests}`);
    console.log(`Failed: ${report.failedTests}`);
    console.log(`Success Rate: ${((report.passedTests / report.totalTests) * 100).toFixed(2)}%`);
    console.log('===================================\n');

    return report;
  }

  /**
   * Test bloodwork vertical slice
   */
  private static async testBloodworkSlice(report: ValidationReport): Promise<void> {
    const testName = 'Bloodwork Vertical Slice';
    console.log(`Testing: ${testName}`);

    try {
      const request: IngestionRequest = {
        userId: 'test-user',
        sourceType: 'bloodwork',
        sourceSystem: 'upload',
        effectiveDate: '2024-01-15',
        rawData: {
          labName: 'Quest Diagnostics',
          testDate: '2024-01-15',
          biomarkers: [
            { name: 'Vitamin D', value: 25, unit: 'ng/mL', referenceRange: { min: 30, max: 100 }, status: 'low' },
            { name: 'Total Cholesterol', value: 220, unit: 'mg/dL', referenceRange: { min: 0, max: 200 }, status: 'high' },
          ],
        },
      };

      const result = await SliceOrchestrator.processIngestion(request);

      // Validate result
      this.assert(result.success, 'Ingestion succeeded', report);
      this.assert(result.intelligenceGenerated, 'Intelligence generated', report);
      this.assert(result.controlTowerUpdated, 'Control Tower updated', report);
      this.assert(result.executionTasksCreated > 0, 'Execution tasks created', report);
      this.assert(result.predictionsGenerated > 0, 'Predictions generated', report);
      this.assert(result.adjustmentsGenerated > 0, 'Adjustments generated', report);

      console.log(`✓ ${testName} passed\n`);
    } catch (error) {
      this.recordFailure(testName, `Error: ${error}`, report);
      console.log(`✗ ${testName} failed: ${error}\n`);
    }
  }

  /**
   * Test workout vertical slice
   */
  private static async testWorkoutSlice(report: ValidationReport): Promise<void> {
    const testName = 'Workout Vertical Slice';
    console.log(`Testing: ${testName}`);

    try {
      const request: IngestionRequest = {
        userId: 'test-user',
        sourceType: 'workoutProgram',
        sourceSystem: 'upload',
        effectiveDate: '2024-01-15',
        rawData: {
          programName: 'Push Pull Legs',
          duration: 12,
          frequency: 6,
          focus: ['strength', 'hypertrophy'],
          exercises: [
            { name: 'Bench Press', sets: 4, reps: '8-10', rest: 120 },
            { name: 'Squats', sets: 4, reps: '6-8', rest: 180 },
          ],
        },
      };

      const result = await SliceOrchestrator.processIngestion(request);

      this.assert(result.success, 'Ingestion succeeded', report);
      this.assert(result.intelligenceGenerated, 'Intelligence generated', report);
      this.assert(result.executionTasksCreated >= 4, 'Workout sessions created', report);
      this.assert(result.predictionsGenerated > 0, 'Predictions generated', report);

      console.log(`✓ ${testName} passed\n`);
    } catch (error) {
      this.recordFailure(testName, `Error: ${error}`, report);
      console.log(`✗ ${testName} failed: ${error}\n`);
    }
  }

  /**
   * Test recovery vertical slice
   */
  private static async testRecoverySlice(report: ValidationReport): Promise<void> {
    const testName = 'Recovery + Device Vertical Slice';
    console.log(`Testing: ${testName}`);

    try {
      const request: IngestionRequest = {
        userId: 'test-user',
        sourceType: 'device',
        sourceSystem: 'whoop',
        effectiveDate: '2024-01-15',
        rawData: {
          hrv: 35,
          restingHR: 58,
          sleep: { duration: 6.5, quality: 55 },
          recovery: { score: 45, strain: 14 },
        },
      };

      const result = await SliceOrchestrator.processIngestion(request);

      this.assert(result.success, 'Ingestion succeeded', report);
      this.assert(result.intelligenceGenerated, 'Intelligence generated', report);
      this.assert(result.predictionsGenerated > 0, 'Predictions generated', report);
      this.assert(result.adjustmentsGenerated > 0, 'Adjustments generated', report);

      console.log(`✓ ${testName} passed\n`);
    } catch (error) {
      this.recordFailure(testName, `Error: ${error}`, report);
      console.log(`✗ ${testName} failed: ${error}\n`);
    }
  }

  /**
   * Test body composition slice
   */
  private static async testBodyCompositionSlice(report: ValidationReport): Promise<void> {
    const testName = 'Body Composition Vertical Slice';
    console.log(`Testing: ${testName}`);

    try {
      const request: IngestionRequest = {
        userId: 'test-user',
        sourceType: 'bodyComposition',
        sourceSystem: 'upload',
        effectiveDate: '2024-01-15',
        rawData: {
          weight: 185,
          bodyFat: 15.5,
          muscleMass: 156,
          measurementMethod: 'dexa',
        },
      };

      const result = await SliceOrchestrator.processIngestion(request);

      this.assert(result.success, 'Ingestion succeeded', report);
      this.assert(result.intelligenceGenerated, 'Intelligence generated', report);

      console.log(`✓ ${testName} passed\n`);
    } catch (error) {
      this.recordFailure(testName, `Error: ${error}`, report);
      console.log(`✗ ${testName} failed: ${error}\n`);
    }
  }

  /**
   * Test nutrition slice
   */
  private static async testNutritionSlice(report: ValidationReport): Promise<void> {
    const testName = 'Nutrition Vertical Slice';
    console.log(`Testing: ${testName}`);

    try {
      const request: IngestionRequest = {
        userId: 'test-user',
        sourceType: 'nutrition',
        sourceSystem: 'manual',
        effectiveDate: '2024-01-15',
        rawData: {
          dailyTotals: { protein: 180, carbs: 250, fat: 70, calories: 2300 },
        },
      };

      const result = await SliceOrchestrator.processIngestion(request);

      this.assert(result.success, 'Ingestion succeeded', report);
      this.assert(result.intelligenceGenerated, 'Intelligence generated', report);

      console.log(`✓ ${testName} passed\n`);
    } catch (error) {
      this.recordFailure(testName, `Error: ${error}`, report);
      console.log(`✗ ${testName} failed: ${error}\n`);
    }
  }

  /**
   * Test supplements slice
   */
  private static async testSupplementsSlice(report: ValidationReport): Promise<void> {
    const testName = 'Supplements Vertical Slice';
    console.log(`Testing: ${testName}`);

    try {
      const request: IngestionRequest = {
        userId: 'test-user',
        sourceType: 'supplements',
        sourceSystem: 'manual',
        effectiveDate: '2024-01-15',
        rawData: {
          supplements: [
            { name: 'Vitamin D', dosage: '5000 IU', timing: 'morning', taken: true },
          ],
        },
      };

      const result = await SliceOrchestrator.processIngestion(request);

      this.assert(result.success, 'Ingestion succeeded', report);

      console.log(`✓ ${testName} passed\n`);
    } catch (error) {
      this.recordFailure(testName, `Error: ${error}`, report);
      console.log(`✗ ${testName} failed: ${error}\n`);
    }
  }

  /**
   * Test daily interview slice
   */
  private static async testDailyInterviewSlice(report: ValidationReport): Promise<void> {
    const testName = 'Daily Interview Vertical Slice';
    console.log(`Testing: ${testName}`);

    try {
      const request: IngestionRequest = {
        userId: 'test-user',
        sourceType: 'dailyInterview',
        sourceSystem: 'ai_interview',
        effectiveDate: '2024-01-15',
        rawData: {
          responses: [
            { question: 'How do you feel today?', answer: 'Energized', category: 'energy' },
          ],
        },
      };

      const result = await SliceOrchestrator.processIngestion(request);

      this.assert(result.success, 'Ingestion succeeded', report);

      console.log(`✓ ${testName} passed\n`);
    } catch (error) {
      this.recordFailure(testName, `Error: ${error}`, report);
      console.log(`✗ ${testName} failed: ${error}\n`);
    }
  }

  /**
   * Test execution slice
   */
  private static async testExecutionSlice(report: ValidationReport): Promise<void> {
    const testName = 'Execution Vertical Slice';
    console.log(`Testing: ${testName}`);

    try {
      const request: IngestionRequest = {
        userId: 'test-user',
        sourceType: 'execution',
        sourceSystem: 'execution_tracker',
        effectiveDate: '2024-01-15',
        rawData: {
          taskId: 'task-123',
          domain: 'workout',
          status: 'completed',
          completedAt: '2024-01-15T10:30:00Z',
        },
      };

      const result = await SliceOrchestrator.processIngestion(request);

      this.assert(result.success, 'Ingestion succeeded', report);
      this.assert(result.predictionsGenerated > 0, 'Predictions generated', report);

      console.log(`✓ ${testName} passed\n`);
    } catch (error) {
      this.recordFailure(testName, `Error: ${error}`, report);
      console.log(`✗ ${testName} failed: ${error}\n`);
    }
  }

  /**
   * Test metrics tracking
   */
  private static testMetrics(report: ValidationReport): void {
    const testName = 'Metrics Tracking';
    console.log(`Testing: ${testName}`);

    try {
      const metrics = SliceMetrics.getMetrics();
      const summary = SliceMetrics.getSummary();

      this.assert(metrics.totalIngestions > 0, 'Metrics tracked ingestions', report);
      this.assert(summary.successRate > 0, 'Success rate calculated', report);

      console.log(`✓ ${testName} passed\n`);
    } catch (error) {
      this.recordFailure(testName, `Error: ${error}`, report);
      console.log(`✗ ${testName} failed: ${error}\n`);
    }
  }

  /**
   * Assert a condition
   */
  private static assert(condition: boolean, testName: string, report: ValidationReport): void {
    report.totalTests++;

    if (condition) {
      report.passedTests++;
      report.results.push({ test: testName, passed: true });
    } else {
      report.failedTests++;
      report.results.push({ test: testName, passed: false, error: 'Assertion failed' });
    }
  }

  /**
   * Record a test failure
   */
  private static recordFailure(testName: string, error: string, report: ValidationReport): void {
    report.totalTests++;
    report.failedTests++;
    report.results.push({ test: testName, passed: false, error });
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface ValidationReport {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: ValidationResult[];
  timestamp: string;
}

interface ValidationResult {
  test: string;
  passed: boolean;
  error?: string;
}
