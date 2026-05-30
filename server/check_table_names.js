const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkActualTableNames() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('🔍 Checking actual table names in database...');
  
  const tableNames = [
    'supplement_documents',
    'supplement_baselines', 
    'supplement_baseline',
    'supplement_items',
    'supplement_extracted_sections',
    'supplement_change_log'
  ];
  
  for (const tableName of tableNames) {
    try {
      const { error } = await supabase.from(tableName).select('count').limit(1);
      if (error && error.code === 'PGRST116') {
        console.log(`❌ ${tableName}: NOT FOUND`);
      } else if (error) {
        console.log(`⚠️  ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: EXISTS`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ERROR - ${err.message}`);
    }
  }
}

checkActualTableNames().catch(console.error);
