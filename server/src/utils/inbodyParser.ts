// InBody Scan Parser
// Parses OCR text from InBody scale images (S2, 570, 770, etc.)

import type { ParsedScanData, Gender } from '../types/bodyComposition';
import { logger } from '../utils/logger';

export const parseInBodyScan = (extractedText: string): ParsedScanData | null => {
  try {
    const lines = extractedText.split('\n').map(line => line.trim());
    
    const parsedData: ParsedScanData = {
      rawFields: {},
    };

    // Extract scan ID
    const idMatch = extractedText.match(/ID[:\s]*(\d+)/i);
    if (idMatch) {
      parsedData.scanId = idMatch[1];
      parsedData.rawFields!.id = idMatch[1];
    }

    // Extract height
    const heightMatch = extractedText.match(/Height[:\s]*([\d]+)ft\s*([\d.]+)in/i);
    if (heightMatch) {
      parsedData.height = `${heightMatch[1]}ft ${heightMatch[2]}in`;
      parsedData.rawFields!.height = parsedData.height;
    }

    // Extract age
    const ageMatch = extractedText.match(/Age[:\s]*(\d+)/i);
    if (ageMatch) {
      parsedData.age = parseInt(ageMatch[1]);
      parsedData.rawFields!.age = parsedData.age;
    }

    // Extract gender
    const genderMatch = extractedText.match(/Gender[:\s]*(Male|Female)/i);
    if (genderMatch) {
      parsedData.gender = genderMatch[1].toLowerCase() as Gender;
      parsedData.rawFields!.gender = parsedData.gender;
    }

    // Extract test date
    const dateMatch = extractedText.match(/Test[:\s]*(\d{4})[.\s]*(\d{1,2})[.\s]*(\d{1,2})/i);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      parsedData.testDate = `${year}-${month}-${day}`;
      parsedData.rawFields!.testDate = parsedData.testDate;
    }

    // Extract weight
    const weightMatch = extractedText.match(/Weight[:\s]*([\d.]+)\s*(lb|kg)/i);
    if (weightMatch) {
      parsedData.weight = parseFloat(weightMatch[1]);
      parsedData.weightUnit = weightMatch[2].toLowerCase() as 'lb' | 'kg';
      parsedData.rawFields!.weight = parsedData.weight;
      parsedData.rawFields!.weightUnit = parsedData.weightUnit;
    }

    // Extract body composition breakdown
    // Total Body Water
    const waterMatch = extractedText.match(/Total\s+Body\s+Water[:\s]*([\d.]+)\s*(?:lb|kg)?/i);
    if (waterMatch) {
      parsedData.totalBodyWater = parseFloat(waterMatch[1]);
      parsedData.rawFields!.totalBodyWater = parsedData.totalBodyWater;
    }

    // Dry Lean Mass
    const leanMatch = extractedText.match(/Dry\s+Lean\s+Mass[:\s]*([\d.]+)\s*(?:lb|kg)?/i);
    if (leanMatch) {
      parsedData.dryLeanMass = parseFloat(leanMatch[1]);
      parsedData.rawFields!.dryLeanMass = parsedData.dryLeanMass;
    }

    // Body Fat Mass
    const fatMatch = extractedText.match(/Body\s+Fat\s+Mass[:\s]*([\d.]+)\s*(?:lb|kg)?/i);
    if (fatMatch) {
      parsedData.bodyFatMass = parseFloat(fatMatch[1]);
      parsedData.rawFields!.bodyFatMass = parsedData.bodyFatMass;
    }

    // Body Fat Percentage
    const fatPercentMatch = extractedText.match(/Body\s+Fat[:\s]*([\d.]+)\s*%/i);
    if (fatPercentMatch) {
      parsedData.bodyFatPercentage = parseFloat(fatPercentMatch[1]);
      parsedData.rawFields!.bodyFatPercentage = parsedData.bodyFatPercentage;
    }

    // Skeletal Muscle Mass
    const muscleMatch = extractedText.match(/Skeletal\s+Muscle\s+Mass[:\s]*([\d.]+)\s*(?:lb|kg)?/i);
    if (muscleMatch) {
      parsedData.skeletalMuscleMass = parseFloat(muscleMatch[1]);
      parsedData.rawFields!.skeletalMuscleMass = parsedData.skeletalMuscleMass;
    }

    // Visceral Fat Level
    const visceralMatch = extractedText.match(/Visceral\s+Fat\s+Level[:\s]*(\d+)/i);
    if (visceralMatch) {
      parsedData.visceralFatLevel = parseInt(visceralMatch[1]);
      parsedData.rawFields!.visceralFatLevel = parsedData.visceralFatLevel;
    }

    // BMI
    const bmiMatch = extractedText.match(/BMI[:\s]*([\d.]+)/i);
    if (bmiMatch) {
      parsedData.bmi = parseFloat(bmiMatch[1]);
      parsedData.rawFields!.bmi = parsedData.bmi;
    }

    // BMR (Basal Metabolic Rate)
    const bmrMatch = extractedText.match(/BMR[:\s]*([\d,]+)\s*(?:kcal)?/i);
    if (bmrMatch) {
      parsedData.bmr = parseInt(bmrMatch[1].replace(/,/g, ''));
      parsedData.rawFields!.bmr = parsedData.bmr;
    }

    // Segmental analysis (if available)
    const segmentalData = parseSegmentalAnalysis(extractedText);
    if (segmentalData) {
      parsedData.segmentalAnalysis = segmentalData;
    }

    // Validate that we extracted at least weight
    if (!parsedData.weight) {
      logger.warn('Failed to extract weight from InBody scan', { extractedText: extractedText.substring(0, 200) });
      return null;
    }

    logger.info('Successfully parsed InBody scan', {
      scanId: parsedData.scanId,
      weight: parsedData.weight,
      bodyFat: parsedData.bodyFatPercentage,
    });

    return parsedData;
  } catch (error) {
    logger.error('Error parsing InBody scan', { error, extractedText: extractedText.substring(0, 200) });
    return null;
  }
};

const parseSegmentalAnalysis = (extractedText: string): ParsedScanData['segmentalAnalysis'] | null => {
  try {
    const segmentalData: ParsedScanData['segmentalAnalysis'] = {};

    // Right Arm
    const rightArmMuscleMatch = extractedText.match(/Right\s+Arm\s+Muscle[:\s]*([\d.]+)/i);
    const rightArmFatMatch = extractedText.match(/Right\s+Arm\s+Fat[:\s]*([\d.]+)/i);
    if (rightArmMuscleMatch || rightArmFatMatch) {
      segmentalData.rightArm = {
        muscle: rightArmMuscleMatch ? parseFloat(rightArmMuscleMatch[1]) : undefined,
        fat: rightArmFatMatch ? parseFloat(rightArmFatMatch[1]) : undefined,
      };
    }

    // Left Arm
    const leftArmMuscleMatch = extractedText.match(/Left\s+Arm\s+Muscle[:\s]*([\d.]+)/i);
    const leftArmFatMatch = extractedText.match(/Left\s+Arm\s+Fat[:\s]*([\d.]+)/i);
    if (leftArmMuscleMatch || leftArmFatMatch) {
      segmentalData.leftArm = {
        muscle: leftArmMuscleMatch ? parseFloat(leftArmMuscleMatch[1]) : undefined,
        fat: leftArmFatMatch ? parseFloat(leftArmFatMatch[1]) : undefined,
      };
    }

    // Trunk
    const trunkMuscleMatch = extractedText.match(/Trunk\s+Muscle[:\s]*([\d.]+)/i);
    const trunkFatMatch = extractedText.match(/Trunk\s+Fat[:\s]*([\d.]+)/i);
    if (trunkMuscleMatch || trunkFatMatch) {
      segmentalData.trunk = {
        muscle: trunkMuscleMatch ? parseFloat(trunkMuscleMatch[1]) : undefined,
        fat: trunkFatMatch ? parseFloat(trunkFatMatch[1]) : undefined,
      };
    }

    // Right Leg
    const rightLegMuscleMatch = extractedText.match(/Right\s+Leg\s+Muscle[:\s]*([\d.]+)/i);
    const rightLegFatMatch = extractedText.match(/Right\s+Leg\s+Fat[:\s]*([\d.]+)/i);
    if (rightLegMuscleMatch || rightLegFatMatch) {
      segmentalData.rightLeg = {
        muscle: rightLegMuscleMatch ? parseFloat(rightLegMuscleMatch[1]) : undefined,
        fat: rightLegFatMatch ? parseFloat(rightLegFatMatch[1]) : undefined,
      };
    }

    // Left Leg
    const leftLegMuscleMatch = extractedText.match(/Left\s+Leg\s+Muscle[:\s]*([\d.]+)/i);
    const leftLegFatMatch = extractedText.match(/Left\s+Leg\s+Fat[:\s]*([\d.]+)/i);
    if (leftLegMuscleMatch || leftLegFatMatch) {
      segmentalData.leftLeg = {
        muscle: leftLegMuscleMatch ? parseFloat(leftLegMuscleMatch[1]) : undefined,
        fat: leftLegFatMatch ? parseFloat(leftLegFatMatch[1]) : undefined,
      };
    }

    // Return null if no segmental data found
    if (Object.keys(segmentalData).length === 0) {
      return null;
    }

    return segmentalData;
  } catch (error) {
    logger.error('Error parsing segmental analysis', { error });
    return null;
  }
};

// Helper function to parse InBody S2 specific format
export const parseInBodyS2 = (extractedText: string): ParsedScanData | null => {
  // InBody S2 has a specific format with "Body Assessment" header
  if (!extractedText.toLowerCase().includes('body assessment')) {
    return parseInBodyScan(extractedText);
  }

  // Use the general parser for now, can be specialized later
  return parseInBodyScan(extractedText);
};

// Helper function to parse InBody 570/770 format
export const parseInBody570 = (extractedText: string): ParsedScanData | null => {
  // InBody 570/770 have more detailed reports
  // Use the general parser for now, can be specialized later
  return parseInBodyScan(extractedText);
};
