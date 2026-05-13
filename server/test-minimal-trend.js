// Test with minimal required columns only
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function testMinimalTrend() {
  console.log('Testing minimal trend insert...\n');

  // Start with absolute minimum and add fields one by one
  const tests = [
    {
      name: 'Test 1: user_id + marker_name only',
      data: {
        user_id: USER_ID,
        marker_name: 'TEST1'
      }
    },
    {
      name: 'Test 2: Add core trend fields',
      data: {
        user_id: USER_ID,
        marker_name: 'TEST2',
        latest_value: 100,
        prior_value: 90,
        trend_direction: 'improving',
        data_points: 2
      }
    },
    {
      name: 'Test 3: Add change_percent',
      data: {
        user_id: USER_ID,
        marker_name: 'TEST3',
        latest_value: 100,
        prior_value: 90,
        change_percent: 11.1,
        trend_direction: 'improving',
        data_points: 2
      }
    },
    {
      name: 'Test 4: Add dates',
      data: {
        user_id: USER_ID,
        marker_name: 'TEST4',
        latest_value: 100,
        prior_value: 90,
        change_percent: 11.1,
        trend_direction: 'improving',
        data_points: 2,
        first_test_date: '2024-01-01',
        latest_test_date: '2024-02-01'
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n${test.name}...`);
    const { data, error } = await supabase
      .from('bloodwork_trends')
      .insert([test.data])
      .select();

    if (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
    } else {
      console.log(`  ✅ SUCCESS`);
      console.log(`  Inserted columns:`, Object.keys(data[0]).join(', '));
    }
  }

  // Clean up test data
  console.log('\n\nCleaning up test data...');
  await supabase
    .from('bloodwork_trends')
    .delete()
    .eq('user_id', USER_ID)
    .like('marker_name', 'TEST%');
}

testMinimalTrend().then(() => {
  console.log('\nTest complete');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
