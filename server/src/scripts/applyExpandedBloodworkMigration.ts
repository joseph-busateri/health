/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runSqlFile(relativePath: string): Promise<void> {
  const filePath = path.join(__dirname, relativePath);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`\n🔄 Applying: ${relativePath}`);

  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    throw new Error(`Failed applying ${relativePath}: ${error.message}`);
  }

  console.log(`✅ Applied: ${relativePath}`);
}

async function verifyExpandedSchema(): Promise<void> {
  console.log('\n🔍 Verifying expanded schema visibility...');

  const { error: docErr } = await supabase
    .from('bloodwork_documents')
    .select('id,lab_name,accession_number,physician_name,patient_sex,patient_dob,specimen_datetime,final_reported_datetime,report_status,account_name,panel_names_detected')
    .limit(1);

  if (docErr) {
    throw new Error(`bloodwork_documents verification failed: ${docErr.message}`);
  }

  const { error: panelErr } = await supabase
    .from('bloodwork_panels')
    .select('id,document_id,user_id,panel_name,panel_category,panel_datetime,panel_status')
    .limit(1);

  if (panelErr) {
    throw new Error(`bloodwork_panels verification failed: ${panelErr.message}`);
  }

  const { error: resultErr } = await supabase
    .from('bloodwork_results')
    .select('id,panel_id,panel_name,sub_category,abnormal_flag_source,lab_timestamp,source_lab,notes')
    .limit(1);

  if (resultErr) {
    throw new Error(`bloodwork_results verification failed: ${resultErr.message}`);
  }

  console.log('✅ Expanded schema verified in API layer');
}

async function main() {
  try {
    console.log('🚀 Applying expanded bloodwork migrations...');

    await runSqlFile('../migrations/create_bloodwork_results_table.sql');
    await runSqlFile('../migrations/20260328_expand_bloodwork_schema.sql');

    const { error: reloadErr } = await supabase.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema';" });
    if (reloadErr) {
      throw new Error(`Schema reload failed: ${reloadErr.message}`);
    }
    console.log('✅ PostgREST schema cache reload requested');

    await verifyExpandedSchema();

    console.log('\n🎉 Expanded bloodwork migrations applied successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration apply failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
