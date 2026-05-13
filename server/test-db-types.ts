import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function testDbTypes() {
  console.log('Testing database types...');
  
  try {
    // Test if bloodwork_documents type is recognized
    const { data, error } = await supabase
      .from('bloodwork_documents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
    } else {
      console.log('✅ Database types working correctly');
      console.log('Data type:', typeof data);
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('TypeScript compilation error:', err);
  }
}

testDbTypes();
