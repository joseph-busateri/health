import { API_BASE_URL } from '../config';
import type { 
  HealthDataSectionStatus, 
  HealthDataHubState,
  BaselineProfileData,
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
      section: 'cardiovascular_risk',
      title: 'Cardiovascular Risk',
      description: '10-year CVD risk assessment (Framingham + ASCVD)',
      status: 'not_started',
      icon: '❤️',
      available: true,
    },
    {
      section: 'strength_tracking',
      title: 'Strength Tracking',
      description: 'Bench press, pushups, grip strength',
      status: 'not_started',
      icon: '🏋️',
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
