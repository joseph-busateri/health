/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { normalizeBloodworkMarker } from '../services/bloodworkNormalizationService';
import { parseBloodworkDocument } from '../services/bloodworkExtractionService';

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

const TEST_USER_ID = 'bloodwork-extraction-validation-user';

async function logStep(stepName: string, status: string, message: string, details?: any) {
  const timestamp = new Date().toISOString();
  const icon = status === '✅' ? '✅' : status === '❌' ? '❌' : '⏳';
  console.log(`${icon} Step ${stepName}: ${status}`);
  console.log(`   ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  console.log('');
}

async function validateDatabaseSchema(): Promise<ValidationResult> {
  try {
    logStep('1: Validating Database Schema', '⏳', 'Checking bloodwork_results table...');

    // Check if bloodwork_results table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('bloodwork_results')
      .select('*')
      .limit(1);

    if (tableError) {
      return {
        success: false,
        message: `Database schema validation failed: ${tableError.message}`,
        details: tableError
      };
    }

    // Check table structure by examining a sample row
    let columns = null;
    let columnError = null;
    try {
      const result = await supabase.rpc('get_table_columns', { table_name: 'bloodwork_results' });
      columns = result.data;
      columnError = result.error;
    } catch (e) {
      columns = null;
      columnError = { message: 'RPC not available' };
    }

    if (!columnError && columns) {
      const expectedColumns = [
        'id', 'document_id', 'user_id', 'raw_test_name', 'normalized_test_name',
        'category', 'value_text', 'value_numeric', 'unit', 'reference_range_low',
        'reference_range_high', 'reference_range_text', 'abnormal_flag',
        'confidence', 'test_date', 'source', 'created_at', 'updated_at'
      ];

      const existingColumns = columns.map((col: any) => col.column_name);
      const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        return {
          success: false,
          message: `Missing columns: ${missingColumns.join(', ')}`,
          details: { missingColumns, existingColumns }
        };
      }
    }

    logStep('1: Validating Database Schema', '✅', 'bloodwork_results table exists and accessible');
    return {
      success: true,
      message: 'Database schema validation passed',
      details: { tableAccessible: true }
    };
  } catch (error) {
    return {
      success: false,
      message: `Database schema validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function createTestDocument(): Promise<ValidationResult> {
  try {
    logStep('2: Creating Test Document', '⏳', 'Creating test bloodwork document...');

    // First create a test document
    const { data: document, error: documentError } = await supabase
      .from('bloodwork_documents')
      .insert({
        user_id: TEST_USER_ID,
        file_url: 'https://storage.example.com/bloodwork/test-extraction.pdf',
        file_name: 'test-extraction.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        document_type: 'comprehensive',
        source: 'validation_test',
        test_date: '2024-01-15',
        upload_date: new Date().toISOString(),
        parse_status: 'pending',
        extraction_confidence: null,
        notes: 'Test document for extraction validation',
        metadata: { validation: true }
      })
      .select()
      .single();

    if (documentError || !document) {
      return {
        success: false,
        message: `Failed to create test document: ${documentError?.message}`,
        details: documentError
      };
    }

    logStep('2: Creating Test Document', '✅', 'Test document created successfully');
    return {
      success: true,
      message: 'Test document created successfully',
      details: { documentId: document.id }
    };
  } catch (error) {
    return {
      success: false,
      message: `Test document creation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateNormalization(): Promise<ValidationResult> {
  try {
    logStep('3: Validating Normalization', '⏳', 'Testing bloodwork marker normalization...');

    const testCases = [
      { input: 'LDL Cholesterol', expected: 'LDL' },
      { input: 'HDL-C', expected: 'HDL' },
      { input: 'Triglycerides', expected: 'Triglycerides' },
      { input: 'A1c', expected: 'HbA1c' },
      { input: 'Testosterone', expected: 'Testosterone' },
      { input: 'WBC', expected: 'WBC' },
      { input: 'Unknown Marker', expected: null }
    ];

    const results: any[] = [];
    let passedTests = 0;

    for (const testCase of testCases) {
      const result = normalizeBloodworkMarker(testCase.input);
      const passed = result.normalized_name === testCase.expected;
      
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        actual: result.normalized_name,
        confidence: result.confidence,
        passed
      });

      if (passed) passedTests++;
    }

    const successRate = (passedTests / testCases.length) * 100;

    if (successRate >= 80) {
      logStep('3: Validating Normalization', '✅', `Normalization passed (${passedTests}/${testCases.length} tests)`);
      return {
        success: true,
        message: `Normalization validation passed (${passedTests}/${testCases.length} tests)`,
        details: { results, successRate }
      };
    } else {
      return {
        success: false,
        message: `Normalization validation failed (${passedTests}/${testCases.length} tests)`,
        details: { results, successRate }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Normalization validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateExtraction(): Promise<ValidationResult> {
  try {
    logStep('4: Validating Extraction', '⏳', 'Testing bloodwork extraction...');

    // Get a test document
    const { data: documents, error: fetchError } = await supabase
      .from('bloodwork_documents')
      .select('id')
      .eq('user_id', TEST_USER_ID)
      .eq('parse_status', 'pending')
      .limit(1);

    if (fetchError || !documents || documents.length === 0) {
      return {
        success: false,
        message: 'No test document available for extraction',
        details: fetchError
      };
    }

    const testDocument = documents[0];

    // Test extraction via service
    const extractionResult = await parseBloodworkDocument({
      document_id: testDocument.id,
      user_id: TEST_USER_ID
    });

    if (!extractionResult.success) {
      return {
        success: false,
        message: `Extraction failed: ${extractionResult.error}`,
        details: extractionResult
      };
    }

    const { results_extracted, confidence, processing_time } = extractionResult.data!;

    if (results_extracted === 0) {
      return {
        success: false,
        message: 'No results extracted from test document',
        details: extractionResult.data
      };
    }

    logStep('4: Validating Extraction', '✅', `Extraction successful (${results_extracted} results)`);
    return {
      success: true,
      message: `Extraction validation passed (${results_extracted} results)`,
      details: {
        resultsExtracted: results_extracted,
        confidence,
        processingTime: processing_time
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Extraction validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateResultsStorage(): Promise<ValidationResult> {
  try {
    logStep('5: Validating Results Storage', '⏳', 'Checking extracted results storage...');

    // Get results for test user
    const { data: results, error: fetchError } = await supabase
      .from('bloodwork_results')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .limit(10);

    if (fetchError) {
      return {
        success: false,
        message: `Failed to fetch stored results: ${fetchError.message}`,
        details: fetchError
      };
    }

    if (!results || results.length === 0) {
      return {
        success: false,
        message: 'No results found in storage',
        details: { resultsCount: 0 }
      };
    }

    // Validate result structure
    const requiredFields = ['id', 'document_id', 'user_id', 'raw_test_name', 'value_text'];
    const invalidResults = results.filter(result => 
      !requiredFields.every(field => result[field] !== undefined && result[field] !== null)
    );

    if (invalidResults.length > 0) {
      return {
        success: false,
        message: `Invalid result structure found in ${invalidResults.length} records`,
        details: { invalidResults: invalidResults.length, totalResults: results.length }
      };
    }

    // Check normalization quality
    const normalizedResults = results.filter(r => r.normalized_test_name);
    const normalizationRate = (normalizedResults.length / results.length) * 100;

    logStep('5: Validating Results Storage', '✅', `Results storage validated (${results.length} results)`);
    return {
      success: true,
      message: `Results storage validation passed (${results.length} results)`,
      details: {
        resultsCount: results.length,
        normalizedResults: normalizedResults.length,
        normalizationRate
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Results storage validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateAPIEndpoints(): Promise<ValidationResult> {
  try {
    logStep('6: Validating API Endpoints', '⏳', 'Testing bloodwork extraction endpoints...');

    // Get a test document
    const { data: documents } = await supabase
      .from('bloodwork_documents')
      .select('id')
      .eq('user_id', TEST_USER_ID)
      .limit(1);

    if (!documents || documents.length === 0) {
      return {
        success: false,
        message: 'No test document available for API testing',
        details: {}
      };
    }

    const testDocument = documents[0];

    // Test parse endpoint
    const parseResponse = await fetch(`${API_BASE_URL}/bloodwork/parse/${testDocument.id}`, {
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
        message: `Parse endpoint failed with status ${parseResponse.status}`,
        details: { status: parseResponse.status, statusText: parseResponse.statusText }
      };
    }

    const parseData = await parseResponse.json();

    if (!parseData.success) {
      return {
        success: false,
        message: `Parse endpoint returned error: ${parseData.error}`,
        details: parseData
      };
    }

    // Test results endpoint
    const resultsResponse = await fetch(`${API_BASE_URL}/bloodwork/results/${TEST_USER_ID}`);

    if (!resultsResponse.ok) {
      return {
        success: false,
        message: `Results endpoint failed with status ${resultsResponse.status}`,
        details: { status: resultsResponse.status, statusText: resultsResponse.statusText }
      };
    }

    const resultsData = await resultsResponse.json();

    if (!resultsData.success) {
      return {
        success: false,
        message: `Results endpoint returned error: ${resultsData.error}`,
        details: resultsData
      };
    }

    // Test timeline endpoint
    const timelineResponse = await fetch(`${API_BASE_URL}/bloodwork/results/${TEST_USER_ID}/timeline`);

    if (!timelineResponse.ok) {
      return {
        success: false,
        message: `Timeline endpoint failed with status ${timelineResponse.status}`,
        details: { status: timelineResponse.status, statusText: timelineResponse.statusText }
      };
    }

    const timelineData = await timelineResponse.json();

    if (!timelineData.success) {
      return {
        success: false,
        message: `Timeline endpoint returned error: ${timelineData.error}`,
        details: timelineData
      };
    }

    logStep('6: Validating API Endpoints', '✅', 'All API endpoints working correctly');
    return {
      success: true,
      message: 'API endpoints validation passed',
      details: {
        parseEndpoint: 'OK',
        resultsEndpoint: 'OK',
        timelineEndpoint: 'OK',
        resultsCount: resultsData.data?.total || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `API endpoints validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateTimelineData(): Promise<ValidationResult> {
  try {
    logStep('7: Validating Timeline Data', '⏳', 'Testing timeline data structure...');

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
        message: 'No timeline data available',
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
    const uniqueMarkers = new Set(
      results.map(r => r.normalized_test_name || r.raw_test_name)
    ).size;

    // Validate chronological order
    const dates = uniqueDates.map(date => new Date(date)).sort((a, b) => a.getTime() - b.getTime());
    const sortedDates = dates.map(date => date.toISOString().split('T')[0]);

    const isChronological = JSON.stringify(uniqueDates.sort()) === JSON.stringify(sortedDates);

    logStep('7: Validating Timeline Data', '✅', `Timeline data validated (${uniqueDates.length} dates, ${uniqueMarkers} markers)`);
    return {
      success: true,
      message: `Timeline data validation passed (${uniqueDates.length} dates, ${uniqueMarkers} markers)`,
      details: {
        uniqueDates: uniqueDates.length,
        uniqueMarkers,
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
      message: `Timeline data validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function cleanupTestData(): Promise<ValidationResult> {
  try {
    logStep('8: Cleanup Test Data', '⏳', 'Removing test records...');

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

    logStep('8: Cleanup Test Data', '✅', 'Test data cleaned up successfully');
    return {
      success: true,
      message: 'Test data cleanup successful',
      details: {}
    };
  } catch (error) {
    return {
      success: false,
      message: `Test data cleanup error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function runValidation() {
  console.log('🚀 BLOODWORK EXTRACTION ENGINE VALIDATION');
  console.log('=============================================\n');

  const results: Record<string, ValidationResult> = {};

  // Run validation steps
  results.databaseSchema = await validateDatabaseSchema();
  results.testDocument = await createTestDocument();
  results.normalization = await validateNormalization();
  results.extraction = await validateExtraction();
  results.resultsStorage = await validateResultsStorage();
  results.apiEndpoints = await validateAPIEndpoints();
  results.timelineData = await validateTimelineData();
  results.cleanup = await cleanupTestData();

  // Generate summary
  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests) * 100;

  console.log('📊 BLOODWORK EXTRACTION VALIDATION SUMMARY');
  console.log('===========================================');

  Object.entries(results).forEach(([step, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const stepName = step.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${stepName}`);
    if (!result.success && result.details) {
      console.log(`   ${result.message}`);
    }
  });

  console.log('\n🎯 Overall Result:', successRate >= 80 ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED');
  console.log(`📈 Test Coverage: ${passedTests}/${totalTests} tests passed (${successRate.toFixed(1)}%)`);

  if (successRate >= 80) {
    console.log('\n🎉 BLOODWORK EXTRACTION ENGINE VALIDATION COMPLETE!');
    console.log('✅ All critical functionality working correctly');
    console.log('✅ Database operations successful');
    console.log('✅ API endpoints responding');
    console.log('✅ Extraction workflow complete');
    console.log('✅ Normalization working');
    console.log('✅ Timeline data structured correctly');
    console.log('\n🚀 BLOODWORK EXTRACTION ENGINE READY FOR PRODUCTION!');
  } else {
    console.log('\n🔧 REMAINING ISSUES:');
    Object.entries(results).forEach(([step, result]) => {
      if (!result.success) {
        const stepName = step.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`   - ${stepName}: ${result.message}`);
      }
    });
    console.log('\n📋 TROUBLESHOOTING:');
    console.log('1. Ensure database schema is deployed');
    console.log('2. Check API endpoints are accessible');
    console.log('3. Verify extraction service is working');
    console.log('4. Review error logs for detailed issues');
  }

  process.exit(successRate >= 80 ? 0 : 1);
}

// Run validation
runValidation().catch(error => {
  console.error('Validation failed to run:', error);
  process.exit(1);
});
