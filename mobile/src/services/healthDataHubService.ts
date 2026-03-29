import { API_BASE_URL } from '../config';
import type { 
  HealthDataSectionStatus, 
  HealthDataHubState,
  BaselineProfileData,
  WorkoutScheduleData,
  SupplementIntakeData,
  BloodworkData,
} from '../types/healthDataHub';

export async function getHealthDataStatus(): Promise<HealthDataSectionStatus[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/health-data/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch health data status');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching health data status:', error);
    return getDefaultSections();
  }
}

function getDefaultSections(): HealthDataSectionStatus[] {
  return [
    {
      section: 'baseline',
      title: 'Baseline Profile',
      description: 'Demographics, goals, and health context',
      status: 'not_started',
      icon: '👤',
      available: true,
    },
    {
      section: 'workout_schedule',
      title: 'Workout Schedule',
      description: 'Upload your foundational workout plan',
      status: 'not_started',
      icon: '💪',
      available: true,
    },
    {
      section: 'supplement_intake',
      title: 'Supplement Stack',
      description: 'Upload your current supplement regimen',
      status: 'not_started',
      icon: '💊',
      available: true,
    },
    {
      section: 'bloodwork',
      title: 'Bloodwork',
      description: 'Upload labs and view recommendations',
      status: 'not_started',
      icon: '🩸',
      available: true,
    },
    {
      section: 'body_composition',
      title: 'Body Composition',
      description: '3D scans and body composition tracking',
      status: 'not_started',
      icon: '📊',
      available: false,
    },
    {
      section: 'strength_tracking',
      title: 'Strength Tracking',
      description: 'Bench press, pushups, grip strength',
      status: 'not_started',
      icon: '🏋️',
      available: false,
    },
    {
      section: 'tape_measurements',
      title: 'Tape Measurements',
      description: 'Chest, shoulders, arms, forearms',
      status: 'not_started',
      icon: '📏',
      available: false,
    },
    {
      section: 'nutrition',
      title: 'Nutrition',
      description: 'Meal photos and nutrition tracking',
      status: 'not_started',
      icon: '🍽️',
      available: false,
    },
    {
      section: 'device_connections',
      title: 'Device Connections',
      description: 'Apple Watch, Whoop, Sleep Number, and more',
      status: 'not_connected',
      icon: '⌚',
      available: false,
    },
  ];
}

export async function getBaselineProfile(): Promise<BaselineProfileData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/baseline/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching baseline profile:', error);
    return null;
  }
}

export async function updateBaselineProfile(profile: Partial<BaselineProfileData>): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/baseline/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating baseline profile:', error);
    return false;
  }
}

export async function uploadWorkoutSchedule(file: File): Promise<WorkoutScheduleData | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/workout-schedule/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload workout schedule');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error uploading workout schedule:', error);
    return null;
  }
}

export async function getWorkoutSchedule(): Promise<WorkoutScheduleData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/workout-schedule`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching workout schedule:', error);
    return null;
  }
}

export async function uploadSupplementIntake(file: File): Promise<SupplementIntakeData | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/supplement-intake/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload supplement intake');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error uploading supplement intake:', error);
    return null;
  }
}

export async function getSupplementIntake(): Promise<SupplementIntakeData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/supplement-intake`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching supplement intake:', error);
    return null;
  }
}

export async function getBloodworkSummary(): Promise<BloodworkData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/bloodwork/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching bloodwork summary:', error);
    return null;
  }
}
