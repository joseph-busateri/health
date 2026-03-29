import type { 
  HealthDataSectionStatus,
  BaselineProfileData,
  WorkoutScheduleData,
  SupplementIntakeData,
  BloodworkData,
} from '../types/healthDataHub';

const baselineProfiles = new Map<string, BaselineProfileData>();
const workoutSchedules = new Map<string, WorkoutScheduleData>();
const supplementIntakes = new Map<string, SupplementIntakeData>();

export async function getHealthDataStatusService(userId: string): Promise<HealthDataSectionStatus[]> {
  const baseline = baselineProfiles.get(userId);
  const workoutSchedule = workoutSchedules.get(userId);
  const supplementIntake = supplementIntakes.get(userId);

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
      section: 'workout_schedule',
      title: 'Workout Schedule',
      description: 'Upload your foundational workout plan',
      status: workoutSchedule?.uploaded ? 'complete' : 'not_started',
      summary: workoutSchedule?.uploaded ? `Uploaded ${new Date(workoutSchedule.uploadDate!).toLocaleDateString()}` : 'No schedule uploaded',
      lastUpdated: workoutSchedule?.uploadDate,
      icon: '💪',
      available: true,
    },
    {
      section: 'supplement_intake',
      title: 'Supplement Stack',
      description: 'Upload your current supplement regimen',
      status: supplementIntake?.uploaded ? 'complete' : 'not_started',
      summary: supplementIntake?.uploaded ? `${supplementIntake.supplementCount} supplements` : 'No supplements uploaded',
      lastUpdated: supplementIntake?.uploadDate,
      icon: '💊',
      available: true,
    },
    {
      section: 'bloodwork',
      title: 'Bloodwork',
      description: 'Upload labs and view recommendations',
      status: 'not_started',
      summary: 'No bloodwork uploaded',
      icon: '🩸',
      available: true,
    },
    {
      section: 'body_composition',
      title: 'Body Composition',
      description: '3D scans and body composition tracking',
      status: 'not_started',
      summary: 'Coming soon',
      icon: '📊',
      available: false,
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
    {
      section: 'tape_measurements',
      title: 'Tape Measurements',
      description: 'Chest, shoulders, arms, forearms',
      status: 'not_started',
      summary: 'Coming soon',
      icon: '📏',
      available: false,
    },
    {
      section: 'nutrition',
      title: 'Nutrition',
      description: 'Meal photos and nutrition tracking',
      status: 'not_started',
      summary: 'Coming soon',
      icon: '🍽️',
      available: false,
    },
    {
      section: 'device_connections',
      title: 'Device Connections',
      description: 'Apple Watch, Whoop, Sleep Number, and more',
      status: 'not_connected',
      summary: 'Coming soon',
      icon: '⌚',
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

export async function getWorkoutScheduleService(userId: string): Promise<WorkoutScheduleData | null> {
  return workoutSchedules.get(userId) || null;
}

export async function uploadWorkoutScheduleService(
  userId: string,
  file: Express.Multer.File
): Promise<WorkoutScheduleData> {
  const schedule: WorkoutScheduleData = {
    uploaded: true,
    uploadDate: new Date().toISOString(),
    documentName: file.originalname,
    weeklySessionCount: 4,
    primaryFocus: 'Strength & Hypertrophy',
  };

  workoutSchedules.set(userId, schedule);
  return schedule;
}

export async function getSupplementIntakeService(userId: string): Promise<SupplementIntakeData | null> {
  return supplementIntakes.get(userId) || null;
}

export async function uploadSupplementIntakeService(
  userId: string,
  file: Express.Multer.File
): Promise<SupplementIntakeData> {
  const intake: SupplementIntakeData = {
    uploaded: true,
    uploadDate: new Date().toISOString(),
    documentName: file.originalname,
    supplementCount: 8,
    stackSummary: 'Multivitamin, Protein, Creatine, Omega-3, Vitamin D, Magnesium, Zinc, Ashwagandha',
  };

  supplementIntakes.set(userId, intake);
  return intake;
}

export async function getBloodworkSummaryService(userId: string): Promise<BloodworkData> {
  return {
    documentCount: 0,
    latestRecommendationCount: 0,
    processingStatus: 'completed',
  };
}
