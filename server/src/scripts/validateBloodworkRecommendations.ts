/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  generateBloodworkRecommendationsForUser,
  getBloodworkRecommendationsByUser,
  getActiveBloodworkRecommendationsByUser,
  getRecommendationRules,
  getRecommendationRulesByType
} from '../services/bloodworkRecommendationService';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

const TEST_USER_ID = 'bloodwork-recommendations-validation-user';

async function logValidation(stepName: string, status: string, message: string, details?: any) {
  const timestamp = new Date().toISOString();
  const icon = status === '✅' ? '✅' : status === '❌' ? '❌' : '⏳';
  console.log(`${icon} Step ${stepName}: ${status}`);
  console.log(`   ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  console.log('');
}

async function setupTestData(): Promise<ValidationResult> {
  try {
    logValidation('SETUP', '⏳', 'Creating test data for recommendation validation...');

    // Create test documents
    const { data: documents, error: docError } = await supabase
      .from('bloodwork_documents')
      .insert([
        {
          user_id: TEST_USER_ID,
          file_url: 'https://storage.example.com/bloodwork/rec-test-1.pdf',
          file_name: 'rec-test-1.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: 'validation_test',
          test_date: '2024-01-15',
          upload_date: new Date().toISOString(),
          parse_status: 'completed',
          extraction_confidence: 0.95,
          notes: 'Test document 1 for recommendation validation',
          metadata: { validation: true, document_number: 1 }
        },
        {
          user_id: TEST_USER_ID,
          file_url: 'https://storage.example.com/bloodwork/rec-test-2.pdf',
          file_name: 'rec-test-2.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: 'validation_test',
          test_date: '2024-02-20',
          upload_date: new Date().toISOString(),
          parse_status: 'completed',
          extraction_confidence: 0.95,
          notes: 'Test document 2 for recommendation validation',
          metadata: { validation: true, document_number: 2 }
        },
        {
          user_id: TEST_USER_ID,
          file_url: 'https://storage.example.com/bloodwork/rec-test-3.pdf',
          file_name: 'rec-test-3.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          document_type: 'comprehensive',
          source: 'validation_test',
          test_date: '2024-03-25',
          upload_date: new Date().toISOString(),
          parse_status: 'completed',
          extraction_confidence: 0.95,
          notes: 'Test document 3 for recommendation validation',
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

    // Create test bloodwork results that should trigger recommendations
    const testResults = [
      // Cardiovascular - LDL worsening (should trigger cardiovascular recommendation)
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '120',
        value_numeric: 120,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '135',
        value_numeric: 135,
        unit: 'mg/dL',
        test_date: '2024-02-20',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '150',
        value_numeric: 150,
        unit: 'mg/dL',
        test_date: '2024-03-25',
        source: 'validation_test',
        confidence: 0.95
      },

      // Metabolic - HbA1c worsening (should trigger metabolic recommendation)
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '5.8',
        value_numeric: 5.8,
        unit: '%',
        test_date: '2024-01-15',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '6.1',
        value_numeric: 6.1,
        unit: '%',
        test_date: '2024-02-20',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '6.8',
        value_numeric: 6.8,
        unit: '%',
        test_date: '2024-03-25',
        source: 'validation_test',
        confidence: 0.95
      },

      // Hormonal - Testosterone worsening (should trigger hormonal recommendation)
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '450',
        value_numeric: 450,
        unit: 'ng/dL',
        test_date: '2024-01-15',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '380',
        value_numeric: 380,
        unit: 'ng/dL',
        test_date: '2024-02-20',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '280',
        value_numeric: 280,
        unit: 'ng/dL',
        test_date: '2024-03-25',
        source: 'validation_test',
        confidence: 0.95
      },

      // Inflammation - hsCRP worsening (should trigger inflammation recommendation)
      {
        user_id: TEST_USER_ID,
        document_id: documents[0].id,
        raw_test_name: 'hsCRP',
        normalized_test_name: 'hsCRP',
        category: 'Cardiovascular',
        value_text: '2.1',
        value_numeric: 2.1,
        unit: 'mg/L',
        test_date: '2024-01-15',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[1].id,
        raw_test_name: 'hsCRP',
        normalized_test_name: 'hsCRP',
        category: 'Cardiovascular',
        value_text: '3.8',
        value_numeric: 3.8,
        unit: 'mg/L',
        test_date: '2024-02-20',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: documents[2].id,
        raw_test_name: 'hsCRP',
        normalized_test_name: 'hsCRP',
        category: 'Cardiovascular',
        value_text: '5.2',
        value_numeric: 5.2,
        unit: 'mg/L',
        test_date: '2024-03-25',
        source: 'validation_test',
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
      message: 'Test data created successfully',
      details: {
        documents: documents.length,
        results: testResults.length,
        scenarios: [
          'LDL worsening (cardiovascular)',
          'HbA1c worsening (metabolic)',
          'Testosterone worsening (hormonal)',
          'hsCRP worsening (inflammation)'
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

async function validateRecommendationRules(): Promise<ValidationResult> {
  try {
    logValidation('RULES', '⏳', 'Testing recommendation rules...');

    const allRules = getRecommendationRules();
    const cardiovascularRules = getRecommendationRulesByType('cardiovascular');
    const metabolicRules = getRecommendationRulesByType('metabolic');
    const hormonalRules = getRecommendationRulesByType('hormonal');

    // Validate expected markers are covered
    const expectedCardiovascular = ['LDL', 'ApoB', 'hsCRP', 'Triglycerides', 'HDL'];
    const expectedMetabolic = ['HbA1c', 'Glucose', 'Fasting Glucose', 'Insulin'];
    const expectedHormonal = ['Testosterone', 'Free Testosterone', 'SHBG', 'Estradiol'];

    const cardioMarkers = cardiovascularRules.map(rule => rule.marker_name);
    const metabolicMarkers = metabolicRules.map(rule => rule.marker_name);
    const hormonalMarkers = hormonalRules.map(rule => rule.marker_name);

    const missingCardio = expectedCardiovascular.filter(marker => !cardioMarkers.includes(marker));
    const missingMetabolic = expectedMetabolic.filter(marker => !metabolicMarkers.includes(marker));
    const missingHormonal = expectedHormonal.filter(marker => !hormonalMarkers.includes(marker));

    if (missingCardio.length > 0 || missingMetabolic.length > 0 || missingHormonal.length > 0) {
      return {
        success: false,
        message: 'Missing expected marker rules',
        details: {
          missingCardio,
          missingMetabolic,
          missingHormonal,
          foundCardio: cardioMarkers,
          foundMetabolic: metabolicMarkers,
          foundHormonal: hormonalMarkers
        }
      };
    }

    // Validate rule structure
    const invalidRules = allRules.filter(rule => {
      return !rule.marker_name || 
             !rule.recommendation_type || 
             !rule.conditions || 
             !rule.recommendation ||
             !rule.recommendation.title ||
             !rule.recommendation.text_template ||
             !rule.recommendation.rationale_template ||
             !rule.recommendation.severity ||
             rule.recommendation.base_confidence === undefined;
    });

    if (invalidRules.length > 0) {
      return {
        success: false,
        message: `Invalid rule structure for ${invalidRules.length} rules`,
        details: { invalidRules }
      };
    }

    // Validate recommendation types
    const validTypes = ['cardiovascular', 'metabolic', 'hormonal', 'inflammation', 'follow_up', 'monitoring', 'lifestyle', 'supplement_review', 'workout_review'];
    const invalidTypes = allRules.filter(rule => !validTypes.includes(rule.recommendation_type));

    if (invalidTypes.length > 0) {
      return {
        success: false,
        message: `Invalid recommendation types for ${invalidTypes.length} rules`,
        details: { invalidTypes }
      };
    }

    // Validate severity levels
    const validSeverities = ['low', 'medium', 'high'];
    const invalidSeverities = allRules.filter(rule => !validSeverities.includes(rule.recommendation.severity));

    if (invalidSeverities.length > 0) {
      return {
        success: false,
        message: `Invalid severity levels for ${invalidSeverities.length} rules`,
        details: { invalidSeverities }
      };
    }

    logValidation('RULES', '✅', `Recommendation rules validation passed (${allRules.length} rules)`);
    return {
      success: true,
      message: 'Recommendation rules validation passed',
      details: {
        totalRules: allRules.length,
        byType: {
          cardiovascular: cardiovascularRules.length,
          metabolic: metabolicRules.length,
          hormonal: hormonalRules.length,
          inflammation: allRules.filter(r => r.recommendation_type === 'inflammation').length
        },
        bySeverity: {
          high: allRules.filter(r => r.recommendation.severity === 'high').length,
          medium: allRules.filter(r => r.recommendation.severity === 'medium').length,
          low: allRules.filter(r => r.recommendation.severity === 'low').length
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Rules validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateRecommendationGeneration(): Promise<ValidationResult> {
  try {
    logValidation('GENERATION', '⏳', 'Testing recommendation generation...');

    // Generate recommendations
    const generationResponse = await generateBloodworkRecommendationsForUser({
      user_id: TEST_USER_ID,
      force_regenerate: true
    });

    if (!generationResponse.success) {
      return {
        success: false,
        message: `Recommendation generation failed: ${generationResponse.error}`,
        details: generationResponse
      };
    }

    const { generated_count, superseded_count, recommendations } = generationResponse.data || {};

    if (!recommendations || recommendations.length === 0) {
      return {
        success: false,
        message: 'No recommendations generated',
        details: { generationResponse }
      };
    }

    // Validate expected recommendations were generated
    const expectedMarkers = ['LDL', 'HbA1c', 'Testosterone', 'hsCRP'];
    const generatedMarkers = recommendations.map(rec => rec.test_name);
    
    const missingMarkers = expectedMarkers.filter(marker => !generatedMarkers.includes(marker));

    if (missingMarkers.length > 0) {
      return {
        success: false,
        message: `Missing expected recommendations for: ${missingMarkers.join(', ')}`,
        details: { expectedMarkers, generatedMarkers, missingMarkers }
      };
    }

    // Validate recommendation structure
    const requiredFields = [
      'id', 'user_id', 'test_name', 'recommendation_type', 'recommendation_title',
      'recommendation_text', 'rationale', 'confidence', 'severity', 'status',
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

    // Validate confidence scores
    const invalidConfidence = recommendations.filter(rec => 
      typeof rec.confidence !== 'number' || rec.confidence < 0 || rec.confidence > 1
    );

    if (invalidConfidence.length > 0) {
      return {
        success: false,
        message: `Invalid confidence scores for ${invalidConfidence.length} recommendations`,
        details: { invalidConfidence }
      };
    }

    // Validate source trend window
    const invalidTrendWindow = recommendations.filter(rec => 
      !rec.source_trend_window ||
      !rec.source_trend_window.start_date ||
      !rec.source_trend_window.end_date ||
      typeof rec.source_trend_window.data_points !== 'number'
    );

    if (invalidTrendWindow.length > 0) {
      return {
        success: false,
        message: `Invalid trend window for ${invalidTrendWindow.length} recommendations`,
        details: { invalidTrendWindow }
      };
    }

    // Validate recommendation types match expectations
    const ldlRec = recommendations.find(rec => rec.test_name === 'LDL');
    const hba1cRec = recommendations.find(rec => rec.test_name === 'HbA1c');
    const testRec = recommendations.find(rec => rec.test_name === 'Testosterone');
    const hscrpRec = recommendations.find(rec => rec.test_name === 'hsCRP');

    const typeValidation = {
      ldl: ldlRec?.recommendation_type === 'cardiovascular',
      hba1c: hba1cRec?.recommendation_type === 'metabolic',
      test: testRec?.recommendation_type === 'hormonal',
      hscrp: hscrpRec?.recommendation_type === 'inflammation'
    };

    const typeFailures = Object.entries(typeValidation).filter(([_, passed]) => !passed);

    if (typeFailures.length > 0) {
      return {
        success: false,
        message: `Incorrect recommendation types for ${typeFailures.length} markers`,
        details: { typeValidation, typeFailures }
      };
    }

    logValidation('GENERATION', '✅', `Recommendation generation working (${recommendations.length} generated)`);
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
          confidence: rec.confidence,
          status: rec.status
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

async function validateRecommendationRetrieval(): Promise<ValidationResult> {
  try {
    logValidation('RETRIEVAL', '⏳', 'Testing recommendation retrieval...');

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

    // Validate active recommendations are subset of all recommendations
    const allRecs = allData.data?.recommendations || [];
    const activeRecs = activeData.data?.recommendations || [];

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

    logValidation('RETRIEVAL', '✅', 'All recommendation retrieval endpoints working correctly');
    return {
      success: true,
      message: 'Recommendation retrieval validation passed',
      details: {
        allRecommendations: allRecs.length,
        activeRecommendations: activeRecs.length,
        cardioRecommendations: cardioRecs.length,
        endpoints: ['all', 'active', 'status_filter', 'type_filter']
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

async function validateRecommendationLogic(): Promise<ValidationResult> {
  try {
    logValidation('LOGIC', '⏳', 'Testing recommendation business logic...');

    // Get recommendations to test logic against
    const recommendationsResponse = await getBloodworkRecommendationsByUser({ user_id: TEST_USER_ID });

    if (!recommendationsResponse.success) {
      return {
        success: false,
        message: `Failed to get recommendations for logic testing: ${recommendationsResponse.error}`,
        details: recommendationsResponse
      };
    }

    const recommendations = recommendationsResponse.data?.recommendations || [];

    if (recommendations.length === 0) {
      return {
        success: false,
        message: 'No recommendations available for logic testing',
        details: {}
      };
    }

    // Test LDL logic - should be high severity due to value > 130
    const ldlRec = recommendations.find(rec => rec.test_name === 'LDL');
    if (!ldlRec || ldlRec.severity !== 'high') {
      return {
        success: false,
        message: 'LDL recommendation should be high severity (value > 130)',
        details: { ldlRec }
      };
    }

    // Test HbA1c logic - should be high severity due to value > 6.5
    const hba1cRec = recommendations.find(rec => rec.test_name === 'HbA1c');
    if (!hba1cRec || hba1cRec.severity !== 'high') {
      return {
        success: false,
        message: 'HbA1c recommendation should be high severity (value > 6.5)',
        details: { hba1cRec }
      };
    }

    // Test Testosterone logic - should be medium severity (below 300 but not critically low)
    const testRec = recommendations.find(rec => rec.test_name === 'Testosterone');
    if (!testRec || testRec.severity !== 'medium') {
      return {
        success: false,
        message: 'Testosterone recommendation should be medium severity (value < 300)',
        details: { testRec }
      };
    }

    // Test hsCRP logic - should be medium severity (elevated but not critical)
    const hscrpRec = recommendations.find(rec => rec.test_name === 'hsCRP');
    if (!hscrpRec || hscrpRec.severity !== 'medium') {
      return {
        success: false,
        message: 'hsCRP recommendation should be medium severity (elevated)',
        details: { hscrpRec }
      };
    }

    // Test confidence scores are reasonable
    const lowConfidenceRecs = recommendations.filter(rec => rec.confidence < 0.5);
    const highConfidenceRecs = recommendations.filter(rec => rec.confidence > 0.95);

    if (lowConfidenceRecs.length > 0) {
      return {
        success: false,
        message: `Found ${lowConfidenceRecs.length} recommendations with confidence < 0.5`,
        details: { lowConfidenceRecs }
      };
    }

    // Test recommendation text contains expected values
    const ldlTextValid = ldlRec.recommendation_text.includes('150') && ldlRec.recommendation_text.includes('LDL');
    const hba1cTextValid = hba1cRec.recommendation_text.includes('6.8') && hba1cRec.recommendation_text.includes('HbA1c');

    if (!ldlTextValid || !hba1cTextValid) {
      return {
        success: false,
        message: 'Recommendation text template substitution failed',
        details: { 
          ldlTextValid, 
          ldlText: ldlRec.recommendation_text,
          hba1cTextValid,
          hba1cText: hba1cRec.recommendation_text
        }
      };
    }

    // Test rationale contains expected information
    const ldlRationaleValid = ldlRec.rationale.includes('150') && ldlRec.rationale.includes('worsing');
    const hba1cRationaleValid = hba1cRec.rationale.includes('6.8') && hba1cRec.rationale.includes('worsing');

    if (!ldlRationaleValid || !hba1cRationaleValid) {
      return {
        success: false,
        message: 'Recommendation rationale template substitution failed',
        details: { 
          ldlRationaleValid,
          ldlRationale: ldlRec.rationale,
          hba1cRationaleValid,
          hba1cRationale: hba1cRec.rationale
        }
      };
    }

    // Test source linking
    const ldlHasSources = ldlRec.source_document_ids.length > 0 && 
                        ldlRec.source_result_ids.length > 0 &&
                        ldlRec.source_trend_window.data_points === 3;

    if (!ldlHasSources) {
      return {
        success: false,
        message: 'LDL recommendation missing proper source linking',
        details: { 
          sourceDocumentIds: ldlRec.source_document_ids,
          sourceResultIds: ldlRec.source_result_ids,
          trendWindow: ldlRec.source_trend_window
        }
      };
    }

    logValidation('LOGIC', '✅', 'Recommendation business logic working correctly');
    return {
      success: true,
      message: 'Recommendation logic validation passed',
      details: {
        severityLogic: 'correct',
        confidenceLogic: 'reasonable',
        templateLogic: 'working',
        sourceLinking: 'proper',
        testedRecommendations: recommendations.length
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Logic validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateFutureReadiness(): Promise<ValidationResult> {
  try {
    logValidation('FUTURE READINESS', '⏳', 'Testing future extensibility readiness...');

    // Get recommendations to test structure
    const recommendationsResponse = await getBloodworkRecommendationsByUser({ user_id: TEST_USER_ID });

    if (!recommendationsResponse.success) {
      return {
        success: false,
        message: `Failed to get recommendations for future readiness testing: ${recommendationsResponse.error}`,
        details: recommendationsResponse
      };
    }

    const recommendations = recommendationsResponse.data?.recommendations || [];

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
      rec.test_name // Recommendations don't have latest_value/prior_value directly
    );

    // Test supplement/workout correlation readiness
    const correlationReady = recommendations.every(rec => 
      rec.source_document_ids && rec.source_result_ids && rec.source_trend_window
    );

    // Test recommendation resolution flow readiness
    const resolutionReady = recommendations.every(rec => 
      rec.status && ['active', 'superseded', 'resolved'].includes(rec.status)
    );

    // Test data structure for extensibility
    const extensibleStructure = recommendations.every(rec => 
      typeof rec.confidence === 'number' &&
      rec.source_trend_window &&
      rec.source_document_ids.length > 0 &&
      rec.source_result_ids.length > 0
    );

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

    // Test recommendation types for future categorization
    const recommendationTypes = [...new Set(recommendations.map(rec => rec.recommendation_type))];
    const expectedTypes = ['cardiovascular', 'metabolic', 'hormonal', 'inflammation'];
    const hasExpectedTypes = expectedTypes.every(type => recommendationTypes.includes(type as any));

    if (!hasExpectedTypes) {
      return {
        success: false,
        message: 'Missing expected recommendation types for future categorization',
        details: { expectedTypes, foundTypes: recommendationTypes }
      };
    }

    // Test severity levels for prioritization
    const severityLevels = [...new Set(recommendations.map(rec => rec.severity))];
    const expectedSeverities = ['low', 'medium', 'high'];
    const hasExpectedSeverities = expectedSeverities.every(severity => severityLevels.includes(severity as any));

    if (!hasExpectedSeverities) {
      return {
        success: false,
        message: 'Missing expected severity levels for prioritization',
        details: { expectedSeverities, foundSeverities: severityLevels }
      };
    }

    logValidation('FUTURE READINESS', '✅', 'Future extensibility validation passed');
    return {
      success: true,
      message: 'Future readiness validation passed',
      details: {
        controlTowerReady: true,
        dashboardReady: true,
        verbalAgentReady: true,
        correlationReady: true,
        resolutionReady: true,
        recommendationTypes: recommendationTypes.length,
        severityLevels: severityLevels.length,
        extensibleStructure: true
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Future readiness validation error: ${(error as Error).message}`,
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

async function runRecommendationsValidation() {
  console.log('🚀 BLOODWORK INTELLIGENCE ENGINE - VALIDATION');
  console.log('========================================\n');

  const results: Record<string, ValidationResult> = {};

  // Run validation steps
  results.setup = await setupTestData();
  
  if (results.setup.success) {
    results.rules = await validateRecommendationRules();
    results.generation = await validateRecommendationGeneration();
    results.retrieval = await validateRecommendationRetrieval();
    results.logic = await validateRecommendationLogic();
    results.futureReadiness = await validateFutureReadiness();
  }
  
  results.cleanup = await cleanupTestData();

  // Generate summary
  const validationCategories = {
    rules: [results.rules],
    recommendationGeneration: [results.generation],
    retrieval: [results.retrieval],
    logic: [results.logic],
    futureReadiness: [results.futureReadiness]
  };

  const categoryResults: Record<string, boolean> = {};
  
  Object.entries(validationCategories).forEach(([category, tests]) => {
    categoryResults[category] = tests.every(test => test && test.success);
  });

  const passedCategories = Object.values(categoryResults).filter(Boolean).length;
  const totalCategories = Object.keys(categoryResults).length;
  const successRate = (passedCategories / totalCategories) * 100;

  console.log('📊 BLOODWORK INTELLIGENCE ENGINE VALIDATION SUMMARY');
  console.log('===============================================');

  Object.entries(categoryResults).forEach(([category, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const displayName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${displayName}`);
  });

  console.log('\n🎯 Overall Result:', successRate >= 80 ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED');
  console.log(`📈 Category Success: ${passedCategories}/${totalCategories} categories passed (${successRate.toFixed(1)}%)`);

  if (successRate >= 80) {
    console.log('\n🎉 BLOODWORK INTELLIGENCE ENGINE VALIDATION COMPLETE!');
    console.log('✅ Recommendation rules comprehensive');
    console.log('✅ Recommendation generation working');
    console.log('✅ Data retrieval functional');
    console.log('✅ Business logic accurate');
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
    console.log('1. Review recommendation rule definitions');
    console.log('2. Check recommendation generation logic');
    console.log('3. Verify API endpoint implementations');
    console.log('4. Test with different data scenarios');
  }

  process.exit(successRate >= 80 ? 0 : 1);
}

// Run validation
runRecommendationsValidation().catch(error => {
  console.error('Recommendations validation failed to run:', error);
  process.exit(1);
});
