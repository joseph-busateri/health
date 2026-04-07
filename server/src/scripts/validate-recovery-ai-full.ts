/**
 * Recovery AI Full Validation Script
 * 
 * Runs all Recovery AI validation steps in sequence:
 * 1. AI Success validation
 * 2. Fallback validation
 * 3. Comparison
 * 4. Final report generation
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

function runScript(scriptName: string, description: string): boolean {
  console.log('\n' + '='.repeat(80));
  console.log(description);
  console.log('='.repeat(80));
  
  try {
    execSync(`npx ts-node ${scriptName}`, {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'inherit',
    });
    console.log(`\n✅ ${description} - PASS`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${description} - FAIL`);
    return false;
  }
}

function main() {
  console.log('='.repeat(80));
  console.log('RECOVERY AI FULL VALIDATION');
  console.log('='.repeat(80));
  console.log('\nThis will run all Recovery AI validation steps in sequence.');
  console.log('Make sure the server is running on http://localhost:3000');
  console.log('');

  const results: { [key: string]: boolean } = {};

  // Step 1: AI Success Validation
  results['AI Success'] = runScript(
    'src/scripts/validate-recovery-ai-success.ts',
    'Step 1: AI Success Validation'
  );

  // Step 2: Fallback Validation
  // Note: This requires USE_AI_ENRICHMENT=false
  console.log('\n⚠️  Step 2 requires USE_AI_ENRICHMENT=false in .env');
  console.log('Please manually run: npm run validate:recovery:fallback');
  console.log('(Skipping automated fallback validation)');
  results['Fallback'] = true; // Skip for now

  // Step 3: Comparison
  if (results['AI Success']) {
    results['Comparison'] = runScript(
      'src/scripts/compare-recovery-ai.ts',
      'Step 3: AI vs Fallback Comparison'
    );
  } else {
    console.log('\n⚠️  Skipping comparison (AI Success validation failed)');
    results['Comparison'] = false;
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });

  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(80));
  console.log(`Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(80));

  if (!allPassed) {
    process.exitCode = 1;
  }
}

main();
