import 'dotenv/config';

import { saveDailyLog, getRecentLogs, similaritySearch } from '../services/dailyLogVectorService';
import type { DailyLogInput } from '../types/dailyLog';

const userId = 'test-user-123';

const sampleLogs: DailyLogInput[] = [
  {
    userId,
    date: '2024-03-20',
    sleepHours: 6,
    recoveryFeeling: 2,
    stressLevel: 8,
    workoutAdherence: 40,
    notes: 'Late night work, high stress, low sleep.',
  },
  {
    userId,
    date: '2024-03-21',
    sleepHours: 8,
    recoveryFeeling: 4,
    stressLevel: 3,
    workoutAdherence: 90,
    notes: 'Great rest and morning workout.',
  },
  {
    userId,
    date: '2024-03-22',
    sleepHours: 5,
    recoveryFeeling: 1,
    stressLevel: 9,
    workoutAdherence: 10,
    notes: 'Barely slept and skipped workout due to stress.',
  },
];

async function runTests() {
  console.log('🚀 Daily Log Vector Service Test');
  console.log('=================================');

  console.log('\n1️⃣ Storage Test: Inserting sample logs...');
  const insertedLogs = [];
  for (const log of sampleLogs) {
    const result = await saveDailyLog(log);
    console.log('Inserted log:', {
      logSaved: result.logSaved,
      embeddingSaved: result.embeddingSaved,
      warning: result.warning,
      id: result.log.id,
      date: result.log.date,
      sleepHours: result.log.sleepHours,
      stressLevel: result.log.stressLevel,
      embeddingPreview: result.log.embedding?.slice(0, 5),
    });
    insertedLogs.push(result.log);
  }

  console.log('\nRetrieving logs to verify storage...');
  const recent = await getRecentLogs(userId, 10);
  console.log('Stored logs:', recent.map((log) => ({
    id: log.id,
    date: log.date,
    sleepHours: log.sleepHours,
    recoveryFeeling: log.recoveryFeeling,
    stressLevel: log.stressLevel,
    workoutAdherence: log.workoutAdherence,
    embeddingLength: log.embedding?.length ?? 0,
  })));

  console.log('\n2️⃣ Ordering Test: Ensure descending order by date...');
  const dates = recent.map((log) => log.date);
  console.log('Dates:', dates);

  const sorted = [...dates].sort((a, b) => (a > b ? -1 : 1));
  const isDescending = dates.every((date, index) => date === sorted[index]);
  console.log('Descending order check:', isDescending ? '✅ Passed' : '❌ Failed');

  console.log('\n3️⃣ Similarity Test: Query "low sleep high stress"');
  const similarityResults = await similaritySearch('low sleep high stress', userId, 5);
  console.log(
    'Similarity matches:',
    similarityResults.map((match) => ({
      id: match.id,
      similarity: match.similarity,
      date: match.log.date,
      sleepHours: match.log.sleepHours,
      stressLevel: match.log.stressLevel,
      notes: match.log.notes,
    })),
  );

  console.log('\n4️⃣ Failure Scenarios & Handling');
  console.log('- Missing environment variables: ensure Supabase/OpenAI keys set before running.');
  console.log('- Supabase RPC not defined: create match_daily_logs function returning similarity matches.');
  console.log('- Embedding generation failures (API limits/network): retry with exponential backoff.');
  console.log('- Vector dimension mismatch: ensure table uses same embedding model.');
  console.log('- Data validation issues: enforce schema at API layer before save.');

  console.log('\n✅ Tests complete.');
}

runTests().catch((error) => {
  console.error('Test run failed:', error);
  process.exit(1);
});
