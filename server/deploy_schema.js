const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deploySchema() {
  console.log('🚀 Deploying supplement schema to Supabase...\n');
  
  // Create tables one by one for better error handling
  const tables = [
    {
      name: 'supplement_documents',
      sql: `
        CREATE TABLE IF NOT EXISTS public.supplement_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          file_reference TEXT,
          storage_path TEXT,
          upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
          document_type TEXT NOT NULL CHECK (document_type IN ('pdf', 'docx', 'txt', 'manual_entry', 'spreadsheet')),
          parse_status TEXT NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
          extraction_confidence DECIMAL(3,2),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'supplement_baselines',
      sql: `
        CREATE TABLE IF NOT EXISTS public.supplement_baselines (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          document_id UUID NOT NULL REFERENCES public.supplement_documents(id) ON DELETE CASCADE,
          stack_name TEXT NOT NULL,
          stack_notes TEXT,
          total_active_items INTEGER NOT NULL DEFAULT 0,
          timing_notes TEXT,
          frequency_notes TEXT,
          extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'supplement_items',
      sql: `
        CREATE TABLE IF NOT EXISTS public.supplement_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          supplement_baseline_id UUID NOT NULL REFERENCES public.supplement_baselines(id) ON DELETE CASCADE,
          supplement_name TEXT NOT NULL,
          dosage DECIMAL(10,3) NOT NULL,
          dosage_unit TEXT NOT NULL,
          frequency TEXT NOT NULL,
          timing TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'removed')),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'supplement_extracted_sections',
      sql: `
        CREATE TABLE IF NOT EXISTS public.supplement_extracted_sections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          document_id UUID NOT NULL REFERENCES public.supplement_documents(id) ON DELETE CASCADE,
          raw_text TEXT NOT NULL,
          normalized_name TEXT NOT NULL,
          extraction_confidence DECIMAL(3,2) NOT NULL CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'supplement_change_log',
      sql: `
        CREATE TABLE IF NOT EXISTS public.supplement_change_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          supplement_baseline_id UUID NOT NULL REFERENCES public.supplement_baselines(id) ON DELETE CASCADE,
          supplement_item_id UUID REFERENCES public.supplement_items(id) ON DELETE CASCADE,
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

  // Create tables
  for (const table of tables) {
    try {
      console.log(`📋 Creating ${table.name}...`);
      const { error } = await supabase.from(table.name).select('count').limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, need to create it via direct SQL
        console.log(`✅ ${table.name} ready for creation`);
      } else if (error) {
        console.log(`⚠️  ${table.name} check:`, error.message);
      } else {
        console.log(`✅ ${table.name} already exists`);
      }
    } catch (err) {
      console.log(`ℹ️  ${table.name} status:`, err.message);
    }
  }

  console.log('\n🎯 Schema deployment check complete!');
  console.log('📝 Note: Tables will be created via Supabase SQL Editor');
  console.log('🔗 Next: Run deploy_supplement_schema.sql in Supabase SQL Editor');
}

deploySchema().catch(console.error);
