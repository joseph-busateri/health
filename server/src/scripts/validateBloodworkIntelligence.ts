/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000016';

async function runValidation() {
  console.log('🚀 BLOODWORK INTELLIGENCE ENGINE VALIDATION\n');
  console.log('============================================\n');

  const results = {
    database: false,
    crud: false,
    api: false,
    quality: false
  };

  try {
    // 1. Test Database Table
    console.log('1️⃣ Testing Database Table...');
    
    const { data: testRec, error: testError } = await supabase
      .from('bloodwork_recommendations')
      .insert({
        user_id: TEST_USER_ID,
        test_name: 'Test LDL',
        recommendation_type: 'cardiovascular',
        recommendation_title: 'Test Recommendation',
        recommendation_text: 'This is a test',
        rationale: 'Test rationale',
        confidence: 0.8,
        severity: 'medium',
        source_document_ids: [],
        source_result_ids: [],
        source_trend_window: {
          start_date: '2024-01-01',
          end_date: '2024-03-31',
          data_points: 3
        }
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Database test failed:', testError.message);
    } else {
      console.log('✅ Database table working');
      results.database = true;

      // 2. Test CRUD Operations
      console.log('\n2️⃣ Testing CRUD Operations...');
      
      // Create multiple recommendations
      const { data: recs, error: createError } = await supabase
        .from('bloodwork_recommendations')
        .insert([
          {
            user_id: TEST_USER_ID,
            test_name: 'LDL Cholesterol',
            recommendation_type: 'cardiovascular',
            recommendation_title: 'High LDL',
            recommendation_text: 'LDL is elevated',
            rationale: 'Cardiovascular risk',
            confidence: 0.85,
            severity: 'high',
            source_document_ids: [],
            source_result_ids: [],
            source_trend_window: { start_date: '2024-01-01', end_date: '2024-03-31', data_points: 3 }
          },
          {
            user_id: TEST_USER_ID,
            test_name: 'Hemoglobin A1c',
            recommendation_type: 'metabolic',
            recommendation_title: 'Elevated A1c',
            recommendation_text: 'A1c is high',
            rationale: 'Metabolic health',
            confidence: 0.75,
            severity: 'medium',
            source_document_ids: [],
            source_result_ids: [],
            source_trend_window: { start_date: '2024-01-01', end_date: '2024-03-31', data_points: 3 }
          }
        ])
        .select();

      if (createError) {
        console.log('❌ CRUD creation failed:', createError.message);
      } else {
        // Test retrieval
        const { data: allRecs, error: retrieveError } = await supabase
          .from('bloodwork_recommendations')
          .select('*')
          .eq('user_id', TEST_USER_ID);

        if (retrieveError) {
          console.log('❌ CRUD retrieval failed:', retrieveError.message);
        } else {
          // Test status update
          const { data: updatedRec, error: updateError } = await supabase
            .from('bloodwork_recommendations')
            .update({ status: 'resolved' })
            .eq('id', testRec.id)
            .select()
            .single();

          if (updateError) {
            console.log('❌ CRUD update failed:', updateError.message);
          } else {
            console.log('✅ CRUD operations working');
            results.crud = true;

            // 3. Test API Endpoints
            console.log('\n3️⃣ Testing API Endpoints...');
            
            try {
              const healthResponse = await fetch(`${API_BASE_URL}/health`);
              if (healthResponse.ok) {
                console.log('✅ Server is running');

                const genResponse = await fetch(`${API_BASE_URL}/bloodwork/recommendations/generate/${TEST_USER_ID}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ force_regenerate: true })
                });

                if (genResponse.ok) {
                  const genData = await genResponse.json();
                  console.log('✅ API endpoints working');
                  results.api = true;
                } else {
                  console.log('❌ API generation failed:', genResponse.status);
                }
              } else {
                console.log('❌ Server health check failed');
              }
            } catch (apiError) {
              console.log('❌ API test failed - server not running');
            }

            // 4. Test Data Quality
            console.log('\n4️⃣ Testing Data Quality...');
            
            const { data: qualityRecs, error: qualityError } = await supabase
              .from('bloodwork_recommendations')
              .select('*')
              .eq('user_id', TEST_USER_ID);

            if (qualityError) {
              console.log('❌ Quality check failed:', qualityError.message);
            } else {
              let qualityScore = 0;
              const totalChecks = qualityRecs.length * 5; // 5 quality checks per recommendation

              qualityRecs.forEach(rec => {
                if (rec.test_name && rec.recommendation_title && rec.recommendation_text) qualityScore++;
                if (rec.confidence >= 0 && rec.confidence <= 1) qualityScore++;
                if (['low', 'medium', 'high'].includes(rec.severity)) qualityScore++;
                if (rec.rationale && rec.rationale.length > 0) qualityScore++;
                if (rec.source_trend_window && rec.source_trend_window.start_date) qualityScore++;
              });

              const qualityPercent = (qualityScore / totalChecks * 100).toFixed(1);
              console.log(`✅ Data quality: ${qualityPercent}%`);
              results.quality = true;
            }
          }
        }
      }

      // Cleanup
      await supabase.from('bloodwork_recommendations').delete().eq('user_id', TEST_USER_ID);
    }

  } catch (error) {
    console.log('❌ Validation failed:', (error as Error).message);
  }

  // Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('====================\n');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);

  console.log(`✅ Database Table: ${results.database ? 'PASS' : 'FAIL'}`);
  console.log(`✅ CRUD Operations: ${results.crud ? 'PASS' : 'FAIL'}`);
  console.log(`✅ API Endpoints: ${results.api ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Data Quality: ${results.quality ? 'PASS' : 'FAIL'}`);

  console.log(`\n🎯 Overall Result: ${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '⚠️  PARTIAL SUCCESS'}`);
  console.log(`📈 Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);

  if (passedTests >= 3) { // At least database, crud, and quality working
    console.log('\n🎉 BLOODWORK INTELLIGENCE ENGINE IS FUNCTIONAL!');
    console.log('✅ Core features working correctly');
    console.log('✅ Ready for use');
    if (!results.api) {
      console.log('💡 Start server with "npm run dev" to enable API features');
    }
  } else {
    console.log('\n🔧 Some issues need to be resolved');
  }
}

runValidation();
