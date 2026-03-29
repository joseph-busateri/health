// Supplement Excel Parser
// Parses OCR text from Excel supplement spreadsheets

import { logger } from '../utils/logger';
import type { ParsedSupplementData } from '../types/supplementBaseline';

export const parseSupplementExcel = (extractedText: string): ParsedSupplementData | null => {
  try {
    const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const parsedData: ParsedSupplementData = {
      supplements: [],
      metadata: {},
    };

    let supplementOrder = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header rows
      if (isHeaderRow(line)) {
        continue;
      }

      // Parse supplement row
      if (isSupplementRow(line)) {
        const supplement = parseSupplementRow(line, ++supplementOrder);
        if (supplement) {
          parsedData.supplements.push(supplement);
        }
      }
    }

    // Validate that we extracted at least one supplement
    if (parsedData.supplements.length === 0) {
      logger.warn('Failed to extract any supplements from Excel', { 
        extractedText: extractedText.substring(0, 200) 
      });
      return null;
    }

    // Add metadata
    parsedData.metadata = {
      uploadSource: 'excel',
      totalSupplements: parsedData.supplements.length,
    };

    logger.info('Successfully parsed supplement Excel', {
      supplementCount: parsedData.supplements.length,
    });

    return parsedData;
  } catch (error) {
    logger.error('Error parsing supplement Excel', { error, extractedText: extractedText.substring(0, 200) });
    return null;
  }
};

const isHeaderRow = (line: string): boolean => {
  const lowerLine = line.toLowerCase();
  
  // Common header keywords
  const headerKeywords = [
    'supplementation',
    'supplement',
    'dosage',
    'timing',
    'goal',
    'reason',
    'frequency',
    'brand',
  ];
  
  // If line contains multiple header keywords, it's likely a header
  const keywordCount = headerKeywords.filter(keyword => lowerLine.includes(keyword)).length;
  return keywordCount >= 2;
};

const isSupplementRow = (line: string): boolean => {
  // Supplement rows should have some content
  if (line.length < 3) return false;
  if (isHeaderRow(line)) return false;
  
  return true;
};

const parseSupplementRow = (line: string, order: number): any | null => {
  try {
    // Split by common delimiters (tab, multiple spaces, pipe)
    const parts = line.split(/\t+|\s{2,}|\|/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length < 2) {
      // Not enough data for a valid supplement
      return null;
    }

    // Expected format: Supplementation | Dosage | Timing | Goal | Reason to take
    let supplementName = '';
    let dosageAmount: number | undefined;
    let dosageUnit = '';
    let timing = '';
    let goal: string | undefined;
    let reasonToTake: string | undefined;
    let brand: string | undefined;
    let frequency: string | undefined;

    // First part is usually supplement name
    supplementName = parts[0];

    // Second part is usually dosage (e.g., "500mg", "5g", "1000 IU")
    if (parts.length > 1) {
      const dosageMatch = parts[1].match(/(\d+(?:\.\d+)?)\s*(mg|g|iu|mcg|ml)/i);
      if (dosageMatch) {
        dosageAmount = parseFloat(dosageMatch[1]);
        dosageUnit = dosageMatch[2].toLowerCase();
      } else {
        // Try to extract just the number
        const numberMatch = parts[1].match(/(\d+(?:\.\d+)?)/);
        if (numberMatch) {
          dosageAmount = parseFloat(numberMatch[1]);
          dosageUnit = 'mg'; // Default unit
        }
      }
    }

    // Third part is usually timing
    if (parts.length > 2) {
      timing = parts[2];
      // Normalize timing
      timing = normalizeTiming(timing);
    }

    // Fourth part might be goal
    if (parts.length > 3) {
      goal = parts[3];
    }

    // Fifth part might be reason
    if (parts.length > 4) {
      reasonToTake = parts[4];
    }

    // Look for brand in supplement name (e.g., "Vitamin D3 (Nature Made)")
    const brandMatch = supplementName.match(/\(([^)]+)\)/);
    if (brandMatch) {
      brand = brandMatch[1];
      supplementName = supplementName.replace(/\s*\([^)]+\)/, '').trim();
    }

    // Validate minimum required fields
    if (!supplementName || !dosageAmount || !dosageUnit) {
      return null;
    }

    // Default timing if not provided
    if (!timing) {
      timing = 'morning';
    }

    return {
      supplementName,
      brand,
      dosageAmount,
      dosageUnit,
      timing,
      frequency: frequency || 'daily',
      goal,
      reasonToTake,
      order,
    };
  } catch (error) {
    logger.error('Error parsing supplement row', { error, line });
    return null;
  }
};

const normalizeTiming = (timing: string): string => {
  const lowerTiming = timing.toLowerCase();
  
  // Map common variations to standard timings
  if (lowerTiming.includes('morning') || lowerTiming.includes('am') || lowerTiming.includes('breakfast')) {
    return 'morning';
  }
  if (lowerTiming.includes('evening') || lowerTiming.includes('pm') || lowerTiming.includes('dinner')) {
    return 'evening';
  }
  if (lowerTiming.includes('night') || lowerTiming.includes('bed')) {
    return 'before bed';
  }
  if (lowerTiming.includes('lunch') || lowerTiming.includes('noon')) {
    return 'with lunch';
  }
  if (lowerTiming.includes('pre-workout') || lowerTiming.includes('preworkout')) {
    return 'pre-workout';
  }
  if (lowerTiming.includes('post-workout') || lowerTiming.includes('postworkout')) {
    return 'post-workout';
  }
  if (lowerTiming.includes('meal')) {
    return 'with meals';
  }
  
  // Return as-is if no match
  return timing;
};

// Helper to parse specific Excel formats
export const parseSupplementExcelStructured = (extractedText: string): ParsedSupplementData | null => {
  // This can be extended to handle more structured Excel formats
  // For now, use the general parser
  return parseSupplementExcel(extractedText);
};
