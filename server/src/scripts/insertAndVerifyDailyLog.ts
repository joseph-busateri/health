import 'dotenv/config';

import { createClient, type PostgrestError } from '@supabase/supabase-js';

import { saveDailyLog } from '../services/dailyLogVectorService';
import type { DailyLogInput } from '../types/dailyLog';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function formatError(error: PostgrestError | null) {
  if (!error) return 'Unknown error';
  return error.message ?? error.details ?? error.hint ?? JSON.stringify(error, null, 2);
}

function coerceEmbedding(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item));
  }

  if (typeof value === 'string') {
    const matches = value.match(/-?\d+(?:\.\d+)?/g);
    return matches ? matches.map((num) => Number(num)) : null;
  }

  return null;
}

async function main() {
  const timestamp = new Date().toISOString();

  const newLog: DailyLogInput = {
    userId: 'test-user-connectivity',
    date: timestamp.slice(0, 10),
    sleepHours: 7.2,
    recoveryFeeling: 3,
    stressLevel: 4,
    workoutAdherence: 80,
    notes: `Inserted for connectivity verification at ${timestamp}`,
  };

  console.log('📝 Inserting new daily log via vector service...');
  const saveResult = await saveDailyLog(newLog);

  console.log('   • logSaved:', saveResult.logSaved);
  console.log('   • embeddingSaved:', saveResult.embeddingSaved);
  if (saveResult.warning) {
    console.warn('   • warning:', saveResult.warning);
  }

  if (!saveResult.logSaved) {
    console.error('❌ Log failed to save; skipping verification steps.');
    return;
  }

  console.log('✅ Inserted log summary:', {
    logSaved: saveResult.logSaved,
    embeddingSaved: saveResult.embeddingSaved,
    warning: saveResult.warning,
    id: saveResult.log.id,
    date: saveResult.log.date,
    userId: saveResult.log.userId,
    embeddingLength: saveResult.log.embedding?.length ?? 0,
  });

  console.log('\n🔍 Fetching stored row directly from Supabase...');
  const { data: stored, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('id', saveResult.log.id)
    .single();

  if (error) {
    console.error(`⚠️ Unable to fetch stored row for verification: ${formatError(error)}`);
    return;
  }

  const parsedEmbedding = coerceEmbedding(stored.embedding);

  console.log('📦 Stored row:', {
    id: stored.id,
    user_id: stored.user_id,
    date: stored.date,
    embeddingType: Array.isArray(stored.embedding) ? 'array' : typeof stored.embedding,
    parsedEmbeddingLength: parsedEmbedding?.length ?? null,
  });

  if (!parsedEmbedding || parsedEmbedding.length === 0) {
    console.warn('⚠️ Failed to parse embedding into numeric array. Raw value logged above.');
  } else {
    console.log('🧠 Embedding length confirmed:', parsedEmbedding.length);
  }

  console.log('\n🎉 Daily log insertion and verification complete.');
}

main().catch((err) => {
  console.error('❌ Insert and verify script failed:', err);
  process.exit(1);
});
