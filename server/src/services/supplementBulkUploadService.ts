import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface ParsedSupplement {
  name: string;
  dosage: string;
  timing: string;
  frequency: string;
  brand?: string;
  form?: string;
  goal?: string;
}

export interface BulkUploadResult {
  success: boolean;
  supplementsCreated: number;
  stackVersionId: string;
  supplements: ParsedSupplement[];
  errors: string[];
}

/**
 * Parse supplement text input into structured supplement entries
 * Supports various formats:
 * - "Vitamin D 5000 IU daily morning"
 * - "Creatine - 5g - post-workout - daily"
 * - "Omega-3 (Nordic Naturals) 2 capsules with breakfast"
 */
export function parseSupplementText(text: string): ParsedSupplement[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const supplements: ParsedSupplement[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Remove common prefixes like bullets, numbers
    const cleaned = trimmed.replace(/^[-*•\d+.)\s]+/, '');

    // Try to extract brand in parentheses
    const brandMatch = cleaned.match(/\(([^)]+)\)/);
    const brand = brandMatch ? brandMatch[1] : undefined;
    const withoutBrand = cleaned.replace(/\([^)]+\)/g, '').trim();

    // Split by common separators
    const parts = withoutBrand.split(/[-–—,]/);

    if (parts.length === 0) continue;

    // First part is usually the supplement name
    const name = parts[0].trim();

    // Try to extract dosage (number + unit)
    const dosageMatch = withoutBrand.match(/(\d+(?:\.\d+)?)\s*(mg|g|mcg|iu|ml|capsules?|tablets?|scoops?)/i);
    const dosage = dosageMatch ? `${dosageMatch[1]} ${dosageMatch[2]}` : '1 serving';

    // Common timing keywords
    const timingKeywords = ['morning', 'evening', 'night', 'breakfast', 'lunch', 'dinner', 'pre-workout', 'post-workout', 'before bed', 'bedtime'];
    const timing = timingKeywords.find(keyword => 
      withoutBrand.toLowerCase().includes(keyword)
    ) || 'morning';

    // Common frequency keywords
    const frequencyKeywords = ['daily', 'twice daily', '2x daily', '3x daily', 'as needed', 'every other day'];
    const frequency = frequencyKeywords.find(keyword => 
      withoutBrand.toLowerCase().includes(keyword)
    ) || 'daily';

    // Try to detect form
    const formKeywords = ['capsule', 'tablet', 'powder', 'liquid', 'gummy', 'softgel'];
    const form = formKeywords.find(keyword => 
      withoutBrand.toLowerCase().includes(keyword)
    );

    supplements.push({
      name,
      dosage,
      timing,
      frequency,
      brand,
      form,
    });
  }

  return supplements;
}

/**
 * Create a new supplement stack version and add supplements in bulk
 */
export async function bulkUploadSupplements(
  userId: string,
  supplementText: string,
  versionName?: string
): Promise<BulkUploadResult> {
  const errors: string[] = [];

  try {
    // Parse the supplement text
    const parsedSupplements = parseSupplementText(supplementText);

    if (parsedSupplements.length === 0) {
      return {
        success: false,
        supplementsCreated: 0,
        stackVersionId: '',
        supplements: [],
        errors: ['No valid supplements found in the input text'],
      };
    }

    logger.info('📦 [SUPPLEMENT BULK UPLOAD] Parsed supplements', {
      userId,
      count: parsedSupplements.length,
    });

    // Get the current version number
    const { data: existingVersions } = await supabase
      .from('supplement_stack_versions')
      .select('version_number')
      .eq('user_id', userId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersionNumber = existingVersions && existingVersions.length > 0 
      ? existingVersions[0].version_number + 1 
      : 1;

    // Mark all previous versions as not current
    await supabase
      .from('supplement_stack_versions')
      .update({ is_current: false })
      .eq('user_id', userId)
      .eq('is_current', true);

    // Create new stack version
    const { data: stackVersion, error: stackError } = await supabase
      .from('supplement_stack_versions')
      .insert({
        user_id: userId,
        version_number: nextVersionNumber,
        version_name: versionName || `Bulk Upload v${nextVersionNumber}`,
        is_current: true,
        created_by: 'user',
        created_reason: 'Bulk text upload',
        effective_from: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (stackError || !stackVersion) {
      logger.error('❌ [SUPPLEMENT BULK UPLOAD] Failed to create stack version', {
        error: stackError?.message,
      });
      return {
        success: false,
        supplementsCreated: 0,
        stackVersionId: '',
        supplements: parsedSupplements,
        errors: [`Failed to create stack version: ${stackError?.message}`],
      };
    }

    logger.info('✅ [SUPPLEMENT BULK UPLOAD] Created stack version', {
      stackVersionId: stackVersion.id,
      versionNumber: nextVersionNumber,
    });

    // Insert supplements
    const supplementsToInsert = parsedSupplements.map((supp, index) => {
      // Parse dosage into amount and unit
      const dosageParts = supp.dosage.match(/(\d+(?:\.\d+)?)\s*(.+)/);
      const dosageAmount = dosageParts ? parseFloat(dosageParts[1]) : 1;
      const dosageUnit = dosageParts ? dosageParts[2] : 'serving';

      // Determine times per day from frequency
      const timesPerDay = supp.frequency.includes('twice') || supp.frequency.includes('2x') ? 2 :
                         supp.frequency.includes('3x') ? 3 : 1;

      return {
        stack_version_id: stackVersion.id,
        supplement_name: supp.name,
        brand: supp.brand || null,
        form: supp.form || 'capsule',
        dosage_amount: dosageAmount,
        dosage_unit: dosageUnit,
        timing: supp.timing,
        frequency: supp.frequency,
        times_per_day: timesPerDay,
        goal: supp.goal || 'General Health',
        reason_to_take: `Added via bulk upload`,
        take_with_food: supp.timing.includes('breakfast') || supp.timing.includes('lunch') || supp.timing.includes('dinner'),
        take_with_water: true,
        status: 'active',
        supplement_order: index + 1,
      };
    });

    const { data: insertedSupplements, error: insertError } = await supabase
      .from('supplements')
      .insert(supplementsToInsert)
      .select();

    if (insertError) {
      logger.error('❌ [SUPPLEMENT BULK UPLOAD] Failed to insert supplements', {
        error: insertError.message,
      });
      errors.push(`Failed to insert supplements: ${insertError.message}`);
    }

    const successCount = insertedSupplements?.length || 0;

    logger.info('✅ [SUPPLEMENT BULK UPLOAD] Bulk upload complete', {
      userId,
      stackVersionId: stackVersion.id,
      supplementsCreated: successCount,
    });

    return {
      success: successCount > 0,
      supplementsCreated: successCount,
      stackVersionId: stackVersion.id,
      supplements: parsedSupplements,
      errors,
    };
  } catch (error) {
    logger.error('❌ [SUPPLEMENT BULK UPLOAD] Unexpected error', {
      error: (error as Error).message,
    });
    return {
      success: false,
      supplementsCreated: 0,
      stackVersionId: '',
      supplements: [],
      errors: [(error as Error).message],
    };
  }
}
