// Test with all expected columns based on healthProfileAggregation.ts
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function testFullTrendSave() {
  console.log('Testing with all expected columns...\n');

  // Based on healthProfileAggregation.ts, the table expects:
  const fullTrend = {
    user_id: USER_ID,
    marker_name: 'TEST_LDL',
    category: 'Cardiovascular',
    latest_value: 120,
    prior_value: 110,
    absolute_change: 10,
    change_percent: 9.09,  // Note: change_percent not percent_change
    trend_direction: 'worsening',
    data_points: 2,
    first_test_date: '2024-01-01',
    latest_test_date: '2024-02-01',
    unit: 'mg/dL',
    trend_summary: 'Worsening by 10mg/dL',
    reference_range_low: 0,
    reference_range_high: 100,
    abnormal_flag: 'High',
    calculated_at: new Date().toISOString()
  };

  console.log('Attempting to insert full trend...');
  const { data, error } = await supabase
    .from('bloodwork_trends')
    .insert([fullTrend])
    .select();

  if (error) {
    console.error('ERROR:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
  } else {
    console.log('SUCCESS! Inserted:', data);
    
    // Now verify we can read it back
    const { data: readData } = await supabase
      .from('bloodwork_trends')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('marker_name', 'TEST_LDL');
    
    console.log('\nRead back from database:', readData);
  }
}

testFullTrendSave().then(() => {
  console.log('\nTest complete');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
