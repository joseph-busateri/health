// Run the bloodwork_trends migration
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Running bloodwork_trends table migration...\n');

  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '003_create_bloodwork_trends_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executing SQL migration...');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
    
    if (error) {
      // Try direct query if RPC doesn't exist
      console.log('RPC method not available, trying direct execution...');
      
      // For Supabase, we need to use the REST API directly
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_query: statement + ';' })
      });

      if (!response.ok) {
        console.error(`❌ Failed to execute statement ${i + 1}`);
        console.error('Statement:', statement.substring(0, 100) + '...');
        console.error('Error:', await response.text());
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } else {
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
  }

  console.log('\n\nMigration complete! Verifying table creation...');
  
  // Verify the table exists
  const { data: tableCheck, error: checkError } = await supabase
    .from('bloodwork_trends')
    .select('*')
    .limit(0);

  if (checkError) {
    console.error('❌ Table verification failed:', checkError.message);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log(sql);
  } else {
    console.log('✅ Table created successfully!');
  }
}

runMigration().then(() => {
  console.log('\nDone');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
