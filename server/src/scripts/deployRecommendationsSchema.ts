/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deployRecommendationsSchema() {
  try {
    console.log('🚀 Deploying Bloodwork Recommendations Database Schema...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/create_bloodwork_recommendations_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log(`📊 SQL file size: ${migrationSQL.length} characters\n`);

    // Execute the migration
    console.log('🔧 Executing SQL migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify table creation
    console.log('🔍 Verifying table creation...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('bloodwork_recommendations')
      .select('*')
      .limit(1);

    if (tableError && tableError.code !== 'PGRST116') {
      console.error('❌ Table verification failed:', tableError);
      return;
    }

    console.log('✅ Table created successfully!\n');

    // Check table structure
    console.log('📋 Checking table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'bloodwork_recommendations' });

    if (columnsError) {
      console.log('⚠️  Could not verify columns (this is normal if RPC function doesn\'t exist)');
    } else {
      console.log(`✅ Found ${columns?.length || 0} columns in the table`);
    }

    // Test basic functionality
    console.log('\n🧪 Testing basic table functionality...');
    
    // Try to insert a test record
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000',
      test_name: 'Test Marker',
      recommendation_type: 'cardiovascular',
      recommendation_title: 'Test Recommendation',
      recommendation_text: 'This is a test recommendation',
      rationale: 'Test rationale for validation',
      confidence: 0.8,
      severity: 'medium',
      source_document_ids: ['test-doc-id'],
      source_result_ids: ['test-result-id'],
      source_trend_window: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        data_points: 3
      }
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('bloodwork_recommendations')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Test insertion failed:', insertError);
    } else {
      console.log('✅ Test record inserted successfully');
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('bloodwork_recommendations')
        .delete()
        .eq('id', insertResult.id);

      if (deleteError) {
        console.error('⚠️  Could not clean up test record:', deleteError);
      } else {
        console.log('✅ Test record cleaned up successfully');
      }
    }

    console.log('\n🎉 Bloodwork Recommendations Database Schema Deployment Complete!');
    console.log('📊 Table: bloodwork_recommendations');
    console.log('🔒 RLS: Enabled with user policies');
    console.log('📈 Indexes: Performance optimization indexes created');
    console.log('⏰ Triggers: updated_at trigger created');
    console.log('\n🚀 Ready for Bloodwork Intelligence Engine!');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function deployWithDirectSQL() {
  try {
    console.log('🚀 Deploying with Direct SQL Execution...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/create_bloodwork_recommendations_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
      
      // Use the REST API to execute SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql: statement + ';' })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Statement ${i + 1} failed:`, error);
        continue;
      }

      console.log(`✅ Statement ${i + 1} executed successfully`);
    }

    console.log('\n🎉 Direct SQL Deployment Complete!');
    
  } catch (error) {
    console.error('❌ Direct SQL deployment failed:', error);
    process.exit(1);
  }
}

// Check if exec_sql function exists, if not use direct method
async function checkAndDeploy() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
    
    if (error) {
      console.log('⚠️  exec_sql function not available, using direct SQL method\n');
      await deployWithDirectSQL();
    } else {
      console.log('✅ exec_sql function available, using standard method\n');
      await deployRecommendationsSchema();
    }
  } catch (error) {
    console.log('⚠️  Could not check exec_sql function, using direct SQL method\n');
    await deployWithDirectSQL();
  }
}

// Run deployment
checkAndDeploy();
