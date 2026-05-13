const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function applySchemaFixes() {
  console.log('🔧 Applying schema fixes to supplement_baseline table...\n');
  
  try {
    // Read the SQL fixes
    const sqlFixes = fs.readFileSync('./apply_schema_fixes.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlFixes
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // For safety, let's just show what needs to be executed manually
    console.log('\n🔧 MANUAL STEPS REQUIRED:');
    console.log('='.repeat(50));
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Copy and execute the contents of apply_schema_fixes.sql');
    console.log('3. After execution, run this validation script again');
    console.log('='.repeat(50));
    
    // Show the critical statements
    console.log('\n📋 Critical SQL statements:');
    statements.forEach((statement, index) => {
      if (statement.includes('ALTER TABLE') || statement.includes('NOTIFY pgrst')) {
        console.log(`${index + 1}. ${statement.substring(0, 100)}...`);
      }
    });
    
    // Test current state
    console.log('\n🔍 Current state check...');
    
    // Check if document_id column exists
    try {
      const { data, error } = await supabase
        .from('supplement_baseline')
        .select('document_id')
        .limit(1);
      
      if (error && error.message.includes('column does not exist')) {
        console.log('❌ document_id column still missing');
        console.log('👉 Please execute the SQL fixes in Supabase SQL Editor');
      } else if (error) {
        console.log('⚠️  Other error:', error.message);
      } else {
        console.log('✅ document_id column exists!');
        console.log('🎉 Schema fixes have been applied');
      }
    } catch (err) {
      console.log('❌ Check failed:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Schema fix application failed:', error);
  }
}

applySchemaFixes();
