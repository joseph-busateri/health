/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findValidSource() {
  try {
    console.log('🔍 Finding valid source values...\n');

    const testValues = [
      'upload',
      'manual_entry',
      'api',
      'integration',
      'import',
      'lab_report',
      'patient_portal',
      'fax',
      'email',
      'mobile_app'
    ];
    
    const testUserId = '00000000-0000-0000-0000-000000000007';

    for (const source of testValues) {
      console.log(`🧪 Testing source: "${source}"`);
      
      // Create minimal test document with this source
      const { data: doc, error: docError } = await supabase
        .from('bloodwork_documents')
        .insert({
          user_id: testUserId,
          file_url: 'https://test.com/test.pdf',
          file_name: 'test.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: source,
          test_date: '2024-01-15',
          upload_date: new Date().toISOString()
        })
        .select()
        .single();

      if (docError) {
        console.log(`❌ "${source}" failed: ${docError.message}`);
      } else {
        console.log(`✅ "${source}" works! Document ID: ${doc.id}`);
        
        // Clean up immediately
        await supabase.from('bloodwork_documents').delete().eq('id', doc.id);
        
        console.log(`\n🎉 Found valid source: "${source}"`);
        
        // Now test parse_status with this valid source
        await testParseStatusWithValidSource(source);
        
        return source;
      }
    }
    
    console.log('\n❌ No valid source found');
    return null;
    
  } catch (error) {
    console.log('❌ Error:', (error as Error).message);
    return null;
  }
}

async function testParseStatusWithValidSource(validSource: string) {
  try {
    console.log(`\n🧪 Testing parse_status values with source: "${validSource}"`);

    const testStatuses = [
      'pending',
      'processing',
      'processed',
      'completed',
      'extracted',
      'analyzed',
      'ready',
      'failed',
      'error'
    ];

    const testUserId = '00000000-0000-0000-0000-000000000008';

    for (const status of testStatuses) {
      console.log(`  🔍 Testing parse_status: "${status}"`);
      
      const { data: doc, error: docError } = await supabase
        .from('bloodwork_documents')
        .insert({
          user_id: testUserId,
          file_url: 'https://test.com/test.pdf',
          file_name: 'test.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: validSource,
          test_date: '2024-01-15',
          upload_date: new Date().toISOString(),
          parse_status: status
        })
        .select()
        .single();

      if (docError) {
        console.log(`    ❌ "${status}" failed: ${docError.message}`);
      } else {
        console.log(`    ✅ "${status}" works! Document ID: ${doc.id}`);
        
        // Clean up
        await supabase.from('bloodwork_documents').delete().eq('id', doc.id);
        
        console.log(`\n🎉 Found valid combination:`);
        console.log(`   Source: "${validSource}"`);
        console.log(`   Parse Status: "${status}"`);
        
        // Test the full validation with these values
        await testFullValidation(validSource, status);
        
        return { source: validSource, status };
      }
    }
    
    console.log('\n❌ No valid parse_status found with this source');
    return null;
    
  } catch (error) {
    console.log('❌ Error:', (error as Error).message);
    return null;
  }
}

async function testFullValidation(validSource: string, validStatus: string) {
  try {
    console.log(`\n🎯 Running full validation test with:`);
    console.log(`   Source: "${validSource}"`);
    console.log(`   Status: "${validStatus}"`);

    const TEST_USER_ID = '00000000-0000-0000-0000-000000000009';

    // Create test document
    const { data: doc, error: docError } = await supabase
      .from('bloodwork_documents')
      .insert({
        user_id: TEST_USER_ID,
        file_url: 'https://storage.example.com/bloodwork/full-test.pdf',
        file_name: 'full-test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        document_type: 'comprehensive',
        source: validSource,
        test_date: '2024-01-15',
        upload_date: new Date().toISOString(),
        parse_status: validStatus,
        extraction_confidence: 0.95,
        notes: 'Full validation test'
      })
      .select()
      .single();

    if (docError) {
      console.log('❌ Full validation document creation failed:', docError.message);
      return;
    }

    console.log('✅ Document created');

    // Create test result
    const { data: result, error: resultError } = await supabase
      .from('bloodwork_results')
      .insert({
        user_id: TEST_USER_ID,
        document_id: doc.id,
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '145',
        value_numeric: 145,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: validSource,
        confidence: 0.95
      })
      .select()
      .single();

    if (resultError) {
      console.log('❌ Result creation failed:', resultError.message);
    } else {
      console.log('✅ Result created');
      console.log('🎉 Full validation PASSED!');
      console.log('\n📋 VALID VALUES FOR VALIDATION SCRIPT:');
      console.log(`   source: "${validSource}"`);
      console.log(`   parse_status: "${validStatus}"`);
    }

    // Cleanup
    await supabase.from('bloodwork_results').delete().eq('user_id', TEST_USER_ID);
    await supabase.from('bloodwork_documents').delete().eq('user_id', TEST_USER_ID);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.log('❌ Full validation error:', (error as Error).message);
  }
}

findValidSource();
