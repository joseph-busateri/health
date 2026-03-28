/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findValidParseStatus() {
  try {
    console.log('🔍 Finding valid parse_status values...\n');

    const testValues = [
      'pending',
      'processing', 
      'parsed',
      'completed',
      'extracted',
      'ready',
      'success',
      'failed',
      'error',
      'uploaded',
      'analyzed'
    ];
    
    const testUserId = '00000000-0000-0000-0000-000000000004';

    for (const status of testValues) {
      console.log(`🧪 Testing parse_status: "${status}"`);
      
      // Create minimal test document
      const { data: doc, error: docError } = await supabase
        .from('bloodwork_documents')
        .insert({
          user_id: testUserId,
          file_url: 'https://test.com/test.pdf',
          file_name: 'test.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: 'lab_report',
          test_date: '2024-01-15',
          upload_date: new Date().toISOString(),
          parse_status: status,
          extraction_confidence: 0.95,
          notes: `Test for status: ${status}`
        })
        .select()
        .single();

      if (docError) {
        console.log(`❌ "${status}" failed: ${docError.message}`);
      } else {
        console.log(`✅ "${status}" works! Document ID: ${doc.id}`);
        
        // Clean up immediately
        await supabase.from('bloodwork_documents').delete().eq('id', doc.id);
        
        console.log(`\n🎉 Found valid parse_status: "${status}"`);
        
        // Now test with this status in the validation
        console.log('\n🔧 Testing validation with this status...');
        await testValidationWithStatus(status);
        
        return status;
      }
    }
    
    console.log('\n❌ No valid parse_status found');
    return null;
    
  } catch (error) {
    console.log('❌ Error:', (error as Error).message);
    return null;
  }
}

async function testValidationWithStatus(validStatus: string) {
  try {
    console.log(`🧪 Running mini-validation with status: "${validStatus}"\n`);

    const TEST_USER_ID = '00000000-0000-0000-0000-000000000005';

    // Create test document
    const { data: doc, error: docError } = await supabase
      .from('bloodwork_documents')
      .insert({
        user_id: TEST_USER_ID,
        file_url: 'https://storage.example.com/bloodwork/mini-test.pdf',
        file_name: 'mini-test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        document_type: 'comprehensive',
        source: 'lab_report',
        test_date: '2024-01-15',
        upload_date: new Date().toISOString(),
        parse_status: validStatus,
        extraction_confidence: 0.95,
        notes: 'Mini validation test'
      })
      .select()
      .single();

    if (docError) {
      console.log('❌ Mini validation document creation failed:', docError.message);
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
        source: 'lab_report',
        confidence: 0.95
      })
      .select()
      .single();

    if (resultError) {
      console.log('❌ Result creation failed:', resultError.message);
    } else {
      console.log('✅ Result created');
      console.log('🎉 Mini validation PASSED with status:', validStatus);
    }

    // Cleanup
    await supabase.from('bloodwork_results').delete().eq('user_id', TEST_USER_ID);
    await supabase.from('bloodwork_documents').delete().eq('user_id', TEST_USER_ID);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.log('❌ Mini validation error:', (error as Error).message);
  }
}

findValidParseStatus();
