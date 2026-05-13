/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTableConstraints() {
  try {
    console.log('🔍 Checking bloodwork_documents table constraints...\n');

    // Try to get table info through information schema
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('table_name', 'bloodwork_documents')
      .eq('constraint_schema', 'public');

    if (constraintsError) {
      console.log('❌ Could not get constraints from information_schema');
    } else {
      console.log('✅ Found constraints:', constraints);
    }

    // Try to get column info
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'bloodwork_documents')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnsError) {
      console.log('❌ Could not get columns from information_schema');
    } else {
      console.log('\n✅ Table columns:');
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });
    }

    // Try to find existing documents to see what values are actually used
    const { data: existingDocs, error: docsError } = await supabase
      .from('bloodwork_documents')
      .select('source, parse_status')
      .limit(10);

    if (docsError) {
      console.log('\n❌ Could not get existing documents');
    } else {
      console.log('\n✅ Existing document values:');
      if (existingDocs && existingDocs.length > 0) {
        const sources = [...new Set(existingDocs.map(d => d.source))];
        const statuses = [...new Set(existingDocs.map(d => d.parse_status))];
        console.log('Valid sources found:', sources);
        console.log('Valid parse_status values found:', statuses);
      } else {
        console.log('No existing documents found');
      }
    }

    // Try a different approach - create a minimal document with null values
    console.log('\n🧪 Testing minimal document...');
    
    const testUserId = '00000000-0000-0000-0000-000000000006';
    
    // First try with minimal required fields only
    const { data: minimalDoc, error: minimalError } = await supabase
      .from('bloodwork_documents')
      .insert({
        user_id: testUserId,
        file_url: 'https://test.com/test.pdf',
        file_name: 'test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        document_type: 'comprehensive',
        test_date: '2024-01-15',
        upload_date: new Date().toISOString()
      })
      .select()
      .single();

    if (minimalError) {
      console.log('❌ Minimal document failed:', minimalError.message);
      console.log('Error details:', minimalError.details);
    } else {
      console.log('✅ Minimal document works! ID:', minimalDoc.id);
      
      // Now try adding optional fields one by one
      console.log('\n🧪 Adding optional fields...');
      
      // Update with source
      const { error: sourceError } = await supabase
        .from('bloodwork_documents')
        .update({ source: 'upload' })
        .eq('id', minimalDoc.id);

      if (sourceError) {
        console.log('❌ Source "upload" failed:', sourceError.message);
      } else {
        console.log('✅ Source "upload" works');
      }

      // Update with parse_status
      const { error: statusError } = await supabase
        .from('bloodwork_documents')
        .update({ parse_status: 'processed' })
        .eq('id', minimalDoc.id);

      if (statusError) {
        console.log('❌ Parse_status "processed" failed:', statusError.message);
      } else {
        console.log('✅ Parse_status "processed" works');
      }

      // Cleanup
      await supabase.from('bloodwork_documents').delete().eq('id', minimalDoc.id);
      console.log('✅ Cleanup complete');
    }

  } catch (error) {
    console.log('❌ Error:', (error as Error).message);
  }
}

checkTableConstraints();
