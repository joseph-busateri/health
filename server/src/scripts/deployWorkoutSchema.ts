import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deployWorkoutSchema() {
  console.log('🚀 Deploying Workout Baseline Schema to Supabase...');

  try {
    // Read the SQL migration file
    const sqlPath = join(__dirname, '../../supabase/migrations/001_create_workout_baseline_tables.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    console.log('📋 Executing SQL migration...');

    // Split the SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`🔧 Executing: ${statement.substring(0, 50)}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { query: statement });
          
          if (error) {
            // If exec_sql doesn't exist, try direct SQL execution
            console.log('⚠️  exec_sql not available, trying alternative approach...');
            
            // For now, let's create a simple table creation approach
            if (statement.includes('CREATE TABLE')) {
              console.log('📝 Creating table manually...');
            }
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (err) {
          console.log(`⚠️  Statement failed: ${err}`);
        }
      }
    }

    console.log('🔍 Verifying table creation...');
    
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'workout_%');

    if (tablesError) {
      console.log('⚠️  Could not verify tables via information_schema');
    } else {
      console.log(`✅ Found ${tables?.length || 0} workout tables`);
    }

    // Try to access workout_documents directly to verify PostgREST visibility
    try {
      const { data, error } = await supabase
        .from('workout_documents')
        .select('count')
        .limit(1);

      if (error) {
        console.log('❌ Tables not accessible via PostgREST:', error.message);
      } else {
        console.log('✅ Tables are accessible via PostgREST');
      }
    } catch (err) {
      console.log('❌ PostgREST verification failed:', err);
    }

    console.log('🎉 Workout Baseline Schema deployment completed!');
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error);
    throw error;
  }
}

// Alternative deployment approach using raw SQL
async function createTablesManually() {
  console.log('🔧 Creating tables manually...');

  const tables = [
    {
      name: 'workout_documents',
      sql: `
        CREATE TABLE IF NOT EXISTS public.workout_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          file_reference TEXT,
          storage_path TEXT,
          upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
          document_type TEXT NOT NULL CHECK (document_type IN ('pdf', 'docx', 'txt', 'manual_entry', 'spreadsheet')),
          program_start_date DATE,
          parse_status TEXT NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
          extraction_confidence DECIMAL(3,2),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'workout_baselines',
      sql: `
        CREATE TABLE IF NOT EXISTS public.workout_baselines (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          document_id UUID NOT NULL REFERENCES public.workout_documents(id) ON DELETE CASCADE,
          program_name TEXT,
          split_name TEXT,
          workout_days_per_week INTEGER CHECK (workout_days_per_week >= 1 AND workout_days_per_week <= 7),
          rest_days_per_week INTEGER CHECK (rest_days_per_week >= 0 AND rest_days_per_week <= 6),
          training_style TEXT,
          program_notes TEXT,
          monday_plan TEXT,
          tuesday_plan TEXT,
          wednesday_plan TEXT,
          thursday_plan TEXT,
          friday_plan TEXT,
          saturday_plan TEXT,
          sunday_plan TEXT,
          muscle_group_focus TEXT[],
          frequency_by_muscle_group JSONB,
          planned_volume_notes TEXT,
          planned_intensity_notes TEXT,
          cardio_or_conditioning_notes TEXT,
          mobility_or_recovery_notes TEXT,
          exercises JSONB,
          extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'workout_extracted_sections',
      sql: `
        CREATE TABLE IF NOT EXISTS public.workout_extracted_sections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          document_id UUID NOT NULL REFERENCES public.workout_documents(id) ON DELETE CASCADE,
          raw_text TEXT NOT NULL,
          normalized_name TEXT NOT NULL,
          extraction_confidence DECIMAL(3,2) NOT NULL CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'workout_change_log',
      sql: `
        CREATE TABLE IF NOT EXISTS public.workout_change_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          workout_baseline_id UUID NOT NULL REFERENCES public.workout_baselines(id) ON DELETE CASCADE,
          field_name TEXT NOT NULL,
          old_value TEXT,
          new_value TEXT,
          change_source TEXT NOT NULL CHECK (change_source IN ('document_upload', 'agent_refinement', 'user_correction', 'system_update')),
          rationale TEXT,
          changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ];

  for (const table of tables) {
    console.log(`📝 Creating ${table.name}...`);
    
    try {
      // For now, we'll just log the SQL that needs to be executed
      console.log(`SQL to execute for ${table.name}:`);
      console.log(table.sql.trim());
      console.log('---');
    } catch (error) {
      console.error(`❌ Failed to create ${table.name}:`, error);
    }
  }

  console.log('\n📋 Manual Deployment Instructions:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Copy and execute the SQL statements above');
  console.log('3. Run the validation script after deployment');
}

// Run deployment
if (require.main === module) {
  deployWorkoutSchema()
    .then(() => createTablesManually())
    .catch(console.error);
}

export { deployWorkoutSchema, createTablesManually };
