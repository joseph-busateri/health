// Test why recommendations aren't being generated
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function testRecommendationGeneration() {
  console.log('=== TESTING RECOMMENDATION GENERATION LOGIC ===\n');

  // 1. Get trends
  console.log('1. Fetching trends...');
  const { data: trends, error: trendsError } = await supabase
    .from('bloodwork_trends')
    .select('*')
    .eq('user_id', USER_ID);

  if (trendsError) {
    console.error('❌ Error fetching trends:', trendsError.message);
    return;
  }

  console.log(`✅ Found ${trends.length} trends\n`);

  // 2. Check which trends have worsening direction
  console.log('2. Analyzing trends for recommendation criteria...');
  const worseningTrends = trends.filter(t => t.trend_direction === 'worsening');
  console.log(`   Worsening trends: ${worseningTrends.length}/${trends.length}`);
  
  if (worseningTrends.length > 0) {
    console.log('\n   Sample worsening trends:');
    worseningTrends.slice(0, 5).forEach(t => {
      console.log(`   - ${t.marker_name}: ${t.prior_value} → ${t.latest_value} (${t.change_percent?.toFixed(1)}%)`);
    });
  }

  // 3. Check specific markers that have rules
  console.log('\n3. Checking markers with recommendation rules...');
  const markersWithRules = ['LDL', 'ApoB', 'hsCRP', 'Triglycerides', 'HbA1c', 'Glucose', 
                            'Insulin', 'Testosterone', 'Free Testosterone', 'SHBG', 'Estradiol'];
  
  for (const marker of markersWithRules) {
    const trend = trends.find(t => t.marker_name === marker);
    if (trend) {
      console.log(`\n   ${marker}:`);
      console.log(`     Latest: ${trend.latest_value} ${trend.unit || ''}`);
      console.log(`     Prior: ${trend.prior_value} ${trend.unit || ''}`);
      console.log(`     Change: ${trend.change_percent?.toFixed(1)}%`);
      console.log(`     Direction: ${trend.trend_direction}`);
      console.log(`     Data points: ${trend.data_points}`);
      
      // Check LDL rules as example
      if (marker === 'LDL') {
        const latestValue = parseFloat(trend.latest_value);
        console.log(`     Rule check (>100): ${latestValue > 100 ? '✅ MATCHES' : '❌ No match'}`);
        console.log(`     Rule check (>130): ${latestValue > 130 ? '✅ MATCHES' : '❌ No match'}`);
        console.log(`     Worsening: ${trend.trend_direction === 'worsening' ? '✅ Yes' : '❌ No'}`);
      }
    }
  }

  // 4. Check if any trends would match ANY rule
  console.log('\n4. Checking which trends could generate recommendations...');
  let potentialMatches = 0;
  
  for (const trend of trends) {
    const latestValue = parseFloat(trend.latest_value);
    const isWorsening = trend.trend_direction === 'worsening';
    const hasEnoughData = trend.data_points >= 2;
    
    // Simple heuristic: worsening + 2+ data points
    if (isWorsening && hasEnoughData && !isNaN(latestValue)) {
      potentialMatches++;
      if (potentialMatches <= 5) {
        console.log(`   ✅ ${trend.marker_name}: ${trend.prior_value} → ${trend.latest_value} (worsening, ${trend.data_points} points)`);
      }
    }
  }
  
  console.log(`\n   Total potential matches: ${potentialMatches}/${trends.length}`);

  // 5. Check actual bloodwork_results to see what data we have
  console.log('\n5. Checking bloodwork_results for marker values...');
  const { data: results, error: resultsError } = await supabase
    .from('bloodwork_results')
    .select('normalized_test_name, raw_test_name, value_numeric, value_text, test_date')
    .eq('user_id', USER_ID)
    .in('normalized_test_name', ['LDL', 'Triglycerides', 'Glucose', 'HbA1c'])
    .order('test_date', { ascending: true });

  if (!resultsError && results.length > 0) {
    console.log(`   Found ${results.length} results for common markers`);
    
    // Group by marker
    const grouped = {};
    results.forEach(r => {
      const key = r.normalized_test_name || r.raw_test_name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    Object.entries(grouped).forEach(([marker, data]) => {
      console.log(`\n   ${marker} (${data.length} tests):`);
      data.forEach(d => {
        console.log(`     ${d.test_date}: ${d.value_text} (numeric: ${d.value_numeric})`);
      });
    });
  }

  console.log('\n=== ANALYSIS COMPLETE ===');
}

testRecommendationGeneration().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
