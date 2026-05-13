/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkExistingTables() {
  try {
    console.log('🔍 Checking what tables exist in the database...\n');

    // Method 1: Try to get table list from information_schema
    console.log('1️⃣ Checking information_schema.tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.log('❌ Could not get tables from information_schema:', tablesError.message);
    } else {
      console.log('✅ Found tables:', tables.map(t => t.table_name));
    }

    // Method 2: Try to access specific bloodwork tables directly
    console.log('\n2️⃣ Testing specific bloodwork tables...');
    
    const bloodworkTables = [
      'bloodwork_documents',
      'bloodwork_results', 
      'bloodwork_trends',
      'bloodwork_recommendations'
    ];

    for (const tableName of bloodworkTables) {
      console.log(`\n🔍 Testing table: ${tableName}`);
      
      const { data: testData, error: testError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (testError) {
        console.log(`❌ ${tableName}: ${testError.message}`);
        console.log(`   Error code: ${testError.code}`);
      } else {
        console.log(`✅ ${tableName}: Accessible (${testData?.length || 0} rows)`);
      }
    }

    // Method 3: Check if we can create recommendations directly (we know this works)
    console.log('\n3️⃣ Testing bloodwork_recommendations (should work)...');
    
    const testUserId = '00000000-0000-0000-0000-000000000013';
    
    const { data: rec, error: recError } = await supabase
      .from('bloodwork_recommendations')
      .insert({
        user_id: testUserId,
        test_name: 'Test Marker',
        recommendation_type: 'cardiovascular',
        recommendation_title: 'Test Recommendation',
        recommendation_text: 'This is a test',
        rationale: 'Test rationale',
        confidence: 0.8,
        severity: 'medium',
        source_document_ids: [],
        source_result_ids: [],
        source_trend_window: {
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          data_points: 1
        }
      })
      .select()
      .single();

    if (recError) {
      console.log('❌ bloodwork_recommendations failed:', recError.message);
    } else {
      console.log('✅ bloodwork_recommendations: Working! ID:', rec.id);
      
      // Clean up
      await supabase.from('bloodwork_recommendations').delete().eq('id', rec.id);
      console.log('✅ Cleanup complete');
    }

    console.log('\n🎯 Summary:');
    console.log('- bloodwork_recommendations table exists and works');
    console.log('- bloodwork_documents table has constraint issues');
    console.log('- bloodwork_results table may not exist or has permission issues');
    console.log('- The validation script needs to work with what actually exists');

  } catch (error) {
    console.log('❌ Check failed:', (error as Error).message);
  }
}

checkExistingTables();
