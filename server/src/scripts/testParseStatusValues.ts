/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testParseStatusValues() {
  try {
    console.log('🧪 Testing different parse_status values...');
    
    const testValues = ['pending', 'processing', 'completed', 'extracted', 'parsed', 'ready', 'success', 'failed'];
    
    for (const status of testValues) {
      console.log(`\n🔍 Testing status: "${status}"`);
      
      // Create a test document with this status
      const { data: doc, error: docError } = await supabase
        .from('bloodwork_documents')
        .insert({
          user_id: 'parse-status-test-user',
          file_url: 'https://test.com/test.pdf',
          file_name: 'test.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: 'validation_test',
          test_date: '2024-01-15',
          upload_date: new Date().toISOString(),
          parse_status: status,
          extraction_confidence: 0.95,
          notes: `Test document for status: ${status}`
        })
        .select()
        .single();

      if (docError) {
        console.log(`❌ Status "${status}" failed:`, docError.message);
      } else {
        console.log(`✅ Status "${status}" works! Document ID:`, doc.id);
        
        // Clean up this successful test
        await supabase.from('bloodwork_documents').delete().eq('id', doc.id);
        
        // Return the first working status
        console.log(`\n🎉 Found valid parse_status: "${status}"`);
        return status;
      }
    }
    
    console.log('\n❌ No valid parse_status values found');
    return null;
    
  } catch (error) {
    console.log('❌ Error:', (error as Error).message);
    return null;
  }
}

testParseStatusValues().then(validStatus => {
  if (validStatus) {
    console.log(`\n✅ Use parse_status: "${validStatus}" in validation scripts`);
  }
  process.exit(validStatus ? 0 : 1);
});
