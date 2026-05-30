import { createClient } from '@supabase/supabase-js';
import {
  SupplementDocument,
  SupplementDocumentInsert,
  SupplementStackVersion,
  Supplement,
  SupplementInsert,
  SupplementStackChange,
  SupplementExtractedSection,
  SupplementExtractedSectionInsert,
  ManualSupplementData,
  SupplementDocumentResult,
  SupplementStackWithSupplements,
  SupplementBaselineWithItems,
} from '../types/supplementDocument';
import { uploadFileToStorage, downloadFileFromStorage } from './storageService';
import { extractTextFromBuffer } from './ocrService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baselineOverrideStore = new Map<string, SupplementBaselineWithItems>();

export const seedSupplementBaselineOverride = (userId: string, baseline: SupplementBaselineWithItems) => {
  baselineOverrideStore.set(userId, baseline);
};

// Create supplement document with baseline and items
function parseSupplementText(ocrText: string): ManualSupplementData | undefined {
  const cleaned = ocrText.replace(/\r/g, '').replace(/\t/g, ' ').trim();
  if (!cleaned) return undefined;

  const sections = cleaned.split(/\n\s*\n/).map(section => section.trim()).filter(Boolean);
  const stackNameMatch = cleaned.match(/Stack Name[:\-]\s*(?<name>.+)/i);
  const stackNotesMatch = cleaned.match(/Stack Notes[:\-]\s*(?<notes>.+)/i);
  const timingNotesMatch = cleaned.match(/Timing Notes[:\-]\s*(?<notes>.+)/i);
  const frequencyNotesMatch = cleaned.match(/Frequency Notes[:\-]\s*(?<notes>.+)/i);

  const supplementsSection = sections.find(section => /supplements?/i.test(section));
  const supplements: ManualSupplementData['supplements'] = [];

  if (supplementsSection) {
    const lines = supplementsSection.split(/\n|\*/).map(line => line.trim()).filter(Boolean);
    for (const line of lines) {
      const normalized = line.replace(/\s{2,}/g, ' ');
      const match = normalized.match(/(?<name>[A-Za-z0-9\s]+?)\s*\-\s*(?<dosage>\d+(?:\.\d+)?)\s*(?<unit>[A-Za-z\/]+)?\s*\-\s*(?<frequency>[^-]+?)\s*\-\s*(?<timing>[^-]+?)\s*\-\s*(?<status>active|paused|removed)/i);
      if (match?.groups) {
        supplements.push({
          supplementName: match.groups.name.trim(),
          dosage: Number(match.groups.dosage),
          dosageUnit: match.groups.unit?.trim() || 'unit',
          frequency: match.groups.frequency.trim(),
          timing: match.groups.timing.trim(),
          status: match.groups.status.toLowerCase() as ManualSupplementData['supplements'][number]['status'],
        });
        continue;
      }

      const simpleMatch = normalized.match(/^(?<name>[A-Za-z0-9\s]+?)(?:\s*:\s*|\s*-\s*)(?<details>.+)$/);
      if (simpleMatch?.groups) {
        supplements.push({
          supplementName: simpleMatch.groups.name.trim(),
          dosage: 1,
          dosageUnit: 'unit',
          frequency: simpleMatch.groups.details.trim(),
          timing: 'unspecified',
          status: 'active',
        });
      }
    }
  }

  const stackName = stackNameMatch?.groups?.name?.trim() || (supplements.length ? supplements[0].supplementName : undefined);
  if (!stackName) {
    return undefined;
  }

  return {
    stackName,
    stackNotes: stackNotesMatch?.groups?.notes?.trim(),
    timingNotes: timingNotesMatch?.groups?.notes?.trim(),
    frequencyNotes: frequencyNotesMatch?.groups?.notes?.trim(),
    supplements: supplements.length
      ? supplements.map(item => ({
          ...item,
          dosage: Number.isFinite(item.dosage) && item.dosage > 0 ? item.dosage : 1,
          dosageUnit: item.dosageUnit || 'unit',
          frequency: item.frequency || 'daily',
          timing: item.timing || 'unspecified',
          status: item.status || 'active',
        }))
      : [
          {
            supplementName: stackName,
            dosage: 1,
            dosageUnit: 'unit',
            frequency: 'daily',
            timing: 'unspecified',
            status: 'active',
          },
        ],
  };
}

export async function createSupplementDocument(
  data: SupplementDocumentInsert & { manualSupplementData?: ManualSupplementData; fileBuffer?: Buffer; mimeType?: string; originalFileName?: string }
): Promise<SupplementDocumentResult> {
  try {
    let storagePath = data.storage_path;
    let fileReference = data.file_reference;
    let manualSupplementData = data.manualSupplementData;

    if (data.fileBuffer && !storagePath) {
      const fileExtension = data.originalFileName ? `.${data.originalFileName.split('.').pop()}` : '.bin';
      storagePath = `supplements/${data.user_id}/${Date.now()}${fileExtension}`;
      const uploadResult = await uploadFileToStorage({
        path: storagePath,
        file: data.fileBuffer,
        contentType: data.mimeType,
      });
      fileReference = uploadResult.publicUrl ?? storagePath;
    }

    if (!manualSupplementData && storagePath) {
      const fileBuffer = await downloadFileFromStorage(storagePath);
      const { text } = await extractTextFromBuffer(fileBuffer, data.mimeType);
      manualSupplementData = parseSupplementText(text);
    }

    const parseStatus = manualSupplementData ? 'completed' : 'processing';
    const extractionConfidence = manualSupplementData ? 0.95 : null;

    // 1. Create supplement document
    const { data: document, error: documentError } = await supabase
      .from('supplement_documents')
      .insert({
        user_id: data.user_id,
        file_reference: fileReference,
        storage_path: storagePath,
        document_type: data.document_type,
        parse_status: parseStatus,
        notes: data.notes,
      })
      .select()
      .single();

    if (documentError || !document) {
      throw new Error(`Failed to create supplement document: ${documentError?.message}`);
    }

    // 2. Create supplement stack version from manual data or placeholder
    let stackVersion: SupplementStackVersion;
    let supplements: Supplement[] = [];
    let extractedSections: SupplementExtractedSection[] = [];

    if (manualSupplementData) {
      // Process manual supplement data
      const supplementData = manualSupplementData;

      // Create supplement stack version (v1 for initial upload)
      const { data: createdStackVersion, error: stackVersionError } = await supabase
        .from('supplement_stack_versions')
        .insert({
          user_id: data.user_id,
          version_number: 1,
          version_name: supplementData.stackName || 'Initial Supplement Stack',
          is_current: true,
          created_by: 'user',
          created_reason: 'Initial baseline upload',
          effective_from: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (stackVersionError || !createdStackVersion) {
        throw new Error(`Failed to create supplement stack version: ${stackVersionError?.message}`);
      }
      stackVersion = createdStackVersion;

      // Link document to stack version
      await supabase
        .from('supplement_baseline_documents')
        .update({ stack_version_id: createdStackVersion.id })
        .eq('id', document.id);

      // Create supplements in stack version
      const supplementInserts = supplementData.supplements.map((supplement, index) => ({
        stack_version_id: createdStackVersion.id,
        supplement_name: supplement.supplementName,
        dosage_amount: supplement.dosage,
        dosage_unit: supplement.dosageUnit,
        frequency: supplement.frequency,
        timing: supplement.timing,
        status: supplement.status,
        goal: supplement.notes,
        supplement_order: index + 1,
      }));

      const { data: createdSupplements, error: supplementsError } = await supabase
        .from('supplements')
        .insert(supplementInserts)
        .select();

      if (supplementsError) {
        throw new Error(`Failed to create supplements: ${supplementsError.message}`);
      }
      supplements = createdSupplements || [];

      // Create extracted sections (simulate extraction from manual data)
      const sections: SupplementExtractedSectionInsert[] = [
        {
          user_id: data.user_id,
          document_id: document.id,
          raw_text: JSON.stringify(supplementData),
          normalized_name: 'supplement_stack_data',
          extraction_confidence: 1.0,
        },
        {
          user_id: data.user_id,
          document_id: document.id,
          raw_text: supplementData.stackName,
          normalized_name: 'stack_name',
          extraction_confidence: 0.95,
        },
        {
          user_id: data.user_id,
          document_id: document.id,
          raw_text: supplementData.supplements.map(s => s.supplementName).join(', '),
          normalized_name: 'supplement_list',
          extraction_confidence: 0.90,
        },
      ];

      const { data: createdSections, error: sectionsError } = await supabase
        .from('supplement_extracted_sections')
        .insert(sections)
        .select();

      if (sectionsError) {
        throw new Error(`Failed to create extracted sections: ${sectionsError.message}`);
      }
      extractedSections = createdSections || [];

    } else {
      // Create placeholder stack version for non-manual uploads
      const { data: createdStackVersion, error: stackVersionError } = await supabase
        .from('supplement_stack_versions')
        .insert({
          user_id: data.user_id,
          version_number: 1,
          version_name: 'Supplement Stack',
          is_current: true,
          created_by: 'user',
          created_reason: 'Document upload pending processing',
          effective_from: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (stackVersionError || !createdStackVersion) {
        throw new Error(`Failed to create supplement stack version: ${stackVersionError?.message}`);
      }
      stackVersion = createdStackVersion;

      // Link document to stack version
      await supabase
        .from('supplement_baseline_documents')
        .update({ stack_version_id: createdStackVersion.id })
        .eq('id', document.id);
    }

    // 3. Update document parse status
    if (!manualSupplementData) {
      const { error: updateError } = await supabase
        .from('supplement_documents')
        .update({
          parse_status: 'completed',
          extraction_confidence: 0.6,
        })
        .eq('id', document.id);

      if (updateError) {
        console.error('Failed to update document parse status:', updateError);
      }
    }

    // 4. Log stack creation in changes table
    if (supplements.length > 0) {
      const changeInserts = supplements.map(supp => ({
        to_version_id: stackVersion.id,
        change_type: 'supplement_added',
        change_description: `Added ${supp.supplement_name} to initial stack`,
        supplement_name: supp.supplement_name,
        new_value: `${supp.dosage_amount} ${supp.dosage_unit} ${supp.frequency}`,
        reason: 'Initial baseline upload',
      }));

      await supabase
        .from('supplement_stack_changes')
        .insert(changeInserts);
    }

    return {
      document: document as SupplementDocument,
      stackVersion,
      supplements,
      extractedSections,
    };

  } catch (error) {
    console.error('Error creating supplement document:', error);
    throw error;
  }
}

// Get latest supplement document for user
export async function getLatestSupplementDocument(userId: string): Promise<SupplementDocument | null> {
  try {
    const { data, error } = await supabase
      .from('supplement_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(`Failed to get latest supplement document: ${error.message}`);
    }

    return data as SupplementDocument || null;
  } catch (error) {
    console.error('Error getting latest supplement document:', error);
    throw error;
  }
}

// Get current supplement stack for user
export async function getCurrentSupplementStack(userId: string): Promise<SupplementStackWithSupplements | null> {
  try {
    // Get the current stack version
    const { data: stackVersion, error: stackVersionError } = await supabase
      .from('supplement_stack_versions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_current', true)
      .single();

    if (stackVersionError && stackVersionError.code !== 'PGRST116') {
      throw new Error(`Failed to get supplement stack version: ${stackVersionError.message}`);
    }

    if (!stackVersion) {
      return null;
    }

    // Get supplements for this stack version
    const { data: supplements, error: supplementsError } = await supabase
      .from('supplements')
      .select('*')
      .eq('stack_version_id', stackVersion.id)
      .order('supplement_order');

    if (supplementsError) {
      throw new Error(`Failed to get supplements: ${supplementsError.message}`);
    }

    return {
      ...stackVersion,
      supplements: supplements || [],
    } as SupplementStackWithSupplements;

  } catch (error) {
    console.error('Error getting current supplement stack:', error);
    throw error;
  }
}

// Legacy function for backward compatibility - redirects to new system
export async function getSupplementBaseline(userId: string): Promise<SupplementBaselineWithItems | null> {
  const stack = await getCurrentSupplementStack(userId);
  if (!stack) return null;
  
  // Map new structure to old structure for backward compatibility
  return {
    id: stack.id,
    user_id: stack.user_id,
    stack_name: stack.version_name,
    created_at: stack.created_at,
    items: stack.supplements.map((s: any) => ({
      id: s.id,
      supplement_name: s.supplement_name,
      dosage: s.dosage_amount.toString(),
      dosage_unit: s.dosage_unit,
      frequency: s.frequency,
      timing_notes: s.timing,
      status: s.status,
    })),
  } as any;
}

// Log supplement changes using new system
export async function logSupplementChange(data: any): Promise<void> {
  try {
    // This function is deprecated - changes are now logged in supplement_stack_changes
    console.warn('logSupplementChange is deprecated. Use supplement_stack_changes table directly.');
  } catch (error) {
    console.error('Error logging supplement change:', error);
  }
}

// Get supplement change history using new system
export async function getSupplementChangeHistory(userId: string, stackVersionId?: string): Promise<SupplementStackChange[]> {
  try {
    // Get all stack versions for user
    const { data: versions, error: versionsError } = await supabase
      .from('supplement_stack_versions')
      .select('id')
      .eq('user_id', userId);

    if (versionsError) {
      throw new Error(`Failed to get stack versions: ${versionsError.message}`);
    }

    const versionIds = versions?.map(v => v.id) || [];

    let query = supabase
      .from('supplement_stack_changes')
      .select('*')
      .in('to_version_id', versionIds)
      .order('created_at', { ascending: false });

    if (stackVersionId) {
      query = query.eq('to_version_id', stackVersionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get supplement change history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting supplement change history:', error);
    throw error;
  }
}
