// Deep analysis of trend generation and saving
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function deepAnalysis() {
  console.log('=== DEEP ANALYSIS OF BLOODWORK TRENDS ===\n');

  // 1. Verify table exists and schema
  console.log('1. Checking bloodwork_trends table schema...');
  const { data: schemaTest, error: schemaError } = await supabase
    .from('bloodwork_trends')
    .select('*')
    .limit(0);

  if (schemaError) {
    console.error('❌ Table does not exist or has access issues:', schemaError.message);
    return;
  }
  console.log('✅ Table exists and is accessible\n');

  // 2. Check bloodwork_results
  console.log('2. Checking bloodwork_results...');
  const { data: results, error: resultsError } = await supabase
    .from('bloodwork_results')
    .select('id, raw_test_name, normalized_test_name, value_numeric, value_text, test_date, user_id')
    .eq('user_id', USER_ID)
    .not('test_date', 'is', null)
    .order('test_date', { ascending: true });

  if (resultsError) {
    console.error('❌ Error fetching results:', resultsError.message);
    return;
  }

  console.log(`Found ${results.length} bloodwork results`);
  
  // Group by marker
  const grouped = {};
  results.forEach(r => {
    const key = r.normalized_test_name || r.raw_test_name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const markersWithMultiplePoints = Object.entries(grouped).filter(([_, data]) => data.length >= 2);
  console.log(`Found ${markersWithMultiplePoints.length} markers with 2+ data points:`);
  markersWithMultiplePoints.forEach(([marker, data]) => {
    console.log(`  - ${marker}: ${data.length} points`);
  });

  if (markersWithMultiplePoints.length === 0) {
    console.log('\n❌ NO MARKERS WITH 2+ DATA POINTS - Trends cannot be calculated!');
    console.log('Each marker needs at least 2 data points from different test dates.\n');
    return;
  }

  // 3. Manually calculate a trend for one marker
  console.log('\n3. Testing trend calculation for one marker...');
  const [testMarker, testData] = markersWithMultiplePoints[0];
  console.log(`Testing with: ${testMarker} (${testData.length} points)`);

  const sorted = testData.sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
  const priorResult = sorted[0];
  const latestResult = sorted[sorted.length - 1];

  const priorValue = priorResult.value_numeric || parseFloat(priorResult.value_text) || 0;
  const latestValue = latestResult.value_numeric || parseFloat(latestResult.value_text) || 0;
  const absoluteChange = latestValue - priorValue;
  const percentChange = priorValue !== 0 ? (absoluteChange / priorValue) * 100 : 0;

  console.log(`  Prior: ${priorValue} (${priorResult.test_date})`);
  console.log(`  Latest: ${latestValue} (${latestResult.test_date})`);
  console.log(`  Change: ${absoluteChange} (${percentChange.toFixed(1)}%)`);

  // 4. Test inserting this trend
  console.log('\n4. Testing trend insert...');
  const testTrend = {
    user_id: USER_ID,
    marker_name: testMarker,
    category: 'Test',
    latest_value: latestValue,
    prior_value: priorValue,
    absolute_change: absoluteChange,
    change_percent: percentChange,
    trend_direction: percentChange > 0 ? 'worsening' : 'improving',
    data_points: testData.length,
    first_test_date: sorted[0].test_date,
    latest_test_date: sorted[sorted.length - 1].test_date,
    unit: latestResult.unit || 'unknown',
    trend_summary: `Test trend for ${testMarker}`,
    reference_range_low: null,
    reference_range_high: null,
    abnormal_flag: null
  };

  const { data: insertData, error: insertError } = await supabase
    .from('bloodwork_trends')
    .insert([testTrend])
    .select();

  if (insertError) {
    console.error('❌ Failed to insert trend:', insertError.message);
    console.error('Full error:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Successfully inserted trend!');
    console.log('Inserted data:', insertData[0]);
  }

  // 5. Check if trends exist in table
  console.log('\n5. Checking bloodwork_trends table...');
  const { data: trends, error: trendsError } = await supabase
    .from('bloodwork_trends')
    .select('*')
    .eq('user_id', USER_ID);

  if (trendsError) {
    console.error('❌ Error fetching trends:', trendsError.message);
  } else {
    console.log(`Found ${trends.length} trends in database`);
    if (trends.length > 0) {
      console.log('Sample trend:', trends[0]);
    }
  }

  // 6. Check recent bloodwork documents
  console.log('\n6. Checking recent bloodwork documents...');
  const { data: docs, error: docsError } = await supabase
    .from('bloodwork_documents')
    .select('id, processing_status, processing_error, created_at, updated_at')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(3);

  if (docsError) {
    console.error('❌ Error fetching documents:', docsError.message);
  } else {
    console.log(`Found ${docs.length} recent documents:`);
    docs.forEach(d => {
      console.log(`  - ${d.id}: ${d.processing_status} (${d.created_at})`);
      if (d.processing_error) {
        console.log(`    Error: ${d.processing_error}`);
      }
    });
  }

  // Clean up test data
  if (insertData && insertData.length > 0) {
    console.log('\n7. Cleaning up test data...');
    await supabase.from('bloodwork_trends').delete().eq('id', insertData[0].id);
    console.log('✅ Cleaned up');
  }

  console.log('\n=== ANALYSIS COMPLETE ===');
}

deepAnalysis().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
});
