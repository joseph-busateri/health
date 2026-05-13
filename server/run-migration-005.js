// Run migration 005 to update recommendation types check constraint
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('=== RUNNING MIGRATION 005 ===\n');
  
  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '005_update_recommendation_types.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration SQL:');
    console.log(sql);
    console.log('\n---\n');
    
    // Execute the migration using Supabase RPC
    // Since we can't run raw SQL directly, we'll use the REST API to execute
    // First, try using the supabase-js client's rpc method if there's a function
    // Otherwise, we'll need to use the REST API directly
    
    console.log('Executing migration via Supabase REST API...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim().length === 0) continue;
      
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      
      try {
        // Use the REST API to execute SQL
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Error executing statement:', error);
          
          // If exec_sql doesn't exist, we need to run this manually
          console.log('\n⚠️  The exec_sql function may not exist.');
          console.log('Please run the following SQL manually in Supabase SQL Editor:\n');
          console.log(sql);
          console.log('\n---\n');
          console.log('Or create the exec_sql function first:');
          console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
          `);
          return;
        }
        
        console.log('✓ Statement executed successfully');
      } catch (err) {
        console.error('Error:', err.message);
      }
    }
    
    console.log('\n=== MIGRATION COMPLETE ===');
    console.log('Please verify the constraint was updated by checking:');
    console.log('SELECT * FROM pg_constraint WHERE conrelid = \'bloodwork_recommendations\'::regclass');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.log('\nPlease run the SQL manually in Supabase SQL Editor:');
    console.log('\n---\n');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '005_update_recommendation_types.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(sql);
  }
}

runMigration().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
