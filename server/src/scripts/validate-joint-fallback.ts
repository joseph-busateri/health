import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = '09e208b8-ff5c-4397-b289-4b019b149b2f';

interface JointScenario {
  painLevel: number;
  tightnessLevel: number;
  sorenessLevel: number;
  affectedArea: string;
  workoutLoad: number;
  recoveryScore: number;
}

async function main() {
  console.log('='.repeat(80));
  console.log('Joint Fallback Validation (AI Disabled)');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  const scenarioPath = path.resolve(__dirname, '../../../tests/joint-ai-scenario.json');
  if (!fs.existsSync(scenarioPath)) {
    console.error(`Scenario file not found: ${scenarioPath}`);
    process.exit(1);
  }

  const scenario: JointScenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));

  console.log('\nCanonical Scenario:');
  console.log(JSON.stringify(scenario, null, 2));

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const jointAIEnabled = process.env.USE_AI_ENRICHMENT_JOINT === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_ENRICHMENT_JOINT: ${process.env.USE_AI_ENRICHMENT_JOINT}`);

  if (aiEnabled && jointAIEnabled) {
    console.log('\n⚠️  WARNING: AI enrichment is enabled. For true fallback validation, set USE_AI_ENRICHMENT_JOINT=false');
    console.log('Continuing anyway - fallback should still trigger on AI failure...\n');
  }

  console.log('\n--- Step 1: Call Joint Endpoint ---');

  let jointResponse: any = null;

  try {
    const params = new URLSearchParams({
      regenerate: 'true',
      pain_level: String(scenario.painLevel),
      tightness_level: String(scenario.tightnessLevel),
      soreness_level: String(scenario.sorenessLevel),
      affected_area: scenario.affectedArea,
      workout_load: String(scenario.workoutLoad),
      recovery_score: String(scenario.recoveryScore),
    });

    logs.push(`Scenario payload: ${JSON.stringify(scenario)}`);
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(`${BASE_URL}/joint-health/${TEST_USER_ID}/today?${params}`);
    jointResponse = response.data;

    logs.push(`Joint endpoint response received: ${response.status}`);
    console.log('✅ Joint endpoint succeeded');
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    logs.push(`Joint endpoint error: ${JSON.stringify(errorMsg)}`);
    errors.push('Joint endpoint failed');
    console.log('❌ Joint endpoint failed');
  }

  console.log('\n--- Step 2: Validate Fallback Behavior ---');

  if (jointResponse?.data?.recommendation) {
    const rec = jointResponse.data.recommendation;

    // In fallback mode, source should be 'fallback' or undefined (for deterministic)
    if (rec.source === 'fallback' || rec.source === 'deterministic' || !rec.source) {
      console.log(`✅ Recommendation source is fallback/deterministic: ${rec.source || 'undefined'}`);
    } else if (rec.source === 'ai_enriched' && !jointAIEnabled) {
      errors.push(`Expected fallback source, got 'ai_enriched' despite AI being disabled`);
      console.log(`❌ Expected fallback source, got 'ai_enriched' despite AI being disabled`);
    } else {
      console.log(`ℹ️  Source: ${rec.source} (AI may have succeeded despite being tested for fallback)`);
    }

    if (rec.summary && rec.summary.length > 0) {
      console.log('✅ Summary exists');
    } else {
      errors.push('Summary missing or empty');
      console.log('❌ Summary missing or empty');
    }

    if (Array.isArray(rec.actions) && rec.actions.length > 0) {
      console.log(`✅ Actions present: ${rec.actions.length}`);
    } else {
      errors.push('Actions missing or empty');
      console.log('❌ Actions missing or empty');
    }

    // Fallback may not have rationale (that's an AI-enriched field)
    if (!rec.rationale) {
      console.log('✅ No rationale (expected for fallback)');
    } else {
      console.log(`ℹ️  Rationale present (AI enrichment may have succeeded): ${rec.rationale.substring(0, 50)}...`);
    }
  } else {
    errors.push('No recommendation in response');
    console.log('❌ No recommendation in response');
  }

  console.log('\n--- Step 3: Validate Response Structure ---');

  if (jointResponse?.data) {
    const data = jointResponse.data;

    if (typeof data.riskLevel === 'string') {
      console.log(`✅ riskLevel present: ${data.riskLevel}`);
    } else {
      errors.push('riskLevel missing');
      console.log('❌ riskLevel missing');
    }

    if (typeof data.jointHealthStatus === 'string') {
      console.log(`✅ jointHealthStatus present: ${data.jointHealthStatus}`);
    } else {
      errors.push('jointHealthStatus missing');
      console.log('❌ jointHealthStatus missing');
    }

    if (typeof data.affectedArea === 'string') {
      console.log(`✅ affectedArea present: ${data.affectedArea}`);
    } else {
      errors.push('affectedArea missing');
      console.log('❌ affectedArea missing');
    }
  }

  console.log('\n--- Step 4: Validate No API Contract Break ---');

  if (jointResponse?.success === true) {
    console.log('✅ API response has success=true');
  } else {
    errors.push('API response missing success field or not true');
    console.log('❌ API response missing success field or not true');
  }

  if (jointResponse?.data) {
    console.log('✅ API response has data field');
  } else {
    errors.push('API response missing data field');
    console.log('❌ API response missing data field');
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'joint-fallback.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
        scenario,
        aiEnabled,
        jointAIEnabled,
        logs,
        errors,
      },
      null,
      2,
    ),
  );

  console.log(`\n✅ Results saved to: ${outputPath}`);

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Success: ${errors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
