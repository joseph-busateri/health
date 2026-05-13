const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function validateSchemaVisibility() {
  console.log('🔍 Validating Supplement Schema Visibility\n');
  
  const results = {
    tableExists: { success: false, message: '' },
    postgrestVisible: { success: false, message: '' },
    backendQueryable: { success: false, message: '' },
    permissionsCorrect: { success: false, message: '' }
  };

  try {
    // Test 1: Confirm supplement_baseline exists in public schema
    console.log('📋 Test 1: Checking if supplement_baseline exists in public schema...');
    try {
      // Try to select from the table directly
      const { data, error } = await supabase
        .from('supplement_baseline')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        results.tableExists = {
          success: false,
          message: 'Table does not exist or not accessible via PostgREST'
        };
        console.log('❌ Table not found in PostgREST schema cache');
      } else if (error) {
        results.tableExists = {
          success: false,
          message: `Table access error: ${error.message}`
        };
        console.log('❌ Table access error:', error.message);
      } else {
        results.tableExists = {
          success: true,
          message: `Table exists and accessible, ${data?.length || 0} rows found`
        };
        console.log('✅ Table exists and accessible via PostgREST');
      }
    } catch (err) {
      results.tableExists = {
        success: false,
        message: `Connection error: ${err.message}`
      };
      console.log('❌ Connection error:', err.message);
    }

    // Test 2: Confirm PostgREST can see all supplement tables
    console.log('\n📋 Test 2: Checking PostgREST visibility for all supplement tables...');
    try {
      const tables = [
        'supplement_documents',
        'supplement_baseline',
        'supplement_items',
        'supplement_extracted_sections',
        'supplement_change_log'
      ];
      
      const visibilityResults = [];
      
      for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(1);
        
        if (error && error.code === 'PGRST116') {
          visibilityResults.push({ table, visible: false, error: 'Not found in cache' });
        } else if (error) {
          visibilityResults.push({ table, visible: false, error: error.message });
        } else {
          visibilityResults.push({ table, visible: true, error: null });
        }
      }
      
      const allVisible = visibilityResults.every(r => r.visible);
      results.postgrestVisible = {
        success: allVisible,
        message: allVisible ? 'All tables visible to PostgREST' : 'Some tables not visible',
        details: visibilityResults
      };
      
      if (allVisible) {
        console.log('✅ All supplement tables visible to PostgREST');
      } else {
        console.log('❌ Some supplement tables not visible to PostgREST:');
        visibilityResults.forEach(r => {
          const status = r.visible ? '✅' : '❌';
          console.log(`   ${status} ${r.table}: ${r.error || 'Visible'}`);
        });
      }
    } catch (err) {
      results.postgrestVisible = {
        success: false,
        message: `PostgREST visibility check failed: ${err.message}`
      };
      console.log('❌ PostgREST visibility check failed:', err.message);
    }

    // Test 3: Confirm backend can query supplement_baseline without errors
    console.log('\n📋 Test 3: Testing backend query operations...');
    try {
      const queryTests = [];
      
      // Test basic select
      const { data: selectData, error: selectError } = await supabase
        .from('supplement_baseline')
        .select('id, user_id, stack_name, created_at')
        .limit(1);
      
      queryTests.push({
        operation: 'SELECT basic fields',
        success: !selectError,
        error: selectError?.message,
        resultCount: selectData?.length || 0
      });
      
      // Test insert (if table exists)
      if (results.tableExists.success) {
        const testUUID = '550e8400-e29b-41d4-a716-446655440001';
        const { data: insertData, error: insertError } = await supabase
          .from('supplement_baseline')
          .insert({
            user_id: testUUID,
            document_id: '550e8400-e29b-41d4-a716-446655440002',
            stack_name: 'Test Stack',
            total_active_items: 0
          })
          .select()
          .single();
        
        queryTests.push({
          operation: 'INSERT test record',
          success: !insertError,
          error: insertError?.message,
          recordId: insertData?.id
        });
        
        // Clean up if insert was successful
        if (insertData?.id) {
          await supabase.from('supplement_baseline').delete().eq('id', insertData.id);
        }
      }
      
      const allQueriesSuccessful = queryTests.every(t => t.success);
      results.backendQueryable = {
        success: allQueriesSuccessful,
        message: allQueriesSuccessful ? 'All backend queries successful' : 'Some backend queries failed',
        details: queryTests
      };
      
      if (allQueriesSuccessful) {
        console.log('✅ All backend query operations successful');
        queryTests.forEach(t => console.log(`   - ${t.operation}: ✅`));
      } else {
        console.log('❌ Some backend query operations failed:');
        queryTests.forEach(t => {
          const status = t.success ? '✅' : '❌';
          console.log(`   ${status} ${t.operation}: ${t.error || 'Success'}`);
        });
      }
    } catch (err) {
      results.backendQueryable = {
        success: false,
        message: `Backend query test failed: ${err.message}`
      };
      console.log('❌ Backend query test failed:', err.message);
    }

    // Test 4: Confirm permissions are correct for backend role
    console.log('\n📋 Test 4: Checking backend service role permissions...');
    try {
      const permissionTests = [];
      
      // Test service role can read
      const { data: readData, error: readError } = await supabase
        .from('supplement_baseline')
        .select('*')
        .limit(1);
      
      permissionTests.push({
        permission: 'READ (service role)',
        success: !readError || readError.code !== '42501', // 42501 = permission denied
        error: readError?.message
      });
      
      // Test service role can write (if table exists)
      if (results.tableExists.success) {
        const testUUID = '550e8400-e29b-41d4-a716-446655440003';
        const { data: writeData, error: writeError } = await supabase
          .from('supplement_baseline')
          .insert({
            user_id: testUUID,
            document_id: '550e8400-e29b-41d4-a716-446655440004',
            stack_name: 'Permission Test',
            total_active_items: 0
          })
          .select()
          .single();
        
        permissionTests.push({
          permission: 'WRITE (service role)',
          success: !writeError || writeError.code !== '42501',
          error: writeError?.message
        });
        
        // Clean up
        if (writeData?.id) {
          await supabase.from('supplement_baseline').delete().eq('id', writeData.id);
        }
      }
      
      const allPermissionsCorrect = permissionTests.every(t => t.success);
      results.permissionsCorrect = {
        success: allPermissionsCorrect,
        message: allPermissionsCorrect ? 'All service role permissions correct' : 'Some permission issues detected',
        details: permissionTests
      };
      
      if (allPermissionsCorrect) {
        console.log('✅ Service role permissions are correct');
        permissionTests.forEach(t => console.log(`   - ${t.permission}: ✅`));
      } else {
        console.log('❌ Some permission issues detected:');
        permissionTests.forEach(t => {
          const status = t.success ? '✅' : '❌';
          console.log(`   ${status} ${t.permission}: ${t.error || 'OK'}`);
        });
      }
    } catch (err) {
      results.permissionsCorrect = {
        success: false,
        message: `Permission check failed: ${err.message}`
      };
      console.log('❌ Permission check failed:', err.message);
    }

  } catch (error) {
    console.error('❌ Schema visibility validation failed:', error);
  }

  // Print final summary
  console.log('\n📊 SCHEMA VISIBILITY SUMMARY');
  console.log('==============================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const formattedName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${formattedName}`);
    if (!result.success && result.message) {
      console.log(`    ${result.message}`);
    }
  });

  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  const overallSuccess = passedTests === totalTests;
  
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`📈 Test Coverage: ${passedTests}/${totalTests} tests passed`);

  // Additional recommendations
  if (!overallSuccess) {
    console.log('\n🔧 RECOMMENDATIONS:');
    if (!results.tableExists.success) {
      console.log('   - Run deploy_supplement_schema.sql in Supabase SQL Editor');
      console.log('   - Reload PostgREST schema cache');
    }
    if (!results.postgrestVisible.success) {
      console.log('   - Restart PostgREST service');
      console.log('   - Check table permissions in Supabase');
    }
    if (!results.backendQueryable.success) {
      console.log('   - Verify table structure matches expectations');
      console.log('   - Check foreign key constraints');
    }
    if (!results.permissionsCorrect.success) {
      console.log('   - Review RLS policies for supplement tables');
      console.log('   - Ensure service role has proper permissions');
    }
  }

  return results;
}

// Run validation
validateSchemaVisibility()
  .then((results) => {
    const overallSuccess = Object.values(results).every(r => r.success);
    process.exit(overallSuccess ? 0 : 1);
  })
  .catch((error) => {
    console.error('Schema visibility validation failed:', error);
    process.exit(1);
  });
