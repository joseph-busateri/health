const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface InjuryRisk {
  overallScore: number;
  riskLevel: string;
  workloadRisk: number;
  recoveryRisk: number;
  painRisk: number;
  mobilityRisk: number;
  historyRisk: number;
  primaryRiskFactors: string[];
  highestRiskAreas: string[];
  immediateActions: string[];
  preventiveMeasures: string[];
}

export interface PainLog {
  id: string;
  bodyPart: string;
  painLevel: number;
  painType: string;
  notes?: string;
  loggedAt: string;
}

export interface PainSite {
  bodyPart: string;
  avgPainLevel: number;
  occurrenceCount: number;
  lastOccurrence: string;
}

export interface MobilityAssessment {
  id: string;
  bodyPart: string;
  rangeOfMotion: number;
  flexibility: number;
  notes?: string;
  assessedAt: string;
}

export interface PreventiveRecommendation {
  id: string;
  type: string;
  priority: string;
  urgency: string;
  targetBodyPart: string;
  title: string;
  description: string;
  frequency: string;
  expectedBenefit: string;
  riskReduction: number;
}

export const injuryPreventionService = {
  /**
   * Calculate injury risk for a user
   */
  async calculateInjuryRisk(userId: string): Promise<InjuryRisk> {
    const response = await fetch(`${API_BASE_URL}/injury/risk/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to calculate injury risk');
    }
    return response.json();
  },

  /**
   * Get pain logs for a user
   */
  async getPainLogs(userId: string): Promise<PainLog[]> {
    const response = await fetch(`${API_BASE_URL}/injury/pain-logs/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch pain logs');
    }
    const data = await response.json();
    return data.painLogs || [];
  },

  /**
   * Get pain sites summary for a user
   */
  async getPainSites(userId: string): Promise<PainSite[]> {
    const response = await fetch(`${API_BASE_URL}/injury/pain-sites/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch pain sites');
    }
    const data = await response.json();
    return data.painSites || [];
  },

  /**
   * Log a pain entry
   */
  async logPain(
    userId: string,
    bodyPart: string,
    painLevel: number,
    painType: string,
    notes?: string
  ): Promise<PainLog> {
    const response = await fetch(`${API_BASE_URL}/injury/pain-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        body_part: bodyPart,
        pain_level: painLevel,
        pain_type: painType,
        notes,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to log pain');
    }
    const data = await response.json();
    return data.painLog;
  },

  /**
   * Get mobility assessments for a user
   */
  async getMobilityAssessments(userId: string): Promise<MobilityAssessment[]> {
    const response = await fetch(`${API_BASE_URL}/injury/mobility/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch mobility assessments');
    }
    const data = await response.json();
    return data.assessments || [];
  },

  /**
   * Log a mobility assessment
   */
  async logMobilityAssessment(
    userId: string,
    bodyPart: string,
    rangeOfMotion: number,
    flexibility: number,
    notes?: string
  ): Promise<MobilityAssessment> {
    const response = await fetch(`${API_BASE_URL}/injury/mobility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        body_part: bodyPart,
        range_of_motion: rangeOfMotion,
        flexibility,
        notes,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to log mobility assessment');
    }
    const data = await response.json();
    return data.assessment;
  },

  /**
   * Get preventive recommendations for a user
   */
  async getPreventiveRecommendations(userId: string): Promise<PreventiveRecommendation[]> {
    const response = await fetch(`${API_BASE_URL}/injury/recommendations/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch preventive recommendations');
    }
    const data = await response.json();
    return data.recommendations || [];
  },
};
