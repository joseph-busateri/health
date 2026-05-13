// Check what users exist and what user_id is in bloodwork_results
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  console.log('Checking user IDs...\n');

  // Check what user_ids are in bloodwork_results
  const { data: results } = await supabase
    .from('bloodwork_results')
    .select('user_id')
    .limit(5);

  if (results && results.length > 0) {
    const uniqueUserIds = [...new Set(results.map(r => r.user_id))];
    console.log('User IDs in bloodwork_results:', uniqueUserIds);
  }

  // Check what user_ids are in bloodwork_documents
  const { data: docs } = await supabase
    .from('bloodwork_documents')
    .select('user_id')
    .limit(5);

  if (docs && docs.length > 0) {
    const uniqueUserIds = [...new Set(docs.map(d => d.user_id))];
    console.log('User IDs in bloodwork_documents:', uniqueUserIds);
  }

  // Try to check auth.users (may not have permission)
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.log('\nCannot access auth.users:', error.message);
  } else {
    console.log('\nUsers in auth.users:', users.users.map(u => u.id));
  }
}

checkUsers().then(() => {
  console.log('\nDone');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
