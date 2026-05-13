const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reloadAndValidate() {
  console.log('🔄 RELOADING SCHEMA CACHE AND VALIDATING\n');
  
  try {
    // Try to reload schema cache
    console.log('📋 Attempting to reload PostgREST schema cache...');
    
    // This might not work via RPC, but let's try
    const { error: reloadError } = await supabase.rpc('reload_schema');
    
    if (reloadError) {
      console.log('ℹ️  Schema reload note:', reloadError.message);
      console.log('👉 Manual reload may be needed via Supabase dashboard');
    } else {
      console.log('✅ Schema cache reloaded successfully');
    }
    
    // Wait a moment for cache to refresh
    console.log('⏳ Waiting for cache refresh...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now check the table structure again
    console.log('\n🔍 Re-checking supplement_extracted_sections structure...');
    
    const columnsToTest = [
      'id', 'user_id', 'document_id', 'raw_text', 
      'normalized_name', 'extraction_confidence', 'created_at'
    ];
    
    const results = [];
    
    for (const column of columnsToTest) {
      try {
        const { error } = await supabase.from('supplement_extracted_sections').select(column).limit(1);
        if (error && error.message.includes('column does not exist')) {
          results.push({ column, status: 'MISSING', error: error.message });
        } else if (error) {
          results.push({ column, status: 'ERROR', error: error.message });
        } else {
          results.push({ column, status: 'ACCESSIBLE', error: null });
        }
      } catch (err) {
        results.push({ column, status: 'CONNECTION_ERROR', error: err.message });
      }
    }
    
    console.log('\n📊 Column Access Results:');
    results.forEach(r => {
      const icon = r.status === 'ACCESSIBLE' ? '✅' : '❌';
      console.log(`${icon} ${r.column}: ${r.status}${r.error ? ' - ' + r.error : ''}`);
    });
    
    const allAccessible = results.every(r => r.status === 'ACCESSIBLE');
    
    if (allAccessible) {
      console.log('\n🎉 All columns accessible! Running full validation...');
      
      // Run the comprehensive validation
      const { validateRemainingFixes } = require('./validate_remaining_fixes.js');
      return validateRemainingFixes();
      
    } else {
      console.log('\n❌ Schema issues persist. Manual SQL fixes required.');
      
      console.log('\n🔧 REQUIRED SQL FIXES:');
      console.log('='.repeat(50));
      
      results.filter(r => r.status === 'MISSING').forEach(r => {
        if (r.column === 'user_id') {
          console.log('ALTER TABLE public.supplement_extracted_sections ADD COLUMN IF NOT EXISTS user_id TEXT;');
        } else if (r.column === 'normalized_name') {
          console.log('ALTER TABLE public.supplement_extracted_sections ADD COLUMN IF NOT EXISTS normalized_name TEXT;');
        }
      });
      
      console.log('\n-- Reload schema cache');
      console.log('NOTIFY pgrst, \'reload schema\';');
      console.log('='.repeat(50));
      
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Execute the SQL above in Supabase SQL Editor');
      console.log('2. Run: node reload_and_validate.js');
      console.log('3. Expected: Full validation success');
    }
    
  } catch (error) {
    console.error('❌ Reload and validation failed:', error);
  }
}

reloadAndValidate();
