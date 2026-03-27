const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  console.log('🧪 Testing table structure with simple insert...');
  
  try {
    // Test with a UUID user_id
    const uuidTest = await supabase
      .from('supplement_documents')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        document_type: 'manual_entry',
        parse_status: 'pending'
      })
      .select()
      .single();
    
    if (uuidTest.error) {
      console.log('❌ UUID test failed:', uuidTest.error.message);
    } else {
      console.log('✅ UUID test passed');
      // Clean up
      await supabase.from('supplement_documents').delete().eq('id', uuidTest.data.id);
    }
    
    // Test with string user_id
    const stringTest = await supabase
      .from('supplement_documents')
      .insert({
        user_id: 'test-user-string', // String
        document_type: 'manual_entry',
        parse_status: 'pending'
      })
      .select()
      .single();
    
    if (stringTest.error) {
      console.log('❌ String test failed:', stringTest.error.message);
      console.log('👉 This indicates user_id column expects UUID format');
    } else {
      console.log('✅ String test passed');
      // Clean up
      await supabase.from('supplement_documents').delete().eq('id', stringTest.data.id);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testInsert();
