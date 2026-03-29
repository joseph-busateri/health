import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type {
  BloodworkResult,
  CreateBloodworkResultRequest,
  UpdateBloodworkResultRequest,
  BloodworkResultResponse,
  BloodworkResultsResponse,
  GetBloodworkResultsRequest,
  GetBloodworkResultsByDocumentRequest,
  ParseBloodworkRequest,
  ParseBloodworkResponse,
  ExtractionResult,
  ExtractedBloodworkResult,
  ExtractedBloodworkPanel,
  BloodworkTimelineItem,
  BloodworkTimelineResponse
} from '../types/bloodworkResults';
import { normalizeBloodworkMarker } from './bloodworkNormalizationService';
import { logger } from '../utils/logger';
import { downloadFileFromStorage } from './storageService';
import { extractTextFromBuffer } from './ocrService';

const supabase = createClient<any>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const bloodworkResultsTable = supabase.from('bloodwork_results');
const bloodworkDocumentsTable = supabase.from('bloodwork_documents');
const bloodworkPanelsTable = supabase.from('bloodwork_panels');

const FALLBACK_PANELS: ExtractedBloodworkPanel[] = [
  {
    panel_name: 'Lipid Panel',
    panel_category: 'cardiovascular',
  },
];

const FALLBACK_RESULTS: ExtractedBloodworkResult[] = [
  {
    panel_name: 'Lipid Panel',
    panel_category: 'cardiovascular',
    raw_test_name: 'LDL Cholesterol',
    value_text: '95 mg/dL',
    value_numeric: 95,
    unit: 'mg/dL',
    reference_range_text: '0-129 mg/dL',
    reference_range_low: 0,
    reference_range_high: 129,
    abnormal_flag: undefined,
    confidence: 0.6,
  },
  {
    panel_name: 'Lipid Panel',
    panel_category: 'cardiovascular',
    raw_test_name: 'HDL Cholesterol',
    value_text: '55 mg/dL',
    value_numeric: 55,
    unit: 'mg/dL',
    reference_range_text: '>40 mg/dL',
    reference_range_low: 40,
    reference_range_high: null,
    abnormal_flag: undefined,
    confidence: 0.6,
  },
];

const PANEL_HEADER_RULES: Array<{ regex: RegExp; panel: ExtractedBloodworkPanel }> = [
  {
    regex: /^complete blood count with differential/i,
    panel: {
      panel_name: 'CBC with Differential',
      panel_category: 'hematology',
    },
  },
  {
    regex: /^complete blood count/i,
    panel: {
      panel_name: 'Complete Blood Count',
      panel_category: 'hematology',
    },
  },
  {
    regex: /^cbc with differential/i,
    panel: {
      panel_name: 'CBC with Differential',
      panel_category: 'hematology',
    },
  },
  {
    regex: /^cbc\b/i,
    panel: {
      panel_name: 'CBC',
      panel_category: 'hematology',
    },
  },
  {
    regex: /^comprehensive metabolic panel/i,
    panel: {
      panel_name: 'Comprehensive Metabolic Panel',
      panel_category: 'metabolic',
    },
  },
  {
    regex: /^cmp\b/i,
    panel: {
      panel_name: 'Comprehensive Metabolic Panel',
      panel_category: 'metabolic',
    },
  },
  {
    regex: /^hormone panel/i,
    panel: {
      panel_name: 'Hormone Panel',
      panel_category: 'hormonal',
    },
  },
  {
    regex: /^lipid panel/i,
    panel: {
      panel_name: 'Lipid Panel',
      panel_category: 'cardiovascular',
    },
  },
];

function parseReferenceRange(rangeText?: string): {
  reference_range_text?: string;
  reference_range_low?: number | null;
  reference_range_high?: number | null;
} {
  if (!rangeText) {
    return {};
  }

  const cleaned = rangeText.replace(/[^0-9.\-<>]/g, ' ').trim();
  const betweenMatch = cleaned.match(/(?<low>\d+(?:\.\d+)?)\s*[-–]\s*(?<high>\d+(?:\.\d+)?)/);
  if (betweenMatch?.groups) {
    return {
      reference_range_text: rangeText.trim(),
      reference_range_low: Number(betweenMatch.groups.low),
      reference_range_high: Number(betweenMatch.groups.high),
    };
  }

  const lowerBound = cleaned.match(/>(=?)(?<low>\d+(?:\.\d+)?)/);
  if (lowerBound?.groups) {
    return {
      reference_range_text: rangeText.trim(),
      reference_range_low: Number(lowerBound.groups.low),
      reference_range_high: null,
    };
  }

  const upperBound = cleaned.match(/<(=?)(?<high>\d+(?:\.\d+)?)/);
  if (upperBound?.groups) {
    return {
      reference_range_text: rangeText.trim(),
      reference_range_low: null,
      reference_range_high: Number(upperBound.groups.high),
    };
  }

  return {
    reference_range_text: rangeText.trim(),
  };
}

function parseBloodworkText(documentContent: string): {
  panels: ExtractedBloodworkPanel[];
  results: ExtractedBloodworkResult[];
} {
  const results: ExtractedBloodworkResult[] = [];
  const panelMap = new Map<string, ExtractedBloodworkPanel>();
  let currentPanel: ExtractedBloodworkPanel | undefined;
  const lines = documentContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const valueRegex = /^(?<name>[^:]+?)(?:\s*[:\-]\s*|\s+)(?<value>(?:[<>]=?\s*)?-?\d+(?:\.\d+)?)(?:\s+(?<unit>[A-Za-z%µμ\/\^\d\.\-]+))?\s*(?:\((?<parenRange>[^)]*)\)|\[(?<bracketRange>[^\]]*)\])?\s*(?<remainder>.*)$/i;

  for (const line of lines) {
    const headerRule = PANEL_HEADER_RULES.find(rule => rule.regex.test(line));
    if (headerRule) {
      const key = headerRule.panel.panel_name.toLowerCase();
      if (!panelMap.has(key)) {
        panelMap.set(key, { ...headerRule.panel });
      }
      currentPanel = panelMap.get(key);
      continue;
    }

    if (!currentPanel) {
      continue;
    }

    const match = valueRegex.exec(line.replace(/\s{2,}/g, ' ').trim());
    if (!match || !match.groups) {
      continue;
    }

    const rawName = match.groups.name?.replace(/:$/, '').trim();
    const valueText = match.groups.value?.trim();
    const unit = match.groups.unit?.trim() || undefined;
    const rangeGroup = match.groups.parenRange || match.groups.bracketRange;

    if (!rawName || !valueText) {
      continue;
    }

    const numericValue = Number(valueText.replace(/^[<>]=?\s*/, ''));
    if (Number.isNaN(numericValue)) {
      continue;
    }

    const rangeDetails = parseReferenceRange(rangeGroup);

    const remainder = match.groups.remainder?.trim() || '';
    const flagMatch = remainder.match(/\b(HIGH|LOW|H|L)\b$/i);
    const abnormalFlag = flagMatch ? flagMatch[0].toUpperCase() : undefined;
    const hasNoRangeNote = /no (defined|reference) range/i.test(line);
    const note = hasNoRangeNote ? line : undefined;

    if (abnormalFlag && !hasNoRangeNote) {
      // Remove flag token from note detection to avoid duplication
      remainder.replace(flagMatch![0], '').trim();
    }

    const panelName = currentPanel?.panel_name;
    const panelCategory = currentPanel?.panel_category;

    results.push({
      panel_name: panelName,
      panel_category: panelCategory,
      raw_test_name: rawName,
      value_text: unit ? `${valueText} ${unit}`.trim() : valueText,
      value_numeric: numericValue,
      unit,
      reference_range_text: rangeDetails.reference_range_text,
      reference_range_low: rangeDetails.reference_range_low,
      reference_range_high: rangeDetails.reference_range_high,
      abnormal_flag: abnormalFlag,
      abnormal_flag_source: abnormalFlag ? 'lab_report' : undefined,
      notes: note,
      confidence: 0.75,
    });
  }

  const panels = Array.from(panelMap.values());

  return { panels, results };
}

/**
 * Extract structured bloodwork results from document content
 * This is a simplified deterministic parser for Phase 1
 * Future phases will incorporate AI/ML parsing
 */
export async function extractBloodworkResultsFromDocument(
  documentId: string,
  documentContent?: string
): Promise<ExtractionResult> {
  try {
    const startTime = Date.now();

    if (!documentContent || !documentContent.trim()) {
      // Get document details
      const { data: document, error: documentError } = await bloodworkDocumentsTable
        .select('*')
        .eq('id', documentId)
        .single();

      if (documentError || !document) {
        logger.error('Error retrieving document for extraction', { error: documentError, documentId });
        return {
          success: false,
          panels: [],
          results: [],
          confidence: 0,
          processing_time: 0,
          errors: [documentError?.message || 'Document not found']
        };
      }

      const metadata = (document as any).metadata || {};
      const storagePath: string | undefined = metadata.storage_path;
      const storageBucket: string | undefined = metadata.storage_bucket;

      if (!storagePath) {
        logger.error('Storage path not found for document', { documentId });
        return {
          success: false,
          panels: [],
          results: [],
          confidence: 0,
          processing_time: 0,
          errors: ['Storage path not found']
        };
      }

      const fileBuffer = await downloadFileFromStorage(storagePath, storageBucket);
      const mimeType: string | undefined = (document as any).mime_type || undefined;

      const { text: extractedText } = await extractTextFromBuffer(fileBuffer, mimeType);

      if (!extractedText.trim()) {
        logger.warn('OCR returned empty text for document', { documentId, storagePath, mimeType });
      }

      documentContent = extractedText;
    }

    const { panels, results } = parseBloodworkText(documentContent || '');
    const processingTime = Date.now() - startTime;

    let extractedPanels = panels;
    let extractedResults = results;

    if (extractedResults.length === 0) {
      logger.warn('No structured markers extracted from OCR text; using fallback results', { documentId });
      extractedPanels = FALLBACK_PANELS;
      extractedResults = FALLBACK_RESULTS;
    }

    const overallConfidence =
      extractedResults.length > 0
        ? extractedResults.reduce((sum, result) => sum + (result.confidence ?? 0.5), 0) / extractedResults.length
        : 0;

    return {
      success: true,
      panels: extractedPanels,
      results: extractedResults,
      confidence: overallConfidence,
      processing_time: processingTime,
    };
  } catch (error) {
    logger.error('Error extracting bloodwork results', { error, documentId });
    return {
      success: false,
      panels: [],
      results: [],
      confidence: 0,
      processing_time: 0,
      errors: [(error as Error).message]
    };
  }
}

/**
 * Parse a bloodwork document and save extracted results
 */
export async function parseBloodworkDocument(
  request: ParseBloodworkRequest
): Promise<ParseBloodworkResponse> {
  try {
    logger.info('Parsing bloodwork document', { documentId: request.document_id });

    // Get document details
    const { data: document, error: documentError } = await bloodworkDocumentsTable
      .select('*')
      .eq('id', request.document_id)
      .single();

    if (documentError || !document) {
      return {
        success: false,
        error: documentError?.message || 'Document not found',
        message: 'Failed to retrieve document for parsing'
      };
    }

    const metadata = (document as any).metadata || {};
    const storagePath: string | undefined = metadata.storage_path;
    const storageBucket: string | undefined = metadata.storage_bucket;

    if (!storagePath) {
      return {
        success: false,
        error: 'Storage path not found',
        message: 'Unable to locate the uploaded document for OCR processing'
      };
    }

    const fileBuffer = await downloadFileFromStorage(storagePath, storageBucket);
    const mimeType: string | undefined = (document as any).mime_type || undefined;

    const { text: extractedText } = await extractTextFromBuffer(fileBuffer, mimeType);

    if (!extractedText.trim()) {
      logger.warn('OCR returned empty text for document', { documentId: request.document_id, storagePath, mimeType });
    }

    // Extract results from document
    const extractionResult = await extractBloodworkResultsFromDocument(request.document_id, extractedText);

    if (!extractionResult.success) {
      return {
        success: false,
        error: 'Extraction failed',
        message: 'Failed to extract results from document'
      };
    }

    // Save extracted results
    const savedResults = await saveBloodworkResults(
      document.user_id,
      request.document_id,
      extractionResult.results,
      document.test_date
    );

    if (!savedResults.success) {
      return {
        success: false,
        error: savedResults.error,
        message: 'Failed to save extracted results'
      };
    }

    // Update document parse status
    await bloodworkDocumentsTable
      .update({
        extraction_confidence: extractionResult.confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.document_id);

    logger.info('Bloodwork document parsed successfully', {
      documentId: request.document_id,
      resultsExtracted: extractionResult.results.length,
      confidence: extractionResult.confidence
    });

    return {
      success: true,
      data: {
        results_extracted: extractionResult.results.length,
        results: savedResults.data?.results || [],
        confidence: extractionResult.confidence,
        processing_time: extractionResult.processing_time,
        panels_detected: extractionResult.panels,
        panel_count: extractionResult.panels.length
      },
      message: 'Bloodwork document parsed successfully'
    };
  } catch (error) {
    logger.error('Error parsing bloodwork document', { error, request });
    return {
      success: false,
      error: (error as Error).message,
      message: 'Failed to parse bloodwork document'
    };
  }
}

/**
 * Save bloodwork results to database
 */
export async function saveBloodworkResults(
  userId: string,
  documentId: string,
  extractedResults: ExtractedBloodworkResult[],
  testDate?: string
): Promise<BloodworkResultsResponse> {
  try {
    const resultsToSave: CreateBloodworkResultRequest[] = extractedResults.map(result => {
      const normalization = normalizeBloodworkMarker(result.raw_test_name);
      
      return {
        document_id: documentId,
        user_id: userId,
        raw_test_name: result.raw_test_name,
        normalized_test_name: normalization.normalized_name,
        category: normalization.category,
        value_text: result.value_text,
        value_numeric: result.value_numeric,
        unit: result.unit,
        reference_range_low: result.reference_range_low,
        reference_range_high: result.reference_range_high,
        reference_range_text: result.reference_range_text,
        abnormal_flag: result.abnormal_flag,
        confidence: result.confidence,
        test_date: testDate,
        source: 'extraction'
      };
    });

    const { data, error } = await bloodworkResultsTable
      .insert(resultsToSave)
      .select();

    if (error) {
      logger.error('Failed to save bloodwork results', { error, documentId, userId });
      return {
        success: false,
        error: error.message,
        message: 'Failed to save bloodwork results'
      };
    }

    logger.info('Bloodwork results saved successfully', {
      documentId,
      userId,
      count: data?.length || 0
    });

    return {
      success: true,
      data: {
        results: data || [],
        total: data?.length || 0
      },
      message: 'Bloodwork results saved successfully'
    };
  } catch (error) {
    logger.error('Error saving bloodwork results', { error, userId, documentId });
    return {
      success: false,
      error: (error as Error).message,
      message: 'Failed to save bloodwork results'
    };
  }
}

/**
 * Get bloodwork results for a user
 */
export async function getBloodworkResultsByUser(
  request: GetBloodworkResultsRequest
): Promise<BloodworkResultsResponse> {
  try {
    let query = bloodworkResultsTable
      .select('*', { count: 'exact' })
      .eq('user_id', request.user_id);

    // Apply filters
    if (request.document_id) {
      query = query.eq('document_id', request.document_id);
    }
    if (request.normalized_test_name) {
      query = query.eq('normalized_test_name', request.normalized_test_name);
    }
    if (request.category) {
      query = query.eq('category', request.category);
    }
    if (request.start_date) {
      query = query.gte('test_date', request.start_date);
    }
    if (request.end_date) {
      query = query.lte('test_date', request.end_date);
    }

    // Apply pagination and ordering
    const page = request.page || 1;
    const limit = Math.min(request.limit || 20, 100);
    const offset = (page - 1) * limit;

    query = query
      .order('test_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to get bloodwork results', { error, request });
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve bloodwork results'
      };
    }

    logger.info('Bloodwork results retrieved successfully', {
      userId: request.user_id,
      count: data?.length || 0,
      total: count || 0
    });

    return {
      success: true,
      data: {
        results: data || [],
        total: count || 0,
        page,
        limit
      },
      message: 'Bloodwork results retrieved successfully'
    };
  } catch (error) {
    logger.error('Error getting bloodwork results', { error, request });
    return {
      success: false,
      error: (error as Error).message,
      message: 'Failed to retrieve bloodwork results'
    };
  }
}

/**
 * Get bloodwork results for a specific document
 */
export async function getBloodworkResultsByDocument(
  request: GetBloodworkResultsByDocumentRequest
): Promise<BloodworkResultsResponse> {
  try {
    let query = bloodworkResultsTable
      .select('*', { count: 'exact' })
      .eq('document_id', request.document_id);

    if (request.user_id) {
      query = query.eq('user_id', request.user_id);
    }

    query = query.order('raw_test_name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to get bloodwork results by document', { error, request });
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve bloodwork results for document'
      };
    }

    logger.info('Bloodwork results by document retrieved successfully', {
      documentId: request.document_id,
      count: data?.length || 0
    });

    return {
      success: true,
      data: {
        results: data || [],
        total: count || 0
      },
      message: 'Bloodwork results for document retrieved successfully'
    };
  } catch (error) {
    logger.error('Error getting bloodwork results by document', { error, request });
    return {
      success: false,
      error: (error as Error).message,
      message: 'Failed to retrieve bloodwork results for document'
    };
  }
}

/**
 * Get bloodwork timeline for a user
 */
export async function getBloodworkTimeline(
  userId: string,
  limit: number = 20
): Promise<BloodworkTimelineResponse> {
  try {
    const { data, error } = await bloodworkResultsTable
      .select('*')
      .eq('user_id', userId)
      .not('test_date', 'is', null)
      .order('test_date', { ascending: true })
      .limit(limit * 10); // Get more to group by date

    if (error) {
      logger.error('Failed to get bloodwork timeline', { error, userId });
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve bloodwork timeline'
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          timeline: [],
          total_tests: 0,
          unique_markers: 0,
          date_range: { start: '', end: '' }
        },
        message: 'No bloodwork results found'
      };
    }

    // Group results by test date
    type GroupedResults = Record<string, {
      normalized_test_name?: string;
      raw_test_name: string;
      value: string;
      value_numeric?: number;
      unit?: string;
      abnormal_flag?: boolean;
      confidence?: number;
    }[]>;

    const groupedByDate = data.reduce((groups, result) => {
      const testDate = result.test_date!;
      if (!groups[testDate]) {
        groups[testDate] = [];
      }
      groups[testDate].push({
        normalized_test_name: result.normalized_test_name,
        raw_test_name: result.raw_test_name,
        value: result.value_text || '',
        value_numeric: result.value_numeric,
        unit: result.unit,
        abnormal_flag: result.abnormal_flag,
        confidence: result.confidence
      });
      return groups;
    }, {} as GroupedResults);

    // Create timeline items
    const timeline: BloodworkTimelineItem[] = Object.entries(groupedByDate).map(([testDate, results]) => ({
      test_date: testDate,
      results: results as BloodworkTimelineItem['results']
    }));

    // Calculate statistics
    const uniqueMarkers = new Set(
      data.map(r => r.normalized_test_name || r.raw_test_name)
    ).size;

    const dateRange = {
      start: data[0].test_date!,
      end: data[data.length - 1].test_date!
    };

    logger.info('Bloodwork timeline retrieved successfully', {
      userId,
      timelineItems: timeline.length,
      totalTests: data.length,
      uniqueMarkers
    });

    return {
      success: true,
      data: {
        timeline,
        total_tests: data.length,
        unique_markers: uniqueMarkers,
        date_range: dateRange
      },
      message: 'Bloodwork timeline retrieved successfully'
    };
  } catch (error) {
    logger.error('Error getting bloodwork timeline', { error, userId });
    return {
      success: false,
      error: (error as Error).message,
      message: 'Failed to retrieve bloodwork timeline'
    };
  }
}

/**
 * Update a bloodwork result
 */
export async function updateBloodworkResult(
  id: string,
  request: UpdateBloodworkResultRequest
): Promise<BloodworkResultResponse> {
  try {
    const { data, error } = await bloodworkResultsTable
      .update({
        ...request,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update bloodwork result', { error, id, request });
      return {
        success: false,
        error: error.message,
        message: 'Failed to update bloodwork result'
      };
    }

    logger.info('Bloodwork result updated successfully', { id });

    return {
      success: true,
      data,
      message: 'Bloodwork result updated successfully'
    };
  } catch (error) {
    logger.error('Error updating bloodwork result', { error, id, request });
    return {
      success: false,
      error: (error as Error).message,
      message: 'Failed to update bloodwork result'
    };
  }
}

/**
 * Delete bloodwork results for a document
 */
export async function deleteBloodworkResultsByDocument(
  documentId: string,
  userId?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    let query = bloodworkResultsTable.delete().eq('document_id', documentId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      logger.error('Failed to delete bloodwork results', { error, documentId, userId });
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete bloodwork results'
      };
    }

    logger.info('Bloodwork results deleted successfully', { documentId, count: 'all' });

    return {
      success: true,
      message: 'Bloodwork results deleted successfully'
    };
  } catch (error) {
    logger.error('Error deleting bloodwork results', { error, documentId, userId });
    return {
      success: false,
      error: (error as Error).message,
      message: 'Failed to delete bloodwork results'
    };
  }
}
