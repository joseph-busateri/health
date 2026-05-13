// Test saving trends directly
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function testSaveTrends() {
  console.log('Testing trend save...\n');

  // Create a sample trend
  const sampleTrend = {
    user_id: USER_ID,
    marker_name: 'TEST_MARKER',
    category: 'Test',
    latest_value: 100,
    prior_value: 90,
    absolute_change: 10,
    change_percent: 11.1,
    trend_direction: 'improving',
    data_points: 2,
    first_test_date: '2024-01-01',
    latest_test_date: '2024-02-01',
    unit: 'mg/dL',
    trend_summary: 'Test trend'
  };

  console.log('Attempting to insert sample trend...');
  const { data, error } = await supabase
    .from('bloodwork_trends')
    .insert([sampleTrend])
    .select();

  if (error) {
    console.error('ERROR inserting trend:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('SUCCESS! Inserted trend:', data);
  }

  // Check what columns exist in the table
  console.log('\nChecking table schema...');
  const { data: schemaData, error: schemaError } = await supabase
    .from('bloodwork_trends')
    .select('*')
    .limit(0);

  if (schemaError) {
    console.error('Error checking schema:', schemaError);
  }
}

testSaveTrends().then(() => {
  console.log('\nTest complete');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
