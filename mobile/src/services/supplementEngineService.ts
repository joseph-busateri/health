import api from './api';
import type {
  SupplementRecommendation,
  SupplementStack,
  SupplementStackVersion,
  SupplementRegimenItem,
  SupplementStackMetrics,
  SupplementInventorySummary,
  SupplementAdherenceSummary,
} from '../types/supplementEngine';

export const generateSupplementRecommendations = async (
  userId: string,
  context?: Record<string, unknown>
): Promise<{ recommendations: SupplementRecommendation[]; summary: any }> => {
  const response = await api.post(`/supplements/recommendations/generate/${userId}`, context ?? {});
  return response.data.data;
};

export const getSupplementRecommendations = async (
  userId: string
): Promise<SupplementRecommendation[]> => {
  const response = await api.get(`/supplements/recommendations/${userId}`);
  return response.data.data;
};

export const getCurrentSupplementStack = async (userId: string): Promise<SupplementStack | null> => {
  try {
    const response = await api.get(`/supplements/current/${userId}`);
    const data = response.data.data;
    if (!data) {
      return null;
    }

    const stackVersion: SupplementStackVersion = {
      id: data.stackVersion.id,
      userId: data.stackVersion.userId,
      versionNumber: data.stackVersion.versionNumber,
      versionName: data.stackVersion.versionName,
      isCurrent: data.stackVersion.isCurrent,
      createdBy: data.stackVersion.createdBy,
      createdReason: data.stackVersion.createdReason,
      basedOnRecommendationId: data.stackVersion.basedOnRecommendationId,
      effectiveFrom: data.stackVersion.effectiveFrom,
      effectiveTo: data.stackVersion.effectiveTo,
      createdAt: data.stackVersion.createdAt,
    };

    const supplements: SupplementRegimenItem[] = (data.supplements ?? []).map((item: any) => {
      const inventory: SupplementInventorySummary | null = item.inventory
        ? {
            current_servings: item.inventory.current_servings,
            servings_per_container: item.inventory.servings_per_container,
            reorder_threshold: item.inventory.reorder_threshold,
            needs_reorder: item.inventory.needs_reorder,
            last_purchase_date: item.inventory.last_purchase_date,
            last_purchase_cost: item.inventory.last_purchase_cost,
            vendor: item.inventory.vendor,
            expiration_date: item.inventory.expiration_date,
            supplement_id: item.inventory.supplement_id,
            user_id: item.inventory.user_id,
            id: item.inventory.id,
          }
        : null;

      const adherence: SupplementAdherenceSummary = {
        windowDays: item.adherence?.windowDays ?? 30,
        totalScheduled: item.adherence?.totalScheduled ?? 0,
        totalTaken: item.adherence?.totalTaken ?? 0,
        totalMissed: item.adherence?.totalMissed ?? 0,
        sideEffects: item.adherence?.sideEffects ?? 0,
        adherencePercentage: item.adherence?.adherencePercentage ?? null,
      };

      return {
        id: item.id,
        supplementName: item.supplementName,
        dosageAmount: item.dosageAmount,
        dosageUnit: item.dosageUnit,
        timing: item.timing,
        frequency: item.frequency,
        timesPerDay: item.timesPerDay,
        goal: item.goal,
        reasonToTake: item.reasonToTake,
        status: item.status,
        takeWithFood: item.takeWithFood,
        takeWithWater: item.takeWithWater,
        createdAt: item.createdAt,
        inventory,
        adherence,
      };
    });

    const metrics: SupplementStackMetrics = {
      totalCount: data.metrics?.totalCount ?? supplements.length,
      activeCount: data.metrics?.activeCount ?? supplements.filter(item => item.status === 'active').length,
      pausedCount: data.metrics?.pausedCount ?? supplements.filter(item => item.status === 'paused').length,
      discontinuedCount: data.metrics?.discontinuedCount ?? supplements.filter(item => item.status === 'discontinued').length,
    };

    const adherenceSummary = {
      windowDays: data.adherenceSummary?.windowDays ?? 30,
      totalScheduled: data.adherenceSummary?.totalScheduled ?? 0,
      totalTaken: data.adherenceSummary?.totalTaken ?? 0,
      totalMissed: data.adherenceSummary?.totalMissed ?? 0,
      sideEffects: data.adherenceSummary?.sideEffects ?? 0,
    };

    return {
      stackVersion,
      supplements,
      metrics,
      adherenceSummary,
    };
  } catch (error: any) {
    // 404 is expected for users without supplement stacks
    if (error.response?.status === 404) {
      return null;
    }
    console.warn('Failed to get supplement stack:', error.message);
    return null;
  }
};
