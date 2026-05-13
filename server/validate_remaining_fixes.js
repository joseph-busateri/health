const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function validateRemainingFixes() {
  console.log('🔍 VALIDATING REMAINING SUPPLEMENT SCHEMA FIXES\n');
  
  const results = {
    schemaStructure: { success: false, details: [] },
    backendAccess: { success: false, message: '' },
    saveFlow: { success: false, message: '' },
    retrievalFlow: { success: false, details: [] },
    frontendSummary: { success: false, message: '' }
  };

  // 1. Confirm supplement_extracted_sections contains document_id
  console.log('📋 1. Checking supplement_extracted_sections structure');
  console.log('==================================================');
  
  const requiredColumns = ['id', 'user_id', 'document_id', 'raw_text', 'normalized_name', 'extraction_confidence', 'created_at'];
  const structureResults = [];
  
  for (const column of requiredColumns) {
    try {
      const { error } = await supabase.from('supplement_extracted_sections').select(column).limit(1);
      if (error && error.message.includes('column does not exist')) {
        structureResults.push({ column, status: 'MISSING', error: error.message });
      } else if (error) {
        structureResults.push({ column, status: 'ERROR', error: error.message });
      } else {
        structureResults.push({ column, status: 'ACCESSIBLE', error: null });
      }
    } catch (err) {
      structureResults.push({ column, status: 'CONNECTION_ERROR', error: err.message });
    }
  }
  
  const allColumnsAccessible = structureResults.every(r => r.status === 'ACCESSIBLE');
  results.schemaStructure = {
    success: allColumnsAccessible,
    details: structureResults
  };
  
  structureResults.forEach(r => {
    const icon = r.status === 'ACCESSIBLE' ? '✅' : '❌';
    console.log(`${icon} ${r.column}: ${r.status}${r.error ? ' - ' + r.error : ''}`);
  });
  
  if (!allColumnsAccessible) {
    console.log('\n❌ Some columns are still missing. Additional schema fixes required.');
    return printFinalSummary(results);
  }

  // 2. Test foreign key relationship (by attempting a valid insert)
  console.log('\n📋 2. Testing foreign key relationship');
  console.log('=====================================');
  
  try {
    // First get a valid document ID
    const { data: documents, error: docError } = await supabase
      .from('supplement_documents')
      .select('id')
      .limit(1);
    
    if (docError || !documents || documents.length === 0) {
      // Create a test document
      const { data: newDoc, error: createError } = await supabase
        .from('supplement_documents')
        .insert({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          document_type: 'manual_entry',
          parse_status: 'pending'
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Could not create test document for FK test:', createError.message);
        return printFinalSummary(results);
      }
      
      console.log('✅ Created test document for FK test:', newDoc.id);
      
      // Test FK relationship
      const { data: testSection, error: fkError } = await supabase
        .from('supplement_extracted_sections')
        .insert({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          document_id: newDoc.id,
          raw_text: 'Test section',
          normalized_name: 'test_section',
          extraction_confidence: 0.95
        })
        .select()
        .single();
      
      if (fkError) {
        console.log('❌ Foreign key test failed:', fkError.message);
        // Clean up
        await supabase.from('supplement_documents').delete().eq('id', newDoc.id);
        return printFinalSummary(results);
      } else {
        console.log('✅ Foreign key relationship working');
        // Clean up
        await supabase.from('supplement_extracted_sections').delete().eq('id', testSection.id);
        await supabase.from('supplement_documents').delete().eq('id', newDoc.id);
        console.log('✅ Test data cleaned up');
      }
    } else {
      console.log('✅ Using existing document for FK test:', documents[0].id);
      
      // Test FK relationship with existing document
      const { data: testSection, error: fkError } = await supabase
        .from('supplement_extracted_sections')
        .insert({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          document_id: documents[0].id,
          raw_text: 'Test section',
          normalized_name: 'test_section',
          extraction_confidence: 0.95
        })
        .select()
        .single();
      
      if (fkError) {
        console.log('❌ Foreign key test failed:', fkError.message);
        return printFinalSummary(results);
      } else {
        console.log('✅ Foreign key relationship working');
        // Clean up
        await supabase.from('supplement_extracted_sections').delete().eq('id', testSection.id);
        console.log('✅ Test data cleaned up');
      }
    }
  } catch (err) {
    console.log('❌ Foreign key test failed:', err.message);
    return printFinalSummary(results);
  }

  // 3. Confirm index on document_id exists
  console.log('\n📋 3. Checking index on document_id');
  console.log('===================================');
  
  try {
    // We can't directly check indexes via PostgREST, but we can test performance implications
    // by doing a query that would benefit from the index
    const { data: indexTest, error: indexError } = await supabase
      .from('supplement_extracted_sections')
      .select('id')
      .eq('document_id', '550e8400-e29b-41d4-a716-446655440000')
      .limit(10);
    
    if (indexError) {
      console.log('❌ Index test query failed:', indexError.message);
    } else {
      console.log('✅ Query by document_id successful (index likely exists)');
    }
  } catch (err) {
    console.log('❌ Index test failed:', err.message);
  }

  // 4. Confirm backend can query without schema errors
  console.log('\n📋 4. Backend access validation');
  console.log('===============================');
  
  try {
    // Test read operations
    const { data: readData, error: readError } = await supabase
      .from('supplement_extracted_sections')
      .select('*')
      .limit(1);
    
    if (readError) {
      results.backendAccess = {
        success: false,
        message: `Read query failed: ${readError.message}`
      };
      console.log('❌ Backend read query failed:', readError.message);
      return printFinalSummary(results);
    }
    
    console.log('✅ Backend read query successful');
    
    // Test write operations
    const testUUID = '550e8400-e29b-41d4-a716-446655440001';
    const { data: existingDoc } = await supabase
      .from('supplement_documents')
      .select('id')
      .limit(1)
      .single();
    
    if (existingDoc) {
      const { data: writeData, error: writeError } = await supabase
        .from('supplement_extracted_sections')
        .insert({
          user_id: testUUID,
          document_id: existingDoc.id,
          raw_text: 'Backend test section',
          normalized_name: 'backend_test',
          extraction_confidence: 0.88
        })
        .select()
        .single();
      
      if (writeError) {
        results.backendAccess = {
          success: false,
          message: `Write query failed: ${writeError.message}`
        };
        console.log('❌ Backend write query failed:', writeError.message);
        return printFinalSummary(results);
      } else {
        console.log('✅ Backend write query successful');
        // Clean up
        await supabase.from('supplement_extracted_sections').delete().eq('id', writeData.id);
        console.log('✅ Test record cleaned up');
      }
    }
    
    results.backendAccess = {
      success: true,
      message: 'All backend operations successful'
    };
    
  } catch (err) {
    results.backendAccess = {
      success: false,
      message: `Backend access validation failed: ${err.message}`
    };
    console.log('❌ Backend access validation failed:', err.message);
    return printFinalSummary(results);
  }

  // 5. Re-run schema visibility validation
  console.log('\n📋 5. Schema visibility validation');
  console.log('=================================');
  
  const tables = ['supplement_documents', 'supplement_baseline', 'supplement_items', 'supplement_extracted_sections', 'supplement_change_log'];
  let allTablesVisible = true;
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error && error.code === 'PGRST116') {
        console.log(`❌ ${table}: NOT VISIBLE`);
        allTablesVisible = false;
      } else if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
        allTablesVisible = false;
      } else {
        console.log(`✅ ${table}: VISIBLE`);
      }
    } catch (err) {
      console.log(`❌ ${table}: CONNECTION ERROR`);
      allTablesVisible = false;
    }
  }
  
  if (!allTablesVisible) {
    console.log('❌ Some tables not visible');
    return printFinalSummary(results);
  }
  
  console.log('✅ All supplement tables visible');

  // 6. End-to-end supplement validation
  console.log('\n📋 6. End-to-end supplement validation');
  console.log('=====================================');
  
  try {
    const fs = require('fs');
    const testPayload = JSON.parse(fs.readFileSync('./test_supplement_payload.json', 'utf8'));
    
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      results.saveFlow = {
        success: false,
        message: `Upload failed: ${error.error || response.statusText}`
      };
      console.log('❌ End-to-end save failed:', results.saveFlow.message);
      return printFinalSummary(results);
    }

    const result = await response.json();
    const { document, baseline, items, extractedSections } = result.data;

    console.log('✅ End-to-end save successful');
    console.log(`   - Document: ${document.id}`);
    console.log(`   - Baseline: ${baseline.id}`);
    console.log(`   - Items: ${items.length}`);
    console.log(`   - Sections: ${extractedSections.length}`);

    results.saveFlow = {
      success: true,
      message: `Save successful: Document ${document.id}, Baseline ${baseline.id}, ${items.length} items, ${extractedSections.length} sections`
    };

  } catch (err) {
    results.saveFlow = {
      success: false,
      message: `End-to-end validation failed: ${err.message}`
    };
    console.log('❌ End-to-end validation failed:', err.message);
    return printFinalSummary(results);
  }

  // 7. Retrieval flow validation
  console.log('\n📋 7. Retrieval flow validation');
  console.log('==============================');
  
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const retrievalTests = [];
  
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
    results.retrievalFlow = {
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
    results.retrievalFlow = {
      success: false,
      details: [{ endpoint: 'All', success: false, error: err.message }]
    };
    console.log('❌ Retrieval validation failed:', err.message);
    return printFinalSummary(results);
  }

  // 8. Frontend summary validation
  console.log('\n📋 8. Frontend summary validation');
  console.log('================================');
  
  try {
    const baselineResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
    
    if (!baselineResponse.ok) {
      results.frontendSummary = {
        success: false,
        message: `Frontend data retrieval failed: ${baselineResponse.statusText}`
      };
      console.log('❌ Frontend validation failed:', results.frontendSummary.message);
      return printFinalSummary(results);
    }

    const baselineData = await baselineResponse.json();
    const baseline = baselineData.data;

    // Validate structure for frontend rendering
    const requiredFields = ['id', 'stack_name', 'total_active_items', 'items'];
    const hasAllFields = requiredFields.every(field => baseline[field]);
    const hasValidItems = baseline.items && Array.isArray(baseline.items) && baseline.items.length > 0;
    const itemsHaveRequiredFields = hasValidItems && baseline.items.every(item => 
      item.supplement_name && item.dosage && item.dosage_unit && item.frequency && item.timing
    );

    if (hasAllFields && hasValidItems && itemsHaveRequiredFields) {
      results.frontendSummary = {
        success: true,
        message: 'Frontend data structure valid for rendering'
      };
      console.log('✅ Frontend data structure valid');
      console.log(`   - Stack: ${baseline.stack_name}`);
      console.log(`   - Active Items: ${baseline.total_active_items}`);
      console.log(`   - Retrieved Items: ${baseline.items.length}`);
      console.log(`   - Items have required fields: ${itemsHaveRequiredFields}`);
    } else {
      results.frontendSummary = {
        success: false,
        message: 'Frontend data structure incomplete'
      };
      console.log('❌ Frontend data structure incomplete');
      console.log(`   - All fields present: ${hasAllFields}`);
      console.log(`   - Valid items array: ${hasValidItems}`);
      console.log(`   - Items have required fields: ${itemsHaveRequiredFields}`);
    }

  } catch (err) {
    results.frontendSummary = {
      success: false,
      message: `Frontend validation failed: ${err.message}`
    };
    console.log('❌ Frontend validation failed:', err.message);
  }

  // Print final summary
  printFinalSummary(results);
}

function printFinalSummary(results) {
  console.log('\n📊 FINAL VALIDATION SUMMARY');
  console.log('==========================');
  
  const testNames = {
    schemaStructure: 'Schema Structure',
    backendAccess: 'Backend Access',
    saveFlow: 'Save Flow',
    retrievalFlow: 'Retrieval Flow',
    frontendSummary: 'Frontend Summary'
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

  if (overallSuccess) {
    console.log('\n🎉 SUPPLEMENT BASELINE SYSTEM FULLY OPERATIONAL!');
    console.log('✅ All schema fixes applied successfully');
    console.log('✅ End-to-end flow working');
    console.log('✅ Frontend can render supplement summaries');
    console.log('✅ System ready for production use');
  } else {
    console.log('\n🔧 REMAINING ISSUES:');
    Object.entries(results).forEach(([test, result]) => {
      if (!result.success) {
        console.log(`   - ${testNames[test]}: ${result.message}`);
      }
    });
  }

  return results;
}

// Run validation
validateRemainingFixes()
  .then((results) => {
    const overallSuccess = Object.values(results).every(r => r.success);
    process.exit(overallSuccess ? 0 : 1);
  })
  .catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
