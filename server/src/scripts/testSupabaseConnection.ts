/// <reference types="node" />
import 'dotenv/config';

import { createClient, type PostgrestError } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DAILY_LOGS_TABLE } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const table = SUPABASE_DAILY_LOGS_TABLE || 'daily_logs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function formatSupabaseError(error: PostgrestError | null) {
  if (!error) {
    return 'Unknown error';
  }

  return error.message ?? error.details ?? error.hint ?? JSON.stringify(error, null, 2);
}

async function testDailyLogsQuery() {
  console.log(`🔍 Running basic select on "${table}"...`);

  const { data, error } = await supabase
    .from(table)
    .select('id, user_id, date')
    .limit(1);

  if (error) {
    console.error('❌ Basic query failed:', formatSupabaseError(error));
    return;
  }

  const rowPreview = data?.[0];

  if (!rowPreview) {
    console.log('ℹ️ Basic query succeeded but returned no rows. Table may be empty.');
  } else {
    console.log('✅ Basic query succeeded. Sample row preview:', rowPreview);
  }
}

async function run() {
  console.log('🔌 Testing Supabase connectivity...');

  await testDailyLogsQuery();

  const { data: countData, count, error: countError } = await supabase
    .from(table)
    .select('id', { count: 'exact' })
    .limit(1);

  if (countError) {
    console.error('❌ Failed to query table:', formatSupabaseError(countError));
    process.exit(1);
  }

  console.log(`✅ Connection successful. Table "${table}" is accessible.`);
  console.log(`   Total row count: ${count ?? (countData?.length ?? 0)}`);

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('date', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Failed to fetch rows:', formatSupabaseError(error));
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('ℹ️ No rows found in the table yet.');
  } else {
    console.log('📦 Sample rows:');
    console.dir(
      data.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        date: row.date,
        sleep_hours: row.sleep_hours,
        stress_level: row.stress_level,
      })),
      { depth: null },
    );
  }

  console.log('\n📋 Checklist remaining:');
  console.log('- Ensure pgvector extension is enabled.');
  console.log('- Confirm daily_logs table has the expected schema.');
  console.log('- Create the match_daily_logs RPC for similarity queries.');
  console.log('- Once OpenAI key is ready, run npm run test:daily-logs.');
}

run().catch((error) => {
  console.error('❌ Supabase test failed:', error);
  process.exit(1);
});
