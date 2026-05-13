const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkExistingSchema() {
  console.log('🔍 Checking existing database schema...\n');
  
  // Check existing supplement tables
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .like('table_name', 'supplement_%');
  
  if (tablesError) {
    console.error('❌ Error checking tables:', tablesError);
    return;
  }
  
  const existingTables = tables?.map(t => t.table_name) || [];
  console.log('📋 Existing supplement tables:', existingTables.length > 0 ? existingTables : 'None');
  
  // Check for existing functions
  const { data: functions, error: functionsError } = await supabase
    .from('pg_proc')
    .select('proname')
    .eq('pronamespace', 'public')
    .like('proname', 'handle_updated_at');
    
  if (functionsError) {
    console.error('❌ Error checking functions:', functionsError);
  } else {
    console.log('🔧 Existing handle_updated_at functions:', functions?.length || 0);
  }
  
  // Check for existing triggers
  const { data: triggers, error: triggersError } = await supabase
    .from('pg_trigger')
    .select('tgname')
    .eq('tgrelid', 'public.supplement_documents')
    .or('tgrelid.eq.public.supplement_baselines')
    .or('tgrelid.eq.public.supplement_items');
    
  if (triggersError) {
    console.error('❌ Error checking triggers:', triggersError);
  } else {
    console.log('⚡ Existing supplement triggers:', triggers?.length || 0);
  }
  
  // Check for existing RLS policies
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('policyname, tablename')
    .eq('schemaname', 'public')
    .like('tablename', 'supplement_%');
    
  if (policiesError) {
    console.error('❌ Error checking policies:', policiesError);
  } else {
    console.log('🔒 Existing supplement policies:', policies?.length || 0);
  }
  
  return {
    existingTables,
    hasConflicts: existingTables.length > 0
  };
}

checkExistingSchema()
  .then(result => {
    console.log('\n✅ Schema check complete');
    if (result.hasConflicts) {
      console.log('⚠️  Existing supplement tables found - deployment will use IF NOT EXISTS');
    } else {
      console.log('✨ Clean slate - all tables will be created fresh');
    }
  })
  .catch(console.error);
