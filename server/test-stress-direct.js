const http = require('http');

function testStressEndpoint(userId, params) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const path = `/stress/${userId}/today?${queryString}`;
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('Testing Stress Engine API...\n');
  
  // Test 1: Low stress
  const low = await testStressEndpoint('test-user-validation', {
    regenerate: 'true',
    stress_level: '1',
    hrv: '80',
    sleep_hours: '8.2',
    workout_load: '3',
    recovery_score: '88'
  });
  
  console.log('Low Stress Test:');
  console.log('Status:', low.status);
  console.log('Stress Status:', low.data?.data?.stressStatus);
  console.log('CNS Load:', low.data?.data?.cnsLoadStatus);
  console.log('');
  
  // Test 2: High stress with AI enrichment
  const high = await testStressEndpoint('test-user-validation', {
    regenerate: 'true',
    stress_level: '5',
    hrv: '28',
    sleep_hours: '4.5',
    workout_load: '9',
    recovery_score: '22'
  });
  
  console.log('High Stress Test (AI Enrichment):');
  console.log('Status:', high.status);
  console.log('Stress Status:', high.data?.data?.stressStatus);
  console.log('CNS Load:', high.data?.data?.cnsLoadStatus);
  console.log('Recommendation Source:', high.data?.data?.recommendation?.source);
  console.log('AI Summary:', high.data?.data?.recommendation?.summary?.substring(0, 100) + '...');
  console.log('');
  
  // Validate results
  const lowPass = low.status === 200 && low.data?.data?.stressStatus === 'low';
  const highPass = high.status === 200 && high.data?.data?.stressStatus === 'high';
  const aiPass = high.data?.data?.recommendation?.source === 'ai_enriched';
  
  console.log('='.repeat(60));
  console.log('RESULTS:');
  console.log('Low stress calculation:', lowPass ? '✅ PASS' : '❌ FAIL');
  console.log('High stress calculation:', highPass ? '✅ PASS' : '❌ FAIL');
  console.log('AI enrichment active:', aiPass ? '✅ PASS' : '❌ FAIL');
  console.log('='.repeat(60));
  
  if (lowPass && highPass && aiPass) {
    console.log('\n✅ STRESS ENGINE VALIDATED - AI ENRICHMENT WORKING');
    process.exit(0);
  } else {
    console.log('\n❌ VALIDATION FAILED');
    process.exit(1);
  }
}

main().catch(console.error);
