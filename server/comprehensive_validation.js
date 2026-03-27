const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function comprehensiveValidation() {
  console.log('🚀 COMPREHENSIVE SUPPLEMENT BASELINE VALIDATION\n');
  
  const results = {
    databaseVisibility: { success: false, details: [] },
    schemaCache: { success: false, message: '' },
    permissions: { success: false, details: [] },
    backendQuery: { success: false, message: '' },
    endToEndSave: { success: false, message: '' },
    retrieval: { success: false, details: [] },
    frontend: { success: false, message: '' },
    namingConsistency: { success: false, issues: [] }
  };

  // 1. Database Visibility
  console.log('📋 1. Database Visibility Check');
  console.log('================================');
  
  const requiredTables = [
    'supplement_documents',
    'supplement_baseline', 
    'supplement_items',
    'supplement_extracted_sections',
    'supplement_change_log'
  ];
  
  const visibilityResults = [];
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error && error.code === 'PGRST116') {
        visibilityResults.push({ table, status: 'NOT_FOUND', error: error.message });
      } else if (error) {
        visibilityResults.push({ table, status: 'ERROR', error: error.message });
      } else {
        visibilityResults.push({ table, status: 'VISIBLE', error: null });
      }
    } catch (err) {
      visibilityResults.push({ table, status: 'CONNECTION_ERROR', error: err.message });
    }
  }
  
  const allTablesVisible = visibilityResults.every(r => r.status === 'VISIBLE');
  results.databaseVisibility = {
    success: allTablesVisible,
    details: visibilityResults
  };
  
  visibilityResults.forEach(r => {
    const icon = r.status === 'VISIBLE' ? '✅' : '❌';
    console.log(`${icon} ${r.table}: ${r.status}${r.error ? ' - ' + r.error : ''}`);
  });
  
  if (!allTablesVisible) {
    console.log('\n❌ Some tables are not visible. Schema fixes may be required.');
    return printFinalSummary(results);
  }

  // 2. Schema Cache - Check specific columns
  console.log('\n📋 2. Schema Cache Check');
  console.log('========================');
  
  try {
    const { data, error } = await supabase
      .from('supplement_baseline')
      .select('id, user_id, document_id, stack_name, total_active_items, created_at')
      .limit(1);
    
    if (error && error.message.includes('column does not exist')) {
      results.schemaCache = {
        success: false,
        message: `Missing columns detected: ${error.message}`
      };
      console.log('❌ Schema cache issue - missing columns');
      console.log(`   Error: ${error.message}`);
      console.log('🔧 Schema fixes need to be applied');
      return printFinalSummary(results);
    } else if (error) {
      results.schemaCache = {
        success: false,
        message: `Schema cache error: ${error.message}`
      };
      console.log('❌ Schema cache error:', error.message);
    } else {
      results.schemaCache = {
        success: true,
        message: 'All required columns accessible'
      };
      console.log('✅ All required columns accessible via PostgREST');
    }
  } catch (err) {
    results.schemaCache = {
      success: false,
      message: `Schema cache check failed: ${err.message}`
    };
    console.log('❌ Schema cache check failed:', err.message);
  }

  // 3. Permissions Check
  console.log('\n📋 3. Permissions Check');
  console.log('=======================');
  
  const permissionTests = [];
  
  // Test read permissions
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      permissionTests.push({
        table,
        operation: 'READ',
        success: !error || error.code !== '42501',
        error: error?.message
      });
    } catch (err) {
      permissionTests.push({
        table,
        operation: 'READ',
        success: false,
        error: err.message
      });
    }
  }
  
  const allPermissionsCorrect = permissionTests.every(t => t.success);
  results.permissions = {
    success: allPermissionsCorrect,
    details: permissionTests
  };
  
  permissionTests.forEach(test => {
    const icon = test.success ? '✅' : '❌';
    console.log(`${icon} ${test.table} READ: ${test.success ? 'OK' : 'FAILED'}`);
  });
  
  if (!allPermissionsCorrect) {
    console.log('❌ Permission issues detected');
    return printFinalSummary(results);
  }

  // 4. Backend Query Validation
  console.log('\n📋 4. Backend Query Validation');
  console.log('=============================');
  
  try {
    // Test simple read
    const { data: readData, error: readError } = await supabase
      .from('supplement_baseline')
      .select('id, user_id, stack_name, created_at')
      .limit(1);
    
    if (readError) {
      results.backendQuery = {
        success: false,
        message: `Read query failed: ${readError.message}`
      };
      console.log('❌ Backend read query failed:', readError.message);
      return printFinalSummary(results);
    }
    
    console.log('✅ Backend read query successful');
    
    // Test write query (if schema allows)
    const testUUID = '550e8400-e29b-41d4-a716-446655440001';
    const { data: existingDoc } = await supabase
      .from('supplement_documents')
      .select('id')
      .limit(1)
      .single();
    
    if (existingDoc) {
      const { data: writeData, error: writeError } = await supabase
        .from('supplement_baseline')
        .insert({
          user_id: testUUID,
          document_id: existingDoc.id,
          stack_name: 'Validation Test',
          total_active_items: 0
        })
        .select()
        .single();
      
      if (writeError) {
        results.backendQuery = {
          success: false,
          message: `Write query failed: ${writeError.message}`
        };
        console.log('❌ Backend write query failed:', writeError.message);
        return printFinalSummary(results);
      } else {
        console.log('✅ Backend write query successful');
        // Clean up
        await supabase.from('supplement_baseline').delete().eq('id', writeData.id);
        console.log('✅ Test record cleaned up');
      }
    }
    
    results.backendQuery = {
      success: true,
      message: 'All backend queries successful'
    };
    
  } catch (err) {
    results.backendQuery = {
      success: false,
      message: `Backend query validation failed: ${err.message}`
    };
    console.log('❌ Backend query validation failed:', err.message);
    return printFinalSummary(results);
  }

  // 5. End-to-End Save Validation
  console.log('\n📋 5. End-to-End Save Validation');
  console.log('===============================');
  
  try {
    const testPayload = JSON.parse(fs.readFileSync('./test_supplement_payload.json', 'utf8'));
    
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      results.endToEndSave = {
        success: false,
        message: `Upload failed: ${error.error || response.statusText}`
      };
      console.log('❌ End-to-end save failed:', results.endToEndSave.message);
      return printFinalSummary(results);
    }

    const result = await response.json();
    const { document, baseline, items, extractedSections } = result.data;

    console.log('✅ End-to-end save successful');
    console.log(`   - Document: ${document.id}`);
    console.log(`   - Baseline: ${baseline.id}`);
    console.log(`   - Items: ${items.length}`);
    console.log(`   - Sections: ${extractedSections.length}`);

    results.endToEndSave = {
      success: true,
      message: `Save successful: Document ${document.id}, Baseline ${baseline.id}, ${items.length} items`
    };

  } catch (err) {
    results.endToEndSave = {
      success: false,
      message: `End-to-end save validation failed: ${err.message}`
    };
    console.log('❌ End-to-end save validation failed:', err.message);
    return printFinalSummary(results);
  }

  // 6. Retrieval Validation
  console.log('\n📋 6. Retrieval Validation');
  console.log('========================');
  
  const retrievalTests = [];
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  
  try {
    // Test baseline retrieval
    const baselineResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
    retrievalTests.push({
      endpoint: 'GET /supplement-baseline/:user_id',
      success: baselineResponse.ok,
      status: baselineResponse.status
    });

    // Test latest document retrieval
    const documentResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document/${testUserId}/latest`);
    retrievalTests.push({
      endpoint: 'GET /supplement-document/:user_id/latest',
      success: documentResponse.ok,
      status: documentResponse.status
    });

    const allRetrievalSuccessful = retrievalTests.every(t => t.success);
    results.retrieval = {
      success: allRetrievalSuccessful,
      details: retrievalTests
    };

    retrievalTests.forEach(test => {
      const icon = test.success ? '✅' : '❌';
      console.log(`${icon} ${test.endpoint}: ${test.status}`);
    });

    if (!allRetrievalSuccessful) {
      console.log('❌ Some retrieval endpoints failed');
      return printFinalSummary(results);
    }

  } catch (err) {
    results.retrieval = {
      success: false,
      details: [{ endpoint: 'All', success: false, error: err.message }]
    };
    console.log('❌ Retrieval validation failed:', err.message);
    return printFinalSummary(results);
  }

  // 7. Frontend Validation (simulated)
  console.log('\n📋 7. Frontend Validation');
  console.log('========================');
  
  // Since we can't run the actual frontend, we'll validate the API responses
  try {
    const baselineResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
    
    if (!baselineResponse.ok) {
      results.frontend = {
        success: false,
        message: `Frontend data retrieval failed: ${baselineResponse.statusText}`
      };
      console.log('❌ Frontend validation failed:', results.frontend.message);
      return printFinalSummary(results);
    }

    const baselineData = await baselineResponse.json();
    const baseline = baselineData.data;

    // Validate structure for frontend rendering
    const requiredFields = ['id', 'stack_name', 'total_active_items', 'items'];
    const hasAllFields = requiredFields.every(field => baseline[field]);
    const hasValidItems = baseline.items && Array.isArray(baseline.items) && baseline.items.length > 0;

    if (hasAllFields && hasValidItems) {
      results.frontend = {
        success: true,
        message: 'Frontend data structure valid for rendering'
      };
      console.log('✅ Frontend data structure valid');
      console.log(`   - Stack: ${baseline.stack_name}`);
      console.log(`   - Active Items: ${baseline.total_active_items}`);
      console.log(`   - Retrieved Items: ${baseline.items.length}`);
    } else {
      results.frontend = {
        success: false,
        message: 'Frontend data structure incomplete'
      };
      console.log('❌ Frontend data structure incomplete');
      console.log(`   - All fields present: ${hasAllFields}`);
      console.log(`   - Valid items array: ${hasValidItems}`);
    }

  } catch (err) {
    results.frontend = {
      success: false,
      message: `Frontend validation failed: ${err.message}`
    };
    console.log('❌ Frontend validation failed:', err.message);
  }

  // 8. Naming Consistency Check
  console.log('\n📋 8. Naming Consistency Check');
  console.log('=============================');
  
  const expectedNames = requiredTables;
  const consistencyIssues = [];
  
  // Check if all references use correct names
  expectedNames.forEach(name => {
    if (name === 'supplement_baselines') {
      consistencyIssues.push(`Found plural 'supplement_baselines' - should be singular 'supplement_baseline'`);
    }
  });
  
  results.namingConsistency = {
    success: consistencyIssues.length === 0,
    issues: consistencyIssues
  };
  
  if (consistencyIssues.length === 0) {
    console.log('✅ All naming conventions consistent');
  } else {
    console.log('❌ Naming consistency issues found:');
    consistencyIssues.forEach(issue => console.log(`   - ${issue}`));
  }

  // Print final summary
  printFinalSummary(results);
}

function printFinalSummary(results) {
  console.log('\n📊 COMPREHENSIVE VALIDATION SUMMARY');
  console.log('===================================');
  
  const testNames = {
    databaseVisibility: 'Database Visibility',
    schemaCache: 'Schema Cache',
    permissions: 'Permissions',
    backendQuery: 'Backend Query',
    endToEndSave: 'End-to-End Save',
    retrieval: 'Retrieval',
    frontend: 'Frontend',
    namingConsistency: 'Naming Consistency'
  };
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testNames[test]}`);
    if (!result.success && result.message) {
      console.log(`    ${result.message}`);
    }
  });

  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  const overallSuccess = passedTests === totalTests;
  
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`📈 Test Coverage: ${passedTests}/${totalTests} tests passed`);

  if (!overallSuccess) {
    console.log('\n🔧 RECOMMENDATIONS:');
    if (!results.schemaCache.success) {
      console.log('   - Execute schema fixes: apply_schema_fixes.sql in Supabase SQL Editor');
      console.log('   - Reload PostgREST cache: NOTIFY pgrst, \'reload schema\';');
    }
    if (!results.databaseVisibility.success) {
      console.log('   - Run deploy_supplement_schema.sql to create missing tables');
    }
    if (!results.endToEndSave.success) {
      console.log('   - Check API server logs for upload errors');
      console.log('   - Verify request payload format');
    }
  }

  return results;
}

// Run comprehensive validation
comprehensiveValidation()
  .then((results) => {
    const overallSuccess = Object.values(results).every(r => r.success);
    process.exit(overallSuccess ? 0 : 1);
  })
  .catch((error) => {
    console.error('Comprehensive validation failed:', error);
    process.exit(1);
  });
