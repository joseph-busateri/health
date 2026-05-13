/**
 * Cardiovascular Data Unifier - Phase 19
 * 
 * Purpose: Unify cardiovascular data from multiple sources into canonical model
 * Critical Gap: CV data exists in silos (bloodwork, BP devices, wearables, baseline)
 * 
 * Sources:
 * - Bloodwork (lipid panel, glucose, A1C, inflammatory markers)
 * - Blood pressure devices (systolic, diastolic, pulse)
 * - Wearables (resting HR, HRV, exercise HR)
 * - Baseline profile (medical history, family history)
 * - Daily interview (symptoms, concerns)
 */

import { logger } from '../utils/logger';

// ============================================================================
// UNIFIED CARDIOVASCULAR MODEL
// ============================================================================

export interface UnifiedCardiovascularData {
  userId: string;
  date: string;
  
  // Blood Pressure
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    pulse: number;
    source: 'device' | 'manual' | 'clinical';
    timestamp: string;
    confidence: number;
  };
  
  // Heart Rate
  heartRate?: {
    restingHR: number;
    maxHR?: number;
    averageHR?: number;
    source: 'wearable' | 'device' | 'manual';
    timestamp: string;
    confidence: number;
  };
  
  // Heart Rate Variability
  hrv?: {
    value: number;
    unit: 'ms' | 'rmssd';
    source: 'whoop' | 'oura' | 'appleWatch' | 'garmin';
    timestamp: string;
    confidence: number;
  };
  
  // Lipid Panel (from bloodwork)
  lipids?: {
    totalCholesterol: number;
    ldl: number;
    hdl: number;
    triglycerides: number;
    cholesterolRatio?: number;
    source: 'bloodwork';
    testDate: string;
    confidence: number;
  };
  
  // Glucose Metrics (from bloodwork)
  glucose?: {
    fastingGlucose?: number;
    a1c?: number;
    averageGlucose?: number;
    source: 'bloodwork' | 'cgm';
    testDate: string;
    confidence: number;
  };
  
  // Inflammatory Markers (from bloodwork)
  inflammation?: {
    crp?: number;
    homocysteine?: number;
    source: 'bloodwork';
    testDate: string;
    confidence: number;
  };
  
  // Medical Context
  medicalContext?: {
    conditions: string[];
    medications: string[];
    familyHistory: string[];
    riskFactors: string[];
    source: 'baseline' | 'clinical_document';
  };
  
  // Overall Assessment
  assessment: {
    overallRisk: 'low' | 'moderate' | 'high' | 'critical';
    riskFactors: string[];
    concerns: string[];
    recommendations: string[];
    confidenceScore: number;
  };
  
  // Metadata
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
  sourceCount: number;
}

export interface CardiovascularSource {
  sourceType: 'bloodwork' | 'bp_device' | 'wearable' | 'baseline' | 'interview' | 'clinical';
  sourceSystem: string;
  ingestedAt: string;
  effectiveDate: string;
  confidence: number;
  data: any;
}

// ============================================================================
// CARDIOVASCULAR DATA UNIFIER
// ============================================================================

export class CardiovascularDataUnifier {
  /**
   * Unify cardiovascular data from all sources
   */
  static unifyData(
    userId: string,
    date: string,
    sources: CardiovascularSource[]
  ): UnifiedCardiovascularData {
    const unified: UnifiedCardiovascularData = {
      userId,
      date,
      assessment: {
        overallRisk: 'low',
        riskFactors: [],
        concerns: [],
        recommendations: [],
        confidenceScore: 0,
      },
      lastUpdated: new Date().toISOString(),
      dataQuality: 'low',
      sourceCount: sources.length,
    };

    // Process each source
    sources.forEach(source => {
      switch (source.sourceType) {
        case 'bloodwork':
          this.integrateBloodwork(unified, source);
          break;
        case 'bp_device':
          this.integrateBPDevice(unified, source);
          break;
        case 'wearable':
          this.integrateWearable(unified, source);
          break;
        case 'baseline':
          this.integrateBaseline(unified, source);
          break;
        case 'interview':
          this.integrateInterview(unified, source);
          break;
        case 'clinical':
          this.integrateClinical(unified, source);
          break;
      }
    });

    // Calculate overall assessment
    unified.assessment = this.calculateAssessment(unified);
    unified.dataQuality = this.assessDataQuality(unified);

    logger.info('✅ [CV UNIFIER] Data unified', {
      userId,
      date,
      sourceCount: sources.length,
      overallRisk: unified.assessment.overallRisk,
      dataQuality: unified.dataQuality,
    });

    return unified;
  }

  /**
   * Integrate bloodwork data
   */
  private static integrateBloodwork(
    unified: UnifiedCardiovascularData,
    source: CardiovascularSource
  ): void {
    const data = source.data;

    // Lipid panel
    if (data.totalCholesterol || data.ldl || data.hdl || data.triglycerides) {
      unified.lipids = {
        totalCholesterol: data.totalCholesterol || 0,
        ldl: data.ldl || 0,
        hdl: data.hdl || 0,
        triglycerides: data.triglycerides || 0,
        cholesterolRatio: data.hdl ? data.totalCholesterol / data.hdl : undefined,
        source: 'bloodwork',
        testDate: source.effectiveDate,
        confidence: source.confidence,
      };
    }

    // Glucose metrics
    if (data.fastingGlucose || data.a1c) {
      unified.glucose = {
        fastingGlucose: data.fastingGlucose,
        a1c: data.a1c,
        averageGlucose: data.a1c ? this.a1cToAverageGlucose(data.a1c) : undefined,
        source: 'bloodwork',
        testDate: source.effectiveDate,
        confidence: source.confidence,
      };
    }

    // Inflammatory markers
    if (data.crp || data.homocysteine) {
      unified.inflammation = {
        crp: data.crp,
        homocysteine: data.homocysteine,
        source: 'bloodwork',
        testDate: source.effectiveDate,
        confidence: source.confidence,
      };
    }
  }

  /**
   * Integrate blood pressure device data
   */
  private static integrateBPDevice(
    unified: UnifiedCardiovascularData,
    source: CardiovascularSource
  ): void {
    const data = source.data;

    if (data.systolic && data.diastolic) {
      // Use most recent reading if multiple sources
      if (!unified.bloodPressure || source.confidence > unified.bloodPressure.confidence) {
        unified.bloodPressure = {
          systolic: data.systolic,
          diastolic: data.diastolic,
          pulse: data.pulse || 0,
          source: 'device',
          timestamp: source.ingestedAt,
          confidence: source.confidence,
        };
      }
    }
  }

  /**
   * Integrate wearable data
   */
  private static integrateWearable(
    unified: UnifiedCardiovascularData,
    source: CardiovascularSource
  ): void {
    const data = source.data;

    // Heart rate
    if (data.restingHR) {
      if (!unified.heartRate || source.confidence > unified.heartRate.confidence) {
        unified.heartRate = {
          restingHR: data.restingHR,
          maxHR: data.maxHR,
          averageHR: data.averageHR,
          source: 'wearable',
          timestamp: source.ingestedAt,
          confidence: source.confidence,
        };
      }
    }

    // HRV
    if (data.hrv) {
      if (!unified.hrv || source.confidence > unified.hrv.confidence) {
        unified.hrv = {
          value: data.hrv,
          unit: data.hrvUnit || 'ms',
          source: source.sourceSystem as any,
          timestamp: source.ingestedAt,
          confidence: source.confidence,
        };
      }
    }
  }

  /**
   * Integrate baseline profile data
   */
  private static integrateBaseline(
    unified: UnifiedCardiovascularData,
    source: CardiovascularSource
  ): void {
    const data = source.data;

    unified.medicalContext = {
      conditions: data.conditions || [],
      medications: data.medications || [],
      familyHistory: data.familyHistory || [],
      riskFactors: this.extractRiskFactors(data),
      source: 'baseline',
    };
  }

  /**
   * Integrate daily interview data
   */
  private static integrateInterview(
    unified: UnifiedCardiovascularData,
    source: CardiovascularSource
  ): void {
    const data = source.data;

    // Extract cardiovascular symptoms from interview
    const symptoms = data.symptoms || [];
    const cvSymptoms = symptoms.filter((s: string) => 
      s.toLowerCase().includes('chest') ||
      s.toLowerCase().includes('heart') ||
      s.toLowerCase().includes('breath') ||
      s.toLowerCase().includes('dizzy')
    );

    if (cvSymptoms.length > 0 && unified.assessment) {
      unified.assessment.concerns.push(...cvSymptoms);
    }
  }

  /**
   * Integrate clinical document data
   */
  private static integrateClinical(
    unified: UnifiedCardiovascularData,
    source: CardiovascularSource
  ): void {
    const data = source.data;

    // Merge clinical context with baseline
    if (unified.medicalContext) {
      unified.medicalContext.conditions = [
        ...unified.medicalContext.conditions,
        ...(data.conditions || []),
      ];
      unified.medicalContext.medications = [
        ...unified.medicalContext.medications,
        ...(data.medications || []),
      ];
    } else {
      unified.medicalContext = {
        conditions: data.conditions || [],
        medications: data.medications || [],
        familyHistory: [],
        riskFactors: [],
        source: 'clinical_document',
      };
    }
  }

  /**
   * Calculate overall cardiovascular assessment
   */
  private static calculateAssessment(
    unified: UnifiedCardiovascularData
  ): UnifiedCardiovascularData['assessment'] {
    const riskFactors: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Blood pressure risk
    if (unified.bloodPressure) {
      const { systolic, diastolic } = unified.bloodPressure;
      
      if (systolic >= 180 || diastolic >= 120) {
        riskFactors.push('Hypertensive crisis (Stage 2)');
        concerns.push('Blood pressure critically high');
        recommendations.push('Seek immediate medical attention');
        riskScore += 40;
      } else if (systolic >= 140 || diastolic >= 90) {
        riskFactors.push('Hypertension (Stage 1)');
        concerns.push('Blood pressure elevated');
        recommendations.push('Consult doctor about blood pressure management');
        riskScore += 25;
      } else if (systolic >= 130 || diastolic >= 80) {
        riskFactors.push('Elevated blood pressure');
        recommendations.push('Monitor blood pressure regularly');
        riskScore += 10;
      }
    }

    // Lipid risk
    if (unified.lipids) {
      if (unified.lipids.ldl >= 190) {
        riskFactors.push('Very high LDL cholesterol');
        concerns.push('LDL cholesterol critically high');
        recommendations.push('Consult doctor about statin therapy');
        riskScore += 30;
      } else if (unified.lipids.ldl >= 160) {
        riskFactors.push('High LDL cholesterol');
        recommendations.push('Reduce saturated fat intake');
        riskScore += 20;
      } else if (unified.lipids.ldl >= 130) {
        riskFactors.push('Borderline high LDL');
        recommendations.push('Monitor cholesterol levels');
        riskScore += 10;
      }

      if (unified.lipids.hdl < 40) {
        riskFactors.push('Low HDL cholesterol');
        recommendations.push('Increase aerobic exercise');
        riskScore += 15;
      }

      if (unified.lipids.triglycerides >= 200) {
        riskFactors.push('High triglycerides');
        recommendations.push('Reduce refined carbohydrates');
        riskScore += 15;
      }
    }

    // Glucose risk
    if (unified.glucose) {
      if (unified.glucose.a1c && unified.glucose.a1c >= 6.5) {
        riskFactors.push('Diabetic range A1C');
        concerns.push('Blood sugar control needed');
        recommendations.push('Consult doctor about diabetes management');
        riskScore += 30;
      } else if (unified.glucose.a1c && unified.glucose.a1c >= 5.7) {
        riskFactors.push('Prediabetic range A1C');
        recommendations.push('Improve blood sugar control through diet and exercise');
        riskScore += 15;
      }

      if (unified.glucose.fastingGlucose && unified.glucose.fastingGlucose >= 126) {
        riskFactors.push('Diabetic fasting glucose');
        riskScore += 25;
      } else if (unified.glucose.fastingGlucose && unified.glucose.fastingGlucose >= 100) {
        riskFactors.push('Elevated fasting glucose');
        riskScore += 10;
      }
    }

    // Inflammatory risk
    if (unified.inflammation?.crp && unified.inflammation.crp > 3) {
      riskFactors.push('Elevated inflammation (CRP)');
      recommendations.push('Reduce inflammatory foods, increase omega-3s');
      riskScore += 15;
    }

    // Heart rate risk
    if (unified.heartRate?.restingHR) {
      if (unified.heartRate.restingHR > 100) {
        riskFactors.push('Elevated resting heart rate');
        recommendations.push('Improve cardiovascular fitness');
        riskScore += 10;
      }
    }

    // HRV risk
    if (unified.hrv?.value && unified.hrv.value < 20) {
      riskFactors.push('Low heart rate variability');
      recommendations.push('Manage stress, improve sleep quality');
      riskScore += 10;
    }

    // Medical context risk
    if (unified.medicalContext) {
      const highRiskConditions = ['diabetes', 'hypertension', 'heart disease', 'stroke'];
      const hasHighRiskCondition = unified.medicalContext.conditions.some(c =>
        highRiskConditions.some(hrc => c.toLowerCase().includes(hrc))
      );
      
      if (hasHighRiskCondition) {
        riskScore += 20;
      }

      const highRiskFamilyHistory = ['heart attack', 'stroke', 'heart disease'];
      const hasHighRiskFamily = unified.medicalContext.familyHistory.some(f =>
        highRiskFamilyHistory.some(hrf => f.toLowerCase().includes(hrf))
      );
      
      if (hasHighRiskFamily) {
        riskFactors.push('Family history of cardiovascular disease');
        riskScore += 10;
      }
    }

    // Determine overall risk level
    let overallRisk: 'low' | 'moderate' | 'high' | 'critical';
    if (riskScore >= 60) {
      overallRisk = 'critical';
    } else if (riskScore >= 40) {
      overallRisk = 'high';
    } else if (riskScore >= 20) {
      overallRisk = 'moderate';
    } else {
      overallRisk = 'low';
    }

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(unified);

    return {
      overallRisk,
      riskFactors: [...new Set(riskFactors)],
      concerns: [...new Set(concerns)],
      recommendations: [...new Set(recommendations)],
      confidenceScore,
    };
  }

  /**
   * Assess overall data quality
   */
  private static assessDataQuality(unified: UnifiedCardiovascularData): 'high' | 'medium' | 'low' {
    let score = 0;

    if (unified.bloodPressure) score += 20;
    if (unified.heartRate) score += 15;
    if (unified.hrv) score += 15;
    if (unified.lipids) score += 25;
    if (unified.glucose) score += 15;
    if (unified.inflammation) score += 10;

    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence score for assessment
   */
  private static calculateConfidenceScore(unified: UnifiedCardiovascularData): number {
    let confidence = 0;
    let sourceCount = 0;

    if (unified.bloodPressure) {
      confidence += unified.bloodPressure.confidence * 0.2;
      sourceCount++;
    }
    if (unified.lipids) {
      confidence += unified.lipids.confidence * 0.3;
      sourceCount++;
    }
    if (unified.glucose) {
      confidence += unified.glucose.confidence * 0.2;
      sourceCount++;
    }
    if (unified.heartRate) {
      confidence += unified.heartRate.confidence * 0.15;
      sourceCount++;
    }
    if (unified.hrv) {
      confidence += unified.hrv.confidence * 0.15;
      sourceCount++;
    }

    return sourceCount > 0 ? confidence : 0;
  }

  /**
   * Extract risk factors from baseline data
   */
  private static extractRiskFactors(baselineData: any): string[] {
    const riskFactors: string[] = [];

    if (baselineData.age && baselineData.age > 45) {
      riskFactors.push('Age over 45');
    }

    if (baselineData.sex === 'male') {
      riskFactors.push('Male sex');
    }

    if (baselineData.trtUsage) {
      riskFactors.push('TRT usage');
    }

    if (baselineData.diabetesStatus && baselineData.diabetesStatus !== 'none') {
      riskFactors.push(`Diabetes: ${baselineData.diabetesStatus}`);
    }

    if (baselineData.bloodPressureHistory && baselineData.bloodPressureHistory !== 'normal') {
      riskFactors.push(`BP history: ${baselineData.bloodPressureHistory}`);
    }

    return riskFactors;
  }

  /**
   * Convert A1C to average glucose
   */
  private static a1cToAverageGlucose(a1c: number): number {
    // Formula: Average Glucose (mg/dL) = (A1C × 28.7) - 46.7
    return Math.round((a1c * 28.7) - 46.7);
  }
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

export async function getUnifiedCardiovascularData(
  userId: string,
  date: string
): Promise<UnifiedCardiovascularData | null> {
  // This would fetch and unify data from multiple sources
  logger.info('📋 [CV UNIFIER] Fetching unified data', { userId, date });
  return null;
}

export async function saveUnifiedCardiovascularData(
  data: UnifiedCardiovascularData
): Promise<UnifiedCardiovascularData> {
  // This would persist unified data
  logger.info('✅ [CV UNIFIER] Unified data saved', {
    userId: data.userId,
    date: data.date,
    overallRisk: data.assessment.overallRisk,
  });
  
  return data;
}
