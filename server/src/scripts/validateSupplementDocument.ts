import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

interface TestResults {
  backendPersistence: ValidationResult;
  structuredExtraction: ValidationResult;
  retrievalEndpoints: ValidationResult;
  changeLogStructure: ValidationResult;
  errorHandling: ValidationResult;
  duplicateHandling: ValidationResult;
  overall: ValidationResult;
}

async function validateSupplementDocumentEngine(): Promise<TestResults> {
  console.log('🚀 Starting Wave 1, Step 3: Supplement Stack Baseline Document Engine Validation\n');

  const testUserId = 'supplement-validation-user';
  const results: TestResults = {
    backendPersistence: { success: false, message: '' },
    structuredExtraction: { success: false, message: '' },
    retrievalEndpoints: { success: false, message: '' },
    changeLogStructure: { success: false, message: '' },
    errorHandling: { success: false, message: '' },
    duplicateHandling: { success: false, message: '' },
    overall: { success: false, message: '' },
  };

  try {
    // Load test payload
    const testPayloadPath = join(__dirname, '../../test_supplement_payload.json');
    const testPayload = JSON.parse(readFileSync(testPayloadPath, 'utf8'));

    console.log('📋 Test 1: Backend Persistence - Creating supplement document and baseline');
    try {
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        const error = await response.json() as {error?: string};
        throw new Error(`API Error: ${error.error || response.statusText}`);
      }

      const result = await response.json() as {data: {document: any; baseline: any; items: any[]; extractedSections: any[]}};
      const { document, baseline, items, extractedSections } = result.data;

      // Validate document structure
      if (!document.id || !document.user_id || !document.document_type || !document.parse_status) {
        throw new Error('Document missing required fields');
      }

      // Validate baseline structure
      if (!baseline.id || !baseline.stack_name || !baseline.total_active_items) {
        throw new Error('Baseline missing required fields');
      }

      // Validate items structure
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('No supplement items created');
      }

      // Validate extracted sections
      if (!Array.isArray(extractedSections) || extractedSections.length === 0) {
        throw new Error('No extracted sections created');
      }

      // Validate specific supplement item structure
      for (const item of items) {
        if (!item.supplement_name || !item.dosage || !item.dosage_unit || !item.frequency || !item.timing) {
          throw new Error(`Supplement item missing required fields: ${item.supplement_name}`);
        }
      }

      results.backendPersistence = {
        success: true,
        message: `Successfully created document (${document.id}), baseline (${baseline.id}), and ${items.length} supplement items`,
        details: { document, baseline, items: items.length, extractedSections: extractedSections.length }
      };

      console.log('✅ Backend Persistence: PASSED');
      console.log(`   - Document ID: ${document.id}`);
      console.log(`   - Baseline: ${baseline.stack_name} with ${baseline.total_active_items} active items`);
      console.log(`   - Items: ${items.length} supplement items created`);
      console.log(`   - Sections: ${extractedSections.length} extracted sections`);

    } catch (error) {
      results.backendPersistence = {
        success: false,
        message: `Backend persistence failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      console.log('❌ Backend Persistence: FAILED');
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n📋 Test 2: Structured Supplement Extraction Validation');
    try {
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json() as {data: any};
      const baseline = result.data;

      // Validate stack information
      if (!baseline.stack_name || !baseline.total_active_items) {
        throw new Error('Missing required stack information');
      }

      // Validate supplement items
      if (!baseline.items || !Array.isArray(baseline.items)) {
        throw new Error('Missing or invalid supplement items');
      }

      // Check for required supplement fields
      const requiredFields = ['supplement_name', 'dosage', 'dosage_unit', 'frequency', 'timing'];
      for (const item of baseline.items) {
        for (const field of requiredFields) {
          if (!item[field]) {
            throw new Error(`Missing required field '${field}' in supplement item`);
          }
        }
      }

      // Validate dosage values are numeric
      for (const item of baseline.items) {
        if (typeof item.dosage !== 'number' || item.dosage <= 0) {
          throw new Error(`Invalid dosage value for ${item.supplement_name}: ${item.dosage}`);
        }
      }

      results.structuredExtraction = {
        success: true,
        message: `Structured extraction validated: ${baseline.stack_name} with ${baseline.items.length} items`,
        details: { 
          stackName: baseline.stack_name,
          totalActiveItems: baseline.total_active_items,
          itemCount: baseline.items.length,
          hasTimingNotes: !!baseline.timing_notes,
          hasFrequencyNotes: !!baseline.frequency_notes
        }
      };

      console.log('✅ Structured Extraction: PASSED');
      console.log(`   - Stack: ${baseline.stack_name}`);
      console.log(`   - Active Items: ${baseline.total_active_items}`);
      console.log(`   - Extracted Items: ${baseline.items.length}`);
      console.log(`   - Timing Notes: ${baseline.timing_notes ? 'Yes' : 'No'}`);
      console.log(`   - Frequency Notes: ${baseline.frequency_notes ? 'Yes' : 'No'}`);

    } catch (error) {
      results.structuredExtraction = {
        success: false,
        message: `Structured extraction validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      console.log('❌ Structured Extraction: FAILED');
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n📋 Test 3: Retrieval Endpoints');
    try {
      // Test baseline retrieval
      const baselineResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
      if (!baselineResponse.ok) {
        throw new Error(`Baseline retrieval failed: ${baselineResponse.statusText}`);
      }

      // Test latest document retrieval
      const documentResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document/${testUserId}/latest`);
      if (!documentResponse.ok) {
        throw new Error(`Document retrieval failed: ${documentResponse.statusText}`);
      }

      const baselineResult = await baselineResponse.json() as {data: any};
      const documentResult = await documentResponse.json() as {data: any};

      results.retrievalEndpoints = {
        success: true,
        message: 'All retrieval endpoints working correctly',
        details: {
          baselineRetrieved: !!baselineResult.data,
          documentRetrieved: !!documentResult.data,
          baselineItemCount: baselineResult.data?.items?.length || 0
        }
      };

      console.log('✅ Retrieval Endpoints: PASSED');
      console.log('   - GET /supplement-baseline/:user_id: Working');
      console.log('   - GET /supplement-document/:user_id/latest: Working');

    } catch (error) {
      results.retrievalEndpoints = {
        success: false,
        message: `Retrieval endpoints failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      console.log('❌ Retrieval Endpoints: FAILED');
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n📋 Test 4: Change Log Structure');
    try {
      // Test change log query (even if empty, should return array)
      const { data: changeLog, error: changeLogError } = await supabase
        .from('supplement_change_log')
        .select('*')
        .eq('user_id', testUserId)
        .order('changed_at', { ascending: false });

      if (changeLogError) {
        throw new Error(`Change log query failed: ${changeLogError.message}`);
      }

      // Verify change log structure
      const requiredChangeLogFields = ['id', 'user_id', 'supplement_baseline_id', 'field_name', 'change_source', 'changed_at'];
      if (changeLog && changeLog.length > 0) {
        for (const entry of changeLog) {
          for (const field of requiredChangeLogFields) {
            if (!entry[field]) {
              throw new Error(`Missing required change log field: ${field}`);
            }
          }
        }
      }

      results.changeLogStructure = {
        success: true,
        message: `Change log structure validated: ${changeLog?.length || 0} entries found`,
        details: { 
          entryCount: changeLog?.length || 0,
          hasEntries: (changeLog?.length || 0) > 0
        }
      };

      console.log('✅ Change Log Structure: PASSED');
      console.log(`   - Entries found: ${changeLog?.length || 0}`);
      console.log('   - Structure: Valid');

    } catch (error) {
      results.changeLogStructure = {
        success: false,
        message: `Change log structure validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      console.log('❌ Change Log Structure: FAILED');
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n📋 Test 5: Error Handling');
    try {
      // Test missing required fields
      const invalidPayload1 = {
        userId: testUserId,
        // Missing documentType
        manualSupplementData: {
          stackName: 'Test',
          supplements: []
        }
      };

      const response1 = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload1),
      });

      if (response1.ok) {
        throw new Error('Should have failed with missing required fields');
      }

      // Test invalid supplement data
      const invalidPayload2 = {
        userId: testUserId,
        documentType: 'manual_entry',
        manualSupplementData: {
          stackName: 'Test',
          supplements: [
            {
              supplementName: 'Test',
              dosage: -1, // Invalid negative dosage
              dosageUnit: 'mg',
              frequency: 'Daily',
              timing: 'Morning',
              status: 'active'
            }
          ]
        }
      };

      const response2 = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload2),
      });

      if (response2.ok) {
        throw new Error('Should have failed with invalid supplement data');
      }

      results.errorHandling = {
        success: true,
        message: 'Error handling working correctly - invalid requests properly rejected',
        details: {
          missingFieldsRejected: !response1.ok,
          invalidDataRejected: !response2.ok
        }
      };

      console.log('✅ Error Handling: PASSED');
      console.log('   - Missing required fields: Rejected');
      console.log('   - Invalid supplement data: Rejected');

    } catch (error) {
      results.errorHandling = {
        success: false,
        message: `Error handling validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      console.log('❌ Error Handling: FAILED');
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n📋 Test 6: Duplicate Upload Handling');
    try {
      // Upload a second document for the same user
      const duplicatePayload = {
        ...testPayload,
        manualSupplementData: {
          ...testPayload.manualSupplementData,
          stackName: 'Updated Supplement Stack',
          supplements: testPayload.manualSupplementData.supplements.slice(0, 5) // Fewer items
        }
      };

      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatePayload),
      });

      if (!response.ok) {
        throw new Error(`Duplicate upload failed: ${response.statusText}`);
      }

      const result = await response.json() as {data: {baseline: any}};
      const newBaseline = result.data.baseline;

      // Verify we can still retrieve the latest baseline
      const retrieveResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
      if (!retrieveResponse.ok) {
        throw new Error('Failed to retrieve baseline after duplicate upload');
      }

      const retrieveResult = await retrieveResponse.json() as {data: any};
      const latestBaseline = retrieveResult.data;

      // Should get the newer baseline
      if (latestBaseline.stack_name !== 'Updated Supplement Stack') {
        throw new Error('Latest baseline not returned after duplicate upload');
      }

      results.duplicateHandling = {
        success: true,
        message: 'Duplicate upload handling working correctly',
        details: {
          duplicateUploadSucceeded: response.ok,
          latestBaselineRetrieved: latestBaseline.stack_name === 'Updated Supplement Stack',
          newBaselineItems: newBaseline.total_active_items
        }
      };

      console.log('✅ Duplicate Upload Handling: PASSED');
      console.log('   - Duplicate upload: Successful');
      console.log('   - Latest baseline retrieval: Working');
      console.log('   - New baseline returned: Yes');

    } catch (error) {
      results.duplicateHandling = {
        success: false,
        message: `Duplicate upload handling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      console.log('❌ Duplicate Upload Handling: FAILED');
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }

  } catch (error) {
    console.error('❌ Validation suite failed:', error);
  }

  // Calculate overall result
  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  results.overall = {
    success: passedTests === totalTests,
    message: `Overall: ${passedTests}/${totalTests} tests passed`,
    details: { passedTests, totalTests }
  };

  // Print final summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('==============================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const formattedName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${formattedName}`);
  });

  console.log(`\n🎯 Overall Result: ${results.overall.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  return results;
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateSupplementDocumentEngine()
    .then((results) => {
      process.exit(results.overall.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Validation script failed:', error);
      process.exit(1);
    });
}

export { validateSupplementDocumentEngine };
