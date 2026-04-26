/**
 * Actuarial Data Unifier
 * Aggregates data from multiple sources for actuarial risk calculation
 * 
 * Integrates data from:
 * - Cardiovascular Engine (BP, HR, lipids)
 * - Metabolic Engine (diabetes, A1C)
 * - Body Composition (BMI, body fat)
 * - Workout Engine (exercise frequency, VO2 max)
 * - Recovery Engine (sleep quality)
 * - Stress Engine (stress level)
 * - Baseline Profile (demographics)
 * 
 * Architecture:
 * - Fetches latest data from each engine
 * - Provides safe fallbacks for missing data
 * - Logs all data sources and fallbacks
 * - Supports manual overrides for testing
 */

import { logger } from '../utils/logger';
import { getCardiovascularToday } from './cardiovascularEngineService';
import { getMetabolicToday } from './metabolicEngineService';
import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getWorkoutRecommendationToday } from './workoutEngineService';
import { getLatestBodyCompositionContext } from './bodyCompositionContextService';
import { getLatestBloodworkContext, getMarkerValue } from './bloodworkContextService';
import { getBaselineFields } from './baselineContextService';
import { getLatestBloodPressureContext, getSystolic, getDiastolic } from './bloodPressureContextService';
import type {
  ActuarialRiskInputs,
  DemographicProfile,
  ClinicalRiskFactors,
  LifestyleRiskFactors,
  AdvancedRiskMarkers,
} from '../types/actuarialRiskEngine';

// ============================================================================
// DATA UNIFICATION
// ============================================================================

/**
 * Unify actuarial data from multiple sources
 * This is a placeholder that will be integrated with actual engine services
 */
export async function unifyActuarialData(
  userId: string,
  overrides?: Partial<ActuarialRiskInputs>
): Promise<ActuarialRiskInputs> {
  logger.info('🔄 [ACTUARIAL DATA UNIFIER] Unifying data from multiple sources', { userId });

  try {
    // Build demographic profile
    const demographic = await buildDemographicProfile(userId, overrides?.demographic);

    // Build clinical risk factors
    const clinical = await buildClinicalRiskFactors(userId, overrides?.clinical);

    // Build lifestyle risk factors
    const lifestyle = await buildLifestyleRiskFactors(userId, overrides?.lifestyle);

    // Build advanced risk markers
    const advanced = await buildAdvancedRiskMarkers(userId, overrides?.advanced);

    const unifiedData: ActuarialRiskInputs = {
      demographic,
      clinical,
      lifestyle,
      advanced,
    };

    logger.info('✅ [ACTUARIAL DATA UNIFIER] Data unification complete', {
      userId,
      hasAdvancedMarkers: !!advanced,
    });

    return unifiedData;
  } catch (error) {
    logger.error('❌ [ACTUARIAL DATA UNIFIER] Data unification failed', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

// ============================================================================
// DEMOGRAPHIC PROFILE BUILDER
// ============================================================================

async function buildDemographicProfile(
  userId: string,
  overrides?: Partial<DemographicProfile>
): Promise<DemographicProfile> {
  logger.info('📋 [DEMOGRAPHIC] Building demographic profile', { userId });

  try {
    // Fetch baseline profile data
    const baseline = await getBaselineFields(userId);

    const profile: DemographicProfile = {
      age: baseline?.age || 50,
      gender: (baseline?.sex as 'male' | 'female') || 'male',
      race: (baseline?.race as 'white' | 'black' | 'asian' | 'hispanic' | 'other') || 'white',
      familyHistory: baseline?.familyHistory?.cardiovascular_disease || false,
      smokingStatus: (baseline?.smokingStatus as 'never' | 'former' | 'current') || 'never',
    };

    // Apply overrides
    const finalProfile = {
      ...profile,
      ...overrides,
    };

    logger.info('✅ [DEMOGRAPHIC] Profile built', {
      userId,
      hasBaseline: !!baseline,
      age: finalProfile.age,
      race: finalProfile.race,
      smokingStatus: finalProfile.smokingStatus,
    });

    return finalProfile;
  } catch (error) {
    logger.warn('⚠️ [DEMOGRAPHIC] Failed to fetch baseline, using defaults', {
      userId,
      error: (error as Error).message,
    });

    return {
      age: 50,
      gender: 'male',
      race: 'white',
      familyHistory: false,
      smokingStatus: 'never',
      ...overrides,
    };
  }
}

// ============================================================================
// CLINICAL RISK FACTORS BUILDER
// ============================================================================

async function buildClinicalRiskFactors(
  userId: string,
  overrides?: Partial<ClinicalRiskFactors>
): Promise<ClinicalRiskFactors> {
  logger.info('🩺 [CLINICAL] Building clinical risk factors', { userId });

  const factors: Partial<ClinicalRiskFactors> = {};

  try {
    // Fetch blood pressure directly from database
    const bpContext = await getLatestBloodPressureContext(userId);
    if (bpContext.hasBloodPressure) {
      factors.systolicBP = getSystolic(bpContext);
      factors.diastolicBP = getDiastolic(bpContext);
      logger.info('✅ [CLINICAL] BP data from blood pressure context service', {
        userId,
        systolicBP: factors.systolicBP,
        diastolicBP: factors.diastolicBP,
      });
    }

    // Check for BP medication from baseline
    const baseline = await getBaselineFields(userId);
    // Determine if user is on BP medication based on blood pressure history or medications list
    const hasHypertensionHistory = baseline.bloodPressureHistory === 'hypertension_stage1' ||
                                   baseline.bloodPressureHistory === 'hypertension_stage2';
    const hasBPMedication = baseline.medications?.some(med =>
      med.toLowerCase().includes('blood pressure') ||
      med.toLowerCase().includes('lisinopril') ||
      med.toLowerCase().includes('amlodipine') ||
      med.toLowerCase().includes('losartan') ||
      med.toLowerCase().includes('metoprolol') ||
      med.toLowerCase().includes('hydrochlorothiazide')
    ) || false;
    factors.onBPmedication = hasHypertensionHistory || hasBPMedication;

    logger.info('✅ [CLINICAL] Clinical data integrated', {
      userId,
      hasBP: !!(factors.systolicBP && factors.diastolicBP),
      onBPmedication: factors.onBPmedication,
      bpHistory: baseline.bloodPressureHistory,
    });

    // Fetch bloodwork data for cholesterol
    const bloodwork = await getLatestBloodworkContext(userId);
    if (bloodwork && bloodwork.hasBloodwork) {
      factors.totalCholesterol = getMarkerValue(bloodwork.markers.totalCholesterol) || undefined;
      factors.hdlCholesterol = getMarkerValue(bloodwork.markers.hdl) || undefined;
      factors.ldlCholesterol = getMarkerValue(bloodwork.markers.ldl) || undefined;
      factors.triglycerides = getMarkerValue(bloodwork.markers.triglycerides) || undefined;

      // Calculate estimated total cholesterol from LDL + HDL if total cholesterol is missing
      // This is a conservative estimate (assumes normal triglycerides)
      // Priority: 1) total_cholesterol column, 2) raw_test_name mapping, 3) LDL+HDL estimation
      if (!factors.totalCholesterol && factors.ldlCholesterol && factors.hdlCholesterol) {
        factors.totalCholesterol = factors.ldlCholesterol + factors.hdlCholesterol;
        logger.info('📊 [CLINICAL] Using estimated total cholesterol (LDL + HDL)', {
          userId,
          ldl: factors.ldlCholesterol,
          hdl: factors.hdlCholesterol,
          estimatedTotal: factors.totalCholesterol,
        });
      }

      logger.info('✅ [CLINICAL] Bloodwork data integrated', {
        userId,
        hasCholesterol: !!factors.totalCholesterol,
        cholesterolSource: bloodwork.markers.totalCholesterol ? 'bloodwork' : 'estimated',
      });
    }

    // Fetch metabolic data for diabetes status
    const metabolic = await getMetabolicToday(userId);
    if (metabolic) {
      // Map metabolic status to diabetes status
      const status = (metabolic as any).status;
      if (status === 'high_risk') {
        factors.diabetesStatus = 'diabetes';
      } else if (status === 'elevated_risk') {
        factors.diabetesStatus = 'prediabetes';
      } else {
        factors.diabetesStatus = 'none';
      }

      logger.info('✅ [CLINICAL] Metabolic data integrated', {
        userId,
        diabetesStatus: factors.diabetesStatus,
      });
    }
  } catch (error) {
    logger.warn('⚠️ [CLINICAL] Error fetching clinical data', {
      userId,
      error: (error as Error).message,
    });
  }

  // Apply defaults for missing values
  const finalFactors: ClinicalRiskFactors = {
    systolicBP: factors.systolicBP || 120,
    diastolicBP: factors.diastolicBP || 80,
    onBPmedication: factors.onBPmedication || false,
    totalCholesterol: factors.totalCholesterol || 180,
    hdlCholesterol: factors.hdlCholesterol || 50,
    ldlCholesterol: factors.ldlCholesterol,
    triglycerides: factors.triglycerides,
    diabetesStatus: factors.diabetesStatus || 'none',
    ...overrides,
  };

  logger.info('✅ [CLINICAL] Clinical risk factors complete', {
    userId,
    systolicBP: finalFactors.systolicBP,
    diabetesStatus: finalFactors.diabetesStatus,
  });

  return finalFactors;
}

// ============================================================================
// LIFESTYLE RISK FACTORS BUILDER
// ============================================================================

async function buildLifestyleRiskFactors(
  userId: string,
  overrides?: Partial<LifestyleRiskFactors>
): Promise<LifestyleRiskFactors> {
  logger.info('🏃 [LIFESTYLE] Building lifestyle risk factors', { userId });

  const factors: Partial<LifestyleRiskFactors> = {};

  try {
    // Fetch exercise frequency from baseline profile
    const baselineProfile = await getBaselineFields(userId);
    if (baselineProfile?.trainingDaysPerWeek && typeof baselineProfile.trainingDaysPerWeek === 'number') {
      factors.exerciseFrequency = baselineProfile.trainingDaysPerWeek;
      logger.info('✅ [LIFESTYLE] Exercise frequency from baseline', {
        userId,
        trainingDaysPerWeek: baselineProfile.trainingDaysPerWeek,
      });
    }

    // Fetch workout data for VO2 max (if available in future)
    const workout = await getWorkoutRecommendationToday(userId);
    if (workout?.evidence?.signals) {
      const vo2Signal = workout.evidence.signals.find(s => s.name === 'vo2_max');
      if (vo2Signal?.value && typeof vo2Signal.value === 'number') {
        factors.vo2Max = vo2Signal.value;
      }
    }

    logger.info('✅ [LIFESTYLE] Workout data integrated', {
        userId,
        hasExerciseFreq: !!factors.exerciseFrequency,
        hasVO2Max: !!factors.vo2Max,
      });

    // Fetch body composition for BMI and body fat
    const bodyComp = await getLatestBodyCompositionContext(userId);
    if (bodyComp) {
      factors.bmi = bodyComp.bmi || undefined;
      factors.bodyFatPercent = bodyComp.bodyFatPercentage || undefined;

      logger.info('✅ [LIFESTYLE] Body composition integrated', {
        userId,
        hasBMI: !!factors.bmi,
        hasBodyFat: !!factors.bodyFatPercent,
      });
    }

    // Fetch recovery data for sleep quality
    const recovery = await getRecoveryToday(userId);
    if (recovery) {
      // Extract sleep quality from recovery evidence
      const evidence = (recovery as any).evidence;
      if (evidence?.signals) {
        const sleepSignal = evidence.signals.find((s: any) => s.type === 'sleep_quality');
        if (sleepSignal?.value && typeof sleepSignal.value === 'number') {
          factors.sleepQuality = sleepSignal.value;
        }
      }

      logger.info('✅ [LIFESTYLE] Recovery data integrated', {
        userId,
        hasSleepQuality: !!factors.sleepQuality,
      });
    }

    // Fetch stress data
    const stress = await getStressToday(userId);
    if (stress) {
      // Extract stress level from stress evidence
      const evidence = (stress as any).evidence;
      if (evidence?.signals) {
        const stressSignal = evidence.signals.find((s: any) => s.type === 'stress_level');
        if (stressSignal?.value && typeof stressSignal.value === 'number') {
          factors.stressLevel = stressSignal.value;
        }
      }

      logger.info('✅ [LIFESTYLE] Stress data integrated', {
        userId,
        hasStressLevel: !!factors.stressLevel,
      });
    }

    // Diet quality from baseline or nutrition engine
    const baselineDiet = await getBaselineFields(userId);
    if (baselineDiet?.dietQuality) {
      factors.dietQuality = baselineDiet.dietQuality as 'poor' | 'fair' | 'good' | 'excellent';
    }
  } catch (error) {
    logger.warn('⚠️ [LIFESTYLE] Error fetching lifestyle data', {
      userId,
      error: (error as Error).message,
    });
  }

  // Apply defaults for missing values
  const finalFactors: LifestyleRiskFactors = {
    exerciseFrequency: factors.exerciseFrequency || 3,
    bmi: factors.bmi || 25,
    dietQuality: factors.dietQuality || 'fair',
    sleepQuality: factors.sleepQuality || 70,
    stressLevel: factors.stressLevel || 50,
    vo2Max: factors.vo2Max,
    bodyFatPercent: factors.bodyFatPercent,
    ...overrides,
  };

  logger.info('✅ [LIFESTYLE] Lifestyle risk factors complete', {
    userId,
    exerciseFrequency: finalFactors.exerciseFrequency,
    bmi: finalFactors.bmi,
    dietQuality: finalFactors.dietQuality,
  });

  return finalFactors;
}

// ============================================================================
// ADVANCED RISK MARKERS BUILDER
// ============================================================================

async function buildAdvancedRiskMarkers(
  userId: string,
  overrides?: Partial<AdvancedRiskMarkers>
): Promise<AdvancedRiskMarkers | undefined> {
  logger.info('🔬 [ADVANCED] Building advanced risk markers', { userId });

  const markers: Partial<AdvancedRiskMarkers> = {};

  try {
    // Fetch bloodwork data for advanced markers
    const bloodwork = await getLatestBloodworkContext(userId);
    if (bloodwork && bloodwork.hasBloodwork) {
      markers.hsCRP = getMarkerValue(bloodwork.markers.hsCRP) || undefined;
      markers.lipoproteinA = getMarkerValue(bloodwork.markers.lpa) || undefined;
      markers.apoB = getMarkerValue(bloodwork.markers.apoB) || undefined;

      logger.info('✅ [ADVANCED] Advanced markers integrated', {
        userId,
        hasHsCRP: !!markers.hsCRP,
        hasLipoA: !!markers.lipoproteinA,
        hasApoB: !!markers.apoB,
      });
    }
  } catch (error) {
    logger.warn('⚠️ [ADVANCED] Error fetching advanced markers', {
      userId,
      error: (error as Error).message,
    });
  }

  // Apply overrides
  const finalMarkers = {
    ...markers,
    ...overrides,
  };

  // Only return if we have at least one marker
  if (Object.keys(finalMarkers).length === 0) {
    logger.info('ℹ️ [ADVANCED] No advanced markers available', { userId });
    return undefined;
  }

  logger.info('✅ [ADVANCED] Advanced risk markers complete', {
    userId,
    markerCount: Object.keys(finalMarkers).length,
  });

  return finalMarkers as AdvancedRiskMarkers;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract blood pressure from cardiovascular data
 */
export async function extractBloodPressure(userId: string): Promise<{ systolic: number; diastolic: number } | null> {
  try {
    const cardiovascular = await getCardiovascularToday(userId);
    if (cardiovascular?.evidence?.signals) {
      const bpSignal = cardiovascular.evidence.signals.find(s => s.type === 'blood_pressure');
      if (bpSignal?.value && typeof bpSignal.value === 'object') {
        return {
          systolic: (bpSignal.value as any).systolic,
          diastolic: (bpSignal.value as any).diastolic,
        };
      }
    }
  } catch (error) {
    logger.warn('⚠️ [HELPER] Failed to extract blood pressure', { userId });
  }
  return null;
}

/**
 * Extract cholesterol from bloodwork data
 */
export async function extractCholesterol(userId: string): Promise<{
  total: number;
  hdl: number;
  ldl?: number;
  triglycerides?: number;
} | null> {
  try {
    const bloodwork = await getLatestBloodworkContext(userId);
    if (bloodwork && bloodwork.hasBloodwork) {
      const total = getMarkerValue(bloodwork.markers.totalCholesterol);
      const hdl = getMarkerValue(bloodwork.markers.hdl);
      if (total && hdl) {
        return {
          total,
          hdl,
          ldl: getMarkerValue(bloodwork.markers.ldl) || undefined,
          triglycerides: getMarkerValue(bloodwork.markers.triglycerides) || undefined,
        };
      }
    }
  } catch (error) {
    logger.warn('⚠️ [HELPER] Failed to extract cholesterol', { userId });
  }
  return null;
}

/**
 * Extract diabetes status from metabolic data
 */
export async function extractDiabetesStatus(userId: string): Promise<'none' | 'prediabetes' | 'diabetes'> {
  try {
    const metabolic = await getMetabolicToday(userId);
    if (metabolic) {
      const status = (metabolic as any).status;
      if (status === 'high_risk') return 'diabetes';
      if (status === 'elevated_risk') return 'prediabetes';
    }
  } catch (error) {
    logger.warn('⚠️ [HELPER] Failed to extract diabetes status', { userId });
  }
  return 'none';
}

/**
 * Extract exercise data from workout engine
 */
export async function extractExerciseData(userId: string): Promise<{
  frequency: number;
  vo2Max?: number;
} | null> {
  try {
    const workout = await getWorkoutRecommendationToday(userId);
    if (workout?.evidence?.signals) {
      const freqSignal = workout.evidence.signals.find(s => s.name === 'exercise_frequency');
      const vo2Signal = workout.evidence.signals.find(s => s.name === 'vo2_max');

      if (freqSignal?.value && typeof freqSignal.value === 'number') {
        return {
          frequency: freqSignal.value,
          vo2Max: (vo2Signal?.value && typeof vo2Signal.value === 'number') ? vo2Signal.value : undefined,
        };
      }
    }
  } catch (error) {
    logger.warn('⚠️ [HELPER] Failed to extract exercise data', { userId });
  }
  return null;
}

/**
 * Extract body composition data
 */
export async function extractBodyComposition(userId: string): Promise<{
  bmi: number;
  bodyFatPercent?: number;
} | null> {
  try {
    const bodyComp = await getLatestBodyCompositionContext(userId);
    if (bodyComp?.bmi) {
      return {
        bmi: bodyComp.bmi,
        bodyFatPercent: bodyComp.bodyFatPercentage || undefined,
      };
    }
  } catch (error) {
    logger.warn('⚠️ [HELPER] Failed to extract body composition', { userId });
  }
  return null;
}

/**
 * Extract sleep quality from recovery engine
 */
export async function extractSleepQuality(userId: string): Promise<number | null> {
  try {
    const recovery = await getRecoveryToday(userId);
    const evidence = (recovery as any)?.evidence;
    if (evidence?.signals) {
      const sleepSignal = evidence.signals.find((s: any) => s.type === 'sleep_quality');
      if (sleepSignal?.value && typeof sleepSignal.value === 'number') {
        return sleepSignal.value;
      }
    }
  } catch (error) {
    logger.warn('⚠️ [HELPER] Failed to extract sleep quality', { userId });
  }
  return null;
}

/**
 * Extract stress level from stress engine
 */
export async function extractStressLevel(userId: string): Promise<number | null> {
  try {
    const stress = await getStressToday(userId);
    const evidence = (stress as any)?.evidence;
    if (evidence?.signals) {
      const stressSignal = evidence.signals.find((s: any) => s.type === 'stress_level');
      if (stressSignal?.value && typeof stressSignal.value === 'number') {
        return stressSignal.value;
      }
    }
  } catch (error) {
    logger.warn('⚠️ [HELPER] Failed to extract stress level', { userId });
  }
  return null;
}
