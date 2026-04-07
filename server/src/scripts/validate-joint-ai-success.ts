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

interface JointResponse {
  success: boolean;
  data: {
    riskLevel: string;
    jointHealthStatus: string;
    affectedArea: string;
    evidence?: {
      signals: Array<{ name: string; value: any; interpretation: string }>;
      summary: string;
    };
    recommendation: {
      type?: string;
      priority?: string;
      summary: string;
      rationale?: string;
      actions: string[];
      source?: string;
    };
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('Joint AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  const { getActiveRecommendations } = await import('../services/recommendationEngineService');

  const scenarioPath = path.resolve(__dirname, '../../../tests/joint-ai-scenario.json');
  if (!fs.existsSync(scenarioPath)) {
    console.error(`Scenario file not found: ${scenarioPath}`);
    process.exit(1);
  }

  const scenario: JointScenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));

  console.log('\nCanonical Scenario:');
  console.log(JSON.stringify(scenario, null, 2));

  console.log('\n--- Step 1: Call Joint Endpoint ---');

  let jointResponse: JointResponse | null = null;

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

  console.log('\n--- Step 2: Query Persisted Recommendation ---');

  let persistedRecommendations: any[] = [];

  try {
    persistedRecommendations = await getActiveRecommendations(TEST_USER_ID);
    logs.push(`Active recommendations fetched for persistence check: ${persistedRecommendations.length}`);
    logs.push(`Active recommendations summary: ${JSON.stringify(persistedRecommendations.map(r => ({ id: r.id, sourceEngine: r.sourceEngine, title: r.title, createdAt: r.createdAt, state: r.state })))}`);

    const jointRec = persistedRecommendations.find(r => r.sourceEngine === 'joint_health');
    if (jointRec) {
      console.log('✅ Joint recommendation found in persisted records');
    } else {
      errors.push('No joint recommendation found in persisted records');
      console.log('❌ No joint recommendation found in persisted records');
    }
  } catch (error: any) {
    logs.push(`Failed to fetch active recommendations: ${error.message}`);
    errors.push('Failed to query persisted recommendations');
    console.log('❌ Failed to query persisted recommendations');
  }

  console.log('\n--- Step 3: Query Retrieval Path ---');

  try {
    const retrievedRecommendations = await getActiveRecommendations(TEST_USER_ID);
    logs.push(`Active recommendations fetched for retrieval check: ${retrievedRecommendations.length}`);
    logs.push(`Retrieval recommendations summary: ${JSON.stringify(retrievedRecommendations.map(r => ({ id: r.id, sourceEngine: r.sourceEngine, title: r.title, createdAt: r.createdAt, state: r.state })))}`);

    const jointRec = retrievedRecommendations.find(r => r.sourceEngine === 'joint_health');
    if (jointRec) {
      console.log('✅ Joint recommendation found in retrieval');
    } else {
      errors.push('No joint recommendation found in retrieval');
      console.log('❌ No joint recommendation found in retrieval');
    }
  } catch (error: any) {
    logs.push(`Failed to retrieve recommendations: ${error.message}`);
    errors.push('Failed to retrieve recommendations');
    console.log('❌ Failed to retrieve recommendations');
  }

  console.log('\n--- Step 4: Validate AI Enrichment ---');

  if (jointResponse?.data?.recommendation) {
    const rec = jointResponse.data.recommendation;

    if (rec.source === 'ai_enriched') {
      console.log('✅ Recommendation source is ai_enriched');
    } else {
      errors.push(`Expected source 'ai_enriched', got '${rec.source}'`);
      console.log(`❌ Expected source 'ai_enriched', got '${rec.source}'`);
    }

    if (rec.type === 'joint') {
      console.log('✅ Recommendation type is joint');
    } else {
      errors.push(`Expected type 'joint', got '${rec.type}'`);
      console.log(`❌ Expected type 'joint', got '${rec.type}'`);
    }

    if (rec.priority) {
      console.log(`✅ Priority set: ${rec.priority}`);
    } else {
      errors.push('Priority not set');
      console.log('❌ Priority not set');
    }

    if (rec.summary && rec.summary.length > 0) {
      console.log('✅ Summary exists');
    } else {
      errors.push('Summary missing or empty');
      console.log('❌ Summary missing or empty');
    }

    if (rec.rationale && rec.rationale.length > 0) {
      console.log('✅ Rationale exists (AI-enriched)');
    } else {
      errors.push('Rationale missing (expected for AI enrichment)');
      console.log('❌ Rationale missing (expected for AI enrichment)');
    }

    if (Array.isArray(rec.actions) && rec.actions.length > 0) {
      console.log(`✅ Actions present: ${rec.actions.length}`);
    } else {
      errors.push('Actions missing or empty');
      console.log('❌ Actions missing or empty');
    }
  } else {
    errors.push('Cannot validate AI enrichment - no persisted record');
    console.log('❌ Cannot validate AI enrichment - no persisted record');
  }

  console.log('\n--- Step 5: Validate Persistence Shape ---');

  if (jointResponse?.data) {
    const data = jointResponse.data;

    if (data.evidence) {
      console.log('✅ Evidence field present');
    } else {
      errors.push('Evidence field missing');
      console.log('❌ Evidence field missing');
    }

    if (data.evidence?.signals && Array.isArray(data.evidence.signals)) {
      console.log(`✅ Evidence signals present: ${data.evidence.signals.length}`);
    } else {
      errors.push('Evidence signals missing');
      console.log('❌ Evidence signals missing');
    }
  }

  console.log('\n--- Step 6: Validate Retrieval Matches Persistence ---');

  const persistedJoint = persistedRecommendations.find(r => r.sourceEngine === 'joint_health');
  if (persistedJoint && jointResponse?.data?.recommendation) {
    console.log('✅ Persisted and response recommendations both exist');
  } else {
    errors.push('Mismatch between persisted and response recommendations');
    console.log('❌ Mismatch between persisted and response recommendations');
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'joint-ai-success.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
        scenario,
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
