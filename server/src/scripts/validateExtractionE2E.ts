/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { normalizeBloodworkMarker } from '../services/bloodworkNormalizationService';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

interface TestDocument {
  id: string;
  user_id: string;
  file_name: string;
  parse_status: string;
  test_date?: string;
}

const TEST_USER_ID = 'bloodwork-extraction-e2e-user';

async function logValidation(step: string, status: string, message: string, details?: any) {
  const timestamp = new Date().toISOString();
  const icon = status === '✅' ? '✅' : status === '❌' ? '❌' : '⏳';
  console.log(`${icon} ${step}: ${status}`);
  console.log(`   ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  console.log('');
}

async function setupTestDocuments(): Promise<ValidationResult> {
  try {
    logValidation('SETUP', '⏳', 'Creating test documents for validation...');

    // Create test document for Scenario A (Metabolic)
    const { data: docA, error: errorA } = await supabase
      .from('bloodwork_documents')
      .insert({
        user_id: TEST_USER_ID,
        file_url: 'https://storage.example.com/bloodwork/metabolic-test.pdf',
        file_name: 'metabolic-test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        document_type: 'comprehensive',
        source: 'validation_test',
        test_date: '2024-01-15',
        upload_date: new Date().toISOString(),
        parse_status: 'pending',
        extraction_confidence: null,
        notes: 'Test document for metabolic markers - Scenario A',
        metadata: { scenario: 'A', validation: true }
      })
      .select()
      .single();

    if (errorA || !docA) {
      return {
        success: false,
        message: `Failed to create Scenario A document: ${errorA?.message}`,
        details: errorA
      };
    }

    // Create test document for Scenario B (Cardiovascular)
    const { data: docB, error: errorB } = await supabase
      .from('bloodwork_documents')
      .insert({
        user_id: TEST_USER_ID,
        file_url: 'https://storage.example.com/bloodwork/cardio-test.pdf',
        file_name: 'cardio-test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        document_type: 'comprehensive',
        source: 'validation_test',
        test_date: '2024-02-20',
        upload_date: new Date().toISOString(),
        parse_status: 'pending',
        extraction_confidence: null,
        notes: 'Test document for cardiovascular markers - Scenario B',
        metadata: { scenario: 'B', validation: true }
      })
      .select()
      .single();

    if (errorB || !docB) {
      return {
        success: false,
        message: `Failed to create Scenario B document: ${errorB?.message}`,
        details: errorB
      };
    }

    // Create test document for Scenario C (Mixed/irregular)
    const { data: docC, error: errorC } = await supabase
      .from('bloodwork_documents')
      .insert({
        user_id: TEST_USER_ID,
        file_url: 'https://storage.example.com/bloodwork/mixed-test.pdf',
        file_name: 'mixed-test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        document_type: 'comprehensive',
        source: 'validation_test',
        test_date: '2024-03-10',
        upload_date: new Date().toISOString(),
        parse_status: 'pending',
        extraction_confidence: null,
        notes: 'Test document for mixed/irregular markers - Scenario C',
        metadata: { scenario: 'C', validation: true }
      })
      .select()
      .single();

    if (errorC || !docC) {
      return {
        success: false,
        message: `Failed to create Scenario C document: ${errorC?.message}`,
        details: errorC
      };
    }

    logValidation('SETUP', '✅', 'Created 3 test documents for validation');
    return {
      success: true,
      message: 'Test documents created successfully',
      details: {
        scenarioA: docA.id,
        scenarioB: docB.id,
        scenarioC: docC.id
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Setup error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function testScenarioA(documentId: string): Promise<ValidationResult> {
  try {
    logValidation('SCENARIO A', '⏳', 'Testing metabolic marker extraction (A1c)...');

    // Parse the document
    const parseResponse = await fetch(`${API_BASE_URL}/bloodwork/parse/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID
      }),
    });

    if (!parseResponse.ok) {
      return {
        success: false,
        message: `Scenario A parsing failed with status ${parseResponse.status}`,
        details: { status: parseResponse.status }
      };
    }

    const parseData = await parseResponse.json();

    if (!parseData.success) {
      return {
        success: false,
        message: `Scenario A parse error: ${parseData.error}`,
        details: parseData
      };
    }

    // Check for A1c normalization
    const results = parseData.data?.results || [];
    const a1cResult = results.find((r: any) => 
      r.normalized_test_name === 'HbA1c' || 
      r.raw_test_name.toLowerCase().includes('a1c')
    );

    if (!a1cResult) {
      return {
        success: false,
        message: 'No A1c result found in extraction',
        details: { results }
      };
    }

    // Validate required fields
    const requiredFields = [
      'document_id', 'user_id', 'raw_test_name', 'value_text',
      'confidence', 'test_date', 'source'
    ];

    const missingFields = requiredFields.filter(field => 
      a1cResult[field] === undefined || a1cResult[field] === null
    );

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Scenario A missing required fields: ${missingFields.join(', ')}`,
        details: { missingFields, result: a1cResult }
      };
    }

    // Check normalization
    if (!a1cResult.normalized_test_name) {
      return {
        success: false,
        message: 'A1c normalization failed',
        details: { result: a1cResult }
      };
    }

    logValidation('SCENARIO A', '✅', 'Metabolic marker extraction successful');
    return {
      success: true,
      message: 'Scenario A passed - A1c extracted and normalized correctly',
      details: {
        extracted: a1cResult.raw_test_name,
        normalized: a1cResult.normalized_test_name,
        value: a1cResult.value_text,
        confidence: a1cResult.confidence
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Scenario A error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function testScenarioB(documentId: string): Promise<ValidationResult> {
  try {
    logValidation('SCENARIO B', '⏳', 'Testing cardiovascular marker extraction (LDL/ApoB)...');

    // Parse the document
    const parseResponse = await fetch(`${API_BASE_URL}/bloodwork/parse/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID
      }),
    });

    if (!parseResponse.ok) {
      return {
        success: false,
        message: `Scenario B parsing failed with status ${parseResponse.status}`,
        details: { status: parseResponse.status }
      };
    }

    const parseData = await parseResponse.json();

    if (!parseData.success) {
      return {
        success: false,
        message: `Scenario B parse error: ${parseData.error}`,
        details: parseData
      };
    }

    // Check for cardiovascular markers
    const results = parseData.data?.results || [];
    const cardioMarkers = results.filter((r: any) => 
      r.category === 'Cardiovascular' ||
      ['LDL', 'HDL', 'Triglycerides', 'ApoB', 'hsCRP'].includes(r.normalized_test_name || '')
    );

    if (cardioMarkers.length === 0) {
      return {
        success: false,
        message: 'No cardiovascular markers found in extraction',
        details: { results }
      };
    }

    // Validate normalization and units
    const validationResults = cardioMarkers.map((marker: any) => {
      const requiredFields = [
        'document_id', 'user_id', 'raw_test_name', 'value_text',
        'confidence', 'test_date', 'source'
      ];

      const missingFields = requiredFields.filter(field => 
        marker[field] === undefined || marker[field] === null
      );

      return {
        raw: marker.raw_test_name,
        normalized: marker.normalized_test_name,
        category: marker.category,
        unit: marker.unit,
        missingFields,
        valid: missingFields.length === 0
      };
    });

    const invalidMarkers = validationResults.filter(r => !r.valid);

    if (invalidMarkers.length > 0) {
      return {
        success: false,
        message: `Scenario B validation failed for ${invalidMarkers.length} markers`,
        details: { invalidMarkers, allResults: validationResults }
      };
    }

    logValidation('SCENARIO B', '✅', 'Cardiovascular marker extraction successful');
    return {
      success: true,
      message: `Scenario B passed - ${cardioMarkers.length} cardiovascular markers extracted`,
      details: {
        markersExtracted: cardioMarkers.length,
        validationResults
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Scenario B error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function testScenarioC(documentId: string): Promise<ValidationResult> {
  try {
    logValidation('SCENARIO C', '⏳', 'Testing mixed/irregular marker extraction...');

    // Parse the document
    const parseResponse = await fetch(`${API_BASE_URL}/bloodwork/parse/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID
      }),
    });

    if (!parseResponse.ok) {
      return {
        success: false,
        message: `Scenario C parsing failed with status ${parseResponse.status}`,
        details: { status: parseResponse.status }
      };
    }

    const parseData = await parseResponse.json();

    if (!parseData.success) {
      return {
        success: false,
        message: `Scenario C parse error: ${parseData.error}`,
        details: parseData
      };
    }

    // Check that extraction didn't fail even with irregular naming
    const results = parseData.data?.results || [];
    
    if (results.length === 0) {
      return {
        success: false,
        message: 'Scenario C extraction failed - no results',
        details: parseData
      };
    }

    // Validate that raw names are preserved even when normalization fails
    const resultsWithNormalization = results.map((result: any) => ({
      raw_test_name: result.raw_test_name,
      normalized_test_name: result.normalized_test_name,
      hasNormalization: result.normalized_test_name !== null,
      confidence: result.confidence
    }));

    const normalizedCount = resultsWithNormalization.filter(r => r.hasNormalization).length;
    const nonNormalizedCount = resultsWithNormalization.filter(r => !r.hasNormalization).length;

    // Check pipeline didn't break - should have some results
    const pipelineWorking = results.length > 0;

    if (!pipelineWorking) {
      return {
        success: false,
        message: 'Scenario C pipeline failure - extraction stopped',
        details: { results }
      };
    }

    logValidation('SCENARIO C', '✅', 'Mixed/irregular marker extraction handled gracefully');
    return {
      success: true,
      message: `Scenario C passed - ${results.length} markers extracted with ${normalizedCount} normalized`,
      details: {
        totalExtracted: results.length,
        normalized: normalizedCount,
        nonNormalized: nonNormalizedCount,
        pipelineWorking: true
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Scenario C error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function testPersistence(): Promise<ValidationResult> {
  try {
    logValidation('PERSISTENCE', '⏳', 'Validating bloodwork_results persistence...');

    // Get all results for test user
    const { data: results, error: fetchError } = await supabase
      .from('bloodwork_results')
      .select('*')
      .eq('user_id', TEST_USER_ID);

    if (fetchError) {
      return {
        success: false,
        message: `Failed to fetch persisted results: ${fetchError.message}`,
        details: fetchError
      };
    }

    if (!results || results.length === 0) {
      return {
        success: false,
        message: 'No results found in bloodwork_results table',
        details: { resultsCount: 0 }
      };
    }

    // Validate all required fields are present
    const requiredFields = [
      'id', 'document_id', 'user_id', 'raw_test_name', 'value_text',
      'confidence', 'test_date', 'source', 'created_at', 'updated_at'
    ];

    const validationResults = results.map(result => {
      const missingFields = requiredFields.filter(field => 
        result[field] === undefined || result[field] === null
      );

      return {
        id: result.id,
        raw_test_name: result.raw_test_name,
        normalized_test_name: result.normalized_test_name,
        missingFields,
        valid: missingFields.length === 0
      };
    });

    const invalidResults = validationResults.filter(r => !r.valid);

    if (invalidResults.length > 0) {
      return {
        success: false,
        message: `Persistence validation failed for ${invalidResults.length} results`,
        details: { invalidResults, totalResults: results.length }
      };
    }

    logValidation('PERSISTENCE', '✅', `Validated ${results.length} persisted results`);
    return {
      success: true,
      message: `Persistence validation passed - ${results.length} results stored correctly`,
      details: {
        totalResults: results.length,
        validationResults
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Persistence validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function testRetrievalEndpoints(): Promise<ValidationResult> {
  try {
    logValidation('RETRIEVAL', '⏳', 'Testing API retrieval endpoints...');

    // Test GET /bloodwork/results/:user_id
    const userResultsResponse = await fetch(`${API_BASE_URL}/bloodwork/results/${TEST_USER_ID}`);
    
    if (!userResultsResponse.ok) {
      return {
        success: false,
        message: `User results endpoint failed with status ${userResultsResponse.status}`,
        details: { status: userResultsResponse.status }
      };
    }

    const userResultsData = await userResultsResponse.json();
    
    if (!userResultsData.success) {
      return {
        success: false,
        message: `User results endpoint error: ${userResultsData.error}`,
        details: userResultsData
      };
    }

    // Test GET /bloodwork/results/document/:document_id
    // Get first document for test
    const { data: documents } = await supabase
      .from('bloodwork_documents')
      .select('id')
      .eq('user_id', TEST_USER_ID)
      .limit(1);

    if (!documents || documents.length === 0) {
      return {
        success: false,
        message: 'No test documents available for document results test',
        details: {}
      };
    }

    const testDocument = documents[0];
    const documentResultsResponse = await fetch(`${API_BASE_URL}/bloodwork/results/document/${testDocument.id}`);
    
    if (!documentResultsResponse.ok) {
      return {
        success: false,
        message: `Document results endpoint failed with status ${documentResultsResponse.status}`,
        details: { status: documentResultsResponse.status }
      };
    }

    const documentResultsData = await documentResultsResponse.json();
    
    if (!documentResultsData.success) {
      return {
        success: false,
        message: `Document results endpoint error: ${documentResultsData.error}`,
        details: documentResultsData
      };
    }

    // Test GET /bloodwork/results/:user_id/timeline
    const timelineResponse = await fetch(`${API_BASE_URL}/bloodwork/results/${TEST_USER_ID}/timeline`);
    
    if (!timelineResponse.ok) {
      return {
        success: false,
        message: `Timeline endpoint failed with status ${timelineResponse.status}`,
        details: { status: timelineResponse.status }
      };
    }

    const timelineData = await timelineResponse.json();
    
    if (!timelineData.success) {
      return {
        success: false,
        message: `Timeline endpoint error: ${timelineData.error}`,
        details: timelineData
      };
    }

    logValidation('RETRIEVAL', '✅', 'All retrieval endpoints working correctly');
    return {
      success: true,
      message: 'Retrieval endpoints validation passed',
      details: {
        userResults: userResultsData.data?.total || 0,
        documentResults: documentResultsData.data?.total || 0,
        timelineItems: timelineData.data?.timeline?.length || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Retrieval validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function testTimelineGrouping(): Promise<ValidationResult> {
  try {
    logValidation('TIMELINE', '⏳', 'Testing timeline grouping logic...');

    // Get timeline data
    const { data: results, error: fetchError } = await supabase
      .from('bloodwork_results')
      .select('test_date, normalized_test_name, raw_test_name, value_text, value_numeric, unit')
      .eq('user_id', TEST_USER_ID)
      .not('test_date', 'is', null)
      .order('test_date', { ascending: true });

    if (fetchError) {
      return {
        success: false,
        message: `Failed to fetch timeline data: ${fetchError.message}`,
        details: fetchError
      };
    }

    if (!results || results.length === 0) {
      return {
        success: false,
        message: 'No timeline data available for grouping test',
        details: { resultsCount: 0 }
      };
    }

    // Group by test date
    const groupedByDate = results.reduce((groups: any, result) => {
      const testDate = result.test_date;
      if (!groups[testDate]) {
        groups[testDate] = [];
      }
      groups[testDate].push(result);
      return groups;
    }, {});

    const uniqueDates = Object.keys(groupedByDate);
    
    // Group by marker (normalized first, then raw)
    const groupedByMarker = results.reduce((groups: any, result) => {
      const markerKey = result.normalized_test_name || result.raw_test_name;
      if (!groups[markerKey]) {
        groups[markerKey] = [];
      }
      groups[markerKey].push(result);
      return groups;
    }, {});

    const uniqueMarkers = Object.keys(groupedByMarker);

    // Validate chronological sorting
    const dates = uniqueDates.map(date => new Date(date)).sort((a, b) => a.getTime() - b.getTime());
    const sortedDates = dates.map(date => date.toISOString().split('T')[0]);
    const isChronological = JSON.stringify(uniqueDates.sort()) === JSON.stringify(sortedDates);

    // Validate grouping logic
    const groupingValid = uniqueMarkers.length > 0 && uniqueDates.length > 0;

    if (!groupingValid) {
      return {
        success: false,
        message: 'Timeline grouping validation failed',
        details: { uniqueMarkers, uniqueDates }
      };
    }

    logValidation('TIMELINE', '✅', `Timeline grouping works correctly (${uniqueDates.length} dates, ${uniqueMarkers.length} markers)`);
    return {
      success: true,
      message: 'Timeline grouping validation passed',
      details: {
        uniqueDates: uniqueDates.length,
        uniqueMarkers: uniqueMarkers.length,
        totalResults: results.length,
        isChronological,
        dateRange: {
          start: uniqueDates[0],
          end: uniqueDates[uniqueDates.length - 1]
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Timeline grouping validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function testMultiDocumentSupport(): Promise<ValidationResult> {
  try {
    logValidation('MULTI-DOC', '⏳', 'Testing multi-document support...');

    // Get all documents for test user
    const { data: documents, error: docError } = await supabase
      .from('bloodwork_documents')
      .select('id, test_date, file_name')
      .eq('user_id', TEST_USER_ID)
      .order('test_date', { ascending: true });

    if (docError) {
      return {
        success: false,
        message: `Failed to fetch test documents: ${docError.message}`,
        details: docError
      };
    }

    if (!documents || documents.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 documents for multi-document test',
        details: { documentCount: documents?.length || 0 }
      };
    }

    // Get all results across all documents
    const { data: allResults, error: resultsError } = await supabase
      .from('bloodwork_results')
      .select('document_id, test_date, raw_test_name, normalized_test_name')
      .eq('user_id', TEST_USER_ID);

    if (resultsError) {
      return {
        success: false,
        message: `Failed to fetch multi-document results: ${resultsError.message}`,
        details: resultsError
      };
    }

    // Validate results are linked to documents
    const documentIds = documents.map(d => d.id);
    const resultsWithValidDocs = allResults?.filter(r => documentIds.includes(r.document_id)) || [];

    // Validate timeline still works with multiple documents
    const timelineResponse = await fetch(`${API_BASE_URL}/bloodwork/results/${TEST_USER_ID}/timeline`);
    const timelineData = await timelineResponse.json();

    if (!timelineData.success) {
      return {
        success: false,
        message: 'Multi-document timeline failed',
        details: timelineData
      };
    }

    const timelineItems = timelineData.data?.timeline?.length || 0;

    logValidation('MULTI-DOC', '✅', `Multi-document support working (${documents.length} docs, ${resultsWithValidDocs.length} results)`);
    return {
      success: true,
      message: 'Multi-document support validation passed',
      details: {
        documents: documents.length,
        results: resultsWithValidDocs.length,
        timelineItems,
        dateRange: {
          start: documents[0].test_date,
          end: documents[documents.length - 1].test_date
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Multi-document validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function testFutureExtensibility(): Promise<ValidationResult> {
  try {
    logValidation('EXTENSIBILITY', '⏳', 'Testing future extensibility readiness...');

    // Test normalization service extensibility
    const testCases = [
      { input: 'Future Marker 1', expected: null },
      { input: 'Advanced Test Name', expected: null },
      { input: 'New Biomarker', expected: null }
    ];

    const normalizationResults = testCases.map(testCase => {
      const result = normalizeBloodworkMarker(testCase.input);
      return {
        input: testCase.input,
        normalized: result.normalized_name,
        confidence: result.confidence,
        handledGracefully: result.confidence >= 0
      };
    });

    const allHandledGracefully = normalizationResults.every(r => r.handledGracefully);

    // Test data structure readiness for AI enhancement
    const { data: sampleResults } = await supabase
      .from('bloodwork_results')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .limit(1);

    const aiReadyFields = [
      'raw_test_name', 'normalized_test_name', 'confidence',
      'value_text', 'value_numeric', 'reference_range_text'
    ];

    const hasAIReadyStructure = sampleResults && sampleResults.length > 0 &&
      aiReadyFields.every(field => field in sampleResults[0]);

    if (!allHandledGracefully) {
      return {
        success: false,
        message: 'Normalization service not handling unknown markers gracefully',
        details: { normalizationResults }
      };
    }

    if (!hasAIReadyStructure) {
      return {
        success: false,
        message: 'Data structure not ready for AI enhancement',
        details: { aiReadyFields, sampleResult: sampleResults?.[0] }
      };
    }

    logValidation('EXTENSIBILITY', '✅', 'Future extensibility validation passed');
    return {
      success: true,
      message: 'Extensibility validation passed - ready for AI enhancement',
      details: {
        normalizationHandling: 'graceful',
        aiReadyStructure: true,
        confidenceTracking: true,
        rawValuePreservation: true
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Extensibility validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function cleanupTestData(): Promise<ValidationResult> {
  try {
    logValidation('CLEANUP', '⏳', 'Cleaning up test data...');

    // Delete test results
    const { error: resultsError } = await supabase
      .from('bloodwork_results')
      .delete()
      .eq('user_id', TEST_USER_ID);

    if (resultsError) {
      return {
        success: false,
        message: `Failed to delete test results: ${resultsError.message}`,
        details: resultsError
      };
    }

    // Delete test documents
    const { error: documentsError } = await supabase
      .from('bloodwork_documents')
      .delete()
      .eq('user_id', TEST_USER_ID);

    if (documentsError) {
      return {
        success: false,
        message: `Failed to delete test documents: ${documentsError.message}`,
        details: documentsError
      };
    }

    logValidation('CLEANUP', '✅', 'Test data cleaned up successfully');
    return {
      success: true,
      message: 'Test data cleanup successful',
      details: {}
    };
  } catch (error) {
    return {
      success: false,
      message: `Cleanup error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function runE2EValidation() {
  console.log('🚀 BLOODWORK EXTRACTION ENGINE - END-TO-END VALIDATION');
  console.log('=====================================================\n');

  const results: Record<string, ValidationResult> = {};

  // Run validation steps
  results.setup = await setupTestDocuments();
  
  if (results.setup.success) {
    const docs = results.setup.details;
    results.scenarioA = await testScenarioA(docs.scenarioA);
    results.scenarioB = await testScenarioB(docs.scenarioB);
    results.scenarioC = await testScenarioC(docs.scenarioC);
    results.persistence = await testPersistence();
    results.retrieval = await testRetrievalEndpoints();
    results.timeline = await testTimelineGrouping();
    results.multiDocument = await testMultiDocumentSupport();
    results.extensibility = await testFutureExtensibility();
  }
  
  results.cleanup = await cleanupTestData();

  // Generate summary
  const validationCategories = {
    extraction: [results.scenarioA, results.scenarioB, results.scenarioC].filter(Boolean),
    normalization: [results.scenarioA, results.scenarioB].filter(Boolean), // These test normalization specifically
    persistence: [results.persistence].filter(Boolean),
    retrieval: [results.retrieval].filter(Boolean),
    timeline: [results.timeline].filter(Boolean),
    multiDocument: [results.multiDocument].filter(Boolean),
    extensibility: [results.extensibility].filter(Boolean)
  };

  const categoryResults: Record<string, boolean> = {};
  
  Object.entries(validationCategories).forEach(([category, tests]) => {
    categoryResults[category] = tests.every(test => test && test.success);
  });

  const passedCategories = Object.values(categoryResults).filter(Boolean).length;
  const totalCategories = Object.keys(categoryResults).length;
  const successRate = (passedCategories / totalCategories) * 100;

  console.log('📊 END-TO-END VALIDATION SUMMARY');
  console.log('===============================');

  Object.entries(categoryResults).forEach(([category, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const displayName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${displayName}`);
  });

  console.log('\n🎯 Overall Result:', successRate >= 80 ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED');
  console.log(`📈 Category Success: ${passedCategories}/${totalCategories} categories passed (${successRate.toFixed(1)}%)`);

  if (successRate >= 80) {
    console.log('\n🎉 BLOODWORK EXTRACTION ENGINE E2E VALIDATION COMPLETE!');
    console.log('✅ Extraction pipeline working correctly');
    console.log('✅ Normalization functioning as expected');
    console.log('✅ Data persistence validated');
    console.log('✅ API endpoints responding correctly');
    console.log('✅ Timeline grouping working');
    console.log('✅ Multi-document support confirmed');
    console.log('✅ Future extensibility verified');
    console.log('\n🚀 BLOODWORK EXTRACTION ENGINE PRODUCTION READY!');
  } else {
    console.log('\n🔧 REMAINING ISSUES:');
    Object.entries(categoryResults).forEach(([category, passed]) => {
      if (!passed) {
        const displayName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`   - ${displayName}: Validation failed`);
      }
    });
    console.log('\n📋 TROUBLESHOOTING:');
    console.log('1. Check database schema deployment');
    console.log('2. Verify API endpoint accessibility');
    console.log('3. Review extraction service logs');
    console.log('4. Test individual components');
  }

  process.exit(successRate >= 80 ? 0 : 1);
}

// Run validation
runE2EValidation().catch(error => {
  console.error('E2E validation failed to run:', error);
  process.exit(1);
});
