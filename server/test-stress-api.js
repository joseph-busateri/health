const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/stress/test-user-123/today?regenerate=true&stress_level=5&hrv=30&sleep_hours=4.5&workout_load=9&recovery_score=40',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.data && json.data.recommendation) {
        console.log('\n=== RECOMMENDATION ===');
        console.log('Source:', json.data.recommendation.source || 'not set');
        console.log('Summary:', json.data.recommendation.summary);
        console.log('Priority:', json.data.recommendation.priority || 'not set');
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
