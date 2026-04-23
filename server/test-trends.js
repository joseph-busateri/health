// Quick test script to check trend generation
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function testTrendGeneration() {
  console.log('Testing trend generation...\n');

  // 1. Check bloodwork_results
  const { data: results, error: resultsError } = await supabase
    .from('bloodwork_results')
    .select('id, raw_test_name, normalized_test_name, value_numeric, value_text, test_date')
    .eq('user_id', USER_ID)
    .not('test_date', 'is', null)
    .order('test_date', { ascending: true })
    .limit(20);

  if (resultsError) {
    console.error('Error fetching results:', resultsError);
    return;
  }

  console.log(`Found ${results?.length || 0} bloodwork results`);
  if (results && results.length > 0) {
    console.log('Sample results:');
    results.slice(0, 5).forEach(r => {
      console.log(`  - ${r.normalized_test_name || r.raw_test_name}: ${r.value_text} (${r.test_date})`);
    });
  }

  // 2. Group by marker
  const grouped = {};
  results?.forEach(r => {
    const key = r.normalized_test_name || r.raw_test_name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  console.log(`\nGrouped into ${Object.keys(grouped).length} unique markers`);
  console.log('Markers with 2+ data points:');
  Object.entries(grouped).forEach(([marker, data]) => {
    if (data.length >= 2) {
      console.log(`  - ${marker}: ${data.length} data points`);
    }
  });

  // 3. Check bloodwork_trends
  const { data: trends, error: trendsError } = await supabase
    .from('bloodwork_trends')
    .select('*')
    .eq('user_id', USER_ID);

  if (trendsError) {
    console.error('\nError fetching trends:', trendsError);
  } else {
    console.log(`\nFound ${trends?.length || 0} trends in database`);
  }

  // 4. Check bloodwork_documents
  const { data: docs, error: docsError } = await supabase
    .from('bloodwork_documents')
    .select('id, processing_status, processing_error, created_at')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  if (docsError) {
    console.error('\nError fetching documents:', docsError);
  } else {
    console.log(`\nFound ${docs?.length || 0} bloodwork documents`);
    docs?.forEach(d => {
      console.log(`  - ${d.id}: ${d.processing_status} ${d.processing_error ? `(${d.processing_error})` : ''}`);
    });
  }
}

testTrendGeneration().then(() => {
  console.log('\nTest complete');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
