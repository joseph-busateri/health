/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecommendationsTable() {
  try {
    console.log('🔍 Checking bloodwork_recommendations table...');
    
    // Try to select from the table
    const { data, error } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Table access failed:', error.message);
      console.log('Error code:', error.code);
      
      if (error.code === 'PGRST116') {
        console.log('📝 Table does not exist - need to deploy schema');
      } else if (error.code === '42501') {
        console.log('🔒 Permission denied - check RLS policies');
      }
      
      return false;
    }

    console.log('✅ Table exists and is accessible');
    console.log('📊 Table structure check passed');
    
    // Check table structure by trying to insert a test record
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000',
      test_name: 'Test Marker',
      recommendation_type: 'cardiovascular',
      recommendation_title: 'Test Recommendation',
      recommendation_text: 'This is a test recommendation',
      rationale: 'Test rationale',
      confidence: 0.8,
      severity: 'medium',
      source_document_ids: ['test-doc'],
      source_result_ids: ['test-result'],
      source_trend_window: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        data_points: 3
      }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('bloodwork_recommendations')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      console.log('Error code:', insertError.code);
      return false;
    }

    console.log('✅ Insert test passed');
    
    // Clean up test record
    const { error: deleteError } = await supabase
      .from('bloodwork_recommendations')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.log('⚠️  Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Cleanup test passed');
    }

    console.log('🎉 bloodwork_recommendations table is fully functional!');
    return true;

  } catch (error) {
    console.log('❌ Connection error:', (error as Error).message);
    return false;
  }
}

checkRecommendationsTable().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
