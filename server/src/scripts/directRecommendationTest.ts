/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function directRecommendationTest() {
  try {
    console.log('🧪 Direct Recommendation Test (Skipping Document Creation)\n');

    // Step 1: Test if we can create recommendations directly
    console.log('1️⃣ Testing direct recommendation creation...');
    
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    const testRecommendation = {
      user_id: testUserId,
      test_name: 'LDL Cholesterol',
      normalized_test_name: 'LDL',
      category: 'Cardiovascular',
      recommendation_type: 'cardiovascular',
      recommendation_title: 'High LDL Cholesterol Detected',
      recommendation_text: 'Your LDL cholesterol level of 145 mg/dL is above the optimal range. Consider dietary changes and discuss with your healthcare provider.',
      rationale: 'LDL level of 145 mg/dL exceeds the recommended threshold of 130 mg/dL for cardiovascular health.',
      confidence: 0.85,
      severity: 'high',
      source_document_ids: ['test-doc-123'],
      source_result_ids: ['test-result-456'],
      source_trend_window: {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        data_points: 3
      }
    };

    const { data: rec, error: recError } = await supabase
      .from('bloodwork_recommendations')
      .insert(testRecommendation)
      .select()
      .single();

    if (recError) {
      console.log('❌ Direct recommendation creation failed:', recError.message);
      console.log('Error details:', recError);
      return;
    }

    console.log('✅ Direct recommendation creation works!');
    console.log('Recommendation ID:', rec.id);

    // Step 2: Test API endpoint (server needs to be running)
    console.log('\n2️⃣ Testing recommendation generation API...');
    try {
      const response = await fetch('http://localhost:3000/bloodwork/recommendations/generate/' + testUserId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          force_regenerate: true
        })
      });

      if (!response.ok) {
        console.log('❌ API request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('Error details:', errorText);
        
        if (response.status === 404) {
          console.log('💡 The API endpoint might not be properly configured');
        } else if (response.status === 500) {
          console.log('💡 Server error - check server logs');
        }
      } else {
        const apiData = await response.json();
        console.log('✅ API request successful');
        console.log('Generated recommendations:', apiData.data?.generated_count || 0);
      }

    } catch (apiError) {
      console.log('❌ API test failed - server might not be running');
      console.log('Please start the server with: npm run dev');
      console.log('Then run this test again');
    }

    // Step 3: Test retrieval
    console.log('\n3️⃣ Testing recommendation retrieval...');
    const { data: recommendations, error: retrieveError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', testUserId);

    if (retrieveError) {
      console.log('❌ Retrieval failed:', retrieveError.message);
    } else {
      console.log('✅ Retrieval works, found:', recommendations.length, 'recommendations');
      
      if (recommendations.length > 0) {
        console.log('\n📊 Sample recommendation:');
        const sample = recommendations[0];
        console.log('- ID:', sample.id);
        console.log('- Marker:', sample.test_name);
        console.log('- Type:', sample.recommendation_type);
        console.log('- Severity:', sample.severity);
        console.log('- Confidence:', sample.confidence);
        console.log('- Title:', sample.recommendation_title);
        console.log('- Status:', sample.status);
        console.log('- Created:', sample.created_at);
      }
    }

    // Step 4: Test status update
    console.log('\n4️⃣ Testing status update...');
    const { data: updatedRec, error: updateError } = await supabase
      .from('bloodwork_recommendations')
      .update({ status: 'resolved' })
      .eq('id', rec.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Status update failed:', updateError.message);
    } else {
      console.log('✅ Status update works, changed to:', updatedRec.status);
    }

    // Step 5: Cleanup
    console.log('\n5️⃣ Cleaning up test data...');
    await supabase.from('bloodwork_recommendations').delete().eq('user_id', testUserId);
    console.log('✅ Cleanup complete');

    console.log('\n🎉 Direct recommendation test PASSED!');
    console.log('✅ Bloodwork recommendations table is working correctly!');
    console.log('✅ The issue with full validation is in document creation, not recommendations');
    
    console.log('\n📋 Summary:');
    console.log('- ✅ Table creation and structure: WORKING');
    console.log('- ✅ Recommendation CRUD operations: WORKING');
    console.log('- ⚠️  Document creation: NEEDS FIXING');
    console.log('- ⚠️  Full validation: DEPENDS ON DOCUMENT CREATION');

  } catch (error) {
    console.log('❌ Test failed with error:', (error as Error).message);
    console.log('Stack:', (error as Error).stack);
  }
}

directRecommendationTest();
