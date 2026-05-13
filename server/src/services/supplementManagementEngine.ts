import { supabase } from '../config/supabase';

interface UpsertSupplementPayload {
  userId: string;
  supplementName: string;
  dosageAmount: number;
  dosageUnit: string;
  timing: string;
  frequency: string;
  timesPerDay?: number;
  goal?: string;
  reasonToTake?: string;
  status?: 'active' | 'paused' | 'discontinued';
}

const ensureStackVersion = async (userId: string) => {
  const { data, error } = await supabase
    .from('supplement_stack_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_current', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to load supplement stack version: ${error.message}`);
  }

  if (!data) {
    throw new Error('No active supplement stack version found for user');
  }

  return data;
};

const loadInventoryMap = async (userId: string, supplementIds: string[]) => {
  if (supplementIds.length === 0) {
    return new Map<string, any>();
  }

  const { data, error } = await supabase
    .from('supplement_inventory')
    .select('*')
    .eq('user_id', userId)
    .in('supplement_id', supplementIds);

  if (error) {
    throw new Error(`Failed to load supplement inventory: ${error.message}`);
  }

  const map = new Map<string, any>();
  for (const row of data ?? []) {
    map.set(row.supplement_id, row);
  }
  return map;
};

const loadAdherenceMap = async (stackVersionId: string, days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('supplement_adherence_log')
    .select('supplement_id, taken, missed, side_effects_reported')
    .eq('stack_version_id', stackVersionId)
    .gte('scheduled_date', startDate.toISOString().split('T')[0]);

  if (error) {
    throw new Error(`Failed to load adherence log: ${error.message}`);
  }

  const map = new Map<string, { total: number; taken: number; missed: number; sideEffects: number }>();
  for (const entry of data ?? []) {
    const current = map.get(entry.supplement_id) ?? { total: 0, taken: 0, missed: 0, sideEffects: 0 };
    current.total += 1;
    if (entry.taken) current.taken += 1;
    if (entry.missed) current.missed += 1;
    if (entry.side_effects_reported) current.sideEffects += 1;
    map.set(entry.supplement_id, current);
  }
  return map;
};

export const supplementManagementEngine = {
  async getSupplementRegimen(userId: string) {
    const stackVersion = await ensureStackVersion(userId);

    const { data: supplements, error: supplementsError } = await supabase
      .from('supplements')
      .select('*')
      .eq('stack_version_id', stackVersion.id)
      .order('supplement_order');

    if (supplementsError) {
      throw new Error(`Failed to load supplements: ${supplementsError.message}`);
    }

    const supplementIds = (supplements ?? []).map(s => s.id);
    const [inventoryMap, adherenceMap] = await Promise.all([
      loadInventoryMap(userId, supplementIds),
      loadAdherenceMap(stackVersion.id, 30),
    ]);

    const enrichedSupplements = (supplements ?? []).map(supplement => {
      const inventory = inventoryMap.get(supplement.id) ?? null;
      const adherence = adherenceMap.get(supplement.id) ?? { total: 0, taken: 0, missed: 0, sideEffects: 0 };
      const adherencePercentage = adherence.total === 0 ? null : Number(((adherence.taken / adherence.total) * 100).toFixed(1));

      return {
        id: supplement.id,
        supplementName: supplement.supplement_name,
        dosageAmount: Number(supplement.dosage_amount),
        dosageUnit: supplement.dosage_unit,
        timing: supplement.timing,
        frequency: supplement.frequency,
        timesPerDay: supplement.times_per_day ?? 1,
        goal: supplement.goal,
        reasonToTake: supplement.reason_to_take,
        status: supplement.status,
        takeWithFood: supplement.take_with_food,
        takeWithWater: supplement.take_with_water,
        inventory,
        adherence: {
          windowDays: 30,
          totalScheduled: adherence.total,
          totalTaken: adherence.taken,
          totalMissed: adherence.missed,
          sideEffects: adherence.sideEffects,
          adherencePercentage,
        },
        createdAt: supplement.created_at,
      };
    });

    const stackVersionNormalized = {
      id: stackVersion.id,
      userId: stackVersion.user_id,
      versionNumber: stackVersion.version_number,
      versionName: stackVersion.version_name,
      isCurrent: stackVersion.is_current,
      createdBy: stackVersion.created_by,
      createdReason: stackVersion.created_reason,
      basedOnRecommendationId: stackVersion.based_on_recommendation_id,
      effectiveFrom: stackVersion.effective_from,
      effectiveTo: stackVersion.effective_to,
      createdAt: stackVersion.created_at,
    };

    return {
      stackVersion: stackVersionNormalized,
      supplements: enrichedSupplements,
    };
  },

  async addSupplement(data: UpsertSupplementPayload) {
    const stackVersion = await ensureStackVersion(data.userId);

    const { data: existing, error: existingError } = await supabase
      .from('supplements')
      .select('supplement_order')
      .eq('stack_version_id', stackVersion.id)
      .order('supplement_order', { ascending: false })
      .limit(1);

    if (existingError) {
      throw new Error(`Failed to determine supplement order: ${existingError.message}`);
    }

    const nextOrder = existing && existing.length > 0 ? (existing[0].supplement_order ?? 0) + 1 : 1;

    const { data: inserted, error: insertError } = await supabase
      .from('supplements')
      .insert({
        stack_version_id: stackVersion.id,
        supplement_name: data.supplementName,
        dosage_amount: data.dosageAmount,
        dosage_unit: data.dosageUnit,
        timing: data.timing,
        frequency: data.frequency,
        times_per_day: data.timesPerDay ?? 1,
        goal: data.goal,
        reason_to_take: data.reasonToTake,
        status: data.status ?? 'active',
        take_with_food: true,
        take_with_water: true,
        supplement_order: nextOrder,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      throw new Error(`Failed to add supplement: ${insertError?.message}`);
    }

    return { supplementId: inserted.id };
  },

  async logIntake(data: { userId: string; supplementId: string; scheduledDate: string; scheduledTime: string; taken: boolean; takenAt?: string; plannedDosageAmount: number; actualDosageAmount?: number; dosageUnit: string; notes?: string }) {
    const stackVersion = await ensureStackVersion(data.userId);

    const { data: inserted, error } = await supabase
      .from('supplement_adherence_log')
      .insert({
        user_id: data.userId,
        supplement_id: data.supplementId,
        stack_version_id: stackVersion.id,
        scheduled_date: data.scheduledDate,
        scheduled_time: data.scheduledTime,
        taken: data.taken,
        taken_at: data.takenAt ?? null,
        planned_dosage_amount: data.plannedDosageAmount,
        actual_dosage_amount: data.actualDosageAmount ?? null,
        dosage_unit: data.dosageUnit,
        missed: !data.taken,
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(`Failed to log supplement intake: ${error?.message}`);
    }

    return { intakeId: inserted.id };
  },

  async getAdherenceStats(userId: string, days: number = 30) {
    const stackVersion = await ensureStackVersion(userId);
    const adherenceMap = await loadAdherenceMap(stackVersion.id, days);

    let totalScheduled = 0;
    let totalTaken = 0;
    let totalMissed = 0;
    let sideEffects = 0;

    adherenceMap.forEach(stats => {
      totalScheduled += stats.total;
      totalTaken += stats.taken;
      totalMissed += stats.missed;
      sideEffects += stats.sideEffects;
    });

    const adherenceRate = totalScheduled === 0 ? null : Number(((totalTaken / totalScheduled) * 100).toFixed(1));

    return {
      windowDays: days,
      totalScheduled,
      totalTaken,
      totalMissed,
      sideEffects,
      adherenceRate,
    };
  },

  async updateSupplement(supplementId: string, data: Partial<UpsertSupplementPayload>) {
    const payload: Record<string, unknown> = {};
    if (data.supplementName) payload.supplement_name = data.supplementName;
    if (typeof data.dosageAmount !== 'undefined') payload.dosage_amount = data.dosageAmount;
    if (data.dosageUnit) payload.dosage_unit = data.dosageUnit;
    if (data.timing) payload.timing = data.timing;
    if (data.frequency) payload.frequency = data.frequency;
    if (typeof data.timesPerDay !== 'undefined') payload.times_per_day = data.timesPerDay;
    if (data.goal) payload.goal = data.goal;
    if (data.reasonToTake) payload.reason_to_take = data.reasonToTake;
    if (data.status) payload.status = data.status;

    if (Object.keys(payload).length === 0) {
      return { message: 'Nothing to update' };
    }

    const { error } = await supabase
      .from('supplements')
      .update(payload)
      .eq('id', supplementId);

    if (error) {
      throw new Error(`Failed to update supplement: ${error.message}`);
    }

    return { message: 'Supplement updated' };
  },

  async deleteSupplement(supplementId: string) {
    const { error } = await supabase
      .from('supplements')
      .delete()
      .eq('id', supplementId);

    if (error) {
      throw new Error(`Failed to delete supplement: ${error.message}`);
    }

    return { message: 'Supplement deleted' };
  },

  async getHistory(userId: string, days: number = 30) {
    const stackVersion = await ensureStackVersion(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('supplement_stack_changes')
      .select('*')
      .eq('to_version_id', stackVersion.id)
      .gte('created_at', startDate.toISOString());

    if (error) {
      throw new Error(`Failed to load supplement history: ${error.message}`);
    }

    return data ?? [];
  },
};
