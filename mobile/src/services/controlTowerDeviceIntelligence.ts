const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface DeviceSignal {
  source: string;
  timestamp: string;
  value: number;
  unit?: string;
  confidence?: number;
}

export interface RecoverySignals {
  hrv: DeviceSignal | null;
  restingHR: DeviceSignal | null;
  sleepScore: DeviceSignal | null;
  sleepDuration: DeviceSignal | null;
  deepSleep: DeviceSignal | null;
  remSleep: DeviceSignal | null;
  readiness: DeviceSignal | null;
}

export interface CardiovascularSignals {
  restingHR: DeviceSignal | null;
  maxHR: DeviceSignal | null;
  hrVariability: DeviceSignal | null;
  bloodPressureSystolic: DeviceSignal | null;
  bloodPressureDiastolic: DeviceSignal | null;
  vo2Max: DeviceSignal | null;
}

export interface MetabolicSignals {
  basalMetabolicRate: DeviceSignal | null;
  activeCalories: DeviceSignal | null;
  totalCalories: DeviceSignal | null;
  bloodGlucose: DeviceSignal | null;
  respiratoryRate: DeviceSignal | null;
}

export interface PredictiveSignals {
  deloadRisk: DeviceSignal | null;
  injuryRisk: DeviceSignal | null;
  overtrainingRisk: DeviceSignal | null;
  illnessRisk: DeviceSignal | null;
}

export interface OptimizationTriggers {
  workoutIntensityAdjustment: DeviceSignal | null;
  recoveryProtocolNeeded: DeviceSignal | null;
  nutritionAdjustmentNeeded: DeviceSignal | null;
  supplementAdjustmentNeeded: DeviceSignal | null;
}

export interface DeviceIntelligenceData {
  userId: string;
  timestamp: string;
  recovery: RecoverySignals;
  cardiovascular: CardiovascularSignals;
  metabolic: MetabolicSignals;
  predictive: PredictiveSignals;
  optimization: OptimizationTriggers;
  overallStatus: string;
  overallScore: number;
  connectedDevices: string[];
  lastSyncTimes: Record<string, string>;
}

export const controlTowerDeviceIntelligenceService = {
  /**
   * Get real-time device intelligence aggregation for a user
   */
  async getDeviceIntelligence(userId: string): Promise<DeviceIntelligenceData> {
    const response = await fetch(`${API_BASE_URL}/control-tower/device-intelligence/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch device intelligence');
    }

    const data = await response.json();
    return data.deviceIntelligence;
  },

  /**
   * Get recovery signals from connected devices
   */
  async getRecoverySignals(userId: string): Promise<RecoverySignals> {
    const response = await fetch(`${API_BASE_URL}/control-tower/device-intelligence/${userId}/recovery`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recovery signals');
    }

    const data = await response.json();
    return data.recovery;
  },

  /**
   * Get cardiovascular signals from connected devices
   */
  async getCardiovascularSignals(userId: string): Promise<CardiovascularSignals> {
    const response = await fetch(`${API_BASE_URL}/control-tower/device-intelligence/${userId}/cardiovascular`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cardiovascular signals');
    }

    const data = await response.json();
    return data.cardiovascular;
  },

  /**
   * Get metabolic signals from connected devices
   */
  async getMetabolicSignals(userId: string): Promise<MetabolicSignals> {
    const response = await fetch(`${API_BASE_URL}/control-tower/device-intelligence/${userId}/metabolic`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch metabolic signals');
    }

    const data = await response.json();
    return data.metabolic;
  },

  /**
   * Get predictive signals (deload risk, injury risk, etc.)
   */
  async getPredictiveSignals(userId: string): Promise<PredictiveSignals> {
    const response = await fetch(`${API_BASE_URL}/control-tower/device-intelligence/${userId}/predictive`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch predictive signals');
    }

    const data = await response.json();
    return data.predictive;
  },

  /**
   * Get optimization triggers (when to adjust plans)
   */
  async getOptimizationTriggers(userId: string): Promise<OptimizationTriggers> {
    const response = await fetch(`${API_BASE_URL}/control-tower/device-intelligence/${userId}/optimization`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch optimization triggers');
    }

    const data = await response.json();
    return data.optimization;
  },

  /**
   * Get list of connected devices and their last sync times
   */
  async getConnectedDevices(userId: string): Promise<{ devices: string[]; lastSyncTimes: Record<string, string> }> {
    const response = await fetch(`${API_BASE_URL}/control-tower/device-intelligence/${userId}/devices`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch connected devices');
    }

    const data = await response.json();
    return {
      devices: data.connectedDevices || [],
      lastSyncTimes: data.lastSyncTimes || {},
    };
  },

  /**
   * Trigger a manual sync for all connected devices
   */
  async triggerDeviceSync(userId: string): Promise<{ success: boolean; syncedDevices: string[] }> {
    const response = await fetch(`${API_BASE_URL}/control-tower/device-intelligence/${userId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to trigger device sync');
    }

    const data = await response.json();
    return {
      success: data.success || false,
      syncedDevices: data.syncedDevices || [],
    };
  },
};
