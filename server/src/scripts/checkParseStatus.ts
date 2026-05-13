/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkParseStatusValues() {
  try {
    console.log('🔍 Checking existing bloodwork_documents to see valid parse_status values...');
    
    const { data, error } = await supabase
      .from('bloodwork_documents')
      .select('parse_status')
      .limit(10);
    
    if (error) {
      console.log('❌ Query failed:', error.message);
      return;
    }
    
    const uniqueValues = [...new Set(data?.map(d => d.parse_status))];
    console.log('✅ Found parse_status values:', uniqueValues);
    
  } catch (error) {
    console.log('❌ Error:', (error as Error).message);
  }
}

checkParseStatusValues();
