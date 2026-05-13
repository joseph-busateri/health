/**
 * Framingham Model Metadata Builder
 * Builds input metadata specifically for Framingham Risk Score
 */

import { logger } from '../utils/logger';
import { getBaselineFields } from './baselineContextService';
import { getLatestBloodworkContext, getMarkerValue } from './bloodworkContextService';
import { getLatestBloodPressureContext, getSystolic, getDiastolic } from './bloodPressureContextService';
import type { FraminghamInputs } from './framinghamRiskCalculator';
import type { FraminghamModelData, ModelInputMetadata } from '../types/actuarialRiskEngine';

/**
 * Build Framingham-specific metadata with actual database values
 */
export async function buildFraminghamMetadata(
  userId: string,
  inputs: FraminghamInputs,
  riskPercentage: number,
  riskCategory: string
): Promise<FraminghamModelData> {
  logger.info('🔬 [FRAMINGHAM METADATA] Building Framingham model metadata', { userId });

  const metadata: ModelInputMetadata[] = [];
  const missingInputs: string[] = [];

  try {
    // Load context data
    const [baselineContext, bloodworkContext, bpContext] = await Promise.allSettled([
      getBaselineFields(userId),
      getLatestBloodworkContext(userId),
      getLatestBloodPressureContext(userId),
    ]);

    const baseline = baselineContext.status === 'fulfilled' ? baselineContext.value : null;
    const bloodwork = bloodworkContext.status === 'fulfilled' ? bloodworkContext.value : null;
    const bp = bpContext.status === 'fulfilled' ? bpContext.value : null;

    // Calculate contribution percentages for each input
    const ageValue = baseline?.age ?? inputs.age;
    const ageContribution = calculateAgeContribution(ageValue);
    metadata.push({
      key: 'age',
      label: 'Age',
      value: ageValue,
      unit: 'years',
      source: baseline?.age ? 'ACTUAL' : 'DERIVED',
      sourceTable: 'baseline_profile',
      sourceField: 'age',
      required: true,
      available: !!ageValue,
      contribution: ageContribution,
    });
    if (!ageValue) missingInputs.push('Age');

    // Sex
    const sexValue = baseline?.sex ?? inputs.gender;
    const sexContribution = inputs.gender === 'male' ? 18 : 12;
    metadata.push({
      key: 'sex',
      label: 'Sex',
      value: sexValue,
      source: baseline?.sex ? 'ACTUAL' : 'DERIVED',
      sourceTable: 'baseline_profile',
      sourceField: 'sex',
      required: true,
      available: !!sexValue,
      contribution: sexContribution,
    });
    if (!sexValue) missingInputs.push('Sex');

    // Total Cholesterol
    const totalCholFromDB = bloodwork ? getMarkerValue(bloodwork.markers.totalCholesterol) : null;
    const totalCholValue = totalCholFromDB ?? inputs.totalCholesterol;
    const totalCholContribution = calculateCholesterolContribution(totalCholValue);
    metadata.push({
      key: 'totalCholesterol',
      label: 'Total Cholesterol',
      value: totalCholValue,
      unit: 'mg/dL',
      source: totalCholFromDB ? 'ACTUAL' : 'DERIVED',
      sourceTable: 'bloodwork_results',
      sourceField: 'total_cholesterol',
      required: true,
      available: !!totalCholValue,
      lastUpdated: bloodwork?.latestTestDate,
      contribution: totalCholContribution,
    });
    if (!totalCholValue) missingInputs.push('Total Cholesterol');

    // HDL Cholesterol
    const hdlFromDB = bloodwork ? getMarkerValue(bloodwork.markers.hdl) : null;
    const hdlValue = hdlFromDB ?? inputs.hdlCholesterol;
    const hdlContribution = calculateHDLContribution(hdlValue);
    metadata.push({
      key: 'hdlCholesterol',
      label: 'HDL Cholesterol',
      value: hdlValue,
      unit: 'mg/dL',
      source: hdlFromDB ? 'ACTUAL' : 'DERIVED',
      sourceTable: 'bloodwork_results',
      sourceField: 'hdl',
      required: true,
      available: !!hdlValue,
      lastUpdated: bloodwork?.latestTestDate,
      contribution: hdlContribution,
    });
    if (!hdlValue) missingInputs.push('HDL Cholesterol');

    // Systolic Blood Pressure
    const systolicFromDB = bp?.hasBloodPressure ? getSystolic(bp) : null;
    const systolicValue = systolicFromDB ?? inputs.systolicBP;
    const systolicContribution = calculateBPContribution(systolicValue);
    metadata.push({
      key: 'systolicBP',
      label: 'Systolic Blood Pressure',
      value: systolicValue,
      unit: 'mmHg',
      source: systolicFromDB ? 'ACTUAL' : 'DERIVED',
      sourceTable: 'blood_pressure_readings',
      sourceField: 'systolic_bp',
      required: true,
      available: !!systolicValue,
      lastUpdated: bp?.latestReadingDate,
      contribution: systolicContribution,
    });
    if (!systolicValue) missingInputs.push('Systolic Blood Pressure');

    // Blood Pressure Treatment Status
    const hasHypertensionHistory = baseline?.bloodPressureHistory === 'hypertension_stage1' ||
                                   baseline?.bloodPressureHistory === 'hypertension_stage2';
    const hasBPMedication = baseline?.medications?.some(med =>
      med.toLowerCase().includes('blood pressure') ||
      med.toLowerCase().includes('lisinopril') ||
      med.toLowerCase().includes('amlodipine') ||
      med.toLowerCase().includes('losartan') ||
      med.toLowerCase().includes('metoprolol') ||
      med.toLowerCase().includes('hydrochlorothiazide')
    ) || false;
    const onBPMedFromDB = hasHypertensionHistory || hasBPMedication;
    const bpTreatmentValue = onBPMedFromDB !== undefined ? onBPMedFromDB : inputs.onBPmedication;
    const bpMedContribution = bpTreatmentValue ? -6 : 0;  // Medication reduces risk
    metadata.push({
      key: 'onBPmedication',
      label: 'On Blood Pressure Medication',
      value: bpTreatmentValue ? 'Yes' : 'No',
      source: (baseline?.bloodPressureHistory || baseline?.medications?.length > 0) ? 'ACTUAL' : 'DERIVED',
      sourceTable: 'baseline_profile',
      sourceField: 'medications',
      required: true,
      available: true,
      contribution: bpMedContribution,
    });

    // Smoking Status - use actual DB value
    const smokingFromDB = baseline?.smokingStatus === 'current';
    const smokingValue = smokingFromDB !== undefined ? smokingFromDB : inputs.smoking;
    const smokingContribution = smokingValue ? 22 : 0;
    metadata.push({
      key: 'smoking',
      label: 'Current Smoker',
      value: smokingValue ? 'Yes' : 'No',
      source: baseline?.smokingStatus ? 'ACTUAL' : 'DERIVED',
      sourceTable: 'baseline_profile',
      sourceField: 'smokingStatus',
      required: true,
      available: true,
      contribution: smokingContribution,
    });

    // Diabetes Status - use actual DB value
    const diabetesFromDB = baseline?.diabetesStatus === 'diabetes';
    const diabetesValue = diabetesFromDB !== undefined ? diabetesFromDB : inputs.diabetes;
    const diabetesContribution = diabetesValue ? 28 : 0;
    metadata.push({
      key: 'diabetes',
      label: 'Diabetes',
      value: diabetesValue ? 'Yes' : 'No',
      source: baseline?.diabetesStatus ? 'ACTUAL' : 'DERIVED',
      sourceTable: 'baseline_profile',
      sourceField: 'diabetesStatus',
      required: true,
      available: true,
      contribution: diabetesContribution,
    });

    logger.info('✅ [FRAMINGHAM METADATA] Framingham metadata built', {
      userId,
      inputCount: metadata.length,
      missingCount: missingInputs.length,
    });

    return {
      riskPercentage,
      riskCategory,
      inputs: metadata,
      missingInputs,
      confidence: missingInputs.length === 0 ? 1.0 : 0.8,
    };
  } catch (error) {
    logger.error('❌ [FRAMINGHAM METADATA] Failed to build Framingham metadata', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

// Helper functions for contribution calculations
function calculateAgeContribution(age: number): number {
  if (age < 40) return 8;
  if (age < 50) return 12;
  if (age < 60) return 22;
  if (age < 70) return 32;
  return 42;
}

function calculateCholesterolContribution(totalCholesterol: number): number {
  if (totalCholesterol < 200) return 8;
  if (totalCholesterol < 240) return 18;
  return 28;
}

function calculateHDLContribution(hdl: number): number {
  // HDL is protective, so higher is better (negative contribution)
  if (hdl >= 60) return -12;
  if (hdl >= 40) return 8;
  return 18;
}

function calculateBPContribution(systolicBP: number): number {
  if (systolicBP < 120) return 8;
  if (systolicBP < 140) return 18;
  if (systolicBP < 160) return 28;
  return 38;
}
