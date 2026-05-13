/**
 * Validation Script for Health Score Detail Inputs
 * 
 * This script validates that all health score detail screens have:
 * 1. Correct input calculations (e.g., Total Cholesterol from LDL + HDL)
 * 2. Correct data sources (e.g., weight from body_composition_scan)
 * 3. All required inputs present in API responses
 * 4. Risk labels properly mapped (90/70/50/30)
 */

import { getCardiovascularToday } from '../services/cardiovascularEngineService';
import { getMetabolicTodayV2 } from '../services/metabolicEngineServiceV2';
import { getJointHealthToday } from '../services/jointHealthEngineService';
import { getSexualHealthTodayV3 } from '../services/sexualHealthEngineServiceV3';
import { logger } from '../utils/logger';

const TEST_USER_ID = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';

interface ValidationResult {
  area: string;
  check: string;
  passed: boolean;
  details: string;
  evidence?: any;
}

const results: ValidationResult[] = [];

async function validateCardiovascular() {
  console.log('\n=== CARDIOVASCULAR SCORE VALIDATION ===\n');
  
  try {
    const cardioData = await getCardiovascularToday(TEST_USER_ID);
    
    if (!cardioData) {
      results.push({
        area: 'Cardiovascular',
        check: 'Data Available',
        passed: false,
        details: 'No cardiovascular data returned',
      });
      return;
    }

    // Check 1: Total Cholesterol calculation
    const hasLDL = cardioData.inputs?.lipidPanel?.ldl !== undefined;
    const hasHDL = cardioData.inputs?.lipidPanel?.hdl !== undefined;
    const hasTotalChol = cardioData.inputs?.lipidPanel?.totalCholesterol !== undefined;
    
    if (hasLDL && hasHDL && hasTotalChol) {
      const ldl = cardioData.inputs.lipidPanel.ldl!;
      const hdl = cardioData.inputs.lipidPanel.hdl!;
      const totalChol = cardioData.inputs.lipidPanel.totalCholesterol!;
      const expectedTotal = ldl + hdl;
      
      results.push({
        area: 'Cardiovascular',
        check: 'Total Cholesterol Calculation',
        passed: Math.abs(totalChol - expectedTotal) < 1,
        details: `LDL: ${ldl}, HDL: ${hdl}, Total: ${totalChol}, Expected: ${expectedTotal}`,
        evidence: { ldl, hdl, totalChol, expectedTotal },
      });
    } else {
      results.push({
        area: 'Cardiovascular',
        check: 'Total Cholesterol Calculation',
        passed: false,
        details: `Missing data - LDL: ${hasLDL}, HDL: ${hasHDL}, Total: ${hasTotalChol}`,
      });
    }

    // Check 2: Total Cholesterol/HDL Ratio
    if (hasTotalChol && hasHDL && cardioData.inputs.lipidPanel.hdl! > 0) {
      const totalChol = cardioData.inputs.lipidPanel.totalCholesterol!;
      const hdl = cardioData.inputs.lipidPanel.hdl!;
      const ratio = cardioData.inputs.lipidPanel.cholesterolRatio;
      const expectedRatio = totalChol / hdl;
      
      results.push({
        area: 'Cardiovascular',
        check: 'Total Cholesterol/HDL Ratio',
        passed: ratio !== undefined && Math.abs(ratio - expectedRatio) < 0.01,
        details: `Total: ${totalChol}, HDL: ${hdl}, Ratio: ${ratio}, Expected: ${expectedRatio.toFixed(2)}`,
        evidence: { totalChol, hdl, ratio, expectedRatio },
      });
    }

    // Check 3: DetailedInputs present
    const hasDetailedInputs = cardioData.detailedInputs && cardioData.detailedInputs.length > 0;
    results.push({
      area: 'Cardiovascular',
      check: 'DetailedInputs Present',
      passed: hasDetailedInputs,
      details: `DetailedInputs count: ${cardioData.detailedInputs?.length || 0}`,
      evidence: { count: cardioData.detailedInputs?.length },
    });

    // Check 4: Total Cholesterol in detailedInputs with correct source
    if (hasDetailedInputs) {
      const totalCholInput = cardioData.detailedInputs!.find(i => i.name === 'Total Cholesterol');
      if (totalCholInput) {
        const isCorrectSource = totalCholInput.source === 'ACTUAL' || totalCholInput.source === 'DERIVED';
        results.push({
          area: 'Cardiovascular',
          check: 'Total Cholesterol Source Tracking',
          passed: isCorrectSource,
          details: `Source: ${totalCholInput.source}, Value: ${totalCholInput.value}`,
          evidence: totalCholInput,
        });
      }
    }

    // Check 5: Risk labels present
    if (hasDetailedInputs) {
      const inputsWithScores = cardioData.detailedInputs!.filter(i => i.score !== undefined);
      const validScores = inputsWithScores.filter(i => 
        i.score === 90 || i.score === 70 || i.score === 50 || i.score === 30
      );
      
      results.push({
        area: 'Cardiovascular',
        check: 'Risk Labels (90/70/50/30)',
        passed: validScores.length > 0,
        details: `${validScores.length}/${inputsWithScores.length} inputs have valid risk scores`,
        evidence: { validScores: validScores.length, totalWithScores: inputsWithScores.length },
      });
    }

  } catch (error) {
    results.push({
      area: 'Cardiovascular',
      check: 'Overall',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function validateMetabolic() {
  console.log('\n=== METABOLIC SCORE VALIDATION ===\n');
  
  try {
    const metabolicData = await getMetabolicTodayV2(TEST_USER_ID);
    
    if (!metabolicData) {
      results.push({
        area: 'Metabolic',
        check: 'Data Available',
        passed: false,
        details: 'No metabolic data returned',
      });
      return;
    }

    // Check 1: Weight source from body_composition_scan
    const hasDetailedInputs = metabolicData.detailedInputs && metabolicData.detailedInputs.length > 0;
    
    if (hasDetailedInputs) {
      const weightInput = metabolicData.detailedInputs!.find(i => i.name === 'Weight');
      
      if (weightInput) {
        const correctSource = weightInput.sourceDetails?.table === 'body_composition_scans';
        results.push({
          area: 'Metabolic',
          check: 'Weight from body_composition_scans',
          passed: correctSource,
          details: `Source table: ${weightInput.sourceDetails?.table}, Field: ${weightInput.sourceDetails?.field}`,
          evidence: weightInput,
        });
      } else {
        results.push({
          area: 'Metabolic',
          check: 'Weight from body_composition_scans',
          passed: false,
          details: 'Weight input not found in detailedInputs',
        });
      }

      // Check 2: All 17 inputs present
      results.push({
        area: 'Metabolic',
        check: 'All 17 Inputs Present',
        passed: metabolicData.detailedInputs!.length >= 17,
        details: `Found ${metabolicData.detailedInputs!.length} inputs (expected 17)`,
        evidence: { count: metabolicData.detailedInputs!.length },
      });

      // Check 3: Risk labels
      const inputsWithScores = metabolicData.detailedInputs!.filter(i => i.score !== undefined);
      const validScores = inputsWithScores.filter(i => 
        i.score === 90 || i.score === 70 || i.score === 50 || i.score === 30
      );
      
      results.push({
        area: 'Metabolic',
        check: 'Risk Labels (90/70/50/30)',
        passed: validScores.length > 0,
        details: `${validScores.length}/${inputsWithScores.length} inputs have valid risk scores`,
        evidence: { validScores: validScores.length, totalWithScores: inputsWithScores.length },
      });
    }

  } catch (error) {
    results.push({
      area: 'Metabolic',
      check: 'Overall',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function validatePerformance() {
  console.log('\n=== PERFORMANCE/JOINT HEALTH SCORE VALIDATION ===\n');
  
  try {
    const jointData = await getJointHealthToday(TEST_USER_ID);
    
    if (!jointData) {
      results.push({
        area: 'Performance',
        check: 'Data Available',
        passed: false,
        details: 'No joint health data returned',
      });
      return;
    }

    // Check 1: Input count
    const hasDetailedInputs = jointData.detailedInputs && jointData.detailedInputs.length > 0;
    const expectedInputs = ['Pain Level', 'Tightness Level', 'Soreness Level', 'Affected Area', 'Workout Load', 'Recovery Score', 'Verbal Notes'];
    
    if (hasDetailedInputs) {
      results.push({
        area: 'Performance',
        check: 'All 7 Core Inputs Present',
        passed: jointData.detailedInputs!.length >= 7,
        details: `Found ${jointData.detailedInputs!.length} inputs (expected 7)`,
        evidence: { 
          count: jointData.detailedInputs!.length,
          inputs: jointData.detailedInputs!.map(i => i.name),
        },
      });

      // Check 2: Age/trainingExperience/weight NOT in calculation
      const hasAge = jointData.detailedInputs!.some(i => i.name.toLowerCase().includes('age'));
      const hasTraining = jointData.detailedInputs!.some(i => i.name.toLowerCase().includes('training'));
      const hasWeight = jointData.detailedInputs!.some(i => i.name.toLowerCase().includes('weight'));
      
      results.push({
        area: 'Performance',
        check: 'Age/Training/Weight NOT in inputs (correct)',
        passed: !hasAge && !hasTraining && !hasWeight,
        details: `Age: ${hasAge}, Training: ${hasTraining}, Weight: ${hasWeight} (should all be false)`,
        evidence: { hasAge, hasTraining, hasWeight },
      });

      // Check 3: Risk labels
      const inputsWithScores = jointData.detailedInputs!.filter(i => i.score !== undefined);
      const validScores = inputsWithScores.filter(i => 
        i.score === 90 || i.score === 70 || i.score === 50 || i.score === 30
      );
      
      results.push({
        area: 'Performance',
        check: 'Risk Labels (90/70/50/30)',
        passed: validScores.length > 0,
        details: `${validScores.length}/${inputsWithScores.length} inputs have valid risk scores`,
        evidence: { validScores: validScores.length, totalWithScores: inputsWithScores.length },
      });
    }

  } catch (error) {
    results.push({
      area: 'Performance',
      check: 'Overall',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function validateSexualHealth() {
  console.log('\n=== SEXUAL HEALTH SCORE VALIDATION ===\n');
  
  try {
    const sexualData = await getSexualHealthTodayV3(TEST_USER_ID);
    
    if (!sexualData) {
      results.push({
        area: 'Sexual Health',
        check: 'Data Available',
        passed: false,
        details: 'No sexual health data returned',
      });
      return;
    }

    // Check 1: DetailedInputs present
    const hasDetailedInputs = sexualData.detailedInputs && sexualData.detailedInputs.length > 0;
    
    results.push({
      area: 'Sexual Health',
      check: 'DetailedInputs Present',
      passed: hasDetailedInputs,
      details: `DetailedInputs count: ${sexualData.detailedInputs?.length || 0}`,
      evidence: { 
        count: sexualData.detailedInputs?.length,
        inputs: sexualData.detailedInputs?.map(i => i.name),
      },
    });

    if (hasDetailedInputs) {
      // Check 2: Input count (should evaluate all 25 available inputs)
      const inputCount = sexualData.detailedInputs!.length;
      results.push({
        area: 'Sexual Health',
        check: 'All Available Inputs Evaluated',
        passed: inputCount >= 20, // At least 20 of 25
        details: `Found ${inputCount} inputs (expected ~25)`,
        evidence: { count: inputCount },
      });

      // Check 3: Risk labels
      const inputsWithScores = sexualData.detailedInputs!.filter(i => i.score !== undefined);
      const validScores = inputsWithScores.filter(i => 
        i.score === 90 || i.score === 70 || i.score === 50 || i.score === 30
      );
      
      results.push({
        area: 'Sexual Health',
        check: 'Risk Labels (90/70/50/30)',
        passed: validScores.length > 0,
        details: `${validScores.length}/${inputsWithScores.length} inputs have valid risk scores`,
        evidence: { validScores: validScores.length, totalWithScores: inputsWithScores.length },
      });
    }

  } catch (error) {
    results.push({
      area: 'Sexual Health',
      check: 'Overall',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function runValidation() {
  console.log('🧪 Health Score Detail Inputs Validation\n');
  console.log(`Testing with User ID: ${TEST_USER_ID}\n`);
  console.log('='.repeat(60));

  await validateCardiovascular();
  await validateMetabolic();
  await validatePerformance();
  await validateSexualHealth();

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 VALIDATION RESULTS\n');

  // Print results table
  console.log('| Area | Check | Status | Details |');
  console.log('|------|-------|--------|---------|');
  
  results.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${r.area} | ${r.check} | ${status} | ${r.details} |`);
  });

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Passed: ${passed}/${total} (${passRate}%)`);
  console.log(`❌ Failed: ${total - passed}/${total}\n`);

  // Exit with error code if any failed
  if (passed < total) {
    process.exit(1);
  }
}

// Run validation
runValidation().catch(error => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});
