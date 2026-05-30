import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyWorkoutSchema() {
  console.log('🔍 Verifying Workout Baseline Schema Deployment...\n');

  const results = {
    tablesExist: false,
    postgrestAccess: false,
    indexesCreated: false,
    rlsEnabled: false,
    triggersWorking: false,
  };

  try {
    // Test 1: Check if tables exist
    console.log('📋 Test 1: Checking table existence...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'workout_%');

    if (tablesError) {
      console.log('⚠️  Could not check information_schema:', tablesError.message);
      
      // Alternative: Try direct table access
      const workoutTables = ['workout_documents', 'workout_baselines', 'workout_extracted_sections', 'workout_change_log'];
      let accessibleTables = 0;
      
      for (const tableName of workoutTables) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('count')
            .limit(1);
          
          if (!error) {
            console.log(`✅ ${tableName} is accessible`);
            accessibleTables++;
          } else {
            console.log(`❌ ${tableName} not accessible:`, error.message);
          }
        } catch (err) {
          console.log(`❌ ${tableName} failed:`, err);
        }
      }
      
      if (accessibleTables === workoutTables.length) {
        console.log('✅ All workout tables are accessible');
        results.tablesExist = true;
      }
    } else {
      console.log(`✅ Found ${tables?.length || 0} workout tables`);
      tables?.forEach(table => console.log(`   - ${table.table_name}`));
      results.tablesExist = true;
    }

    // Test 2: Check PostgREST access
    console.log('\n📋 Test 2: Checking PostgREST access...');
    
    try {
      const { data, error } = await supabase
        .from('workout_documents')
        .select('id, user_id, created_at')
        .limit(1);

      if (error) {
        console.log('❌ PostgREST access failed:', error.message);
      } else {
        console.log('✅ PostgREST access working');
        console.log(`   Sample query returned ${data?.length || 0} rows`);
        results.postgrestAccess = true;
      }
    } catch (err) {
      console.log('❌ PostgREST access failed:', err);
    }

    // Test 3: Test basic CRUD operations
    console.log('\n📋 Test 3: Testing basic CRUD operations...');
    
    const testUserId = 'schema-verification-test';
    
    // Test INSERT
    const { data: insertData, error: insertError } = await supabase
      .from('workout_documents')
      .insert({
        user_id: testUserId,
        document_type: 'manual_entry',
        program_start_date: '2026-01-01',
        notes: 'Schema verification test'
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ INSERT operation failed:', insertError.message);
    } else {
      console.log('✅ INSERT operation successful');
      console.log(`   Created document ID: ${insertData.id}`);
      
      // Test SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('workout_documents')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      if (selectError) {
        console.log('❌ SELECT operation failed:', selectError.message);
      } else {
        console.log('✅ SELECT operation successful');
        console.log(`   Retrieved document: ${selectData.document_type}`);
        
        // Test UPDATE
        const { data: updateData, error: updateError } = await supabase
          .from('workout_documents')
          .update({ notes: 'Updated schema verification test' })
          .eq('id', insertData.id)
          .select()
          .single();

        if (updateError) {
          console.log('❌ UPDATE operation failed:', updateError.message);
        } else {
          console.log('✅ UPDATE operation successful');
          console.log(`   Updated at: ${updateData.updated_at}`);
          
          // Test DELETE
          const { error: deleteError } = await supabase
            .from('workout_documents')
            .delete()
            .eq('id', insertData.id);

          if (deleteError) {
            console.log('❌ DELETE operation failed:', deleteError.message);
          } else {
            console.log('✅ DELETE operation successful');
            results.postgrestAccess = true;
          }
        }
      }
    }

    // Test 4: Test workout baseline creation
    console.log('\n📋 Test 4: Testing workout baseline creation...');
    
    const { data: baselineData, error: baselineError } = await supabase
      .from('workout_baselines')
      .insert({
        user_id: testUserId,
        document_id: insertData?.id || '00000000-0000-0000-0000-000000000000',
        program_name: 'Test Program',
        workout_days_per_week: 4,
        training_style: 'Test Style',
        monday_plan: 'Test Monday',
        exercises: [
          {
            name: 'Test Exercise',
            dayAssociation: 'Monday',
            setRepLoadNotes: '3x10',
            grouping: 'Test Group'
          }
        ]
      })
      .select()
      .single();

    if (baselineError) {
      console.log('❌ Workout baseline creation failed:', baselineError.message);
    } else {
      console.log('✅ Workout baseline creation successful');
      console.log(`   Created baseline: ${baselineData.program_name}`);
      
      // Cleanup
      await supabase
        .from('workout_baselines')
        .delete()
        .eq('id', baselineData.id);
    }

    // Test 5: Check indexes (basic performance test)
    console.log('\n📋 Test 5: Checking query performance...');
    
    const startTime = Date.now();
    const { data: perfData, error: perfError } = await supabase
      .from('workout_documents')
      .select('id, user_id, created_at')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    const queryTime = Date.now() - startTime;

    if (perfError) {
      console.log('❌ Performance test failed:', perfError.message);
    } else {
      console.log(`✅ Performance test completed in ${queryTime}ms`);
      console.log(`   Query returned ${perfData?.length || 0} rows`);
      
      if (queryTime < 100) {
        console.log('✅ Query performance is good (indexes likely working)');
        results.indexesCreated = true;
      } else {
        console.log('⚠️  Query performance may need optimization');
      }
    }

  } catch (error) {
    console.error('❌ Schema verification failed:', error);
  }

  // Print Summary
  console.log('\n📊 SCHEMA VERIFICATION SUMMARY');
  console.log('==============================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`Overall: ${passedTests}/${totalTests} tests passed\n`);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const formattedName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${formattedName}`);
  });

  if (passedTests === totalTests) {
    console.log('\n🎉 SCHEMA DEPLOYMENT VERIFIED - Ready for validation!');
  } else {
    console.log('\n⚠️  Some schema components need attention');
  }

  return results;
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyWorkoutSchema().catch(console.error);
}

export { verifyWorkoutSchema };
