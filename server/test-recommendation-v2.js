// Test Recommendation Service V2
// Validates expanded rule coverage and AI enhancement
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function testRecommendationV2() {
  console.log('=== TESTING RECOMMENDATION SERVICE V2 ===\n');

  // 1. Check feature flags
  console.log('1. Feature Flags:');
  console.log(`   USE_RECOMMENDATION_V2: ${process.env.USE_RECOMMENDATION_V2 || 'false'}`);
  console.log(`   AI_ENHANCEMENT_ENABLED: ${process.env.AI_ENHANCEMENT_ENABLED || 'true'}`);
  console.log(`   USE_UNIFIED_ENGINE: ${process.env.USE_UNIFIED_ENGINE || 'false'}`);

  // 2. Check trends
  console.log('\n2. Checking trends...');
  const { data: trends, error: trendsError } = await supabase
    .from('bloodwork_trends')
    .select('marker_name, trend_direction, data_points')
    .eq('user_id', USER_ID);

  if (trendsError) {
    console.error('❌ Error fetching trends:', trendsError.message);
    return;
  }

  console.log(`   Total trends: ${trends.length}`);
  const worseningTrends = trends.filter(t => t.trend_direction === 'worsening');
  console.log(`   Worsening trends: ${worseningTrends.length}`);
  
  if (worseningTrends.length > 0) {
    console.log('\n   Worsening markers:');
    worseningTrends.forEach(t => {
      console.log(`   - ${t.marker_name} (${t.data_points} points)`);
    });
  }

  // 3. Check existing recommendations
  console.log('\n3. Checking existing recommendations...');
  const { data: existingRecs, error: recsError } = await supabase
    .from('bloodwork_recommendations')
    .select('id, test_name, recommendation_type, severity, created_at')
    .eq('user_id', USER_ID)
    .eq('status', 'active');

  if (recsError) {
    console.error('❌ Error fetching recommendations:', recsError.message);
  } else {
    console.log(`   Existing recommendations: ${existingRecs.length}`);
    if (existingRecs.length > 0) {
      console.log('\n   Active recommendations:');
      existingRecs.forEach(r => {
        console.log(`   - ${r.test_name} (${r.recommendation_type}, ${r.severity})`);
      });
    }
  }

  // 4. Expected V2 improvements
  console.log('\n4. V2 Expected Improvements:');
  console.log('   V1 Coverage: 11 markers (LDL, HDL, Triglycerides, hsCRP, HbA1c, Glucose, Insulin, Testosterone, Free Testosterone, SHBG, Estradiol)');
  console.log('   V2 Coverage: 30+ markers across 9 categories:');
  console.log('   - Cardiovascular: LDL, HDL, Triglycerides, ApoB, Lp(a)');
  console.log('   - Metabolic: Glucose, HbA1c, Insulin, hsCRP, Homocysteine');
  console.log('   - Liver: ALT, AST, GGT, Bilirubin, Alkaline Phosphatase');
  console.log('   - Kidney: Creatinine, BUN, eGFR');
  console.log('   - Hematology: WBC, RBC, HGB, Platelets');
  console.log('   - Thyroid: TSH, Free T3, Free T4');
  console.log('   - Hormonal: Testosterone, Free Testosterone, SHBG, Estradiol, Cortisol, DHEA-S');
  console.log('   - Nutritional: Vitamin D, Vitamin B12, Ferritin, Magnesium');
  console.log('   - Prostate: PSA, Free PSA');

  // 5. Recommendation coverage analysis
  console.log('\n5. Coverage Analysis:');
  const v2CoveredMarkers = [
    'LDL', 'HDL', 'Triglycerides', 'ApoB', 'Lp(a)',
    'Glucose', 'HbA1c', 'Insulin', 'hsCRP', 'Homocysteine',
    'ALT', 'AST', 'GGT', 'Bilirubin, Total', 'Alkaline Phosphatase',
    'Creatinine', 'Blood Urea Nitrogen', 'eGFR',
    'WBC', 'RBC', 'HGB', 'Platelets',
    'TSH', 'Free T3', 'Free T4',
    'Testosterone', 'Free Testosterone', 'SHBG', 'Estradiol', 'Cortisol', 'DHEA-S',
    'Vitamin D', 'Vitamin B12', 'Ferritin', 'Magnesium',
    'PSA', 'Free PSA'
  ];

  const coveredWorseningMarkers = worseningTrends.filter(t => 
    v2CoveredMarkers.includes(t.marker_name)
  );

  console.log(`   Worsening markers covered by V2: ${coveredWorseningMarkers.length}/${worseningTrends.length}`);
  console.log(`   Coverage rate: ${worseningTrends.length > 0 ? (coveredWorseningMarkers.length / worseningTrends.length * 100).toFixed(1) : 0}%`);

  if (coveredWorseningMarkers.length > 0) {
    console.log('\n   Covered worsening markers:');
    coveredWorseningMarkers.forEach(t => {
      console.log(`   ✅ ${t.marker_name}`);
    });
  }

  const uncoveredWorseningMarkers = worseningTrends.filter(t => 
    !v2CoveredMarkers.includes(t.marker_name)
  );

  if (uncoveredWorseningMarkers.length > 0) {
    console.log('\n   Uncovered worsening markers (need rules):');
    uncoveredWorseningMarkers.forEach(t => {
      console.log(`   ⚠️  ${t.marker_name}`);
    });
  }

  // 6. Next steps
  console.log('\n6. Next Steps:');
  if (process.env.USE_RECOMMENDATION_V2 === 'true') {
    console.log('   ✅ V2 is ENABLED - recommendations will use expanded rules');
    console.log('   📤 Upload a bloodwork document to test V2 generation');
  } else {
    console.log('   ⚠️  V2 is DISABLED - set USE_RECOMMENDATION_V2=true in .env to enable');
    console.log('   Steps to enable:');
    console.log('   1. Add to .env: USE_RECOMMENDATION_V2=true');
    console.log('   2. Restart server: npm run dev');
    console.log('   3. Upload bloodwork document');
    console.log('   4. Check logs for "[RECOMMENDATION V2]" messages');
    console.log('   5. Verify increased recommendation count');
  }

  console.log('\n=== TEST COMPLETE ===');
}

testRecommendationV2().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
