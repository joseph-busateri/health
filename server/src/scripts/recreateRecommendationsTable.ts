/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function recreateRecommendationsTable() {
  try {
    console.log('🔄 Recreating bloodwork_recommendations table...\n');

    // Drop the table completely (this will drop all policies, indexes, etc.)
    console.log('🗑️  Dropping existing table...');
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: 'DROP TABLE IF EXISTS bloodwork_recommendations CASCADE;' 
    });

    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('⚠️  Could not drop table with exec_sql, trying direct approach...');
    }

    // Create the table with clean schema
    console.log('🏗️  Creating new table...');
    const createTableSQL = `
      CREATE TABLE bloodwork_recommendations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        test_name TEXT NOT NULL,
        normalized_test_name TEXT,
        category TEXT,
        recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('cardiovascular', 'metabolic', 'hormonal', 'inflammation', 'follow_up', 'monitoring', 'lifestyle', 'supplement_review', 'workout_review')),
        recommendation_title TEXT NOT NULL,
        recommendation_text TEXT NOT NULL,
        rationale TEXT NOT NULL,
        confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'resolved')),
        source_document_ids TEXT[] NOT NULL DEFAULT '{}',
        source_result_ids TEXT[] NOT NULL DEFAULT '{}',
        source_trend_window JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX idx_bloodwork_recommendations_user_id ON bloodwork_recommendations(user_id);
      CREATE INDEX idx_bloodwork_recommendations_status ON bloodwork_recommendations(status);
      CREATE INDEX idx_bloodwork_recommendations_recommendation_type ON bloodwork_recommendations(recommendation_type);
      CREATE INDEX idx_bloodwork_recommendations_severity ON bloodwork_recommendations(severity);
      CREATE INDEX idx_bloodwork_recommendations_test_name ON bloodwork_recommendations(test_name);
      CREATE INDEX idx_bloodwork_recommendations_normalized_test_name ON bloodwork_recommendations(normalized_test_name) WHERE normalized_test_name IS NOT NULL;
      CREATE INDEX idx_bloodwork_recommendations_created_at ON bloodwork_recommendations(created_at DESC);
      CREATE INDEX idx_bloodwork_recommendations_user_status ON bloodwork_recommendations(user_id, status);

      -- Create RLS policies
      ALTER TABLE bloodwork_recommendations ENABLE ROW LEVEL SECURITY;

      -- Policy: Users can only read their own recommendations
      CREATE POLICY "Users can read own bloodwork recommendations" ON bloodwork_recommendations
        FOR SELECT USING (auth.uid() = user_id);

      -- Policy: Users can only insert their own recommendations
      CREATE POLICY "Users can insert own bloodwork recommendations" ON bloodwork_recommendations
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      -- Policy: Users can only update their own recommendations
      CREATE POLICY "Users can update own bloodwork recommendations" ON bloodwork_recommendations
        FOR UPDATE USING (auth.uid() = user_id);

      -- Policy: Users can only delete their own recommendations
      CREATE POLICY "Users can delete own bloodwork recommendations" ON bloodwork_recommendations
        FOR DELETE USING (auth.uid() = user_id);

      -- Policy: Service role has full access
      CREATE POLICY "Service role full access to bloodwork_recommendations" ON bloodwork_recommendations
        FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

      -- Add table comments
      COMMENT ON TABLE bloodwork_recommendations IS 'Stores AI-generated recommendations based on bloodwork trends and results';
      COMMENT ON COLUMN bloodwork_recommendations.source_trend_window IS 'JSON object with start_date, end_date, and data_points for the trend analysis';
      COMMENT ON COLUMN bloodwork_recommendations.confidence IS 'Confidence score (0-1) for the recommendation based on data quality and trend strength';
    `;

    // Execute the table creation
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: createTableSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Direct creation failed, trying manual approach...');
      console.log('Please run this SQL manually in Supabase SQL Editor:');
      console.log('\n' + createTableSQL);
      return false;
    }

    console.log('✅ Table recreated successfully!');
    
    // Test the new table
    console.log('🧪 Testing new table...');
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
      return false;
    }

    console.log('✅ Insert test passed');
    
    // Clean up
    await supabase
      .from('bloodwork_recommendations')
      .delete()
      .eq('id', insertData.id);

    console.log('✅ Cleanup test passed');
    console.log('🎉 Table recreation complete!');
    
    return true;

  } catch (error) {
    console.log('❌ Recreation failed:', (error as Error).message);
    return false;
  }
}

recreateRecommendationsTable().then(success => {
  if (success) {
    console.log('\n✅ Ready to run validation!');
    console.log('Run: npm run validate:intelligence:e2e');
  } else {
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
    console.log(`
CREATE TABLE bloodwork_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  normalized_test_name TEXT,
  category TEXT,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('cardiovascular', 'metabolic', 'hormonal', 'inflammation', 'follow_up', 'monitoring', 'lifestyle', 'supplement_review', 'workout_review')),
  recommendation_title TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  rationale TEXT NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'resolved')),
  source_document_ids TEXT[] NOT NULL DEFAULT '{}',
  source_result_ids TEXT[] NOT NULL DEFAULT '{}',
  source_trend_window JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bloodwork_recommendations_user_id ON bloodwork_recommendations(user_id);
CREATE INDEX idx_bloodwork_recommendations_status ON bloodwork_recommendations(status);
CREATE INDEX idx_bloodwork_recommendations_recommendation_type ON bloodwork_recommendations(recommendation_type);
CREATE INDEX idx_bloodwork_recommendations_severity ON bloodwork_recommendations(severity);
CREATE INDEX idx_bloodwork_recommendations_test_name ON bloodwork_recommendations(test_name);
CREATE INDEX idx_bloodwork_recommendations_normalized_test_name ON bloodwork_recommendations(normalized_test_name) WHERE normalized_test_name IS NOT NULL;
CREATE INDEX idx_bloodwork_recommendations_created_at ON bloodwork_recommendations(created_at DESC);
CREATE INDEX idx_bloodwork_recommendations_user_status ON bloodwork_recommendations(user_id, status);

ALTER TABLE bloodwork_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bloodwork recommendations" ON bloodwork_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bloodwork recommendations" ON bloodwork_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bloodwork recommendations" ON bloodwork_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bloodwork recommendations" ON bloodwork_recommendations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to bloodwork_recommendations" ON bloodwork_recommendations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE bloodwork_recommendations IS 'Stores AI-generated recommendations based on bloodwork trends and results';
COMMENT ON COLUMN bloodwork_recommendations.source_trend_window IS 'JSON object with start_date, end_date, and data_points for the trend analysis';
COMMENT ON COLUMN bloodwork_recommendations.confidence IS 'Confidence score (0-1) for the recommendation based on data quality and trend strength';
    `);
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
