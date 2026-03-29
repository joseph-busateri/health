// Phase 2 Systems Validation Script
// Validates body composition, workout, and supplement systems

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  system: string;
  component: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: string;
}

const results: ValidationResult[] = [];

// Helper function to check if file exists
function checkFileExists(filePath: string, description: string, system: string): boolean {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  results.push({
    system,
    component: 'File Existence',
    status: exists ? 'PASS' : 'FAIL',
    message: `${description}: ${exists ? 'Found' : 'Missing'}`,
    details: filePath,
  });
  
  return exists;
}

// Helper function to check file size
function checkFileSize(filePath: string, minLines: number, description: string, system: string): void {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return; // Already reported as missing
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n').length;
  const passed = lines >= minLines;
  
  results.push({
    system,
    component: 'File Size',
    status: passed ? 'PASS' : 'WARNING',
    message: `${description}: ${lines} lines (expected ≥${minLines})`,
    details: filePath,
  });
}

// Helper function to check for required exports
function checkExports(filePath: string, requiredExports: string[], description: string, system: string): void {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return; // Already reported as missing
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const missingExports: string[] = [];
  
  for (const exportName of requiredExports) {
    const exportPattern = new RegExp(`export.*${exportName}`, 'i');
    if (!exportPattern.test(content)) {
      missingExports.push(exportName);
    }
  }
  
  results.push({
    system,
    component: 'Exports',
    status: missingExports.length === 0 ? 'PASS' : 'FAIL',
    message: `${description}: ${missingExports.length === 0 ? 'All exports found' : `Missing: ${missingExports.join(', ')}`}`,
    details: filePath,
  });
}

// Helper function to check for imports
function checkImports(filePath: string, requiredImports: string[], description: string, system: string): void {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return; // Already reported as missing
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const missingImports: string[] = [];
  
  for (const importName of requiredImports) {
    const importPattern = new RegExp(`import.*${importName}`, 'i');
    if (!importPattern.test(content)) {
      missingImports.push(importName);
    }
  }
  
  results.push({
    system,
    component: 'Imports',
    status: missingImports.length === 0 ? 'PASS' : 'WARNING',
    message: `${description}: ${missingImports.length === 0 ? 'All imports found' : `Missing: ${missingImports.join(', ')}`}`,
    details: filePath,
  });
}

console.log('='.repeat(80));
console.log('PHASE 2 SYSTEMS VALIDATION');
console.log('='.repeat(80));
console.log('');

// ============================================================================
// BODY COMPOSITION SYSTEM VALIDATION
// ============================================================================

console.log('Validating Body Composition System...');
console.log('-'.repeat(80));

// Schema
checkFileExists('migrations/20260329_create_body_composition_schema.sql', 'Schema Migration', 'Body Composition');
checkFileSize('migrations/20260329_create_body_composition_schema.sql', 300, 'Schema Migration', 'Body Composition');

// Types
checkFileExists('types/bodyComposition.ts', 'Type Definitions', 'Body Composition');
checkFileSize('types/bodyComposition.ts', 400, 'Type Definitions', 'Body Composition');
checkExports('types/bodyComposition.ts', [
  'BodyCompositionScan',
  'BodyCompositionDocument',
  'BodyCompositionGoal',
  'BodyCompositionTrend',
  'CreateBodyCompositionScanInput',
], 'Type Definitions', 'Body Composition');

// Service
checkFileExists('services/bodyCompositionService.ts', 'Service Layer', 'Body Composition');
checkFileSize('services/bodyCompositionService.ts', 400, 'Service Layer', 'Body Composition');
checkExports('services/bodyCompositionService.ts', [
  'uploadBodyCompositionDocument',
  'createBodyCompositionScan',
  'getLatestBodyComposition',
  'getBodyCompositionTrends',
  'createBodyCompositionGoal',
  'detectAnomalies',
], 'Service Layer', 'Body Composition');

// Parser
checkFileExists('utils/inbodyParser.ts', 'InBody Parser', 'Body Composition');
checkFileSize('utils/inbodyParser.ts', 200, 'InBody Parser', 'Body Composition');
checkExports('utils/inbodyParser.ts', ['parseInBodyScan'], 'InBody Parser', 'Body Composition');

// Controller
checkFileExists('controllers/bodyCompositionController.ts', 'Controller', 'Body Composition');
checkFileSize('controllers/bodyCompositionController.ts', 200, 'Controller', 'Body Composition');
checkExports('controllers/bodyCompositionController.ts', [
  'uploadBodyCompositionDocumentHandler',
  'getLatestBodyCompositionHandler',
  'getBodyCompositionTrendsHandler',
  'createBodyCompositionGoalHandler',
  'detectAnomaliesHandler',
], 'Controller', 'Body Composition');

// Routes
checkFileExists('routes/bodyCompositionRoutes.ts', 'Routes', 'Body Composition');
checkFileSize('routes/bodyCompositionRoutes.ts', 30, 'Routes', 'Body Composition');

// ============================================================================
// WORKOUT SYSTEM VALIDATION
// ============================================================================

console.log('');
console.log('Validating Workout System...');
console.log('-'.repeat(80));

// Schema
checkFileExists('migrations/20260329_create_workout_schema.sql', 'Schema Migration', 'Workout');
checkFileSize('migrations/20260329_create_workout_schema.sql', 300, 'Schema Migration', 'Workout');

// Types
checkFileExists('types/workoutBaseline.ts', 'Type Definitions', 'Workout');
checkFileSize('types/workoutBaseline.ts', 300, 'Type Definitions', 'Workout');
checkExports('types/workoutBaseline.ts', [
  'TrainingCycle',
  'WorkoutPlanVersion',
  'WorkoutSplitDay',
  'WorkoutExercise',
  'WorkoutExecutionLog',
], 'Type Definitions', 'Workout');

// Service
checkFileExists('services/workoutBaselineService.ts', 'Service Layer', 'Workout');
checkFileSize('services/workoutBaselineService.ts', 500, 'Service Layer', 'Workout');
checkExports('services/workoutBaselineService.ts', [
  'uploadWorkoutBaselineDocument',
  'createTrainingCycle',
  'getCurrentTrainingCycle',
  'createWorkoutPlanVersion',
  'getCurrentWorkoutPlan',
  'logWorkoutExecution',
], 'Service Layer', 'Workout');

// Parser
checkFileExists('utils/workoutExcelParser.ts', 'Excel Parser', 'Workout');
checkFileSize('utils/workoutExcelParser.ts', 150, 'Excel Parser', 'Workout');
checkExports('utils/workoutExcelParser.ts', ['parseWorkoutExcel'], 'Excel Parser', 'Workout');

// Controller
checkFileExists('controllers/workoutBaselineController.ts', 'Controller', 'Workout');
checkFileSize('controllers/workoutBaselineController.ts', 150, 'Controller', 'Workout');
checkExports('controllers/workoutBaselineController.ts', [
  'uploadWorkoutDocumentHandler',
  'createTrainingCycleHandler',
  'getCurrentWorkoutPlanHandler',
  'logWorkoutExecutionHandler',
], 'Controller', 'Workout');

// Routes
checkFileExists('routes/workoutBaselineRoutes.ts', 'Routes', 'Workout');
checkFileSize('routes/workoutBaselineRoutes.ts', 25, 'Routes', 'Workout');

// ============================================================================
// SUPPLEMENT SYSTEM VALIDATION
// ============================================================================

console.log('');
console.log('Validating Supplement System...');
console.log('-'.repeat(80));

// Schema
checkFileExists('migrations/20260329_create_supplement_schema.sql', 'Schema Migration', 'Supplement');
checkFileSize('migrations/20260329_create_supplement_schema.sql', 500, 'Schema Migration', 'Supplement');

// Types
checkFileExists('types/supplementBaseline.ts', 'Type Definitions', 'Supplement');
checkFileSize('types/supplementBaseline.ts', 350, 'Type Definitions', 'Supplement');
checkExports('types/supplementBaseline.ts', [
  'SupplementStackVersion',
  'Supplement',
  'SupplementAdherenceLog',
  'SupplementStackChange',
  'SupplementInteraction',
], 'Type Definitions', 'Supplement');

// Service
checkFileExists('services/supplementBaselineService.ts', 'Service Layer', 'Supplement');
checkFileSize('services/supplementBaselineService.ts', 450, 'Service Layer', 'Supplement');
checkExports('services/supplementBaselineService.ts', [
  'uploadSupplementBaselineDocument',
  'createSupplementStackVersion',
  'getCurrentSupplementStack',
  'logSupplementAdherence',
  'checkSupplementInteractions',
  'getReorderAlerts',
], 'Service Layer', 'Supplement');

// Parser
checkFileExists('utils/supplementExcelParser.ts', 'Excel Parser', 'Supplement');
checkFileSize('utils/supplementExcelParser.ts', 150, 'Excel Parser', 'Supplement');
checkExports('utils/supplementExcelParser.ts', ['parseSupplementExcel'], 'Excel Parser', 'Supplement');

// Controller
checkFileExists('controllers/supplementBaselineController.ts', 'Controller', 'Supplement');
checkFileSize('controllers/supplementBaselineController.ts', 200, 'Controller', 'Supplement');
checkExports('controllers/supplementBaselineController.ts', [
  'uploadSupplementDocumentHandler',
  'createSupplementStackVersionHandler',
  'getCurrentSupplementStackHandler',
  'logSupplementAdherenceHandler',
  'checkSupplementInteractionsHandler',
], 'Controller', 'Supplement');

// Routes
checkFileExists('routes/supplementBaselineRoutes.ts', 'Routes', 'Supplement');
checkFileSize('routes/supplementBaselineRoutes.ts', 30, 'Routes', 'Supplement');

// ============================================================================
// SERVER INTEGRATION VALIDATION
// ============================================================================

console.log('');
console.log('Validating Server Integration...');
console.log('-'.repeat(80));

checkFileExists('index.ts', 'Server Index', 'Integration');
checkImports('index.ts', [
  'bodyCompositionRoutes',
  'workoutBaselineRoutes',
  'supplementBaselineRoutes',
], 'Server Index Imports', 'Integration');

// Check route registrations
const indexPath = path.join(__dirname, '..', 'index.ts');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  const routeRegistrations = [
    { route: 'bodyCompositionRoutes', pattern: /app\.use\([^)]*bodyCompositionRoutes\)/ },
    { route: 'workoutBaselineRoutes', pattern: /app\.use\([^)]*workoutBaselineRoutes\)/ },
    { route: 'supplementBaselineRoutes', pattern: /app\.use\([^)]*supplementBaselineRoutes\)/ },
  ];
  
  for (const { route, pattern } of routeRegistrations) {
    const registered = pattern.test(indexContent);
    results.push({
      system: 'Integration',
      component: 'Route Registration',
      status: registered ? 'PASS' : 'FAIL',
      message: `${route}: ${registered ? 'Registered' : 'Not registered'}`,
      details: 'index.ts',
    });
  }
}

// ============================================================================
// GENERATE REPORT
// ============================================================================

console.log('');
console.log('='.repeat(80));
console.log('VALIDATION RESULTS');
console.log('='.repeat(80));
console.log('');

const systems = ['Body Composition', 'Workout', 'Supplement', 'Integration'];

for (const system of systems) {
  const systemResults = results.filter(r => r.system === system);
  const passed = systemResults.filter(r => r.status === 'PASS').length;
  const failed = systemResults.filter(r => r.status === 'FAIL').length;
  const warnings = systemResults.filter(r => r.status === 'WARNING').length;
  
  console.log(`${system} System:`);
  console.log(`  ✅ PASS: ${passed}`);
  console.log(`  ❌ FAIL: ${failed}`);
  console.log(`  ⚠️  WARNING: ${warnings}`);
  console.log('');
}

console.log('-'.repeat(80));
console.log('');

// Show failures
const failures = results.filter(r => r.status === 'FAIL');
if (failures.length > 0) {
  console.log('FAILURES:');
  for (const failure of failures) {
    console.log(`  ❌ [${failure.system}] ${failure.component}: ${failure.message}`);
    if (failure.details) {
      console.log(`     ${failure.details}`);
    }
  }
  console.log('');
}

// Show warnings
const warnings = results.filter(r => r.status === 'WARNING');
if (warnings.length > 0) {
  console.log('WARNINGS:');
  for (const warning of warnings) {
    console.log(`  ⚠️  [${warning.system}] ${warning.component}: ${warning.message}`);
    if (warning.details) {
      console.log(`     ${warning.details}`);
    }
  }
  console.log('');
}

// Overall summary
const totalPassed = results.filter(r => r.status === 'PASS').length;
const totalFailed = results.filter(r => r.status === 'FAIL').length;
const totalWarnings = results.filter(r => r.status === 'WARNING').length;
const totalChecks = results.length;

console.log('='.repeat(80));
console.log('OVERALL SUMMARY');
console.log('='.repeat(80));
console.log(`Total Checks: ${totalChecks}`);
console.log(`✅ Passed: ${totalPassed} (${((totalPassed / totalChecks) * 100).toFixed(1)}%)`);
console.log(`❌ Failed: ${totalFailed} (${((totalFailed / totalChecks) * 100).toFixed(1)}%)`);
console.log(`⚠️  Warnings: ${totalWarnings} (${((totalWarnings / totalChecks) * 100).toFixed(1)}%)`);
console.log('');

if (totalFailed === 0) {
  console.log('🎉 ALL SYSTEMS VALIDATED SUCCESSFULLY!');
} else {
  console.log('❌ VALIDATION FAILED - Please fix the issues above');
  process.exit(1);
}

console.log('='.repeat(80));
