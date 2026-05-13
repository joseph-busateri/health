import 'dotenv/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type {
  CardioMetricRecord,
  SexualHealthCheckInRecord,
  SexualHealthStatusRecord,
} from '../types/healthMetrics';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_CARDIO_METRICS_TABLE,
  SUPABASE_SEXUAL_HEALTH_CHECK_INS_TABLE,
  SUPABASE_SEXUAL_HEALTH_STATUS_TABLE,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const CARDIO_TABLE = SUPABASE_CARDIO_METRICS_TABLE || 'cardio_metrics';
const SEXUAL_CHECK_INS_TABLE = SUPABASE_SEXUAL_HEALTH_CHECK_INS_TABLE || 'sexual_health_check_ins';
const SEXUAL_STATUS_TABLE = SUPABASE_SEXUAL_HEALTH_STATUS_TABLE || 'sexual_health_status';

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type NullableNumber = number | string | null;

type CardioMetricRow = {
  id: string;
  user_id: string;
  taken_at: string;
  systolic: NullableNumber;
  diastolic: NullableNumber;
  resting_heart_rate: NullableNumber;
  source: string | null;
  notes: string | null;
  created_at: string;
};

type SexualHealthCheckInRow = {
  id: string;
  user_id: string;
  taken_at: string;
  desire_level: NullableNumber;
  satisfaction_level: NullableNumber;
  stress_impact: NullableNumber;
  status: string;
  notes: string | null;
  created_at: string;
};

type SexualHealthStatusRow = {
  id: string;
  user_id: string;
  taken_at: string;
  status: string;
  confidence: NullableNumber;
  summary: string | null;
  created_at: string;
};

const toNumber = (value: NullableNumber, fallback: number): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const mapCardioRow = (row: CardioMetricRow): CardioMetricRecord => ({
  userId: row.user_id,
  takenAt: row.taken_at,
  systolic: toNumber(row.systolic, 0),
  diastolic: toNumber(row.diastolic, 0),
  restingHeartRate: toNumber(row.resting_heart_rate, 0),
  source: row.source ?? undefined,
  notes: row.notes ?? undefined,
});

const mapSexualCheckInRow = (row: SexualHealthCheckInRow): SexualHealthCheckInRecord => ({
  userId: row.user_id,
  takenAt: row.taken_at,
  desireLevel: toNumber(row.desire_level, 0),
  satisfactionLevel: toNumber(row.satisfaction_level, 0),
  stressImpact: toNumber(row.stress_impact, 0),
  status: (row.status as SexualHealthCheckInRecord['status']) ?? 'Monitoring',
  notes: row.notes ?? undefined,
});

const mapSexualStatusRow = (row: SexualHealthStatusRow): SexualHealthStatusRecord => ({
  userId: row.user_id,
  takenAt: row.taken_at,
  status: (row.status as SexualHealthStatusRecord['status']) ?? 'Monitoring',
  confidence: Number.isFinite(Number(row.confidence)) ? Number(row.confidence) : undefined,
  summary: row.summary ?? undefined,
});

export const getRecentCardioMetrics = async (
  userId: string,
  limit = 10,
): Promise<CardioMetricRecord[]> => {
  try {
    const { data, error } = await supabase
      .from(CARDIO_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase cardio metrics error:', error.message);
      return [];
    }

    return ((data ?? []) as CardioMetricRow[]).map(mapCardioRow);
  } catch (error) {
    console.warn('Unexpected cardio metrics fetch error:', error);
    return [];
  }
};

export const getRecentSexualHealthCheckIns = async (
  userId: string,
  limit = 6,
): Promise<SexualHealthCheckInRecord[]> => {
  try {
    const { data, error } = await supabase
      .from(SEXUAL_CHECK_INS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase sexual health check-ins error:', error.message);
      return [];
    }

    return ((data ?? []) as SexualHealthCheckInRow[]).map(mapSexualCheckInRow);
  } catch (error) {
    console.warn('Unexpected sexual health check-in fetch error:', error);
    return [];
  }
};

export const getLatestSexualHealthStatus = async (
  userId: string,
): Promise<SexualHealthStatusRecord | null> => {
  try {
    const { data, error } = await supabase
      .from(SEXUAL_STATUS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.warn('Supabase sexual health status error:', error.message);
      }
      return null;
    }

    return data ? mapSexualStatusRow(data as SexualHealthStatusRow) : null;
  } catch (error) {
    console.warn('Unexpected sexual health status fetch error:', error);
    return null;
  }
};
