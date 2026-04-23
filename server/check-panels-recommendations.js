// Check if bloodwork_panels and bloodwork_recommendations tables should have data
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function checkTables() {
  console.log('=== CHECKING BLOODWORK_PANELS AND BLOODWORK_RECOMMENDATIONS ===\n');

  // 1. Check bloodwork_panels table
  console.log('1. Checking bloodwork_panels table...');
  const { data: panels, error: panelsError } = await supabase
    .from('bloodwork_panels')
    .select('*')
    .eq('user_id', USER_ID);

  if (panelsError) {
    console.error('❌ Error accessing bloodwork_panels:', panelsError.message);
  } else {
    console.log(`✅ bloodwork_panels table exists`);
    console.log(`   Found ${panels.length} panels for user`);
    if (panels.length > 0) {
      console.log('   Sample panel:', panels[0]);
    }
  }

  // 2. Check bloodwork_recommendations table
  console.log('\n2. Checking bloodwork_recommendations table...');
  const { data: recommendations, error: recsError } = await supabase
    .from('bloodwork_recommendations')
    .select('*')
    .eq('user_id', USER_ID);

  if (recsError) {
    console.error('❌ Error accessing bloodwork_recommendations:', recsError.message);
  } else {
    console.log(`✅ bloodwork_recommendations table exists`);
    console.log(`   Found ${recommendations.length} recommendations for user`);
    if (recommendations.length > 0) {
      console.log('   Sample recommendation:', recommendations[0]);
    }
  }

  // 3. Check bloodwork_documents to see what was extracted
  console.log('\n3. Checking bloodwork_documents for panel data...');
  const { data: docs, error: docsError } = await supabase
    .from('bloodwork_documents')
    .select('id, metadata, created_at')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(3);

  if (docsError) {
    console.error('❌ Error accessing bloodwork_documents:', docsError.message);
  } else {
    console.log(`Found ${docs.length} recent documents`);
    docs.forEach(doc => {
      const metadata = doc.metadata || {};
      console.log(`\n   Document ${doc.id}:`);
      console.log(`   - panels_detected: ${metadata.panels_detected || 'none'}`);
      console.log(`   - panel_names_detected: ${JSON.stringify(metadata.panel_names_detected || [])}`);
    });
  }

  // 4. Check bloodwork_results to see what markers were extracted
  console.log('\n4. Checking bloodwork_results...');
  const { data: results, error: resultsError } = await supabase
    .from('bloodwork_results')
    .select('id, panel_name, raw_test_name')
    .eq('user_id', USER_ID)
    .limit(10);

  if (resultsError) {
    console.error('❌ Error accessing bloodwork_results:', resultsError.message);
  } else {
    console.log(`Found ${results.length} results (showing first 10)`);
    const panelCounts = {};
    results.forEach(r => {
      const panel = r.panel_name || 'No Panel';
      panelCounts[panel] = (panelCounts[panel] || 0) + 1;
    });
    console.log('\n   Results by panel:');
    Object.entries(panelCounts).forEach(([panel, count]) => {
      console.log(`   - ${panel}: ${count} markers`);
    });
  }

  console.log('\n=== ANALYSIS ===');
  console.log('\n📊 bloodwork_panels:');
  console.log('   Purpose: Store panel-level information (CBC, CMP, Lipid Panel, etc.)');
  console.log('   Expected: Should have data if extraction service populates it');
  console.log(`   Current: ${panels?.length || 0} panels`);
  console.log('   Status:', panels?.length > 0 ? '✅ Has data' : '⚠️  Empty (may not be populated by current extraction logic)');

  console.log('\n💊 bloodwork_recommendations:');
  console.log('   Purpose: Store AI-generated recommendations for out-of-range markers');
  console.log('   Expected: Should have data if generateBloodworkRecommendationsForUser is called');
  console.log(`   Current: ${recommendations?.length || 0} recommendations`);
  console.log('   Status:', recommendations?.length > 0 ? '✅ Has data' : '⚠️  Empty (recommendations may not be generated yet)');

  console.log('\n=== SUMMARY ===');
  if (panels?.length === 0) {
    console.log('\n⚠️  bloodwork_panels is empty:');
    console.log('   This table may not be actively used in the current extraction pipeline.');
    console.log('   The extraction service saves to bloodwork_results with panel_name field instead.');
  }
  
  if (recommendations?.length === 0) {
    console.log('\n⚠️  bloodwork_recommendations is empty:');
    console.log('   Check if generateBloodworkRecommendationsForUser is being called successfully.');
    console.log('   Check server logs for "Generating recommendations" and "Recommendations result".');
  }
}

checkTables().then(() => {
  console.log('\nDone');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
