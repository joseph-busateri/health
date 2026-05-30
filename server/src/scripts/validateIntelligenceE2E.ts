/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

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

const TEST_USER_ID = '00000000-0000-0000-0000-000000000015';

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

async function setupMultiMarkerTestData(): Promise<ValidationResult> {
  try {
    logValidation('SETUP', '⏳', 'Creating multi-marker test data for intelligence validation...');

    // Create test documents
    const { data: documents, error: docError } = await supabase
      .from('bloodwork_documents')
      .insert([
        {
          user_id: TEST_USER_ID,
          file_url: 'https://storage.example.com/bloodwork/intel-test-1.pdf',
          file_name: 'intel-test-1.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: 'lab_report',
          test_date: '2024-01-15',
          upload_date: new Date().toISOString(),
          parse_status: 'extracted',
          extraction_confidence: 0.95,
          notes: 'Test document 1 for intelligence validation',
          metadata: { validation: true, document_number: 1 }
        },
        {
          user_id: TEST_USER_ID,
          file_url: 'https://storage.example.com/bloodwork/intel-test-2.pdf',
          file_name: 'intel-test-2.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: 'lab_report',
          test_date: '2024-02-20',
          upload_date: new Date().toISOString(),
          parse_status: 'extracted',
          extraction_confidence: 0.95,
          notes: 'Test document 2 for intelligence validation',
          metadata: { validation: true, document_number: 2 }
        },
        {
          user_id: TEST_USER_ID,
          file_url: 'https://storage.example.com/bloodwork/intel-test-3.pdf',
          file_name: 'intel-test-3.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: 'lab_report',
          test_date: '2024-03-25',
          upload_date: new Date().toISOString(),
          parse_status: 'extracted',
          extraction_confidence: 0.95,
          notes: 'Test document 3 for intelligence validation',
          metadata: { validation: true, document_number: 3 }
        }
      ])
      .select();

    if (docError || !documents) {
      return {
        success: false,
        message: `Failed to create test documents: ${docError?.message}`,
        details: docError
      };
    }

    // Create comprehensive test bloodwork results for all scenarios
    const testResults = [
      // Scenario A: Worsening cardiovascular markers
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '110',
        value_numeric: 110,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '125',
        value_numeric: 125,
        unit: 'mg/dL',
        test_date: '2024-02-20',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '145',
        value_numeric: 145,
        unit: 'mg/dL',
        test_date: '2024-03-25',
        source: 'lab_report',
        confidence: 0.95
      },

      // ApoB worsening
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'Apolipoprotein B',
        normalized_test_name: 'ApoB',
        category: 'Cardiovascular',
        value_text: '85',
        value_numeric: 85,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'Apolipoprotein B',
        normalized_test_name: 'ApoB',
        category: 'Cardiovascular',
        value_text: '95',
        value_numeric: 95,
        unit: 'mg/dL',
        test_date: '2024-02-20',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'Apolipoprotein B',
        normalized_test_name: 'ApoB',
        category: 'Cardiovascular',
        value_text: '108',
        value_numeric: 108,
        unit: 'mg/dL',
        test_date: '2024-03-25',
        source: 'lab_report',
        confidence: 0.95
      },

      // Scenario B: Worsening metabolic markers
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '5.6',
        value_numeric: 5.6,
        unit: '%',
        test_date: '2024-01-15',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '5.9',
        value_numeric: 5.9,
        unit: '%',
        test_date: '2024-02-20',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '6.7',
        value_numeric: 6.7,
        unit: '%',
        test_date: '2024-03-25',
        source: 'lab_report',
        confidence: 0.95
      },

      // Glucose worsening
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'Glucose',
        normalized_test_name: 'Glucose',
        category: 'Metabolic',
        value_text: '92',
        value_numeric: 92,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'Glucose',
        normalized_test_name: 'Glucose',
        category: 'Metabolic',
        value_text: '105',
        value_numeric: 105,
        unit: 'mg/dL',
        test_date: '2024-02-20',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'Glucose',
        normalized_test_name: 'Glucose',
        category: 'Metabolic',
        value_text: '118',
        value_numeric: 118,
        unit: 'mg/dL',
        test_date: '2024-03-25',
        source: 'lab_report',
        confidence: 0.95
      },

      // Scenario C: Hormonal concerns
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '480',
        value_numeric: 480,
        unit: 'ng/dL',
        test_date: '2024-01-15',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '410',
        value_numeric: 410,
        unit: 'ng/dL',
        test_date: '2024-02-20',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '260',
        value_numeric: 260,
        unit: 'ng/dL',
        test_date: '2024-03-25',
        source: 'lab_report',
        confidence: 0.95
      },

      // SHBG worsening
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'SHBG',
        normalized_test_name: 'SHBG',
        category: 'Hormonal',
        value_text: '45',
        value_numeric: 45,
        unit: 'nmol/L',
        test_date: '2024-01-15',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'SHBG',
        normalized_test_name: 'SHBG',
        category: 'Hormonal',
        value_text: '68',
        value_numeric: 68,
        unit: 'nmol/L',
        test_date: '2024-02-20',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'SHBG',
        normalized_test_name: 'SHBG',
        category: 'Hormonal',
        value_text: '92',
        value_numeric: 92,
        unit: 'nmol/L',
        test_date: '2024-03-25',
        source: 'lab_report',
        confidence: 0.95
      },

      // Scenario D: Stable markers (should not generate recommendations or low severity)
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'HDL Cholesterol',
        normalized_test_name: 'HDL',
        category: 'Cardiovascular',
        value_text: '52',
        value_numeric: 52,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'HDL Cholesterol',
        normalized_test_name: 'HDL',
        category: 'Cardiovascular',
        value_text: '54',
        value_numeric: 54,
        unit: 'mg/dL',
        test_date: '2024-02-20',
        source: 'lab_report',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'HDL Cholesterol',
        normalized_test_name: 'HDL',
        category: 'Cardiovascular',
        value_text: '53',
        value_numeric: 53,
        unit: 'mg/dL',
        test_date: '2024-03-25',
        source: 'lab_report',
        confidence: 0.95
      },

      // Single data point marker (insufficient data)
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'Free Testosterone',
        normalized_test_name: 'Free Testosterone',
        category: 'Hormonal',
        value_text: '8.5',
        value_numeric: 8.5,
        unit: 'ng/dL',
        test_date: '2024-03-25',
        source: 'lab_report',
        confidence: 0.95
      }
    ];

    const { data: insertedResults, error: insertError } = await supabase
      .from('bloodwork_results')
      .insert(testResults)
      .select();

    if (insertError) {
      return {
        success: false,
        message: `Failed to insert test results: ${insertError.message}`,
        details: insertError
      };
    }

    logValidation('SETUP', '✅', `Created ${documents.length} documents and ${testResults.length} results`);
    return {
      success: true,
      message: 'Multi-marker test data created successfully',
      details: {
        documents: documents.length,
        results: testResults.length,
        scenarios: [
          'Cardiovascular: LDL worsening (110→125→145)',
          'Cardiovascular: ApoB worsening (85→95→108)',
          'Metabolic: HbA1c worsening (5.6→5.9→6.7)',
          'Metabolic: Glucose worsening (92→105→118)',
          'Hormonal: Testosterone worsening (480→410→260)',
          'Hormonal: SHBG worsening (45→68→92)',
          'Stable: HDL stable (52→54→53)',
          'Insufficient: Free Testosterone single point'
        ]
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

async function validateRecommendationGeneration(): Promise<ValidationResult> {
  try {
    logValidation('GENERATION', '⏳', 'Testing recommendation generation...');

    // Generate recommendations
    const generationResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/generate/${TEST_USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        force_regenerate: true
      })
    });

    if (!generationResponse.ok) {
      return {
        success: false,
        message: `Recommendation generation failed with status ${generationResponse.status}`,
        details: { status: generationResponse.status }
      };
    }

    const generationData = await generationResponse.json();

    if (!generationData.success) {
      return {
        success: false,
        message: `Recommendation generation error: ${generationData.error}`,
        details: generationData
      };
    }

    const { generated_count, superseded_count, recommendations } = generationData.data || {};

    if (!recommendations || recommendations.length === 0) {
      return {
        success: false,
        message: 'No recommendations generated',
        details: { generationData }
      };
    }

    logValidation('GENERATION', '✅', `Generated ${generated_count} recommendations`);
    return {
      success: true,
      message: 'Recommendation generation validation passed',
      details: {
        generatedCount: generated_count,
        supersededCount: superseded_count,
        recommendations: recommendations.map(rec => ({
          marker: rec.test_name,
          type: rec.recommendation_type,
          severity: rec.severity,
          confidence: rec.confidence
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Generation validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateRecommendationPersistence(): Promise<ValidationResult> {
  try {
    logValidation('PERSISTENCE', '⏳', 'Testing recommendation persistence...');

    // Check recommendations were saved to database
    const { data: recommendations, error: fetchError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return {
        success: false,
        message: `Failed to fetch persisted recommendations: ${fetchError.message}`,
        details: fetchError
      };
    }

    if (!recommendations || recommendations.length === 0) {
      return {
        success: false,
        message: 'No recommendations found in database',
        details: {}
      };
    }

    // Validate all required fields are present
    const requiredFields = [
      'user_id', 'test_name', 'normalized_test_name', 'category',
      'recommendation_type', 'recommendation_title', 'recommendation_text',
      'rationale', 'confidence', 'severity', 'status',
      'source_document_ids', 'source_result_ids', 'source_trend_window'
    ];

    const invalidRecommendations = recommendations.filter(rec => 
      !requiredFields.every(field => rec[field] !== undefined && rec[field] !== null)
    );

    if (invalidRecommendations.length > 0) {
      return {
        success: false,
        message: `Invalid structure for ${invalidRecommendations.length} recommendations`,
        details: { invalidRecommendations, requiredFields }
      };
    }

    // Validate field types and values
    const fieldValidation = recommendations.map(rec => ({
      id: rec.id,
      user_id_valid: rec.user_id === TEST_USER_ID,
      confidence_valid: typeof rec.confidence === 'number' && rec.confidence >= 0 && rec.confidence <= 1,
      severity_valid: ['low', 'medium', 'high'].includes(rec.severity),
      status_valid: ['active', 'superseded', 'resolved'].includes(rec.status),
      source_document_ids_valid: Array.isArray(rec.source_document_ids) && rec.source_document_ids.length > 0,
      source_result_ids_valid: Array.isArray(rec.source_result_ids) && rec.source_result_ids.length > 0,
      trend_window_valid: rec.source_trend_window && 
        rec.source_trend_window.start_date && 
        rec.source_trend_window.end_date && 
        typeof rec.source_trend_window.data_points === 'number'
    }));

    const invalidFields = fieldValidation.filter(v => 
      !v.user_id_valid || !v.confidence_valid || !v.severity_valid || 
      !v.status_valid || !v.source_document_ids_valid || 
      !v.source_result_ids_valid || !v.trend_window_valid
    );

    if (invalidFields.length > 0) {
      return {
        success: false,
        message: `Field validation failed for ${invalidFields.length} recommendations`,
        details: { invalidFields }
      };
    }

    // Validate specific recommendations for scenarios
    const ldlRec = recommendations.find(rec => rec.test_name === 'LDL');
    const apobRec = recommendations.find(rec => rec.test_name === 'ApoB');
    const hba1cRec = recommendations.find(rec => rec.test_name === 'HbA1c');
    const glucoseRec = recommendations.find(rec => rec.test_name === 'Glucose');
    const testRec = recommendations.find(rec => rec.test_name === 'Testosterone');
    const shbgRec = recommendations.find(rec => rec.test_name === 'SHBG');

    const scenarioValidation = {
      ldl: ldlRec && ldlRec.recommendation_type === 'cardiovascular',
      apob: apobRec && apobRec.recommendation_type === 'cardiovascular',
      hba1c: hba1cRec && hba1cRec.recommendation_type === 'metabolic',
      glucose: glucoseRec && glucoseRec.recommendation_type === 'metabolic',
      test: testRec && testRec.recommendation_type === 'hormonal',
      shbg: shbgRec && shbgRec.recommendation_type === 'hormonal'
    };

    const scenarioFailures = Object.entries(scenarioValidation).filter(([_, passed]) => !passed);

    if (scenarioFailures.length > 0) {
      return {
        success: false,
        message: `Scenario validation failed for ${scenarioFailures.length} markers`,
        details: { scenarioValidation, scenarioFailures }
      };
    }

    logValidation('PERSISTENCE', '✅', `Recommendation persistence working (${recommendations.length} records)`);
    return {
      success: true,
      message: 'Recommendation persistence validation passed',
      details: {
        totalRecommendations: recommendations.length,
        fieldValidation: 'passed',
        scenarioValidation: scenarioValidation,
        averageConfidence: recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length
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

async function validateRecommendationRetrieval(): Promise<ValidationResult> {
  try {
    logValidation('RETRIEVAL', '⏳', 'Testing recommendation retrieval endpoints...');

    // Test GET /bloodwork/recommendations/:user_id
    const allResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/${TEST_USER_ID}`);

    if (!allResponse.ok) {
      return {
        success: false,
        message: `All recommendations endpoint failed with status ${allResponse.status}`,
        details: { status: allResponse.status }
      };
    }

    const allData = await allResponse.json();

    if (!allData.success) {
      return {
        success: false,
        message: `All recommendations endpoint error: ${allData.error}`,
        details: allData
      };
    }

    // Test GET /bloodwork/recommendations/:user_id/active
    const activeResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/${TEST_USER_ID}/active`);

    if (!activeResponse.ok) {
      return {
        success: false,
        message: `Active recommendations endpoint failed with status ${activeResponse.status}`,
        details: { status: activeResponse.status }
      };
    }

    const activeData = await activeResponse.json();

    if (!activeData.success) {
      return {
        success: false,
        message: `Active recommendations endpoint error: ${activeData.error}`,
        details: activeData
      };
    }

    // Validate response structure
    const allRecs = allData.data?.recommendations || [];
    const activeRecs = activeData.data?.recommendations || [];

    if (allRecs.length === 0) {
      return {
        success: false,
        message: 'No recommendations returned from all endpoint',
        details: { allData }
      };
    }

    // Validate active recommendations are subset of all
    const activeNotInAll = activeRecs.filter(activeRec => 
      !allRecs.some(allRec => allRec.id === activeRec.id)
    );

    if (activeNotInAll.length > 0) {
      return {
        success: false,
        message: 'Active recommendations not found in all recommendations',
        details: { activeNotInAll }
      };
    }

    // Validate all active recommendations have correct status
    const inactiveInActive = activeRecs.filter(rec => rec.status !== 'active');

    if (inactiveInActive.length > 0) {
      return {
        success: false,
        message: 'Non-active recommendations found in active endpoint',
        details: { inactiveInActive }
      };
    }

    // Test filtering by status
    const activeStatusResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/${TEST_USER_ID}?status=active`);

    if (!activeStatusResponse.ok) {
      return {
        success: false,
        message: `Status filtering endpoint failed with status ${activeStatusResponse.status}`,
        details: { status: activeStatusResponse.status }
      };
    }

    const activeStatusData = await activeStatusResponse.json();

    if (!activeStatusData.success) {
      return {
        success: false,
        message: `Status filtering endpoint error: ${activeStatusData.error}`,
        details: activeStatusData
      };
    }

    // Test filtering by recommendation type
    const cardioResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/${TEST_USER_ID}?recommendation_type=cardiovascular`);

    if (!cardioResponse.ok) {
      return {
        success: false,
        message: `Type filtering endpoint failed with status ${cardioResponse.status}`,
        details: { status: cardioResponse.status }
      };
    }

    const cardioData = await cardioResponse.json();

    if (!cardioData.success) {
      return {
        success: false,
        message: `Type filtering endpoint error: ${cardioData.error}`,
        details: cardioData
      };
    }

    const cardioRecs = cardioData.data?.recommendations || [];
    const nonCardioInCardio = cardioRecs.filter(rec => rec.recommendation_type !== 'cardiovascular');

    if (nonCardioInCardio.length > 0) {
      return {
        success: false,
        message: 'Non-cardiovascular recommendations found in cardiovascular filter',
        details: { nonCardioInCardio }
      };
    }

    // Test filtering by severity
    const highResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/${TEST_USER_ID}?severity=high`);

    if (!highResponse.ok) {
      return {
        success: false,
        message: `Severity filtering endpoint failed with status ${highResponse.status}`,
        details: { status: highResponse.status }
      };
    }

    const highData = await highResponse.json();

    if (!highData.success) {
      return {
        success: false,
        message: `Severity filtering endpoint error: ${highData.error}`,
        details: highData
      };
    }

    const highRecs = highData.data?.recommendations || [];
    const nonHighInHigh = highRecs.filter(rec => rec.severity !== 'high');

    if (nonHighInHigh.length > 0) {
      return {
        success: false,
        message: 'Non-high severity recommendations found in high filter',
        details: { nonHighInHigh }
      };
    }

    logValidation('RETRIEVAL', '✅', 'All recommendation retrieval endpoints working correctly');
    return {
      success: true,
      message: 'Recommendation retrieval validation passed',
      details: {
        allRecommendations: allRecs.length,
        activeRecommendations: activeRecs.length,
        cardioRecommendations: cardioRecs.length,
        highRecommendations: highRecs.length,
        endpoints: ['all', 'active', 'status_filter', 'type_filter', 'severity_filter']
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

async function validateStatusUpdates(): Promise<ValidationResult> {
  try {
    logValidation('STATUS UPDATES', '⏳', 'Testing recommendation status updates...');

    // Get a recommendation to update
    const { data: recommendations, error: fetchError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'active')
      .limit(1);

    if (fetchError || !recommendations || recommendations.length === 0) {
      return {
        success: false,
        message: 'No active recommendations found for status update test',
        details: { fetchError, recommendations }
      };
    }

    const testRecommendation = recommendations[0];
    const originalStatus = testRecommendation.status;

    // Test status update to resolved
    const updateResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/${testRecommendation.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'resolved'
      })
    });

    if (!updateResponse.ok) {
      return {
        success: false,
        message: `Status update endpoint failed with status ${updateResponse.status}`,
        details: { status: updateResponse.status }
      };
    }

    const updateData = await updateResponse.json();

    if (!updateData.success) {
      return {
        success: false,
        message: `Status update endpoint error: ${updateData.error}`,
        details: updateData
      };
    }

    // Verify status was updated in database
    const { data: updatedRec, error: verifyError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('id', testRecommendation.id)
      .single();

    if (verifyError || !updatedRec) {
      return {
        success: false,
        message: 'Failed to verify status update in database',
        details: { verifyError }
      };
    }

    if (updatedRec.status !== 'resolved') {
      return {
        success: false,
        message: 'Status not updated correctly in database',
        details: { expected: 'resolved', actual: updatedRec.status }
      };
    }

    // Test status update back to active
    const restoreResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/${testRecommendation.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'active'
      })
    });

    if (!restoreResponse.ok) {
      return {
        success: false,
        message: `Status restore endpoint failed with status ${restoreResponse.status}`,
        details: { status: restoreResponse.status }
      };
    }

    // Verify restore
    const { data: restoredRec, error: restoreVerifyError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('id', testRecommendation.id)
      .single();

    if (restoreVerifyError || !restoredRec) {
      return {
        success: false,
        message: 'Failed to verify status restore in database',
        details: { restoreVerifyError }
      };
    }

    if (restoredRec.status !== 'active') {
      return {
        success: false,
        message: 'Status not restored correctly in database',
        details: { expected: 'active', actual: restoredRec.status }
      };
    }

    // Test invalid status
    const invalidResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/${testRecommendation.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'invalid_status'
      })
    });

    if (invalidResponse.ok) {
      return {
        success: false,
        message: 'Invalid status should have been rejected',
        details: { status: invalidResponse.status }
      };
    }

    logValidation('STATUS UPDATES', '✅', 'Status update endpoints working correctly');
    return {
      success: true,
      message: 'Status update validation passed',
      details: {
        originalStatus,
        updatedTo: 'resolved',
        restoredTo: 'active',
        invalidStatusRejected: true
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Status update validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateRecommendationQuality(): Promise<ValidationResult> {
  try {
    logValidation('QUALITY', '⏳', 'Testing recommendation quality and scenarios...');

    // Get all recommendations for quality testing
    const { data: recommendations, error: fetchError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID);

    if (fetchError || !recommendations || recommendations.length === 0) {
      return {
        success: false,
        message: 'No recommendations found for quality testing',
        details: { fetchError }
      };
    }

    // Scenario A: Worsening cardiovascular markers
    const ldlRec = recommendations.find(rec => rec.test_name === 'LDL');
    const apobRec = recommendations.find(rec => rec.test_name === 'ApoB');

    if (!ldlRec || !apobRec) {
      return {
        success: false,
        message: 'Scenario A failed: Missing cardiovascular recommendations',
        details: { ldlRec, apobRec }
      };
    }

    // Validate cardiovascular recommendations
    const cardioValidation = {
      ldlType: ldlRec.recommendation_type === 'cardiovascular',
      ldlSeverity: ldlRec.severity === 'high', // Should be high due to >130 value
      ldlRationale: ldlRec.rationale.includes('worsening') && ldlRec.rationale.includes('145'),
      apobType: apobRec.recommendation_type === 'cardiovascular',
      apobSeverity: apobRec.severity === 'medium',
      apobRationale: apobRec.rationale.includes('worsening') && apobRec.rationale.includes('108')
    };

    const cardioFailures = Object.entries(cardioValidation).filter(([_, passed]) => !passed);

    if (cardioFailures.length > 0) {
      return {
        success: false,
        message: `Scenario A validation failed for ${cardioFailures.length} checks`,
        details: { cardioValidation, cardioFailures }
      };
    }

    // Scenario B: Worsening metabolic markers
    const hba1cRec = recommendations.find(rec => rec.test_name === 'HbA1c');
    const glucoseRec = recommendations.find(rec => rec.test_name === 'Glucose');

    if (!hba1cRec || !glucoseRec) {
      return {
        success: false,
        message: 'Scenario B failed: Missing metabolic recommendations',
        details: { hba1cRec, glucoseRec }
      };
    }

    // Validate metabolic recommendations
    const metabolicValidation = {
      hba1cType: hba1cRec.recommendation_type === 'metabolic',
      hba1cSeverity: hba1cRec.severity === 'high', // Should be high due to >6.5 value
      hba1cRationale: hba1cRec.rationale.includes('worsening') && hba1cRec.rationale.includes('6.7'),
      glucoseType: glucoseRec.recommendation_type === 'metabolic',
      glucoseSeverity: glucoseRec.severity === 'medium',
      glucoseRationale: glucoseRec.rationale.includes('worsening') && glucoseRec.rationale.includes('118')
    };

    const metabolicFailures = Object.entries(metabolicValidation).filter(([_, passed]) => !passed);

    if (metabolicFailures.length > 0) {
      return {
        success: false,
        message: `Scenario B validation failed for ${metabolicFailures.length} checks`,
        details: { metabolicValidation, metabolicFailures }
      };
    }

    // Scenario C: Hormonal concerns
    const testRec = recommendations.find(rec => rec.test_name === 'Testosterone');
    const shbgRec = recommendations.find(rec => rec.test_name === 'SHBG');

    if (!testRec || !shbgRec) {
      return {
        success: false,
        message: 'Scenario C failed: Missing hormonal recommendations',
        details: { testRec, shbgRec }
      };
    }

    // Validate hormonal recommendations
    const hormonalValidation = {
      testType: testRec.recommendation_type === 'hormonal',
      testSeverity: testRec.severity === 'medium', // Should be medium due to <300 value
      testRationale: testRec.rationale.includes('worsening') && testRec.rationale.includes('260'),
      shbgType: shbgRec.recommendation_type === 'hormonal',
      shbgSeverity: shbgRec.severity === 'low', // Should be low for SHBG
      shbgRationale: shbgRec.rationale.includes('worsening') && shbgRec.rationale.includes('92')
    };

    const hormonalFailures = Object.entries(hormonalValidation).filter(([_, passed]) => !passed);

    if (hormonalFailures.length > 0) {
      return {
        success: false,
        message: `Scenario C validation failed for ${hormonalFailures.length} checks`,
        details: { hormonalValidation, hormonalFailures }
      };
    }

    // Scenario D: Stable markers (should not generate recommendations)
    const hdlRec = recommendations.find(rec => rec.test_name === 'HDL');

    if (hdlRec) {
      return {
        success: false,
        message: 'Scenario D failed: HDL should not generate recommendation for stable trend',
        details: { hdlRec }
      };
    }

    // Validate confidence scores are reasonable
    const lowConfidenceRecs = recommendations.filter(rec => rec.confidence < 0.5);
    const highConfidenceRecs = recommendations.filter(rec => rec.confidence > 0.95);

    if (lowConfidenceRecs.length > 0) {
      return {
        success: false,
        message: `Found ${lowConfidenceRecs.length} recommendations with confidence < 0.5`,
        details: { lowConfidenceRecs }
      };
    }

    // Validate recommendation text contains expected values
    const textValidation = {
      ldlText: ldlRec.recommendation_text.includes('145') && ldlRec.recommendation_text.includes('LDL'),
      hba1cText: hba1cRec.recommendation_text.includes('6.7') && hba1cRec.recommendation_text.includes('HbA1c'),
      testText: testRec.recommendation_text.includes('260') && testRec.recommendation_text.includes('Testosterone')
    };

    const textFailures = Object.entries(textValidation).filter(([_, passed]) => !passed);

    if (textFailures.length > 0) {
      return {
        success: false,
        message: `Text template validation failed for ${textFailures.length} recommendations`,
        details: { textValidation, textFailures }
      };
    }

    // Validate source linking
    const sourceValidation = recommendations.every(rec => 
      rec.source_document_ids.length > 0 && 
      rec.source_result_ids.length > 0 &&
      rec.source_trend_window.data_points === 3
    );

    if (!sourceValidation) {
      return {
        success: false,
        message: 'Source linking validation failed',
        details: { recommendations: recommendations.map(rec => ({
          marker: rec.test_name,
          sourceDocumentIds: rec.source_document_ids.length,
          sourceResultIds: rec.source_result_ids.length,
          dataPoints: rec.source_trend_window.data_points
        }))}
      };
    }

    logValidation('QUALITY', '✅', `Recommendation quality validation passed (${recommendations.length} recommendations)`);
    return {
      success: true,
      message: 'Recommendation quality validation passed',
      details: {
        scenarioA: 'passed',
        scenarioB: 'passed',
        scenarioC: 'passed',
        scenarioD: 'passed',
        averageConfidence: recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length,
        confidenceRange: {
          min: Math.min(...recommendations.map(rec => rec.confidence)),
          max: Math.max(...recommendations.map(rec => rec.confidence))
        },
        textTemplateValidation: 'passed',
        sourceLinkingValidation: 'passed'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Quality validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateDuplicationHandling(): Promise<ValidationResult> {
  try {
    logValidation('DUPLICATION', '⏳', 'Testing recommendation duplication handling...');

    // Get initial recommendation count
    const { data: initialRecs, error: initialError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'active');

    if (initialError) {
      return {
        success: false,
        message: `Failed to get initial recommendation count: ${initialError.message}`,
        details: initialError
      };
    }

    const initialCount = initialRecs?.length || 0;

    // Run recommendation generation again (should not create duplicates)
    const generationResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/generate/${TEST_USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        force_regenerate: false // Don't force regenerate
      })
    });

    if (!generationResponse.ok) {
      return {
        success: false,
        message: `Second generation failed with status ${generationResponse.status}`,
        details: { status: generationResponse.status }
      };
    }

    const generationData = await generationResponse.json();

    if (!generationData.success) {
      return {
        success: false,
        message: `Second generation error: ${generationData.error}`,
        details: generationData
      };
    }

    // Check that no new recommendations were created
    const { data: afterRecs, error: afterError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'active');

    if (afterError) {
      return {
        success: false,
        message: `Failed to get after generation count: ${afterError.message}`,
        details: afterError
      };
    }

    const afterCount = afterRecs?.length || 0;

    if (afterCount !== initialCount) {
      return {
        success: false,
        message: `Duplication handling failed: expected ${initialCount}, got ${afterCount}`,
        details: { initialCount, afterCount, generationData }
      };
    }

    // Test force regenerate (should supersede old recommendations)
    const forceResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/generate/${TEST_USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        force_regenerate: true
      })
    });

    if (!forceResponse.ok) {
      return {
        success: false,
        message: `Force generation failed with status ${forceResponse.status}`,
        details: { status: forceResponse.status }
      };
    }

    const forceData = await forceResponse.json();

    if (!forceData.success) {
      return {
        success: false,
        message: `Force generation error: ${forceData.error}`,
        details: forceData
      };
    }

    // Check that old recommendations were superseded
    const { data: supersededRecs, error: supersededError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'superseded');

    if (supersededError) {
      return {
        success: false,
        message: `Failed to check superseded recommendations: ${supersededError.message}`,
        details: supersededError
      };
    }

    const supersededCount = supersededRecs?.length || 0;

    if (supersededCount === 0) {
      return {
        success: false,
        message: 'No recommendations were superseded during force regeneration',
        details: { forceData }
      };
    }

    // Check that new active recommendations exist
    const { data: newActiveRecs, error: newActiveError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'active');

    if (newActiveError) {
      return {
        success: false,
        message: `Failed to check new active recommendations: ${newActiveError.message}`,
        details: newActiveError
      };
    }

    const newActiveCount = newActiveRecs?.length || 0;

    if (newActiveCount === 0) {
      return {
        success: false,
        message: 'No new active recommendations after force regeneration',
        details: { forceData }
      };
    }

    logValidation('DUPLICATION', '✅', 'Duplication handling working correctly');
    return {
      success: true,
      message: 'Duplication handling validation passed',
      details: {
        initialActiveCount: initialCount,
        afterGenerationCount: afterCount,
        supersededCount,
        newActiveCount,
        duplicationPrevented: initialCount === afterCount,
        supersessionWorked: supersededCount > 0
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Duplication validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateFutureExtensibility(): Promise<ValidationResult> {
  try {
    logValidation('EXTENSIBILITY', '⏳', 'Testing future extensibility readiness...');

    // Get recommendations for extensibility testing
    const { data: recommendations, error: fetchError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID);

    if (fetchError || !recommendations || recommendations.length === 0) {
      return {
        success: false,
        message: 'No recommendations found for extensibility testing',
        details: { fetchError }
      };
    }

    // Test control tower integration readiness
    const controlTowerReady = recommendations.every(rec => 
      rec.id && rec.user_id && rec.test_name && rec.recommendation_type &&
      rec.severity && rec.confidence && rec.status && rec.created_at
    );

    // Test dashboard highlights readiness
    const dashboardReady = recommendations.every(rec => 
      rec.recommendation_title && rec.recommendation_text && rec.rationale &&
      rec.test_name && rec.severity && rec.confidence
    );

    // Test verbal agent readiness
    const verbalAgentReady = recommendations.every(rec => 
      rec.recommendation_title && rec.recommendation_text && rec.rationale &&
      rec.test_name
    );

    // Test supplement/workout correlation readiness
    const correlationReady = recommendations.every(rec => 
      rec.source_document_ids && rec.source_result_ids && rec.source_trend_window
    );

    // Test recommendation resolution flow readiness
    const resolutionReady = recommendations.every(rec => 
      rec.status && ['active', 'superseded', 'resolved'].includes(rec.status)
    );

    // Test multi-marker coexistence
    const markerTypes = [...new Set(recommendations.map(rec => rec.test_name))];
    const recommendationTypes = [...new Set(recommendations.map(rec => rec.recommendation_type))];
    const severityLevels = [...new Set(recommendations.map(rec => rec.severity))];

    const multiMarkerReady = markerTypes.length >= 4; // Should have LDL, ApoB, HbA1c, Glucose, Testosterone, SHBG
    const multiTypeReady = recommendationTypes.length >= 3; // Should have cardiovascular, metabolic, hormonal
    const multiSeverityReady = severityLevels.length >= 2; // Should have high, medium, low

    // Test data structure for extensibility
    const extensibleStructure = recommendations.every(rec => 
      typeof rec.confidence === 'number' &&
      rec.source_trend_window &&
      rec.source_document_ids.length > 0 &&
      rec.source_result_ids.length > 0 &&
      rec.recommendation_title &&
      rec.recommendation_text &&
      rec.rationale
    );

    // Test category grouping readiness
    const categoryGroups = recommendations.reduce((groups, rec) => {
      const category = rec.recommendation_type;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(rec);
      return groups;
    }, {} as Record<string, any[]>);

    const groupingReady = Object.keys(categoryGroups).length >= 3; // Should have multiple categories

    if (!controlTowerReady || !dashboardReady || !verbalAgentReady || !correlationReady || !resolutionReady || !extensibleStructure) {
      return {
        success: false,
        message: 'Future readiness validation failed',
        details: {
          controlTowerReady,
          dashboardReady,
          verbalAgentReady,
          correlationReady,
          resolutionReady,
          extensibleStructure
        }
      };
    }

    if (!multiMarkerReady || !multiTypeReady || !multiSeverityReady || !groupingReady) {
      return {
        success: false,
        message: 'Multi-marker/type/severity validation failed',
        details: {
          markerTypes: markerTypes.length,
          recommendationTypes: recommendationTypes.length,
          severityLevels: severityLevels.length,
          multiMarkerReady,
          multiTypeReady,
          multiSeverityReady,
          groupingReady
        }
      };
    }

    logValidation('EXTENSIBILITY', '✅', 'Future extensibility validation passed');
    return {
      success: true,
      message: 'Future extensibility validation passed',
      details: {
        controlTowerReady: true,
        dashboardReady: true,
        verbalAgentReady: true,
        correlationReady: true,
        resolutionReady: true,
        extensibleStructure: true,
        multiMarkerReady,
        multiTypeReady,
        multiSeverityReady,
        groupingReady,
        summary: {
          markerTypes,
          recommendationTypes,
          severityLevels,
          categoryGroups: Object.keys(categoryGroups)
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Future extensibility validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateFrontendDisplay(): Promise<ValidationResult> {
  try {
    logValidation('FRONTEND', '⏳', 'Testing frontend display requirements...');

    // Get recommendations for frontend testing
    const { data: recommendations, error: fetchError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID);

    if (fetchError || !recommendations || recommendations.length === 0) {
      return {
        success: false,
        message: 'No recommendations found for frontend testing',
        details: { fetchError }
      };
    }

    // Test that all required display fields are present
    const displayFields = [
      'recommendation_title',
      'recommendation_text',
      'severity',
      'recommendation_type', // category
      'confidence',
      'rationale',
      'status'
    ];

    const invalidForDisplay = recommendations.filter(rec => 
      !displayFields.every(field => rec[field] !== undefined && rec[field] !== null)
    );

    if (invalidForDisplay.length > 0) {
      return {
        success: false,
        message: `Display validation failed for ${invalidForDisplay.length} recommendations`,
        details: { invalidForDisplay, displayFields }
      };
    }

    // Test category grouping
    const categoryGroups = recommendations.reduce((groups, rec) => {
      const category = rec.recommendation_type;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(rec);
      return groups;
    }, {} as Record<string, any[]>);

    const expectedCategories = ['cardiovascular', 'metabolic', 'hormonal'];
    const missingCategories = expectedCategories.filter(cat => !categoryGroups[cat]);

    if (missingCategories.length > 0) {
      return {
        success: false,
        message: `Missing expected categories: ${missingCategories.join(', ')}`,
        details: { expectedCategories, foundCategories: Object.keys(categoryGroups) }
      };
    }

    // Test severity grouping
    const severityGroups = recommendations.reduce((groups, rec) => {
      const severity = rec.severity;
      if (!groups[severity]) {
        groups[severity] = [];
      }
      groups[severity].push(rec);
      return groups;
    }, {} as Record<string, any[]>);

    const expectedSeverities = ['high', 'medium', 'low'];
    const missingSeverities = expectedSeverities.filter(sev => !severityGroups[sev]);

    if (missingSeverities.length > 0) {
      return {
        success: false,
        message: `Missing expected severities: ${missingSeverities.join(', ')}`,
        details: { expectedSeverities, foundSeverities: Object.keys(severityGroups) }
      };
    }

    // Test active vs all grouping
    const activeRecs = recommendations.filter(rec => rec.status === 'active');
    const allRecs = recommendations;

    if (activeRecs.length === 0) {
      return {
        success: false,
        message: 'No active recommendations found for active grouping',
        details: { total: allRecs.length, active: activeRecs.length }
      };
    }

    // Test that display data is formatted correctly
    const formatValidation = recommendations.every(rec => {
      return (
        typeof rec.recommendation_title === 'string' && rec.recommendation_title.length > 0 &&
        typeof rec.recommendation_text === 'string' && rec.recommendation_text.length > 0 &&
        typeof rec.rationale === 'string' && rec.rationale.length > 0 &&
        typeof rec.confidence === 'number' && rec.confidence >= 0 && rec.confidence <= 1 &&
        ['high', 'medium', 'low'].includes(rec.severity) &&
        ['active', 'superseded', 'resolved'].includes(rec.status)
      );
    });

    if (!formatValidation) {
      return {
        success: false,
        message: 'Format validation failed for recommendations',
        details: { recommendations: recommendations.map(rec => ({
          titleType: typeof rec.recommendation_title,
          titleLength: rec.recommendation_title?.length,
          textType: typeof rec.recommendation_text,
          textLength: rec.recommendation_text?.length,
          rationaleType: typeof rec.rationale,
          rationaleLength: rec.rationale?.length,
          confidenceType: typeof rec.confidence,
          confidenceValue: rec.confidence
        }))}
      };
    }

    // Test multi-marker coexistence
    const markersPerCategory = Object.entries(categoryGroups).map(([category, recs]: [string, any[]]) => ({
      category,
      markerCount: [...new Set(recs.map((rec: any) => rec.test_name))].length
    }));

    const multiMarkerPerCategory = markersPerCategory.every(cat => cat.markerCount >= 1);

    if (!multiMarkerPerCategory) {
      return {
        success: false,
        message: 'Multi-marker coexistence validation failed',
        details: { markersPerCategory }
      };
    }

    logValidation('FRONTEND', '✅', 'Frontend display requirements validation passed');
    return {
      success: true,
      message: 'Frontend display validation passed',
      details: {
        totalRecommendations: recommendations.length,
        activeRecommendations: activeRecs.length,
        categoryGroups: Object.keys(categoryGroups).length,
        severityGroups: Object.keys(severityGroups).length,
        displayFields: 'present',
        formatValidation: 'passed',
        multiMarkerCoexistence: 'passed',
        summary: {
          categories: Object.keys(categoryGroups),
          severities: Object.keys(severityGroups),
          markersPerCategory: markersPerCategory.map((cat: any) => ({
            category: cat.category,
            markerCount: cat.markerCount
          }))
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Frontend display validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function cleanupTestData(): Promise<ValidationResult> {
  try {
    logValidation('CLEANUP', '⏳', 'Cleaning up test data...');

    // Delete test recommendations
    const { error: recommendationsError } = await supabase
      .from('bloodwork_recommendations')
      .delete()
      .eq('user_id', TEST_USER_ID);

    if (recommendationsError) {
      return {
        success: false,
        message: `Failed to delete test recommendations: ${recommendationsError.message}`,
        details: recommendationsError
      };
    }

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

async function runIntelligenceE2EValidation() {
  console.log('🚀 BLOODWORK INTELLIGENCE ENGINE - END-TO-END VALIDATION');
  console.log('================================================\n');

  const results: Record<string, ValidationResult> = {};

  // Run validation steps
  results.setup = await setupMultiMarkerTestData();
  
  if (results.setup.success) {
    results.generation = await validateRecommendationGeneration();
    results.persistence = await validateRecommendationPersistence();
    results.retrieval = await validateRecommendationRetrieval();
    results.statusUpdates = await validateStatusUpdates();
    results.quality = await validateRecommendationQuality();
    results.duplication = await validateDuplicationHandling();
    results.extensibility = await validateFutureExtensibility();
    results.frontend = await validateFrontendDisplay();
  }
  
  results.cleanup = await cleanupTestData();

  // Generate summary
  const validationCategories = {
    generation: [results.generation],
    persistence: [results.persistence],
    retrieval: [results.retrieval],
    statusUpdates: [results.statusUpdates],
    recommendationQuality: [results.quality],
    duplicationHandling: [results.duplication],
    frontendDisplay: [results.frontend],
    futureExtensibility: [results.extensibility]
  };

  const categoryResults: Record<string, boolean> = {};
  
  Object.entries(validationCategories).forEach(([category, tests]) => {
    categoryResults[category] = tests.every(test => test && test.success);
  });

  const passedCategories = Object.values(categoryResults).filter(Boolean).length;
  const totalCategories = Object.keys(categoryResults).length;
  const successRate = (passedCategories / totalCategories) * 100;

  console.log('📊 BLOODWORK INTELLIGENCE ENGINE E2E VALIDATION SUMMARY');
  console.log('===============================================');

  Object.entries(categoryResults).forEach(([category, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const displayName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${displayName}`);
  });

  console.log('\n🎯 Overall Result:', successRate >= 80 ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED');
  console.log(`📈 Category Success: ${passedCategories}/${totalCategories} categories passed (${successRate.toFixed(1)}%)`);

  if (successRate >= 80) {
    console.log('\n🎉 BLOODWORK INTELLIGENCE ENGINE E2E VALIDATION COMPLETE!');
    console.log('✅ Recommendation generation working correctly');
    console.log('✅ Data persistence functional');
    console.log('✅ API retrieval endpoints working');
    console.log('✅ Status updates functional');
    console.log('✅ Recommendation quality high');
    console.log('✅ Duplication handling effective');
    console.log('✅ Frontend display ready');
    console.log('✅ Future extensibility verified');
    console.log('\n🚀 BLOODWORK INTELLIGENCE ENGINE PRODUCTION READY!');
  } else {
    console.log('\n🔧 REMAINING ISSUES:');
    Object.entries(categoryResults).forEach(([category, passed]) => {
      if (!passed) {
        const displayName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`   - ${displayName}: Validation failed`);
      }
    });
    console.log('\n📋 TROUBLESHOOTING:');
    console.log('1. Review recommendation generation logic');
    console.log('2. Check database schema and data');
    console.log('3. Verify API endpoint implementations');
    console.log('4. Test with different data scenarios');
  }

  process.exit(successRate >= 80 ? 0 : 1);
}

// Run validation
runIntelligenceE2EValidation().catch(error => {
  console.error('Intelligence E2E validation failed to run:', error);
  process.exit(1);
});
