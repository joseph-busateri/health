/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration(migrationName: string) {
  try {
    console.log(`🔄 Running migration: ${migrationName}`);
    
    const migrationPath = join(__dirname, '../migrations', `${migrationName}.sql`);
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // Try direct SQL execution if RPC fails
          console.log(`⚠️  RPC failed, trying direct execution for statement ${i + 1}`);
          console.log(`   SQL: ${statement.substring(0, 100)}...`);
          
          // For now, we'll just log the error and continue
          // In a real deployment, you'd use a proper migration tool
          console.log(`   Error: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Statement ${i + 1} failed: ${(error as Error).message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ Migration completed: ${successCount} successful, ${errorCount} failed`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This might be due to:');
      console.log('   - Objects already existing');
      console.log('   - Permission issues');
      console.log('   - SQL syntax differences');
      console.log('\n📋 Manual deployment may be required. Run the SQL directly in Supabase dashboard:');
      console.log(`   File: ${migrationPath}`);
    }
    
    return errorCount === 0;
  } catch (error) {
    console.error(`❌ Migration failed: ${(error as Error).message}`);
    return false;
  }
}

async function main() {
  const migrationName = process.argv[2];
  
  if (!migrationName) {
    console.log('Usage: npm run migrate <migration-name>');
    console.log('Example: npm run migrate create_bloodwork_results_table');
    process.exit(1);
  }
  
  console.log('🚀 DATABASE MIGRATION');
  console.log('=====================\n');
  
  const success = await runMigration(migrationName);
  
  if (success) {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  } else {
    console.log('\n❌ Migration completed with errors');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Migration failed to run:', error);
  process.exit(1);
});
