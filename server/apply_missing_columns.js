const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function applyMissingColumns() {
  console.log('🔧 APPLYING MISSING COLUMN FIXES\n');
  
  // Since we can't execute ALTER TABLE via PostgREST, let's check what we can work with
  // and provide the exact SQL needed
  
  console.log('📋 Current supplement_extracted_sections columns:');
  
  try {
    // Test what columns currently exist
    const columnsToTest = [
      'id', 'user_id', 'document_id', 'raw_text', 
      'normalized_name', 'extraction_confidence', 'created_at'
    ];
    
    const existingColumns = [];
    const missingColumns = [];
    
    for (const column of columnsToTest) {
      try {
        const { error } = await supabase.from('supplement_extracted_sections').select(column).limit(1);
        if (error && error.message.includes('column does not exist')) {
          missingColumns.push(column);
        } else {
          existingColumns.push(column);
        }
      } catch (err) {
        missingColumns.push(column);
      }
    }
    
    console.log('✅ Existing columns:', existingColumns);
    console.log('❌ Missing columns:', missingColumns);
    
    if (missingColumns.length > 0) {
      console.log('\n🔧 SQL COMMANDS TO EXECUTE IN SUPABASE SQL EDITOR:');
      console.log('='.repeat(60));
      
      missingColumns.forEach(column => {
        if (column === 'user_id') {
          console.log('ALTER TABLE public.supplement_extracted_sections ADD COLUMN IF NOT EXISTS user_id TEXT;');
        } else if (column === 'normalized_name') {
          console.log('ALTER TABLE public.supplement_extracted_sections ADD COLUMN IF NOT EXISTS normalized_name TEXT;');
        }
      });
      
      console.log('\n-- Create indexes');
      console.log('CREATE INDEX IF NOT EXISTS idx_supplement_extracted_sections_user_id ON public.supplement_extracted_sections(user_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_supplement_extracted_sections_document_id ON public.supplement_extracted_sections(document_id);');
      
      console.log('\n-- Reload schema cache');
      console.log('NOTIFY pgrst, \'reload schema\';');
      console.log('='.repeat(60));
      
      console.log('\n📋 AFTER EXECUTING SQL:');
      console.log('1. Run: node validate_remaining_fixes.js');
      console.log('2. Expected: All 5/5 tests pass');
      
    } else {
      console.log('\n✅ All columns present! Running validation...');
      
      // All columns exist, run the full validation
      const { validateRemainingFixes } = require('./validate_remaining_fixes.js');
      return validateRemainingFixes();
    }
    
  } catch (error) {
    console.error('❌ Column check failed:', error);
  }
}

applyMissingColumns();
