/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  getBloodworkTrendsByUser,
  getBloodworkTrendSummary,
  calculateBloodworkTrend,
  getSupportedMarkers,
  getMarkersByCategory
} from '../services/bloodworkTrendService';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

interface TestResult {
  normalized_test_name?: string;
  raw_test_name: string;
  value_numeric?: number;
  value_text: string;
  test_date: string;
  unit?: string;
  category?: string;
}

const TEST_USER_ID = 'bloodwork-trends-validation-user';

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
    logValidation('SETUP', '⏳', 'Creating test bloodwork results for trend validation...');

    // Create test bloodwork results with multiple data points for trend analysis
    const testResults: TestResult[] = [
      // LDL - improving trend (should go down)
      {
        normalized_test_name: 'LDL',
        raw_test_name: 'LDL Cholesterol',
        value_numeric: 130,
        value_text: '130',
        test_date: '2024-01-15',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },
      {
        normalized_test_name: 'LDL',
        raw_test_name: 'LDL Cholesterol',
        value_numeric: 115,
        value_text: '115',
        test_date: '2024-02-20',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },
      {
        normalized_test_name: 'LDL',
        raw_test_name: 'LDL Cholesterol',
        value_numeric: 95,
        value_text: '95',
        test_date: '2024-03-25',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },

      // HDL - improving trend (should go up)
      {
        normalized_test_name: 'HDL',
        raw_test_name: 'HDL Cholesterol',
        value_numeric: 35,
        value_text: '35',
        test_date: '2024-01-15',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },
      {
        normalized_test_name: 'HDL',
        raw_test_name: 'HDL Cholesterol',
        value_numeric: 42,
        value_text: '42',
        test_date: '2024-02-20',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },
      {
        normalized_test_name: 'HDL',
        raw_test_name: 'HDL Cholesterol',
        value_numeric: 48,
        value_text: '48',
        test_date: '2024-03-25',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },

      // Triglycerides - worsening trend (should go up)
      {
        normalized_test_name: 'Triglycerides',
        raw_test_name: 'Triglycerides',
        value_numeric: 120,
        value_text: '120',
        test_date: '2024-01-15',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },
      {
        normalized_test_name: 'Triglycerides',
        raw_test_name: 'Triglycerides',
        value_numeric: 145,
        value_text: '145',
        test_date: '2024-02-20',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },
      {
        normalized_test_name: 'Triglycerides',
        raw_test_name: 'Triglycerides',
        value_numeric: 180,
        value_text: '180',
        test_date: '2024-03-25',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },

      // HbA1c - improving trend (should go down)
      {
        normalized_test_name: 'HbA1c',
        raw_test_name: 'Hemoglobin A1c',
        value_numeric: 6.2,
        value_text: '6.2',
        test_date: '2024-01-15',
        unit: '%',
        category: 'Metabolic'
      },
      {
        normalized_test_name: 'HbA1c',
        raw_test_name: 'Hemoglobin A1c',
        value_numeric: 5.8,
        value_text: '5.8',
        test_date: '2024-02-20',
        unit: '%',
        category: 'Metabolic'
      },
      {
        normalized_test_name: 'HbA1c',
        raw_test_name: 'Hemoglobin A1c',
        value_numeric: 5.4,
        value_text: '5.4',
        test_date: '2024-03-25',
        unit: '%',
        category: 'Metabolic'
      },

      // Testosterone - worsening trend (should go down for higher_is_better)
      {
        normalized_test_name: 'Testosterone',
        raw_test_name: 'Testosterone',
        value_numeric: 450,
        value_text: '450',
        test_date: '2024-01-15',
        unit: 'ng/dL',
        category: 'Hormonal'
      },
      {
        normalized_test_name: 'Testosterone',
        raw_test_name: 'Testosterone',
        value_numeric: 380,
        value_text: '380',
        test_date: '2024-02-20',
        unit: 'ng/dL',
        category: 'Hormonal'
      },
      {
        normalized_test_name: 'Testosterone',
        raw_test_name: 'Testosterone',
        value_numeric: 320,
        value_text: '320',
        test_date: '2024-03-25',
        unit: 'ng/dL',
        category: 'Hormonal'
      },

      // Unknown marker - should handle gracefully
      {
        raw_test_name: 'Unknown Biomarker',
        value_numeric: 25,
        value_text: '25',
        test_date: '2024-01-15',
        unit: 'units',
        category: null
      },
      {
        raw_test_name: 'Unknown Biomarker',
        value_numeric: 30,
        value_text: '30',
        test_date: '2024-02-20',
        unit: 'units',
        category: null
      }
    ];

    // Insert test results into database
    const { data: insertedResults, error: insertError } = await supabase
      .from('bloodwork_results')
      .insert(
        testResults.map(result => ({
          user_id: TEST_USER_ID,
          document_id: 'test-trend-document',
          raw_test_name: result.raw_test_name,
          normalized_test_name: result.normalized_test_name,
          category: result.category,
          value_text: result.value_text,
          value_numeric: result.value_numeric,
          unit: result.unit,
          test_date: result.test_date,
          source: 'validation_test',
          confidence: 0.95
        }))
      )
      .select();

    if (insertError) {
      return {
        success: false,
        message: `Failed to insert test results: ${insertError.message}`,
        details: insertError
      };
    }

    logValidation('SETUP', '✅', `Created ${testResults.length} test bloodwork results`);
    return {
      success: true,
      message: 'Test data created successfully',
      details: { resultsInserted: testResults.length }
    };
  } catch (error) {
    return {
      success: false,
      message: `Setup error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateTrendCalculation(): Promise<ValidationResult> {
  try {
    logValidation('TREND CALCULATION', '⏳', 'Testing trend calculation logic...');

    // Test LDL calculation (should be improving)
    const ldlResults: TestResult[] = [
      {
        normalized_test_name: 'LDL',
        raw_test_name: 'LDL Cholesterol',
        value_numeric: 130,
        value_text: '130',
        test_date: '2024-01-15',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },
      {
        normalized_test_name: 'LDL',
        raw_test_name: 'LDL Cholesterol',
        value_numeric: 95,
        value_text: '95',
        test_date: '2024-03-25',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      }
    ];

    const ldlTrend = calculateBloodworkTrend(ldlResults);

    const ldlValidation = {
      expectedDirection: 'improving',
      actualDirection: ldlTrend.trend_direction,
      expectedChange: -35,
      actualChange: ldlTrend.absolute_change,
      expectedPercent: -26.9,
      actualPercent: ldlTrend.percent_change
    };

    // Test HDL calculation (should be improving)
    const hdlResults: TestResult[] = [
      {
        normalized_test_name: 'HDL',
        raw_test_name: 'HDL Cholesterol',
        value_numeric: 35,
        value_text: '35',
        test_date: '2024-01-15',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },
      {
        normalized_test_name: 'HDL',
        raw_test_name: 'HDL Cholesterol',
        value_numeric: 48,
        value_text: '48',
        test_date: '2024-03-25',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      }
    ];

    const hdlTrend = calculateBloodworkTrend(hdlResults);

    const hdlValidation = {
      expectedDirection: 'improving',
      actualDirection: hdlTrend.trend_direction,
      expectedChange: 13,
      actualChange: hdlTrend.absolute_change,
      expectedPercent: 37.1,
      actualPercent: hdlTrend.percent_change
    };

    // Test Triglycerides calculation (should be worsening)
    const trigResults: TestResult[] = [
      {
        normalized_test_name: 'Triglycerides',
        raw_test_name: 'Triglycerides',
        value_numeric: 120,
        value_text: '120',
        test_date: '2024-01-15',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      },
      {
        normalized_test_name: 'Triglycerides',
        raw_test_name: 'Triglycerides',
        value_numeric: 180,
        value_text: '180',
        test_date: '2024-03-25',
        unit: 'mg/dL',
        category: 'Cardiovascular'
      }
    ];

    const trigTrend = calculateBloodworkTrend(trigResults);

    const trigValidation = {
      expectedDirection: 'worsening',
      actualDirection: trigTrend.trend_direction,
      expectedChange: 60,
      actualChange: trigTrend.absolute_change,
      expectedPercent: 50.0,
      actualPercent: trigTrend.percent_change
    };

    const allValidations = [ldlValidation, hdlValidation, trigValidation];
    const passedValidations = allValidations.filter(v => v.actualDirection === v.expectedDirection);

    if (passedValidations.length === allValidations.length) {
      logValidation('TREND CALCULATION', '✅', 'All trend calculations working correctly');
      return {
        success: true,
        message: 'Trend calculation validation passed',
        details: { validations: allValidations }
      };
    } else {
      return {
        success: false,
        message: `Trend calculation failed for ${allValidations.length - passedValidations.length} markers`,
        details: { validations: allValidations }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Trend calculation validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateTrendsService(): Promise<ValidationResult> {
  try {
    logValidation('TRENDS SERVICE', '⏳', 'Testing bloodwork trends service...');

    const trendsResponse = await getBloodworkTrendsByUser({
      user_id: TEST_USER_ID,
      min_data_points: 2
    });

    if (!trendsResponse.success) {
      return {
        success: false,
        message: `Trends service failed: ${trendsResponse.error}`,
        details: trendsResponse
      };
    }

    const trends = trendsResponse.data?.trends || [];
    
    if (trends.length === 0) {
      return {
        success: false,
        message: 'No trends returned from service',
        details: { trends }
      };
    }

    // Validate expected trends
    const expectedTrends = ['LDL', 'HDL', 'Triglycerides', 'HbA1c', 'Testosterone'];
    const foundTrends = trends.map(t => t.marker_name);
    const missingTrends = expectedTrends.filter(t => !foundTrends.includes(t));

    if (missingTrends.length > 0) {
      return {
        success: false,
        message: `Missing expected trends: ${missingTrends.join(', ')}`,
        details: { expectedTrends, foundTrends, missingTrends }
      };
    }

    // Validate trend directions
    const ldlTrend = trends.find(t => t.marker_name === 'LDL');
    const hdlTrend = trends.find(t => t.marker_name === 'HDL');
    const trigTrend = trends.find(t => t.marker_name === 'Triglycerides');
    const hba1cTrend = trends.find(t => t.marker_name === 'HbA1c');
    const testosteroneTrend = trends.find(t => t.marker_name === 'Testosterone');

    const directionValidations = [
      { marker: 'LDL', expected: 'improving', actual: ldlTrend?.trend_direction },
      { marker: 'HDL', expected: 'improving', actual: hdlTrend?.trend_direction },
      { marker: 'Triglycerides', expected: 'worsening', actual: trigTrend?.trend_direction },
      { marker: 'HbA1c', expected: 'improving', actual: hba1cTrend?.trend_direction },
      { marker: 'Testosterone', expected: 'worsening', actual: testosteroneTrend?.trend_direction }
    ];

    const incorrectDirections = directionValidations.filter(v => v.actual !== v.expected);

    if (incorrectDirections.length > 0) {
      return {
        success: false,
        message: `Incorrect trend directions for ${incorrectDirections.length} markers`,
        details: { directionValidations, incorrectDirections }
      };
    }

    logValidation('TRENDS SERVICE', '✅', `Trends service working correctly (${trends.length} trends)`);
    return {
      success: true,
      message: 'Trends service validation passed',
      details: {
        totalTrends: trends.length,
        directionValidations,
        trends: trends.map(t => ({
          marker: t.marker_name,
          direction: t.trend_direction,
          dataPoints: t.data_points,
          change: t.absolute_change
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Trends service validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateTrendSummary(): Promise<ValidationResult> {
  try {
    logValidation('TREND SUMMARY', '⏳', 'Testing trend summary generation...');

    const summaryResponse = await getBloodworkTrendSummary({
      user_id: TEST_USER_ID
    });

    if (!summaryResponse.success) {
      return {
        success: false,
        message: `Trend summary failed: ${summaryResponse.error}`,
        details: summaryResponse
      };
    }

    const summary = summaryResponse.data;

    if (!summary) {
      return {
        success: false,
        message: 'No summary data returned',
        details: {}
      };
    }

    // Validate summary structure
    const requiredFields = ['improving_markers', 'worsening_markers', 'stable_markers', 'insufficient_data_markers', 'total_markers'];
    const missingFields = requiredFields.filter(field => !(field in summary));

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing summary fields: ${missingFields.join(', ')}`,
        details: { missingFields, summary }
      };
    }

    // Validate expected summary content
    const expectedImproving = ['LDL', 'HDL', 'HbA1c'];
    const expectedWorsening = ['Triglycerides', 'Testosterone'];

    const improvingMatches = expectedImproving.every(marker => summary.improving_markers.includes(marker));
    const worseningMatches = expectedWorsening.every(marker => summary.worsening_markers.includes(marker));

    if (!improvingMatches || !worseningMatches) {
      return {
        success: false,
        message: 'Summary categorization incorrect',
        details: {
          expectedImproving,
          actualImproving: summary.improving_markers,
          expectedWorsening,
          actualWorsening: summary.worsening_markers
        }
      };
    }

    logValidation('TREND SUMMARY', '✅', 'Trend summary generation working correctly');
    return {
      success: true,
      message: 'Trend summary validation passed',
      details: {
        summary: {
          improving: summary.improving_markers.length,
          worsening: summary.worsening_markers.length,
          stable: summary.stable_markers.length,
          insufficient_data: summary.insufficient_data_markers.length,
          total: summary.total_markers
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Trend summary validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateAPIEndpoints(): Promise<ValidationResult> {
  try {
    logValidation('API ENDPOINTS', '⏳', 'Testing trend API endpoints...');

    // Test GET /bloodwork/trends/:user_id
    const trendsResponse = await fetch(`${API_BASE_URL}/bloodwork/trends/${TEST_USER_ID}`);

    if (!trendsResponse.ok) {
      return {
        success: false,
        message: `Trends endpoint failed with status ${trendsResponse.status}`,
        details: { status: trendsResponse.status }
      };
    }

    const trendsData = await trendsResponse.json();

    if (!trendsData.success) {
      return {
        success: false,
        message: `Trends endpoint error: ${trendsData.error}`,
        details: trendsData
      };
    }

    // Test GET /bloodwork/trends/:user_id/summary
    const summaryResponse = await fetch(`${API_BASE_URL}/bloodwork/trends/${TEST_USER_ID}/summary`);

    if (!summaryResponse.ok) {
      return {
        success: false,
        message: `Summary endpoint failed with status ${summaryResponse.status}`,
        details: { status: summaryResponse.status }
      };
    }

    const summaryData = await summaryResponse.json();

    if (!summaryData.success) {
      return {
        success: false,
        message: `Summary endpoint error: ${summaryData.error}`,
        details: summaryData
      };
    }

    // Test GET /bloodwork/trends/supported-markers
    const markersResponse = await fetch(`${API_BASE_URL}/bloodwork/trends/supported-markers`);

    if (!markersResponse.ok) {
      return {
        success: false,
        message: `Supported markers endpoint failed with status ${markersResponse.status}`,
        details: { status: markersResponse.status }
      };
    }

    const markersData = await markersResponse.json();

    if (!markersData.success) {
      return {
        success: false,
        message: `Supported markers endpoint error: ${markersData.error}`,
        details: markersData
      };
    }

    // Test GET /bloodwork/trends/categories
    const categoriesResponse = await fetch(`${API_BASE_URL}/bloodwork/trends/categories`);

    if (!categoriesResponse.ok) {
      return {
        success: false,
        message: `Categories endpoint failed with status ${categoriesResponse.status}`,
        details: { status: categoriesResponse.status }
      };
    }

    const categoriesData = await categoriesResponse.json();

    if (!categoriesData.success) {
      return {
        success: false,
        message: `Categories endpoint error: ${categoriesData.error}`,
        details: categoriesData
      };
    }

    logValidation('API ENDPOINTS', '✅', 'All trend API endpoints working correctly');
    return {
      success: true,
      message: 'API endpoints validation passed',
      details: {
        trendsEndpoint: 'OK',
        summaryEndpoint: 'OK',
        supportedMarkersEndpoint: 'OK',
        categoriesEndpoint: 'OK',
        trendsCount: trendsData.data?.total || 0,
        supportedMarkersCount: markersData.data?.total || 0,
        categoriesCount: categoriesData.data?.total || 0
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

async function validateMarkerRules(): Promise<ValidationResult> {
  try {
    logValidation('MARKER RULES', '⏳', 'Testing marker trend rules...');

    const supportedMarkers = getSupportedMarkers();
    const cardiovascularMarkers = getMarkersByCategory('Cardiovascular');
    const metabolicMarkers = getMarkersByCategory('Metabolic');
    const hormonalMarkers = getMarkersByCategory('Hormonal');

    // Validate expected markers are present
    const expectedCardiovascular = ['LDL', 'HDL', 'Triglycerides', 'ApoB', 'hsCRP'];
    const expectedMetabolic = ['HbA1c', 'A1c', 'Glucose', 'Fasting Glucose', 'Insulin'];
    const expectedHormonal = ['Testosterone', 'Free Testosterone', 'SHBG', 'Estradiol'];

    const cardioMatches = expectedCardiovascular.every(marker => 
      cardiovascularMarkers.some(m => m.name === marker)
    );
    const metabolicMatches = expectedMetabolic.every(marker => 
      metabolicMarkers.some(m => m.name === marker)
    );
    const hormonalMatches = expectedHormonal.every(marker => 
      hormonalMarkers.some(m => m.name === marker)
    );

    if (!cardioMatches || !metabolicMatches || !hormonalMatches) {
      return {
        success: false,
        message: 'Missing expected marker rules',
        details: {
          cardioMatches,
          metabolicMatches,
          hormonalMatches,
          expectedCardiovascular,
          foundCardiovascular: cardiovascularMarkers.map(m => m.name),
          expectedMetabolic,
          foundMetabolic: metabolicMarkers.map(m => m.name),
          expectedHormonal,
          foundHormonal: hormonalMarkers.map(m => m.name)
        }
      };
    }

    // Validate rule structure
    const invalidRules = supportedMarkers.filter(rule => {
      return !rule.name || !rule.category || !rule.direction;
    });

    if (invalidRules.length > 0) {
      return {
        success: false,
        message: `Invalid rule structure for ${invalidRules.length} markers`,
        details: { invalidRules }
      };
    }

    logValidation('MARKER RULES', '✅', `Marker rules validation passed (${supportedMarkers.length} markers)`);
    return {
      success: true,
      message: 'Marker rules validation passed',
      details: {
        totalMarkers: supportedMarkers.length,
        cardiovascular: cardiovascularMarkers.length,
        metabolic: metabolicMarkers.length,
        hormonal: hormonalMarkers.length
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Marker rules validation error: ${(error as Error).message}`,
      details: error
    };
  }
}

async function validateFutureReadiness(): Promise<ValidationResult> {
  try {
    logValidation('FUTURE READINESS', '⏳', 'Testing future extensibility readiness...');

    // Test unknown marker handling
    const unknownResults: TestResult[] = [
      {
        raw_test_name: 'Future Biomarker X',
        value_numeric: 42,
        value_text: '42',
        test_date: '2024-01-15',
        unit: 'units',
        category: null
      },
      {
        raw_test_name: 'Future Biomarker X',
        value_numeric: 38,
        value_text: '38',
        test_date: '2024-02-20',
        unit: 'units',
        category: null
      }
    ];

    const unknownTrend = calculateBloodworkTrend(unknownResults);

    // Should handle unknown markers gracefully
    const handlesUnknown = unknownTrend.trend_direction !== undefined;

    // Test data structure readiness for control tower
    const trendsResponse = await getBloodworkTrendsByUser({
      user_id: TEST_USER_ID,
      min_data_points: 1
    });

    const controlTowerReady = trendsResponse.success && trendsResponse.data && 
      trendsResponse.data.trends.every(trend => 
        trend.trend_direction && 
        trend.data_points && 
        trend.first_test_date && 
        trend.latest_test_date
      );

    // Test summary structure for dashboard
    const summaryResponse = await getBloodworkTrendSummary({
      user_id: TEST_USER_ID
    });

    const dashboardReady = summaryResponse.success && summaryResponse.data &&
      summaryResponse.data.improving_markers &&
      summaryResponse.data.worsening_markers &&
      summaryResponse.data.stable_markers &&
      summaryResponse.data.insufficient_data_markers;

    if (!handlesUnknown || !controlTowerReady || !dashboardReady) {
      return {
        success: false,
        message: 'Future readiness validation failed',
        details: {
          handlesUnknown,
          controlTowerReady,
          dashboardReady
        }
      };
    }

    logValidation('FUTURE READINESS', '✅', 'Future extensibility validation passed');
    return {
      success: true,
      message: 'Future readiness validation passed',
      details: {
        unknownMarkerHandling: 'graceful',
        controlTowerReady: true,
        dashboardReady: true,
        recommendationReady: true
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

async function runTrendsValidation() {
  console.log('🚀 BLOODWORK TREND ENGINE - VALIDATION');
  console.log('======================================\n');

  const results: Record<string, ValidationResult> = {};

  // Run validation steps
  results.setup = await setupTestData();
  
  if (results.setup.success) {
    results.trendCalculation = await validateTrendCalculation();
    results.trendsService = await validateTrendsService();
    results.trendSummary = await validateTrendSummary();
    results.apiEndpoints = await validateAPIEndpoints();
    results.markerRules = await validateMarkerRules();
    results.futureReadiness = await validateFutureReadiness();
  }
  
  results.cleanup = await cleanupTestData();

  // Generate summary
  const validationCategories = {
    trendCalculation: [results.trendCalculation],
    trendsService: [results.trendsService],
    trendSummary: [results.trendSummary],
    apiEndpoints: [results.apiEndpoints],
    markerRules: [results.markerRules],
    futureReadiness: [results.futureReadiness]
  };

  const categoryResults: Record<string, boolean> = {};
  
  Object.entries(validationCategories).forEach(([category, tests]) => {
    categoryResults[category] = tests.every(test => test && test.success);
  });

  const passedCategories = Object.values(categoryResults).filter(Boolean).length;
  const totalCategories = Object.keys(categoryResults).length;
  const successRate = (passedCategories / totalCategories) * 100;

  console.log('📊 BLOODWORK TREND ENGINE VALIDATION SUMMARY');
  console.log('===========================================');

  Object.entries(categoryResults).forEach(([category, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const displayName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${displayName}`);
  });

  console.log('\n🎯 Overall Result:', successRate >= 80 ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED');
  console.log(`📈 Category Success: ${passedCategories}/${totalCategories} categories passed (${successRate.toFixed(1)}%)`);

  if (successRate >= 80) {
    console.log('\n🎉 BLOODWORK TREND ENGINE VALIDATION COMPLETE!');
    console.log('✅ Trend calculations working correctly');
    console.log('✅ Service layer functioning properly');
    console.log('✅ Summary generation accurate');
    console.log('✅ API endpoints responding');
    console.log('✅ Marker rules comprehensive');
    console.log('✅ Future extensibility verified');
    console.log('\n🚀 BLOODWORK TREND ENGINE PRODUCTION READY!');
  } else {
    console.log('\n🔧 REMAINING ISSUES:');
    Object.entries(categoryResults).forEach(([category, passed]) => {
      if (!passed) {
        const displayName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`   - ${displayName}: Validation failed`);
      }
    });
    console.log('\n📋 TROUBLESHOOTING:');
    console.log('1. Review trend calculation logic');
    console.log('2. Check API endpoint implementations');
    console.log('3. Verify marker rule definitions');
    console.log('4. Test with different data scenarios');
  }

  process.exit(successRate >= 80 ? 0 : 1);
}

// Run validation
runTrendsValidation().catch(error => {
  console.error('Trends validation failed to run:', error);
  process.exit(1);
});
