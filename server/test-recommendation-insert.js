// Test recommendation insert to find the failure point
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function testRecommendationInsert() {
  console.log('=== TESTING RECOMMENDATION INSERT ===\n');

  // 1. Check table schema
  console.log('1. Checking bloodwork_recommendations table...');
  const { data: schemaTest, error: schemaError } = await supabase
    .from('bloodwork_recommendations')
    .select('*')
    .limit(0);

  if (schemaError) {
    console.error('❌ Table access error:', schemaError.message);
    return;
  }
  console.log('✅ Table exists and is accessible\n');

  // 2. Create a minimal test recommendation
  console.log('2. Testing minimal recommendation insert...');
  const minimalRec = {
    user_id: USER_ID,
    test_name: 'LDL',
    recommendation_title: 'Test Recommendation',
    recommendation_text: 'This is a test',
    status: 'active'
  };

  const { data: minData, error: minError } = await supabase
    .from('bloodwork_recommendations')
    .insert([minimalRec])
    .select();

  if (minError) {
    console.error('❌ Minimal insert failed:', minError.message);
    console.error('Error code:', minError.code);
    console.error('Error details:', JSON.stringify(minError, null, 2));
  } else {
    console.log('✅ Minimal insert succeeded!');
    console.log('Inserted ID:', minData[0].id);
    
    // Clean up
    await supabase.from('bloodwork_recommendations').delete().eq('id', minData[0].id);
  }

  // 3. Test with full recommendation data (matching service structure)
  console.log('\n3. Testing full recommendation insert...');
  const fullRec = {
    user_id: USER_ID,
    test_name: 'LDL',
    normalized_test_name: 'LDL',
    category: 'Cardiovascular',
    recommendation_type: 'cardiovascular',
    recommendation_title: 'LDL Cholesterol Increasing',
    recommendation_text: 'Your LDL cholesterol has increased from 90 to 120 (33.3%). Consider reviewing your cardiovascular health strategy.',
    rationale: 'LDL cholesterol is rising above optimal levels (120 mg/dL) with a worsening trend over 2 measurements.',
    confidence: 0.8,
    severity: 'medium',
    status: 'active',
    source_document_ids: [],
    source_result_ids: [],
    source_trend_window: {
      start_date: '2024-01-01',
      end_date: '2024-02-01',
      data_points: 2
    }
  };

  const { data: fullData, error: fullError } = await supabase
    .from('bloodwork_recommendations')
    .insert([fullRec])
    .select();

  if (fullError) {
    console.error('❌ Full insert failed:', fullError.message);
    console.error('Error code:', fullError.code);
    console.error('Error details:', JSON.stringify(fullError, null, 2));
    
    // Try to identify which field is causing the issue
    console.log('\n4. Testing individual fields...');
    const testFields = [
      { name: 'Without source_trend_window', data: { ...fullRec, source_trend_window: undefined } },
      { name: 'Without source arrays', data: { ...fullRec, source_document_ids: undefined, source_result_ids: undefined } },
      { name: 'With null source_trend_window', data: { ...fullRec, source_trend_window: null } },
    ];

    for (const test of testFields) {
      const { data: testData, error: testError } = await supabase
        .from('bloodwork_recommendations')
        .insert([test.data])
        .select();

      if (testError) {
        console.log(`  ❌ ${test.name}: ${testError.message}`);
      } else {
        console.log(`  ✅ ${test.name}: Success!`);
        await supabase.from('bloodwork_recommendations').delete().eq('id', testData[0].id);
      }
    }
  } else {
    console.log('✅ Full insert succeeded!');
    console.log('Inserted ID:', fullData[0].id);
    console.log('Full record:', fullData[0]);
    
    // Clean up
    await supabase.from('bloodwork_recommendations').delete().eq('id', fullData[0].id);
  }

  // 4. Check if there's a foreign key constraint issue
  console.log('\n5. Checking for foreign key constraints...');
  const { data: constraints, error: constraintError } = await supabase
    .rpc('get_table_constraints', { table_name: 'bloodwork_recommendations' });

  if (constraintError) {
    console.log('⚠️  Cannot check constraints (RPC may not exist)');
  } else if (constraints) {
    console.log('Table constraints:', constraints);
  }

  console.log('\n=== TEST COMPLETE ===');
}

testRecommendationInsert().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
