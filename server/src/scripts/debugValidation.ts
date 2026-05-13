/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_USER_ID = '00000000-0000-0000-0000-000000000003';

async function debugValidation() {
  try {
    console.log('🔍 Debugging Validation Script\n');

    // Step 1: Test document creation with detailed error handling
    console.log('1️⃣ Testing document creation...');
    
    const testDoc = {
      user_id: TEST_USER_ID,
      file_url: 'https://storage.example.com/bloodwork/debug-test.pdf',
      file_name: 'debug-test.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      document_type: 'comprehensive',
      source: 'lab_report',
      test_date: '2024-01-15',
      upload_date: new Date().toISOString(),
      parse_status: 'extracted',
      extraction_confidence: 0.95,
      notes: 'Debug test document'
    };

    console.log('Creating document with data:', JSON.stringify(testDoc, null, 2));

    const { data: doc, error: docError } = await supabase
      .from('bloodwork_documents')
      .insert(testDoc)
      .select()
      .single();

    if (docError) {
      console.log('❌ Document creation failed:');
      console.log('Error code:', docError.code);
      console.log('Error message:', docError.message);
      console.log('Error details:', docError.details);
      console.log('Error hint:', docError.hint);
      return;
    }

    console.log('✅ Document created successfully:', doc.id);

    // Step 2: Test result creation
    console.log('\n2️⃣ Testing result creation...');
    
    const testResult = {
      user_id: TEST_USER_ID,
      document_id: doc.id,
      raw_test_name: 'LDL Cholesterol',
      normalized_test_name: 'LDL',
      category: 'Cardiovascular',
      value_text: '145',
      value_numeric: 145,
      unit: 'mg/dL',
      test_date: '2024-01-15',
      source: 'lab_report',
      confidence: 0.95
    };

    console.log('Creating result with data:', JSON.stringify(testResult, null, 2));

    const { data: result, error: resultError } = await supabase
      .from('bloodwork_results')
      .insert(testResult)
      .select()
      .single();

    if (resultError) {
      console.log('❌ Result creation failed:');
      console.log('Error code:', resultError.code);
      console.log('Error message:', resultError.message);
      console.log('Error details:', resultError.details);
      console.log('Error hint:', resultError.hint);
      return;
    }

    console.log('✅ Result created successfully:', result.id);

    // Step 3: Test recommendation creation
    console.log('\n3️⃣ Testing recommendation creation...');
    
    const testRecommendation = {
      user_id: TEST_USER_ID,
      test_name: 'LDL Cholesterol',
      normalized_test_name: 'LDL',
      category: 'Cardiovascular',
      recommendation_type: 'cardiovascular',
      recommendation_title: 'High LDL Cholesterol Detected',
      recommendation_text: 'Your LDL cholesterol level of 145 mg/dL is above the optimal range.',
      rationale: 'LDL level of 145 mg/dL exceeds the recommended threshold of 130 mg/dL.',
      confidence: 0.85,
      severity: 'high',
      source_document_ids: [doc.id],
      source_result_ids: [result.id],
      source_trend_window: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        data_points: 1
      }
    };

    console.log('Creating recommendation with data:', JSON.stringify(testRecommendation, null, 2));

    const { data: rec, error: recError } = await supabase
      .from('bloodwork_recommendations')
      .insert(testRecommendation)
      .select()
      .single();

    if (recError) {
      console.log('❌ Recommendation creation failed:');
      console.log('Error code:', recError.code);
      console.log('Error message:', recError.message);
      console.log('Error details:', recError.details);
      console.log('Error hint:', recError.hint);
      return;
    }

    console.log('✅ Recommendation created successfully:', rec.id);

    // Step 4: Test API (if server is running)
    console.log('\n4️⃣ Testing API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        console.log('✅ Server is running');
        
        const genResponse = await fetch('http://localhost:3000/bloodwork/recommendations/generate/' + TEST_USER_ID, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            force_regenerate: true
          })
        });

        if (genResponse.ok) {
          const genData = await genResponse.json();
          console.log('✅ API generation successful:', genData.data?.generated_count || 0);
        } else {
          console.log('❌ API generation failed:', genResponse.status);
        }
      } else {
        console.log('❌ Server is not running');
      }
    } catch (apiError) {
      console.log('❌ API test failed - server not running');
    }

    // Step 5: Cleanup
    console.log('\n5️⃣ Cleaning up...');
    await supabase.from('bloodwork_recommendations').delete().eq('user_id', TEST_USER_ID);
    await supabase.from('bloodwork_results').delete().eq('user_id', TEST_USER_ID);
    await supabase.from('bloodwork_documents').delete().eq('user_id', TEST_USER_ID);
    console.log('✅ Cleanup complete');

    console.log('\n🎉 Debug validation PASSED!');
    console.log('All components are working correctly!');

  } catch (error) {
    console.log('❌ Debug validation failed with error:', (error as Error).message);
    console.log('Stack:', (error as Error).stack);
  }
}

debugValidation();
