// Discover actual bloodwork_trends schema by trying different column names
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function discoverSchema() {
  console.log('Discovering bloodwork_trends schema...\n');

  // Common column name variations to try
  const possibleColumns = {
    // User/marker identification
    user_id: USER_ID,
    userId: USER_ID,
    marker: 'LDL',
    markerName: 'LDL',
    marker_name: 'LDL',
    test_name: 'LDL',
    
    // Values
    latestValue: 100,
    latest_value: 100,
    priorValue: 90,
    prior_value: 90,
    currentValue: 100,
    current_value: 100,
    previousValue: 90,
    previous_value: 90,
    
    // Change metrics
    changePercent: 11.1,
    change_percent: 11.1,
    percentChange: 11.1,
    percent_change: 11.1,
    absoluteChange: 10,
    absolute_change: 10,
    
    // Trend
    trendDirection: 'improving',
    trend_direction: 'improving',
    direction: 'improving',
    
    // Counts
    dataPoints: 2,
    data_points: 2,
    count: 2,
    
    // Dates
    firstTestDate: '2024-01-01',
    first_test_date: '2024-01-01',
    latestTestDate: '2024-02-01',
    latest_test_date: '2024-02-01',
    
    // Metadata
    category: 'Cardiovascular',
    unit: 'mg/dL',
    summary: 'Test',
    trendSummary: 'Test',
    trend_summary: 'Test'
  };

  // Try inserting with different combinations
  const attempts = [
    ['user_id', 'marker'],
    ['user_id', 'markerName'],
    ['userId', 'marker'],
    ['user_id', 'test_name'],
  ];

  for (const cols of attempts) {
    const testData = {};
    cols.forEach(col => {
      testData[col] = possibleColumns[col];
    });
    
    console.log(`Trying: ${cols.join(', ')}`);
    const { data, error } = await supabase
      .from('bloodwork_trends')
      .insert([testData])
      .select();

    if (!error) {
      console.log(`✅ SUCCESS with columns: ${cols.join(', ')}`);
      console.log('Returned data:', data);
      
      // Now try to read it back to see all columns
      const { data: readData } = await supabase
        .from('bloodwork_trends')
        .select('*')
        .limit(1);
      
      if (readData && readData.length > 0) {
        console.log('\nActual table columns:', Object.keys(readData[0]).join(', '));
      }
      
      // Clean up
      await supabase.from('bloodwork_trends').delete().eq('user_id', USER_ID);
      return;
    } else {
      console.log(`  ❌ ${error.message}`);
    }
  }
  
  console.log('\nAll attempts failed. The table might not exist or have RLS policies.');
}

discoverSchema().then(() => {
  console.log('\nDiscovery complete');
  process.exit(0);
}).catch(err => {
  console.error('Discovery failed:', err);
  process.exit(1);
});
