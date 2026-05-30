/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function executeSQL(sql: string) {
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    throw new Error(error.message);
  }
}

async function runMigrationStatements(statements: string[]) {
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement.trim()) continue;
    console.log(`🔧 Executing statement ${i + 1}/${statements.length}`);
    await executeSQL(statement.endsWith(';') ? statement : `${statement};`);
  }
}

async function deployProcessingSchema() {
  try {
    console.log('🚀 Deploying bloodwork processing schema additions...');

    const migrationPath = path.join(
      __dirname,
      '../migrations/20240327_add_bloodwork_processing_fields.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    if (statements.length === 0) {
      console.log('⚠️  No SQL statements detected in migration file');
      return;
    }

    await runMigrationStatements(statements);

    console.log('✅ Bloodwork processing schema deployed successfully');

    console.log('🔍 Verifying new columns exist...');
    const { data, error } = await supabase
      .from('bloodwork_documents')
      .select('processing_status, processing_error, processing_started_at, processing_completed_at, processing_progress')
      .limit(1);

    if (error) {
      console.warn('⚠️  Verification query failed:', error.message);
    } else {
      console.log('✅ Verification query succeeded', data ? data[0] : 'no rows');
    }
  } catch (error) {
    console.error('❌ Failed to deploy processing schema:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

deployProcessingSchema();
