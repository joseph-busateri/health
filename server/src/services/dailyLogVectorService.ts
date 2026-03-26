import 'dotenv/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

import {
  createDailyLog,
  getDailyLogsForUser,
} from './structuredDailyLogService';

import type {
  DailyLogInput,
  DailyLogRecord,
  SimilarLogMatch,
  SaveDailyLogResult,
} from '../types/dailyLog';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DAILY_LOGS_TABLE,
  OPENAI_API_KEY,
  OPENAI_EMBEDDING_MODEL,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const TABLE_NAME = SUPABASE_DAILY_LOGS_TABLE || 'daily_logs';
const EMBEDDING_MODEL = OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const VECTOR_DIMENSION = 1536;

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

interface DailyLogRow {
  id: string;
  user_id: string;
  date: string;
  sleep_hours: number | string;
  recovery_feeling: number | string;
  stress_level: number | string;
  workout_adherence: number | string;
  notes: string | null;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

interface MatchResult {
  id: string;
  similarity: number;
  log: DailyLogRow;
}

const toNumber = (value: number | string | null | undefined, fallback = 0): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
};

const toDailyLogRecord = (row: DailyLogRow): DailyLogRecord => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  sleepHours: toNumber(row.sleep_hours),
  recoveryFeeling: toNumber(row.recovery_feeling),
  stressLevel: toNumber(row.stress_level),
  workoutAdherence: toNumber(row.workout_adherence),
  notes: row.notes ?? undefined,
  embedding: row.embedding ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildEmbeddingPayload = (log: DailyLogInput): string => {
  const lines = [
    `Date: ${log.date}`,
    `Sleep Hours: ${log.sleepHours}`,
    `Recovery Feeling: ${log.recoveryFeeling}`,
    `Stress Level: ${log.stressLevel}`,
    `Workout Adherence: ${log.workoutAdherence}`,
  ];

  if (log.notes) {
    lines.push(`Notes: ${log.notes}`);
  }

  return lines.join('\n');
};

const embedLog = async (log: DailyLogInput): Promise<number[]> => {
  if (!openai) {
    throw new Error('OpenAI API key not configured; skipping embedding generation.');
  }

  const { data } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: buildEmbeddingPayload(log),
  });

  if (!data || data.length === 0) {
    throw new Error('OpenAI embeddings response did not contain data.');
  }

  return data[0].embedding;
};

export const saveDailyLog = async (log: DailyLogInput): Promise<SaveDailyLogResult> => {
  const insertedRecord = await createDailyLog(log);

  let currentRow: DailyLogRow = {
    id: insertedRecord.id,
    user_id: insertedRecord.userId,
    date: insertedRecord.date,
    sleep_hours: insertedRecord.sleepHours,
    recovery_feeling: insertedRecord.recoveryFeeling,
    stress_level: insertedRecord.stressLevel,
    workout_adherence: insertedRecord.workoutAdherence,
    notes: insertedRecord.notes ?? null,
    embedding: insertedRecord.embedding ?? null,
    created_at: insertedRecord.createdAt,
    updated_at: insertedRecord.updatedAt,
  };
  let embeddingSaved = false;
  let warning: string | undefined;

  try {
    const embedding = await embedLog(log);
    const { data: updatedRow, error: updateError } = await supabase
      .from(TABLE_NAME)
      .update({ embedding })
      .eq('id', insertedRecord.id)
      .select()
      .single<DailyLogRow>();

    if (updateError) {
      warning = `Saved log but failed to store embedding: ${updateError.message ?? updateError.details ?? 'Unknown error'}`;
    } else if (updatedRow) {
      currentRow = updatedRow;
      embeddingSaved = true;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warning = `Saved log but skipped embedding: ${message}`;
  }

  return {
    logSaved: true,
    embeddingSaved,
    warning,
    log: toDailyLogRecord(currentRow),
  };
};

export const getRecentLogs = async (userId: string, limit = 7): Promise<DailyLogRecord[]> => {
  return getDailyLogsForUser(userId, limit);
};

export const similaritySearch = async (
  query: string,
  userId: string,
  limit = 5,
  similarityThreshold = 0.3,
): Promise<SimilarLogMatch[]> => {
  if (!openai) {
    throw new Error('OpenAI API key not configured; similarity search is unavailable.');
  }

  const { data } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });

  if (!data || data.length === 0) {
    throw new Error('OpenAI embeddings response did not contain data.');
  }

  const queryEmbedding = data[0].embedding;

  const { data: matches, error } = await supabase.rpc(
    'match_daily_logs',
    {
      query_embedding: queryEmbedding,
      match_count: limit,
      similarity_threshold: similarityThreshold,
      match_user_id: userId,
    },
  );

  if (error) {
    console.error('Supabase similarity search error:', error);
    throw error;
  }

  const typedMatches = (matches as MatchResult[] | null) ?? [];

  return typedMatches.map((match) => ({
    id: match.id,
    similarity: match.similarity,
    log: toDailyLogRecord(match.log),
  }));
};
