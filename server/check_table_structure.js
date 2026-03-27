const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTableStructure() {
  console.log('🔍 Checking actual table structure...\n');
  
  try {
    // Test what columns we can actually access
    const { data, error } = await supabase
      .from('supplement_baseline')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Sample record found. Columns:');
      Object.keys(data[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof data[0][key]} (${data[0][key]})`);
      });
    } else {
      console.log('ℹ️  No records in table, testing column access...');
      
      // Test specific columns
      const columnsToTest = [
        'id',
        'user_id', 
        'document_id',
        'stack_name',
        'total_active_items',
        'created_at'
      ];
      
      for (const column of columnsToTest) {
        try {
          const { data: colData, error: colError } = await supabase
            .from('supplement_baseline')
            .select(column)
            .limit(1);
          
          if (colError) {
            console.log(`❌ ${column}: NOT ACCESSIBLE - ${colError.message}`);
          } else {
            console.log(`✅ ${column}: ACCESSIBLE`);
          }
        } catch (err) {
          console.log(`❌ ${column}: ERROR - ${err.message}`);
        }
      }
    }
    
    // Check if this is a schema cache issue by testing a simple insert
    console.log('\n🧪 Testing simple operations...');
    
    // Try to find a document to reference
    const { data: documents, error: docError } = await supabase
      .from('supplement_documents')
      .select('id')
      .limit(1);
    
    if (docError || !documents || documents.length === 0) {
      console.log('ℹ️  No existing documents found, creating test document...');
      
      // Create a test document first
      const { data: newDoc, error: createDocError } = await supabase
        .from('supplement_documents')
        .insert({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          document_type: 'manual_entry',
          parse_status: 'pending'
        })
        .select()
        .single();
      
      if (createDocError) {
        console.log('❌ Could not create test document:', createDocError.message);
        return;
      }
      
      console.log('✅ Test document created:', newDoc.id);
      
      // Now try to create baseline
      const { data: newBaseline, error: createBaselineError } = await supabase
        .from('supplement_baseline')
        .insert({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          document_id: newDoc.id,
          stack_name: 'Test Stack',
          total_active_items: 0
        })
        .select()
        .single();
      
      if (createBaselineError) {
        console.log('❌ Could not create baseline:', createBaselineError.message);
      } else {
        console.log('✅ Test baseline created successfully:', newBaseline.id);
        
        // Clean up
        await supabase.from('supplement_baseline').delete().eq('id', newBaseline.id);
        await supabase.from('supplement_documents').delete().eq('id', newDoc.id);
        console.log('✅ Test data cleaned up');
      }
    } else {
      console.log('✅ Found existing document:', documents[0].id);
      
      // Try to create baseline with existing document
      const { data: newBaseline, error: createBaselineError } = await supabase
        .from('supplement_baseline')
        .insert({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          document_id: documents[0].id,
          stack_name: 'Test Stack',
          total_active_items: 0
        })
        .select()
        .single();
      
      if (createBaselineError) {
        console.log('❌ Could not create baseline:', createBaselineError.message);
      } else {
        console.log('✅ Test baseline created successfully:', newBaseline.id);
        
        // Clean up
        await supabase.from('supplement_baseline').delete().eq('id', newBaseline.id);
        console.log('✅ Test data cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Structure check failed:', error);
  }
}

checkTableStructure();
