/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testResultsTable() {
  try {
    console.log('🔍 Testing bloodwork_results table...\n');

    const testUserId = '00000000-0000-0000-0000-000000000011';

    // Test 1: Try to create a result without document_id
    console.log('1️⃣ Testing result creation without document_id...');
    
    const { data: result1, error: error1 } = await supabase
      .from('bloodwork_results')
      .insert({
        user_id: testUserId,
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '145',
        value_numeric: 145,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'upload',
        confidence: 0.95
      })
      .select()
      .single();

    if (error1) {
      console.log('❌ Without document_id failed:', error1.message);
      console.log('Error code:', error1.code);
    } else {
      console.log('✅ Without document_id works! ID:', result1.id);
      await supabase.from('bloodwork_results').delete().eq('id', result1.id);
    }

    // Test 2: Try to create a result with document_id
    console.log('\n2️⃣ Testing result creation with document_id...');
    
    const { data: result2, error: error2 } = await supabase
      .from('bloodwork_results')
      .insert({
        user_id: testUserId,
        document_id: '00000000-0000-0000-0000-000000000012', // Fake document ID
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '145',
        value_numeric: 145,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'upload',
        confidence: 0.95
      })
      .select()
      .single();

    if (error2) {
      console.log('❌ With document_id failed:', error2.message);
      console.log('Error code:', error2.code);
      
      if (error2.code === '23503') {
        console.log('💡 This is a foreign key constraint violation - document_id must reference an existing document');
      }
    } else {
      console.log('✅ With document_id works! ID:', result2.id);
      await supabase.from('bloodwork_results').delete().eq('id', result2.id);
    }

    // Test 3: Check table structure
    console.log('\n3️⃣ Checking table structure...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable, column_default')
      .eq('table_name', 'bloodwork_results')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnsError) {
      console.log('❌ Could not get column info');
    } else {
      console.log('✅ Table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: nullable=${col.is_nullable}, default=${col.column_default}`);
      });
    }

    // Test 4: Try to create a simple result with minimal required fields
    console.log('\n4️⃣ Testing minimal result creation...');
    
    const { data: result4, error: error4 } = await supabase
      .from('bloodwork_results')
      .insert({
        user_id: testUserId,
        raw_test_name: 'Test Marker',
        value_text: '100',
        test_date: '2024-01-15'
      })
      .select()
      .single();

    if (error4) {
      console.log('❌ Minimal result failed:', error4.message);
      console.log('Error details:', error4.details);
    } else {
      console.log('✅ Minimal result works! ID:', result4.id);
      await supabase.from('bloodwork_results').delete().eq('id', result4.id);
    }

    console.log('\n🎯 Summary:');
    console.log('- The bloodwork_results table exists and is accessible');
    console.log('- Foreign key constraints may be enforced');
    console.log('- Need to identify the exact required fields');

  } catch (error) {
    console.log('❌ Test failed:', (error as Error).message);
  }
}

testResultsTable();
