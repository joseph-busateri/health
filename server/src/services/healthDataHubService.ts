import type { 
  HealthDataSectionStatus,
  BaselineProfileData,
} from '../types/healthDataHub';

const baselineProfiles = new Map<string, BaselineProfileData>();

export async function getHealthDataStatusService(userId: string): Promise<HealthDataSectionStatus[]> {
  const baseline = baselineProfiles.get(userId);

  return [
    {
      section: 'baseline',
      title: 'Baseline Profile',
      description: 'Demographics, goals, and health context',
      status: baseline ? (baseline.completionPercentage === 100 ? 'complete' : 'incomplete') : 'not_started',
      summary: baseline ? `${baseline.completionPercentage}% complete` : undefined,
      lastUpdated: baseline ? new Date().toISOString() : undefined,
      icon: '👤',
      available: true,
    },
    {
      section: 'cardiovascular_risk',
      title: 'Cardiovascular Risk',
      description: '10-year CVD risk assessment (Framingham + ASCVD)',
      status: 'not_started',
      summary: 'Coming soon',
      icon: '❤️',
      available: true,
    },
    {
      section: 'strength_tracking',
      title: 'Strength Tracking',
      description: 'Bench press, pushups, grip strength',
      status: 'not_started',
      summary: 'Coming soon',
      icon: '🏋️',
      available: false,
    },
  ];
}

export async function getBaselineProfileService(userId: string): Promise<BaselineProfileData | null> {
  return baselineProfiles.get(userId) || null;
}

export async function updateBaselineProfileService(
  userId: string,
  profile: Partial<BaselineProfileData>
): Promise<BaselineProfileData> {
  const existing = baselineProfiles.get(userId) || {
    demographics: {},
    healthGoals: [],
    sexualHealthGoals: [],
    workoutGoals: [],
    secondaryGoals: [],
    completionPercentage: 0,
  };

  const updated = {
    ...existing,
    ...profile,
  };

  const fieldsCompleted = [
    updated.demographics?.age,
    updated.demographics?.gender,
    updated.demographics?.height,
    updated.demographics?.weight,
    updated.healthGoals?.length,
    updated.workoutGoals?.length,
    updated.trainingContext,
    updated.lifestyleContext,
  ].filter(Boolean).length;

  updated.completionPercentage = Math.round((fieldsCompleted / 8) * 100);

  baselineProfiles.set(userId, updated);
  return updated;
}
