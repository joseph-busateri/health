/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testDirectInsert() {
  try {
    console.log('🧪 Testing direct database insert...');
    
    const testDocument = {
      user_id: 'test-user-123',
      file_url: 'https://test.com/test.pdf',
      file_name: 'test.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      document_type: 'lab_panel',
      source: 'manual_upload',
      test_date: null,
      notes: 'Test document',
      metadata: {
        upload_timestamp: new Date().toISOString(),
        original_filename: 'test.pdf',
      },
      parse_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📤 Inserting document...');
    
    const { data, error } = await supabase
      .from('bloodwork_documents')
      .insert([testDocument])
      .select()
      .single();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('📋 Error details:', error.details);
      console.log('🔢 Error code:', error.code);
    } else {
      console.log('✅ Insert successful!');
      console.log('📋 Document ID:', data.id);
      
      // Clean up
      await supabase.from('bloodwork_documents').delete().eq('id', data.id);
      console.log('🧹 Cleaned up test document');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testDirectInsert();
