// Test workout today endpoint
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';
const API_URL = 'http://localhost:3000';

async function testWorkoutToday() {
  console.log('=== TESTING WORKOUT TODAY ENDPOINT ===\n');

  try {
    const response = await fetch(`${API_URL}/api/workout-document/workout/today/${USER_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': '12345678-1234-1234-1234-123456789abc',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success && data.data) {
      console.log('\n✅ SUCCESS: Workout today endpoint working');
      console.log('Workout date:', data.data.date);
      console.log('Readiness status:', data.data.readinessStatus);
    } else {
      console.log('\n❌ FAILED: Endpoint returned error');
      console.log('Error:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('\n❌ FAILED: Request error');
    console.error('Error:', error.message);
  }
}

testWorkoutToday().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
