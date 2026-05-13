// Check actual bloodwork_trends table schema
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('Checking bloodwork_trends table schema...\n');

  // Try to get one row to see the actual columns
  const { data, error } = await supabase
    .from('bloodwork_trends')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    
    // Try a minimal insert to see what columns are expected
    console.log('\nTrying minimal insert to discover columns...');
    const { error: insertError } = await supabase
      .from('bloodwork_trends')
      .insert([{ user_id: '00000000-0000-0000-0000-000000000001' }]);
    
    if (insertError) {
      console.log('Insert error (shows required columns):', insertError.message);
    }
  } else {
    console.log('Table exists. Sample data:', data);
  }

  // Check the healthProfileAggregation service to see what columns it expects
  console.log('\nLet me check what columns are used in the codebase...');
}

checkSchema().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
