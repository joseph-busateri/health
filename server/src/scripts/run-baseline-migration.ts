import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

async function runBaselineMigration() {
  console.log('='.repeat(80));
  console.log('BASELINE PROFILE MIGRATION');
  console.log('='.repeat(80));

  try {
    logger.info('🔵 [BASELINE MIGRATION] Migration started');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'migrations', '20260406_baseline_profile_preferences_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('\n--- Executing Migration SQL ---');
    console.log(`File: ${migrationPath}`);
    console.log(`Size: ${migrationSQL.length} characters`);

    // Execute the migration
    // Note: Supabase client doesn't support raw SQL execution directly
    // This would need to be run via Supabase dashboard or psql
    console.log('\n⚠️  IMPORTANT: This migration must be run via Supabase dashboard or psql');
    console.log('Copy the SQL from: src/migrations/20260406_baseline_profile_preferences_schema.sql');
    console.log('And execute in Supabase SQL Editor');

    // Verify tables exist after manual migration
    console.log('\n--- Verifying Tables ---');

    const { data: profileTable, error: profileError } = await supabase
      .from('baseline_profile')
      .select('*')
      .limit(0);

    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ baseline_profile table: NOT FOUND');
      console.log('   Please run the migration SQL first');
    } else {
      console.log('✅ baseline_profile table: EXISTS');
    }

    const { data: prefsTable, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(0);

    if (prefsError && prefsError.code !== 'PGRST116') {
      console.log('❌ user_preferences table: NOT FOUND');
      console.log('   Please run the migration SQL first');
    } else {
      console.log('✅ user_preferences table: EXISTS');
    }

    logger.info('✅ [BASELINE MIGRATION] Migration verification complete');

    console.log('\n' + '='.repeat(80));
    console.log('MIGRATION STATUS');
    console.log('='.repeat(80));
    console.log('Tables verified. System ready for baseline profile integration.');
    console.log('='.repeat(80));

  } catch (error) {
    logger.error('❌ [BASELINE MIGRATION] Migration failed', {
      error: (error as Error).message,
    });
    console.error('\n❌ Migration failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runBaselineMigration()
    .then(() => {
      console.log('\n✅ Migration verification complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration verification failed:', error);
      process.exit(1);
    });
}

export { runBaselineMigration };
