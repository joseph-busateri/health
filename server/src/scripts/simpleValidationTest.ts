/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function simpleValidationTest() {
  try {
    console.log('🧪 Simple Bloodwork Intelligence Validation Test\n');

    // Step 1: Test basic table access
    console.log('1️⃣ Testing table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Table access failed:', tableError.message);
      return;
    }
    console.log('✅ Table access works');

    // Step 2: Test creating a test document
    console.log('\n2️⃣ Creating test document...');
    const { data: doc, error: docError } = await supabase
      .from('bloodwork_documents')
      .insert({
        user_id: 'simple-test-user',
        file_url: 'https://test.com/test.pdf',
        file_name: 'test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        document_type: 'comprehensive',
        source: 'validation_test',
        test_date: '2024-01-15',
        upload_date: new Date().toISOString(),
        parse_status: 'extracted',
        extraction_confidence: 0.95,
        notes: 'Test document for validation'
      })
      .select()
      .single();

    if (docError) {
      console.log('❌ Document creation failed:', docError.message);
      console.log('Error details:', docError);
      return;
    }
    console.log('✅ Test document created:', doc.id);

    // Step 3: Test creating test bloodwork results
    console.log('\n3️⃣ Creating test bloodwork results...');
    const testResults = [
      {
        user_id: 'simple-test-user',
        document_id: doc.id,
        raw_test_name: 'LDL Cholesterol',
        normalized_test_name: 'LDL',
        category: 'Cardiovascular',
        value_text: '145',
        value_numeric: 145,
        unit: 'mg/dL',
        test_date: '2024-01-15',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: 'simple-test-user',
        document_id: doc.id,
        raw_test_name: 'Hemoglobin A1c',
        normalized_test_name: 'HbA1c',
        category: 'Metabolic',
        value_text: '6.7',
        value_numeric: 6.7,
        unit: '%',
        test_date: '2024-01-15',
        source: 'validation_test',
        confidence: 0.95
      },
      {
        user_id: 'simple-test-user',
        document_id: doc.id,
        raw_test_name: 'Testosterone',
        normalized_test_name: 'Testosterone',
        category: 'Hormonal',
        value_text: '260',
        value_numeric: 260,
        unit: 'ng/dL',
        test_date: '2024-01-15',
        source: 'validation_test',
        confidence: 0.95
      }
    ];

    const { data: results, error: resultsError } = await supabase
      .from('bloodwork_results')
      .insert(testResults)
      .select();

    if (resultsError) {
      console.log('❌ Results creation failed:', resultsError.message);
      console.log('Error details:', resultsError);
      return;
    }
    console.log('✅ Test results created:', results.length, 'records');

    // Step 4: Test API endpoint (server needs to be running)
    console.log('\n4️⃣ Testing recommendation generation API...');
    try {
      const response = await fetch('http://localhost:3000/bloodwork/recommendations/generate/simple-test-user', {
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
        return;
      }

      const apiData = await response.json();
      console.log('✅ API request successful');
      console.log('Generated recommendations:', apiData.data?.generated_count || 0);

      // Step 5: Test retrieving recommendations
      console.log('\n5️⃣ Testing recommendation retrieval...');
      const { data: recommendations, error: recError } = await supabase
        .from('bloodwork_recommendations')
        .select('*')
        .eq('user_id', 'simple-test-user');

      if (recError) {
        console.log('❌ Recommendation retrieval failed:', recError.message);
        return;
      }

      console.log('✅ Retrieved recommendations:', recommendations.length, 'records');
      
      if (recommendations.length > 0) {
        console.log('\n📊 Sample recommendation:');
        const sample = recommendations[0];
        console.log('- Marker:', sample.test_name);
        console.log('- Type:', sample.recommendation_type);
        console.log('- Severity:', sample.severity);
        console.log('- Confidence:', sample.confidence);
        console.log('- Title:', sample.recommendation_title);
        console.log('- Text:', sample.recommendation_text.substring(0, 100) + '...');
      }

    } catch (apiError) {
      console.log('❌ API test failed - server might not be running');
      console.log('Please start the server with: npm run dev');
      console.log('Then run this test again');
      return;
    }

    // Step 6: Cleanup
    console.log('\n6️⃣ Cleaning up test data...');
    await supabase.from('bloodwork_recommendations').delete().eq('user_id', 'simple-test-user');
    await supabase.from('bloodwork_results').delete().eq('user_id', 'simple-test-user');
    await supabase.from('bloodwork_documents').delete().eq('user_id', 'simple-test-user');
    console.log('✅ Cleanup complete');

    console.log('\n🎉 Simple validation test PASSED!');
    console.log('✅ Bloodwork Intelligence Engine is working correctly!');
    console.log('\n🚀 Ready for full validation with: npm run validate:intelligence:e2e');

  } catch (error) {
    console.log('❌ Test failed with error:', (error as Error).message);
    console.log('Stack:', (error as Error).stack);
  }
}

simpleValidationTest();
