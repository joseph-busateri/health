const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixBaselineTable() {
  console.log('🔧 Fixing supplement_baseline table structure...\n');
  
  try {
    // First, let's add the missing document_id column
    console.log('📋 Adding missing document_id column...');
    
    // This is a direct SQL operation - we'll need to run this via Supabase SQL Editor
    // For now, let's create the SQL that needs to be executed
    
    const sqlFixes = [
      // Add missing document_id column
      `ALTER TABLE public.supplement_baseline ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.supplement_documents(id) ON DELETE CASCADE;`,
      
      // Add missing stack_notes column if it doesn't exist
      `ALTER TABLE public.supplement_baseline ADD COLUMN IF NOT EXISTS stack_notes TEXT;`,
      
      // Add missing timing_notes column if it doesn't exist  
      `ALTER TABLE public.supplement_baseline ADD COLUMN IF NOT EXISTS timing_notes TEXT;`,
      
      // Add missing frequency_notes column if it doesn't exist
      `ALTER TABLE public.supplement_baseline ADD COLUMN IF NOT EXISTS frequency_notes TEXT;`,
      
      // Add missing extracted_at column if it doesn't exist
      `ALTER TABLE public.supplement_baseline ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`,
      
      // Add missing updated_at column if it doesn't exist
      `ALTER TABLE public.supplement_baseline ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`,
      
      // Create index on document_id
      `CREATE INDEX IF NOT EXISTS idx_supplement_baseline_document_id ON public.supplement_baseline(document_id);`,
      
      // Reload schema cache
      `NOTIFY pgrst, 'reload schema';`
    ];
    
    console.log('📝 SQL commands to execute in Supabase SQL Editor:');
    console.log('='.repeat(60));
    sqlFixes.forEach((sql, index) => {
      console.log(`${index + 1}. ${sql}`);
    });
    console.log('='.repeat(60));
    
    // Test if we can work around this by checking the current structure
    console.log('\n🔍 Current table structure check...');
    
    const { data: currentData, error: currentError } = await supabase
      .from('supplement_baseline')
      .select('id, user_id, stack_name, total_active_items, created_at')
      .limit(1);
    
    if (currentError) {
      console.log('❌ Current structure check failed:', currentError.message);
    } else {
      console.log('✅ Current accessible columns:', Object.keys(currentData[0] || {}));
    }
    
    // For now, let's modify our code to work without document_id temporarily
    console.log('\n🔄 Creating temporary workaround...');
    
    // Test if we can create a baseline without document_id
    const { data: tempBaseline, error: tempError } = await supabase
      .from('supplement_baseline')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        stack_name: 'Test Stack (No Doc Ref)',
        total_active_items: 0
      })
      .select()
      .single();
    
    if (tempError) {
      console.log('❌ Even without document_id, insert failed:', tempError.message);
    } else {
      console.log('✅ Can create baseline without document_id:', tempBaseline.id);
      
      // Clean up
      await supabase.from('supplement_baseline').delete().eq('id', tempBaseline.id);
      console.log('✅ Test record cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Table fix attempt failed:', error);
  }
}

fixBaselineTable();
