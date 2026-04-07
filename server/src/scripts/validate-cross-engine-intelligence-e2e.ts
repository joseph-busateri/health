import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'cross-engine-intelligence-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Cross-Engine Intelligence Layer E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Get Cross-Engine Intelligence Today ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const intelligence = response.data?.data;

    logs.push(`Cross-engine intelligence response received: ${response.status}`);

    if (intelligence) {
      console.log('✅ Cross-engine intelligence record generated');
    } else {
      errors.push('Cross-engine intelligence record not generated');
      console.log('❌ Cross-engine intelligence record not generated');
    }

    if (intelligence.overallStatus) {
      console.log(`✅ Overall status: ${intelligence.overallStatus}`);
      logs.push(`Overall status: ${intelligence.overallStatus}`);
    } else {
      errors.push('Overall status missing');
      console.log('❌ Overall status missing');
    }

    if (intelligence.engineSnapshot) {
      console.log('✅ Engine snapshot exists');
      const availableEngines = Object.keys(intelligence.engineSnapshot).filter(
        k => intelligence.engineSnapshot[k] !== undefined
      );
      console.log(`   Available engines: ${availableEngines.length}`);
      logs.push(`Available engines: ${availableEngines.join(', ')}`);
    } else {
      errors.push('Engine snapshot missing');
      console.log('❌ Engine snapshot missing');
    }

    if (intelligence.patterns) {
      console.log(`✅ Patterns detected: ${intelligence.patterns.length}`);
      intelligence.patterns.forEach((p: any) => {
        console.log(`   - [${p.severity}] ${p.name}`);
      });
      logs.push(`Pattern count: ${intelligence.patterns.length}`);
    } else {
      errors.push('Patterns missing');
      console.log('❌ Patterns missing');
    }

    if (intelligence.evidence) {
      console.log(`✅ Evidence signals: ${intelligence.evidence.length}`);
      logs.push(`Evidence count: ${intelligence.evidence.length}`);
    } else {
      errors.push('Evidence missing');
      console.log('❌ Evidence missing');
    }

    if (intelligence.recommendation) {
      console.log('✅ Recommendation exists');
      console.log(`   Priority: ${intelligence.recommendation.priority}`);
      console.log(`   Summary: ${intelligence.recommendation.summary}`);
      console.log(`   Actions: ${intelligence.recommendation.actions?.length || 0}`);
      logs.push(`Recommendation priority: ${intelligence.recommendation.priority}`);
      logs.push(`Recommendation source: ${intelligence.recommendation.source}`);
    } else {
      errors.push('Recommendation missing');
      console.log('❌ Recommendation missing');
    }
  } catch (error: any) {
    errors.push('Get cross-engine intelligence today failed');
    console.log('❌ Get cross-engine intelligence today failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Overall Status Validation ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const intelligence = response.data?.data;

    const validStatuses = ['optimal', 'moderate', 'constrained', 'high_risk'];
    if (validStatuses.includes(intelligence.overallStatus)) {
      console.log(`✅ Valid overall status: ${intelligence.overallStatus}`);
    } else {
      errors.push(`Invalid overall status: ${intelligence.overallStatus}`);
      console.log(`❌ Invalid overall status: ${intelligence.overallStatus}`);
    }
  } catch (error: any) {
    errors.push('Overall status validation failed');
    console.log('❌ Overall status validation failed');
  }

  console.log('\n--- Scenario 3: Engine Snapshot Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const intelligence = response.data?.data;

    if (intelligence.engineSnapshot) {
      const expectedEngines = [
        'recoveryStatus',
        'stressStatus',
        'jointStatus',
        'adherenceStatus',
        'workoutStatus',
        'nutritionStatus',
        'metabolicStatus',
        'cardiovascularStatus',
        'sexualHealthStatus',
        'supplementStatus',
      ];

      const availableEngines = expectedEngines.filter(
        engine => intelligence.engineSnapshot[engine] !== undefined
      );

      console.log(`✅ Engine snapshot has ${availableEngines.length}/10 engines available`);
      
      if (availableEngines.length > 0) {
        console.log('✅ At least some engines are available (graceful degradation working)');
      } else {
        console.log('⚠️ No engines available - check engine services');
      }
    }
  } catch (error: any) {
    errors.push('Engine snapshot structure validation failed');
    console.log('❌ Engine snapshot structure validation failed');
  }

  console.log('\n--- Scenario 4: Pattern Detection ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const intelligence = response.data?.data;

    if (Array.isArray(intelligence.patterns)) {
      console.log(`✅ Patterns is array: ${intelligence.patterns.length} patterns`);
      
      if (intelligence.patterns.length > 0) {
        const pattern = intelligence.patterns[0];
        const requiredFields = ['name', 'summary', 'severity', 'sourceEngines'];
        const missingFields = requiredFields.filter(field => !(field in pattern));

        if (missingFields.length === 0) {
          console.log('✅ Pattern structure valid');
        } else {
          errors.push(`Missing pattern fields: ${missingFields.join(', ')}`);
          console.log(`❌ Missing pattern fields: ${missingFields.join(', ')}`);
        }

        const validSeverities = ['low', 'moderate', 'high'];
        if (validSeverities.includes(pattern.severity)) {
          console.log(`✅ Valid pattern severity: ${pattern.severity}`);
        } else {
          errors.push(`Invalid pattern severity: ${pattern.severity}`);
          console.log(`❌ Invalid pattern severity: ${pattern.severity}`);
        }
      } else {
        console.log('⚠️ No patterns detected (may be optimal state)');
      }
    } else {
      errors.push('Patterns not an array');
      console.log('❌ Patterns not an array');
    }
  } catch (error: any) {
    errors.push('Pattern detection validation failed');
    console.log('❌ Pattern detection validation failed');
  }

  console.log('\n--- Scenario 5: Evidence Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const intelligence = response.data?.data;

    if (Array.isArray(intelligence.evidence)) {
      console.log(`✅ Evidence is array: ${intelligence.evidence.length} signals`);
      
      if (intelligence.evidence.length > 0) {
        const signal = intelligence.evidence[0];
        if (signal.name && signal.interpretation) {
          console.log('✅ Evidence signal structure valid');
        } else {
          errors.push('Evidence signal structure invalid');
          console.log('❌ Evidence signal structure invalid');
        }
      }
    } else {
      errors.push('Evidence not an array');
      console.log('❌ Evidence not an array');
    }
  } catch (error: any) {
    errors.push('Evidence structure validation failed');
    console.log('❌ Evidence structure validation failed');
  }

  console.log('\n--- Scenario 6: Recommendation Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const intelligence = response.data?.data;

    if (intelligence.recommendation) {
      const requiredFields = ['type', 'priority', 'summary', 'actions'];
      const missingFields = requiredFields.filter(field => !(field in intelligence.recommendation));

      if (missingFields.length === 0) {
        console.log('✅ All recommendation fields present');
      } else {
        errors.push(`Missing recommendation fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing recommendation fields: ${missingFields.join(', ')}`);
      }

      if (intelligence.recommendation.type === 'cross_engine_intelligence') {
        console.log('✅ Recommendation type is "cross_engine_intelligence"');
      } else {
        errors.push('Recommendation type should be "cross_engine_intelligence"');
        console.log('❌ Recommendation type should be "cross_engine_intelligence"');
      }

      const validPriorities = ['critical', 'important', 'optimization'];
      if (validPriorities.includes(intelligence.recommendation.priority)) {
        console.log(`✅ Valid priority: ${intelligence.recommendation.priority}`);
      } else {
        errors.push(`Invalid priority: ${intelligence.recommendation.priority}`);
        console.log(`❌ Invalid priority: ${intelligence.recommendation.priority}`);
      }

      if (Array.isArray(intelligence.recommendation.actions) && intelligence.recommendation.actions.length > 0) {
        console.log(`✅ Actions array with ${intelligence.recommendation.actions.length} items`);
      } else {
        errors.push('Actions array empty or invalid');
        console.log('❌ Actions array empty or invalid');
      }

      if (intelligence.recommendation.source) {
        console.log(`✅ Source: ${intelligence.recommendation.source}`);
        const validSources = ['deterministic', 'ai_enriched', 'fallback'];
        if (validSources.includes(intelligence.recommendation.source)) {
          console.log('✅ Valid source value');
        } else {
          errors.push(`Invalid source: ${intelligence.recommendation.source}`);
          console.log(`❌ Invalid source: ${intelligence.recommendation.source}`);
        }
      }
    }
  } catch (error: any) {
    errors.push('Recommendation structure validation failed');
    console.log('❌ Recommendation structure validation failed');
  }

  console.log('\n--- Scenario 7: Record Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const intelligence = response.data?.data;

    const requiredFields = ['id', 'userId', 'date', 'overallStatus', 'engineSnapshot', 'patterns', 'evidence', 'recommendation', 'createdAt'];
    const missingFields = requiredFields.filter(field => !(field in intelligence));

    if (missingFields.length === 0) {
      console.log('✅ All required record fields present');
    } else {
      errors.push(`Missing record fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing record fields: ${missingFields.join(', ')}`);
    }

    if (intelligence.userId === TEST_USER_ID) {
      console.log('✅ User ID matches');
    } else {
      errors.push('User ID mismatch');
      console.log('❌ User ID mismatch');
    }
  } catch (error: any) {
    errors.push('Record structure validation failed');
    console.log('❌ Record structure validation failed');
  }

  console.log('\n--- Scenario 8: History Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/history`);

    if (Array.isArray(response.data?.data)) {
      console.log(`✅ History retrieved: ${response.data.data.length} records`);
      logs.push(`History count: ${response.data.data.length}`);
    } else {
      errors.push('History not an array');
      console.log('❌ History not an array');
    }
  } catch (error: any) {
    errors.push('History retrieval failed');
    console.log('❌ History retrieval failed');
  }

  console.log('\n--- Scenario 9: Multi-Domain Orchestration ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const intelligence = response.data?.data;

    if (intelligence.recommendation && intelligence.recommendation.summary) {
      // Check if recommendation addresses multiple domains
      const summary = intelligence.recommendation.summary.toLowerCase();
      const actions = intelligence.recommendation.actions?.join(' ').toLowerCase() || '';
      const combined = summary + ' ' + actions;

      const domainKeywords = {
        recovery: ['recovery', 'sleep', 'rest'],
        training: ['workout', 'training', 'intensity', 'volume'],
        nutrition: ['nutrition', 'protein', 'hydration', 'meal'],
        stress: ['stress', 'cns'],
        health: ['metabolic', 'cardiovascular', 'health'],
      };

      const domainsAddressed = Object.entries(domainKeywords).filter(([domain, keywords]) =>
        keywords.some(keyword => combined.includes(keyword))
      ).map(([domain]) => domain);

      if (domainsAddressed.length >= 2) {
        console.log(`✅ Multi-domain orchestration detected: ${domainsAddressed.join(', ')}`);
      } else {
        console.log(`⚠️ Limited multi-domain orchestration: ${domainsAddressed.join(', ')}`);
      }
    }
  } catch (error: any) {
    errors.push('Multi-domain orchestration check failed');
    console.log('❌ Multi-domain orchestration check failed');
  }

  console.log('\n--- Scenario 10: Graceful Degradation ---');
  try {
    const response = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const intelligence = response.data?.data;

    // Even with missing engine data, should still return valid intelligence
    if (intelligence && intelligence.overallStatus && intelligence.recommendation) {
      console.log('✅ Graceful degradation working - intelligence generated despite potentially missing engine data');
    } else {
      errors.push('Graceful degradation failed');
      console.log('❌ Graceful degradation failed');
    }
  } catch (error: any) {
    errors.push('Graceful degradation check failed');
    console.log('❌ Graceful degradation check failed');
  }

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Success: ${errors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  if (logs.length > 0) {
    console.log('\nLogs:');
    logs.forEach(l => console.log(`  - ${l}`));
  }

  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
