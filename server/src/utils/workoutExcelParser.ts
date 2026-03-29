// Workout Excel Parser
// Parses OCR text from Excel workout spreadsheets

import { logger } from '../utils/logger';
import type { ParsedWorkoutData } from '../types/workoutBaseline';

export const parseWorkoutExcel = (extractedText: string): ParsedWorkoutData | null => {
  try {
    const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const parsedData: ParsedWorkoutData = {
      splitDays: [],
      metadata: {},
    };

    let currentSplitDay: any = null;
    let currentDayOrder = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect split day headers (e.g., "Day 1", "Push Day", "Monday")
      if (isSplitDayHeader(line)) {
        // Save previous split day if exists
        if (currentSplitDay && currentSplitDay.exercises.length > 0) {
          parsedData.splitDays.push(currentSplitDay);
        }

        // Start new split day
        currentDayOrder++;
        currentSplitDay = {
          dayName: line,
          splitFocus: extractSplitFocus(line),
          dayOrder: currentDayOrder,
          exercises: [],
        };
        continue;
      }

      // Skip header rows
      if (isHeaderRow(line)) {
        continue;
      }

      // Parse exercise row
      if (currentSplitDay && isExerciseRow(line)) {
        const exercise = parseExerciseRow(line, currentSplitDay.exercises.length + 1);
        if (exercise) {
          currentSplitDay.exercises.push(exercise);
        }
      }
    }

    // Add last split day
    if (currentSplitDay && currentSplitDay.exercises.length > 0) {
      parsedData.splitDays.push(currentSplitDay);
    }

    // Validate that we extracted at least one split day
    if (parsedData.splitDays.length === 0) {
      logger.warn('Failed to extract any split days from workout Excel', { 
        extractedText: extractedText.substring(0, 200) 
      });
      return null;
    }

    logger.info('Successfully parsed workout Excel', {
      splitDaysCount: parsedData.splitDays.length,
      totalExercises: parsedData.splitDays.reduce((sum, day) => sum + day.exercises.length, 0),
    });

    return parsedData;
  } catch (error) {
    logger.error('Error parsing workout Excel', { error, extractedText: extractedText.substring(0, 200) });
    return null;
  }
};

const isSplitDayHeader = (line: string): boolean => {
  const lowerLine = line.toLowerCase();
  
  // Check for day patterns
  if (/^day\s+\d+/i.test(line)) return true;
  if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(line)) return true;
  if (/^(push|pull|legs|upper|lower|full\s*body)/i.test(line)) return true;
  
  return false;
};

const extractSplitFocus = (dayName: string): string | undefined => {
  const lowerName = dayName.toLowerCase();
  
  if (lowerName.includes('push')) return 'Push';
  if (lowerName.includes('pull')) return 'Pull';
  if (lowerName.includes('legs') || lowerName.includes('leg')) return 'Legs';
  if (lowerName.includes('upper')) return 'Upper';
  if (lowerName.includes('lower')) return 'Lower';
  if (lowerName.includes('full')) return 'Full Body';
  
  return undefined;
};

const isHeaderRow = (line: string): boolean => {
  const lowerLine = line.toLowerCase();
  
  // Common header keywords
  const headerKeywords = [
    'exercise',
    'sets',
    'reps',
    'weight',
    'description',
    'split',
    'focus',
  ];
  
  // If line contains multiple header keywords, it's likely a header
  const keywordCount = headerKeywords.filter(keyword => lowerLine.includes(keyword)).length;
  return keywordCount >= 2;
};

const isExerciseRow = (line: string): boolean => {
  // Exercise rows typically have numbers (sets/reps) or exercise names
  // Skip if it's too short or looks like a header
  if (line.length < 5) return false;
  if (isHeaderRow(line)) return false;
  
  return true;
};

const parseExerciseRow = (line: string, exerciseOrder: number): any | null => {
  try {
    // Split by common delimiters (tab, multiple spaces, pipe)
    const parts = line.split(/\t+|\s{2,}|\|/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length < 3) {
      // Not enough data for a valid exercise
      return null;
    }

    // Try to identify exercise name, sets, reps, weight
    let exerciseName = '';
    let exerciseDescription = '';
    let sets: number | undefined;
    let reps: string | undefined;
    let weight: string | undefined;

    // First part is usually exercise name
    exerciseName = parts[0];

    // Look for sets (number)
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      
      // Check if it's a number (sets)
      if (/^\d+$/.test(part) && !sets) {
        sets = parseInt(part);
        continue;
      }

      // Check if it's reps (number or range like "8-12")
      if (/^\d+(-\d+)?$/.test(part) && !reps) {
        reps = part;
        continue;
      }

      // Check if it's weight (number with unit or "bodyweight")
      if (/^\d+\s*(lb|kg|lbs)?$/i.test(part) || /bodyweight/i.test(part)) {
        weight = part;
        continue;
      }

      // Otherwise, it might be part of description
      if (!exerciseDescription && i === 1) {
        exerciseDescription = part;
      }
    }

    // If we didn't find sets/reps, try alternate parsing
    if (!sets || !reps) {
      // Look for patterns like "3x10" or "4 x 12"
      const setRepPattern = /(\d+)\s*[xX×]\s*(\d+(-\d+)?)/;
      for (const part of parts) {
        const match = part.match(setRepPattern);
        if (match) {
          sets = parseInt(match[1]);
          reps = match[2];
          break;
        }
      }
    }

    // Validate minimum required fields
    if (!exerciseName || !sets || !reps) {
      return null;
    }

    return {
      exerciseName,
      exerciseDescription: exerciseDescription || undefined,
      sets,
      reps,
      weight: weight || undefined,
      exerciseOrder,
    };
  } catch (error) {
    logger.error('Error parsing exercise row', { error, line });
    return null;
  }
};

// Helper to parse specific Excel formats
export const parseWorkoutExcelStructured = (extractedText: string): ParsedWorkoutData | null => {
  // This can be extended to handle more structured Excel formats
  // For now, use the general parser
  return parseWorkoutExcel(extractedText);
};
