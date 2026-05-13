/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000010';

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

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

async function createTestData(): Promise<ValidationResult> {
  try {
    logValidation('SETUP', '⏳', 'Creating test data for validation (direct approach)...');

    // Skip document creation - create results directly
    const testResults = [
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011', // Mock document ID
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '110',
        value_numeric: 110,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'upload',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '125',
        value_numeric: 125,
        unit: 'mg/dL',
        test_date: '2024-02-20',
        source: 'upload',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '145',
        value_numeric: 145,
        unit: 'mg/dL',
        test_date: '2024-03-25',
        source: 'upload',
        confidence: 0.95
      },
      // ApoB worsening
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'Apolipoprotein B',
        normalized_test_name: 'ApoB',
        category: 'Cardiovascular',
        value_text: '85',
        value_numeric: 85,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'upload',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'Apolipoprotein B',
        normalized_test_name: 'ApoB',
        category: 'Cardiovascular',
        value_text: '95',
        value_numeric: 95,
        unit: 'mg/dL',
        test_date: '2024-02-20',
        source: 'upload',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'Apolipoprotein B',
        normalized_test_name: 'ApoB',
        category: 'Cardiovascular',
        value_text: '108',
        value_numeric: 108,
        unit: 'mg/dL',
        test_date: '2024-03-25',
        source: 'upload',
        confidence: 0.95
      },
      // HbA1c worsening
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '5.6',
        value_numeric: 5.6,
        unit: '%',
        test_date: '2024-01-15',
        source: 'upload',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '5.9',
        value_numeric: 5.9,
        unit: '%',
        test_date: '2024-02-20',
        source: 'upload',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '6.7',
        value_numeric: 6.7,
        unit: '%',
        test_date: '2024-03-25',
        source: 'upload',
        confidence: 0.95
      },
      // Testosterone declining
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '480',
        value_numeric: 480,
        unit: 'ng/dL',
        test_date: '2024-01-15',
        source: 'upload',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '410',
        value_numeric: 410,
        unit: 'ng/dL',
        test_date: '2024-02-20',
        source: 'upload',
        confidence: 0.95
      },
      {
        user_id: TEST_USER_ID,
        document_id: '00000000-0000-0000-0000-000000000011',
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '260',
        value_numeric: 260,
        unit: 'ng/dL',
        test_date: '2024-03-25',
        source: 'upload',
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
        message: `Failed to create test results: ${insertError.message}`,
        details: insertError
      };
    }

    logValidation('SETUP', '✅', `Created ${insertedResults.length} test bloodwork results`);
    
    return {
      success: true,
      message: 'Test data created successfully',
      details: { resultsCount: insertedResults.length }
    };

  } catch (error) {
    return {
      success: false,
      message: `Setup failed: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateRecommendationGeneration(): Promise<ValidationResult> {
  try {
    logValidation('GENERATION', '⏳', 'Testing recommendation generation...');

    const response = await fetch(`${API_BASE_URL}/bloodwork/recommendations/generate/${TEST_USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        force_regenerate: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `API request failed: ${response.status} ${response.statusText}`,
        details: errorText
      };
    }

    const apiData = await response.json();
    
    if (!apiData.success) {
      return {
        success: false,
        message: 'API returned failure',
        details: apiData
      };
    }

    const generatedCount = apiData.data?.generated_count || 0;
    logValidation('GENERATION', '✅', `Generated ${generatedCount} recommendations`);
    
    return {
      success: true,
      message: `Generated ${generatedCount} recommendations`,
      details: { generatedCount, apiResponse: apiData }
    };

  } catch (error) {
    return {
      success: false,
      message: `Generation test failed: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateRecommendationPersistence(): Promise<ValidationResult> {
  try {
    logValidation('PERSISTENCE', '⏳', 'Testing recommendation persistence...');

    const { data: recommendations, error } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID);

    if (error) {
      return {
        success: false,
        message: `Failed to retrieve recommendations: ${error.message}`,
        details: error
      };
    }

    if (!recommendations || recommendations.length === 0) {
      return {
        success: false,
        message: 'No recommendations found in database',
        details: { count: 0 }
      };
    }

    // Verify required fields
    const requiredFields = ['id', 'user_id', 'test_name', 'recommendation_type', 'recommendation_title', 'recommendation_text', 'rationale', 'confidence', 'severity', 'status'];
    const missingFields = requiredFields.filter(field => !recommendations[0][field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        details: { missingFields, sampleRec: recommendations[0] }
      };
    }

    logValidation('PERSISTENCE', '✅', `Found ${recommendations.length} persisted recommendations with all required fields`);
    
    return {
      success: true,
      message: `Found ${recommendations.length} persisted recommendations`,
      details: { count: recommendations.length, sampleRec: recommendations[0] }
    };

  } catch (error) {
    return {
      success: false,
      message: `Persistence test failed: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateRecommendationRetrieval(): Promise<ValidationResult> {
  try {
    logValidation('RETRIEVAL', '⏳', 'Testing recommendation retrieval...');

    // Test all recommendations
    const { data: allRecs, error: allError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID);

    if (allError) {
      return {
        success: false,
        message: `Failed to retrieve all recommendations: ${allError.message}`,
        details: allError
      };
    }

    // Test active recommendations only
    const { data: activeRecs, error: activeError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'active');

    if (activeError) {
      return {
        success: false,
        message: `Failed to retrieve active recommendations: ${activeError.message}`,
        details: activeError
      };
    }

    logValidation('RETRIEVAL', '✅', `Retrieved ${allRecs.length} total, ${activeRecs.length} active recommendations`);
    
    return {
      success: true,
      message: `Retrieved ${allRecs.length} total, ${activeRecs.length} active recommendations`,
      details: { totalCount: allRecs.length, activeCount: activeRecs.length }
    };

  } catch (error) {
    return {
      success: false,
      message: `Retrieval test failed: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateStatusUpdates(): Promise<ValidationResult> {
  try {
    logValidation('STATUS UPDATES', '⏳', 'Testing recommendation status updates...');

    // Get a recommendation to update
    const { data: recommendations, error: getError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'active')
      .limit(1);

    if (getError || !recommendations || recommendations.length === 0) {
      return {
        success: false,
        message: 'No active recommendations found to update',
        details: getError
      };
    }

    const recommendation = recommendations[0];

    // Test API status update
    const response = await fetch(`${API_BASE_URL}/bloodwork/recommendations/${recommendation.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'resolved'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Status update API failed: ${response.status} ${response.statusText}`,
        details: errorText
      };
    }

    // Verify the update
    const { data: updatedRec, error: verifyError } = await supabase
      .from('bloodwork_recommendations')
      .select('status')
      .eq('id', recommendation.id)
      .single();

    if (verifyError || updatedRec?.status !== 'resolved') {
      return {
        success: false,
        message: 'Status update not persisted correctly',
        details: { verifyError, updatedRec }
      };
    }

    logValidation('STATUS UPDATES', '✅', 'Successfully updated recommendation status to resolved');
    
    return {
      success: true,
      message: 'Status update working correctly',
      details: { recommendationId: recommendation.id, newStatus: updatedRec.status }
    };

  } catch (error) {
    return {
      success: false,
      message: `Status update test failed: ${(error as Error).message}`,
      details: error
    };
  }
}

async function cleanupTestData(): Promise<ValidationResult> {
  try {
    logValidation('CLEANUP', '⏳', 'Cleaning up test data...');

    // Clean up recommendations
    const { error: recError } = await supabase
      .from('bloodwork_recommendations')
      .delete()
      .eq('user_id', TEST_USER_ID);

    if (recError) {
      return {
        success: false,
        message: `Failed to cleanup recommendations: ${recError.message}`,
        details: recError
      };
    }

    // Clean up results
    const { error: resultError } = await supabase
      .from('bloodwork_results')
      .delete()
      .eq('user_id', TEST_USER_ID);

    if (resultError) {
      return {
        success: false,
        message: `Failed to cleanup results: ${resultError.message}`,
        details: resultError
      };
    }

    logValidation('CLEANUP', '✅', 'Test data cleaned up successfully');
    
    return {
      success: true,
      message: 'Cleanup completed successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: `Cleanup failed: ${(error as Error).message}`,
      details: error
    };
  }
}

async function runFixedValidation() {
  console.log('🚀 BLOODWORK INTELLIGENCE ENGINE - FIXED VALIDATION\n');
  console.log('================================================\n');

  const results = {
    setup: false,
    generation: false,
    persistence: false,
    retrieval: false,
    statusUpdates: false,
    cleanup: false
  };

  // Setup
  const setupResult = await createTestData();
  results.setup = setupResult.success;

  if (!results.setup) {
    logValidation('SETUP', '❌', 'Setup failed - cannot continue validation');
    return;
  }

  // Generation
  const genResult = await validateRecommendationGeneration();
  results.generation = genResult.success;

  // Persistence
  const persistResult = await validateRecommendationPersistence();
  results.persistence = persistResult.success;

  // Retrieval
  const retrieveResult = await validateRecommendationRetrieval();
  results.retrieval = retrieveResult.success;

  // Status Updates
  const statusResult = await validateStatusUpdates();
  results.statusUpdates = statusResult.success;

  // Cleanup
  const cleanupResult = await cleanupTestData();
  results.cleanup = cleanupResult.success;

  // Summary
  console.log('📊 FIXED VALIDATION SUMMARY');
  console.log('============================\n');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);

  console.log(`✅ Setup: ${results.setup ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Generation: ${results.generation ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Persistence: ${results.persistence ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Retrieval: ${results.retrieval ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Status Updates: ${results.statusUpdates ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Cleanup: ${results.cleanup ? 'PASS' : 'FAIL'}`);

  console.log(`\n🎯 Overall Result: ${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '⚠️  PARTIAL SUCCESS'}`);
  console.log(`📈 Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);

  if (passedTests === totalTests) {
    console.log('\n🎉 BLOODWORK INTELLIGENCE ENGINE IS FULLY FUNCTIONAL!');
    console.log('✅ Database schema deployed and working');
    console.log('✅ Recommendation generation working');
    console.log('✅ Data persistence working');
    console.log('✅ API endpoints working');
    console.log('✅ Status updates working');
    console.log('✅ Ready for production use!');
  } else {
    console.log('\n🔧 Some issues remain - check individual test results above');
  }
}

// Run the validation
runFixedValidation().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
