const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function validateSupplementBaseline() {
  console.log('🚀 Starting Supplement Stack Baseline End-to-End Validation\n');
  
  const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
  const results = {
    upload: { success: false, message: '' },
    records: { success: false, message: '' },
    retrieval: { success: false, message: '' },
    summary: { success: false, message: '' }
  };

  try {
    // Step 1: Upload supplement baseline document
    console.log('📋 Step 1: Uploading supplement baseline document...');
    try {
      const testPayload = JSON.parse(fs.readFileSync('./test_supplement_payload.json', 'utf8'));
      
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Upload failed: ${error.error || response.statusText}`);
      }

      const result = await response.json();
      const { document, baseline, items, extractedSections } = result.data;

      results.upload = {
        success: true,
        message: `Upload successful: Document ${document.id}, Baseline ${baseline.id}, ${items.length} items`,
        details: { document, baseline, items, extractedSections }
      };

      console.log('✅ Upload successful');
      console.log(`   - Document ID: ${document.id}`);
      console.log(`   - Baseline ID: ${baseline.id}`);
      console.log(`   - Items: ${items.length}`);
      console.log(`   - Sections: ${extractedSections.length}`);

    } catch (error) {
      results.upload = {
        success: false,
        message: `Upload failed: ${error.message}`
      };
      console.log('❌ Upload failed:', error.message);
      return;
    }

    // Step 2: Confirm records are created in all tables
    console.log('\n📋 Step 2: Verifying database records...');
    try {
      const checks = [];
      
      // Check supplement_documents
      const { data: docRecords, error: docError } = await supabase
        .from('supplement_documents')
        .select('*')
        .eq('user_id', testUserId);
      
      checks.push({ table: 'supplement_documents', count: docRecords?.length || 0, error: docError });

      // Check supplement_baseline
      const { data: baselineRecords, error: baselineError } = await supabase
        .from('supplement_baseline')
        .select('*')
        .eq('user_id', testUserId);
      
      checks.push({ table: 'supplement_baseline', count: baselineRecords?.length || 0, error: baselineError });

      // Check supplement_items
      const { data: itemRecords, error: itemError } = await supabase
        .from('supplement_items')
        .select('*')
        .eq('supplement_baseline_id', results.upload.details.baseline.id);
      
      checks.push({ table: 'supplement_items', count: itemRecords?.length || 0, error: itemError });

      // Check supplement_extracted_sections
      const { data: sectionRecords, error: sectionError } = await supabase
        .from('supplement_extracted_sections')
        .select('*')
        .eq('document_id', results.upload.details.document.id);
      
      checks.push({ table: 'supplement_extracted_sections', count: sectionRecords?.length || 0, error: sectionError });

      const allSuccessful = checks.every(c => !c.error && c.count > 0);
      
      results.records = {
        success: allSuccessful,
        message: allSuccessful ? 'All records created successfully' : 'Some records missing',
        details: checks
      };

      if (allSuccessful) {
        console.log('✅ All database records verified');
        checks.forEach(c => console.log(`   - ${c.table}: ${c.count} records`));
      } else {
        console.log('❌ Database record verification failed');
        checks.forEach(c => {
          if (c.error) console.log(`   - ${c.table}: ERROR - ${c.error.message}`);
          else if (c.count === 0) console.log(`   - ${c.table}: NO RECORDS`);
          else console.log(`   - ${c.table}: ${c.count} records`);
        });
      }

    } catch (error) {
      results.records = {
        success: false,
        message: `Record verification failed: ${error.message}`
      };
      console.log('❌ Record verification failed:', error.message);
    }

    // Step 3: Test retrieval endpoints
    console.log('\n📋 Step 3: Testing retrieval endpoints...');
    try {
      const endpoints = [];
      
      // Test baseline retrieval
      const baselineResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
      endpoints.push({
        endpoint: 'GET /supplement-baseline/:user_id',
        success: baselineResponse.ok,
        status: baselineResponse.status
      });

      // Test latest document retrieval
      const documentResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document/${testUserId}/latest`);
      endpoints.push({
        endpoint: 'GET /supplement-document/:user_id/latest',
        success: documentResponse.ok,
        status: documentResponse.status
      });

      const allEndpointsWork = endpoints.every(e => e.success);
      
      results.retrieval = {
        success: allEndpointsWork,
        message: allEndpointsWork ? 'All retrieval endpoints working' : 'Some endpoints failed',
        details: endpoints
      };

      if (allEndpointsWork) {
        console.log('✅ All retrieval endpoints working');
        endpoints.forEach(e => console.log(`   - ${e.endpoint}: ${e.status}`));
      } else {
        console.log('❌ Some retrieval endpoints failed');
        endpoints.forEach(e => {
          const status = e.success ? '✅' : '❌';
          console.log(`   ${status} ${e.endpoint}: ${e.status}`);
        });
      }

    } catch (error) {
      results.retrieval = {
        success: false,
        message: `Endpoint testing failed: ${error.message}`
      };
      console.log('❌ Endpoint testing failed:', error.message);
    }

    // Step 4: Test baseline summary display
    console.log('\n📋 Step 4: Testing baseline summary display...');
    try {
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
      
      if (!response.ok) {
        throw new Error(`Summary retrieval failed: ${response.statusText}`);
      }

      const baselineData = await response.json();
      const baseline = baselineData.data;

      // Verify summary structure
      const requiredFields = ['id', 'stack_name', 'total_active_items', 'items'];
      const hasAllFields = requiredFields.every(field => baseline[field]);

      // Verify items structure
      const hasValidItems = baseline.items && Array.isArray(baseline.items) && baseline.items.length > 0;
      const itemsHaveRequiredFields = hasValidItems && baseline.items.every(item => 
        item.supplement_name && item.dosage && item.dosage_unit && item.frequency && item.timing
      );

      results.summary = {
        success: hasAllFields && hasValidItems && itemsHaveRequiredFields,
        message: hasAllFields && hasValidItems && itemsHaveRequiredFields 
          ? 'Summary displays correctly' 
          : 'Summary structure incomplete',
        details: {
          hasAllFields,
          hasValidItems,
          itemsHaveRequiredFields,
          itemCount: baseline.items?.length || 0,
          stackName: baseline.stack_name,
          activeItems: baseline.total_active_items
        }
      };

      if (results.summary.success) {
        console.log('✅ Baseline summary displays correctly');
        console.log(`   - Stack: ${baseline.stack_name}`);
        console.log(`   - Active Items: ${baseline.total_active_items}`);
        console.log(`   - Retrieved Items: ${baseline.items.length}`);
      } else {
        console.log('❌ Baseline summary display issues');
        console.log(`   - All fields present: ${hasAllFields}`);
        console.log(`   - Valid items array: ${hasValidItems}`);
        console.log(`   - Items have required fields: ${itemsHaveRequiredFields}`);
      }

    } catch (error) {
      results.summary = {
        success: false,
        message: `Summary testing failed: ${error.message}`
      };
      console.log('❌ Summary testing failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
  }

  // Print final summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('==============================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const formattedName = test.charAt(0).toUpperCase() + test.slice(1);
    console.log(`${status} ${formattedName}`);
    if (!result.success) {
      console.log(`    ${result.message}`);
    }
  });

  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  const overallSuccess = passedTests === totalTests;
  
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`📈 Test Coverage: ${passedTests}/${totalTests} tests passed`);

  return results;
}

// Run validation
validateSupplementBaseline()
  .then((results) => {
    const overallSuccess = Object.values(results).every(r => r.success);
    process.exit(overallSuccess ? 0 : 1);
  })
  .catch((error) => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
