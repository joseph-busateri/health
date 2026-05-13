const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalValidation() {
  console.log('🎯 FINAL SUPPLEMENT BASELINE VALIDATION\n');
  console.log('=====================================\n');
  
  const results = {
    schemaStructure: false,
    backendAccess: false,
    saveFlow: false,
    retrievalFlow: false,
    frontendSummary: false
  };

  try {
    // 1. Schema Structure Validation
    console.log('📋 1. Schema Structure Validation');
    console.log('===============================');
    
    const tables = ['supplement_documents', 'supplement_baseline', 'supplement_items', 'supplement_extracted_sections', 'supplement_change_log'];
    const requiredColumns = {
      supplement_documents: ['id', 'user_id', 'document_type', 'parse_status'],
      supplement_baseline: ['id', 'user_id', 'document_id', 'stack_name', 'total_active_items'],
      supplement_items: ['id', 'supplement_baseline_id', 'supplement_name', 'dosage', 'dosage_unit'],
      supplement_extracted_sections: ['id', 'user_id', 'document_id', 'raw_text', 'normalized_name'],
      supplement_change_log: ['id', 'user_id', 'supplement_baseline_id', 'field_name', 'change_source']
    };
    
    let allTablesValid = true;
    
    for (const table of tables) {
      const columns = requiredColumns[table];
      let tableValid = true;
      
      for (const column of columns) {
        try {
          const { error } = await supabase.from(table).select(column).limit(1);
          if (error && error.message.includes('column does not exist')) {
            console.log(`❌ ${table}.${column}: MISSING`);
            tableValid = false;
          } else {
            console.log(`✅ ${table}.${column}: ACCESSIBLE`);
          }
        } catch (err) {
          console.log(`❌ ${table}.${column}: ERROR`);
          tableValid = false;
        }
      }
      
      if (!tableValid) {
        allTablesValid = false;
      }
    }
    
    results.schemaStructure = allTablesValid;
    console.log(`\n${allTablesValid ? '✅' : '❌'} Schema Structure: ${allTablesValid ? 'PASS' : 'FAIL'}`);

    // 2. Backend Access Validation
    console.log('\n📋 2. Backend Access Validation');
    console.log('===============================');
    
    try {
      // Test read operations on all tables
      let backendAccessValid = true;
      
      for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code !== 'PGRST116') {
          console.log(`❌ ${table} READ: ${error.message}`);
          backendAccessValid = false;
        } else {
          console.log(`✅ ${table} READ: OK`);
        }
      }
      
      // Test write operations
      const testUUID = '550e8400-e29b-41d4-a716-446655440001';
      const { data: testDoc } = await supabase
        .from('supplement_documents')
        .insert({
          user_id: testUUID,
          document_type: 'manual_entry',
          parse_status: 'pending'
        })
        .select()
        .single();
      
      if (testDoc) {
        // Test baseline creation
        const { data: testBaseline } = await supabase
          .from('supplement_baseline')
          .insert({
            user_id: testUUID,
            document_id: testDoc.id,
            stack_name: 'Test Stack',
            total_active_items: 0
          })
          .select()
          .single();
        
        if (testBaseline) {
          // Test extracted sections creation
          const { data: testSection } = await supabase
            .from('supplement_extracted_sections')
            .insert({
              user_id: testUUID,
              document_id: testDoc.id,
              raw_text: 'Test section',
              normalized_name: 'test_section',
              extraction_confidence: 0.95
            })
            .select()
            .single();
          
          if (testSection) {
            // Clean up test data
            await supabase.from('supplement_extracted_sections').delete().eq('id', testSection.id);
            await supabase.from('supplement_baseline').delete().eq('id', testBaseline.id);
            await supabase.from('supplement_documents').delete().eq('id', testDoc.id);
            console.log('✅ Backend WRITE: OK (test data cleaned up)');
          } else {
            backendAccessValid = false;
            console.log('❌ Backend WRITE: Failed to create extracted section');
          }
        } else {
          backendAccessValid = false;
          console.log('❌ Backend WRITE: Failed to create baseline');
        }
      } else {
        backendAccessValid = false;
        console.log('❌ Backend WRITE: Failed to create document');
      }
      
      results.backendAccess = backendAccessValid;
      console.log(`\n${backendAccessValid ? '✅' : '❌'} Backend Access: ${backendAccessValid ? 'PASS' : 'FAIL'}`);
      
    } catch (error) {
      results.backendAccess = false;
      console.log(`❌ Backend Access: FAIL - ${error.message}`);
    }

    // 3. Save Flow Validation
    console.log('\n📋 3. End-to-End Save Flow Validation');
    console.log('===================================');
    
    try {
      const testPayload = JSON.parse(fs.readFileSync('./test_supplement_payload.json', 'utf8'));
      
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        const result = await response.json();
        const { document, baseline, items, extractedSections } = result.data;
        
        console.log('✅ Save Flow: SUCCESS');
        console.log(`   - Document: ${document.id}`);
        console.log(`   - Baseline: ${baseline.id}`);
        console.log(`   - Items: ${items.length}`);
        console.log(`   - Sections: ${extractedSections.length}`);
        
        results.saveFlow = true;
      } else {
        const error = await response.json();
        console.log('❌ Save Flow: FAILED');
        console.log(`   - Error: ${error.error || response.statusText}`);
        results.saveFlow = false;
      }
    } catch (error) {
      console.log('❌ Save Flow: FAILED');
      console.log(`   - Error: ${error.message}`);
      results.saveFlow = false;
    }

    // 4. Retrieval Flow Validation
    console.log('\n📋 4. Retrieval Flow Validation');
    console.log('=============================');
    
    try {
      const testUserId = '550e8400-e29b-41d4-a716-446655440000';
      let retrievalValid = true;
      
      // Test baseline retrieval
      const baselineResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
      console.log(`${baselineResponse.ok ? '✅' : '❌'} GET /supplement-baseline/:user_id: ${baselineResponse.status}`);
      if (!baselineResponse.ok) retrievalValid = false;
      
      // Test latest document retrieval
      const documentResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-document/${testUserId}/latest`);
      console.log(`${documentResponse.ok ? '✅' : '❌'} GET /supplement-document/:user_id/latest: ${documentResponse.status}`);
      if (!documentResponse.ok) retrievalValid = false;
      
      results.retrievalFlow = retrievalValid;
      console.log(`\n${retrievalValid ? '✅' : '❌'} Retrieval Flow: ${retrievalValid ? 'PASS' : 'FAIL'}`);
      
    } catch (error) {
      console.log('❌ Retrieval Flow: FAILED');
      console.log(`   - Error: ${error.message}`);
      results.retrievalFlow = false;
    }

    // 5. Frontend Summary Validation
    console.log('\n📋 5. Frontend Summary Validation');
    console.log('===============================');
    
    try {
      const testUserId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/supplement-baseline/${testUserId}`);
      
      if (response.ok) {
        const baselineData = await response.json();
        const baseline = baselineData.data;
        
        // Validate structure for frontend rendering
        const requiredFields = ['id', 'stack_name', 'total_active_items', 'items'];
        const hasAllFields = requiredFields.every(field => baseline[field]);
        const hasValidItems = baseline.items && Array.isArray(baseline.items) && baseline.items.length > 0;
        const itemsHaveRequiredFields = hasValidItems && baseline.items.every(item => 
          item.supplement_name && item.dosage && item.dosage_unit && item.frequency && item.timing
        );

        if (hasAllFields && hasValidItems && itemsHaveRequiredFields) {
          console.log('✅ Frontend Summary: PASS');
          console.log(`   - Stack: ${baseline.stack_name}`);
          console.log(`   - Active Items: ${baseline.total_active_items}`);
          console.log(`   - Retrieved Items: ${baseline.items.length}`);
          console.log(`   - Items have required fields: ${itemsHaveRequiredFields}`);
          results.frontendSummary = true;
        } else {
          console.log('❌ Frontend Summary: FAIL');
          console.log(`   - All fields present: ${hasAllFields}`);
          console.log(`   - Valid items array: ${hasValidItems}`);
          console.log(`   - Items have required fields: ${itemsHaveRequiredFields}`);
          results.frontendSummary = false;
        }
      } else {
        console.log('❌ Frontend Summary: FAILED');
        console.log(`   - Status: ${response.status}`);
        results.frontendSummary = false;
      }
    } catch (error) {
      console.log('❌ Frontend Summary: FAILED');
      console.log(`   - Error: ${error.message}`);
      results.frontendSummary = false;
    }

    // Print final summary
    console.log('\n📊 FINAL VALIDATION SUMMARY');
    console.log('==========================');
    
    const testNames = {
      schemaStructure: 'Schema Structure',
      backendAccess: 'Backend Access', 
      saveFlow: 'Save Flow',
      retrievalFlow: 'Retrieval Flow',
      frontendSummary: 'Frontend Summary'
    };
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${testNames[test]}`);
    });

    const passedTests = Object.values(results).filter(r => r).length;
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
      Object.entries(results).forEach(([test, passed]) => {
        if (!passed) {
          console.log(`   - ${testNames[test]}: FAILED`);
        }
      });
    }

    return results;

  } catch (error) {
    console.error('❌ Final validation failed:', error);
    return results;
  }
}

// Run final validation
finalValidation()
  .then((results) => {
    const overallSuccess = Object.values(results).every(r => r);
    process.exit(overallSuccess ? 0 : 1);
  })
  .catch((error) => {
    console.error('Final validation failed:', error);
    process.exit(1);
  });
