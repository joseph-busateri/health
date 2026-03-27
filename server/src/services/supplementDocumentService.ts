import { createClient } from '@supabase/supabase-js';
import { 
  SupplementDocument, 
  SupplementDocumentInsert,
  SupplementBaseline,
  SupplementBaselineInsert,
  SupplementItem,
  SupplementItemInsert,
  SupplementExtractedSection,
  SupplementExtractedSectionInsert,
  SupplementChangeLog,
  SupplementChangeLogInsert,
  ManualSupplementData,
  SupplementDocumentResult,
  SupplementBaselineWithItems
} from '../types/supplementDocument';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create supplement document with baseline and items
export async function createSupplementDocument(
  data: SupplementDocumentInsert & { manualSupplementData?: ManualSupplementData }
): Promise<SupplementDocumentResult> {
  try {
    // 1. Create supplement document
    const { data: document, error: documentError } = await supabase
      .from('supplement_documents')
      .insert({
        user_id: data.user_id,
        file_reference: data.file_reference,
        storage_path: data.storage_path,
        document_type: data.document_type,
        parse_status: 'processing',
        notes: data.notes,
      })
      .select()
      .single();

    if (documentError || !document) {
      throw new Error(`Failed to create supplement document: ${documentError?.message}`);
    }

    // 2. Create supplement baseline from manual data or placeholder
    let baseline: SupplementBaseline;
    let items: SupplementItem[] = [];
    let extractedSections: SupplementExtractedSection[] = [];

    if (data.manualSupplementData) {
      // Process manual supplement data
      const supplementData = data.manualSupplementData;
      
      // Create baseline
      const { data: createdBaseline, error: baselineError } = await supabase
        .from('supplement_baseline')
        .insert({
          user_id: data.user_id,
          document_id: document.id,
          stack_name: supplementData.stackName,
          stack_notes: supplementData.stackNotes,
          total_active_items: supplementData.supplements.filter(s => s.status === 'active').length,
          timing_notes: supplementData.timingNotes,
          frequency_notes: supplementData.frequencyNotes,
        })
        .select()
        .single();

      if (baselineError || !createdBaseline) {
        throw new Error(`Failed to create supplement baseline: ${baselineError?.message}`);
      }
      baseline = createdBaseline;

      // Create supplement items
      const itemInserts: SupplementItemInsert[] = supplementData.supplements.map(supplement => ({
        supplement_baseline_id: createdBaseline.id,
        supplement_name: supplement.supplementName,
        dosage: supplement.dosage.toString(),
        dosage_unit: supplement.dosageUnit,
        frequency: supplement.frequency,
        timing_notes: supplement.timing,
        notes: supplement.notes,
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from('supplement_items')
        .insert(itemInserts)
        .select();

      if (itemsError) {
        throw new Error(`Failed to create supplement items: ${itemsError.message}`);
      }
      items = createdItems || [];

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
      // Create placeholder baseline for non-manual uploads
      const { data: createdBaseline, error: baselineError } = await supabase
        .from('supplement_baseline')
        .insert({
          user_id: data.user_id,
          document_id: document.id,
          stack_name: 'Supplement Stack',
          total_active_items: 0,
        })
        .select()
        .single();

      if (baselineError || !createdBaseline) {
        throw new Error(`Failed to create supplement baseline: ${baselineError?.message}`);
      }
      baseline = createdBaseline;
    }

    // 3. Update document parse status
    const { error: updateError } = await supabase
      .from('supplement_documents')
      .update({
        parse_status: 'completed',
        extraction_confidence: data.manualSupplementData ? 0.95 : 0.5,
      })
      .eq('id', document.id);

    if (updateError) {
      console.error('Failed to update document parse status:', updateError);
    }

    // 4. Log change (for future refinement tracking)
    await logSupplementChange({
      user_id: data.user_id,
      supplement_baseline_id: baseline.id,
      field_name: 'baseline_created',
      new_value: 'Initial supplement baseline created',
      change_source: 'document_upload',
      rationale: 'Initial supplement document upload',
    });

    return {
      document: document as SupplementDocument,
      baseline,
      items,
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

// Get supplement baseline with items for user
export async function getSupplementBaseline(userId: string): Promise<SupplementBaselineWithItems | null> {
  try {
    // Get the latest baseline
    const { data: baseline, error: baselineError } = await supabase
      .from('supplement_baseline')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (baselineError && baselineError.code !== 'PGRST116') {
      throw new Error(`Failed to get supplement baseline: ${baselineError.message}`);
    }

    if (!baseline) {
      return null;
    }

    // Get items for this baseline
    const { data: items, error: itemsError } = await supabase
      .from('supplement_items')
      .select('*')
      .eq('supplement_baseline_id', baseline.id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      throw new Error(`Failed to get supplement items: ${itemsError.message}`);
    }

    return {
      ...baseline,
      items: items as SupplementItem[],
    } as SupplementBaselineWithItems;

  } catch (error) {
    console.error('Error getting supplement baseline:', error);
    throw error;
  }
}

// Log supplement changes (for future refinement)
export async function logSupplementChange(data: SupplementChangeLogInsert): Promise<void> {
  try {
    const { error } = await supabase
      .from('supplement_change_log')
      .insert({
        ...data,
        changed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log supplement change:', error);
    }
  } catch (error) {
    console.error('Error logging supplement change:', error);
  }
}

// Get supplement change history
export async function getSupplementChangeHistory(userId: string, baselineId?: string): Promise<SupplementChangeLog[]> {
  try {
    let query = supabase
      .from('supplement_change_log')
      .select('*')
      .eq('user_id', userId)
      .order('changed_at', { ascending: false });

    if (baselineId) {
      query = query.eq('supplement_baseline_id', baselineId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get supplement change history: ${error.message}`);
    }

    return data as SupplementChangeLog[];
  } catch (error) {
    console.error('Error getting supplement change history:', error);
    throw error;
  }
}
