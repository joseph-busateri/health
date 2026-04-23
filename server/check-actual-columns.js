// Check what columns actually exist in bloodwork_trends
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  console.log('Checking bloodwork_trends actual columns...\n');

  // Try to select everything to see what columns exist
  const { data, error } = await supabase
    .from('bloodwork_trends')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying table:', error.message);
    console.log('\nThe table might be empty. Trying to get schema info...');
    
    // Try inserting minimal data to see what's required
    const { error: insertError } = await supabase
      .from('bloodwork_trends')
      .insert([{}]);
    
    if (insertError) {
      console.log('Insert error (shows what columns are expected):', insertError.message);
    }
  } else {
    if (data && data.length > 0) {
      console.log('Table has data. Columns:', Object.keys(data[0]).join(', '));
    } else {
      console.log('Table exists but is empty.');
      console.log('Trying a test insert to discover required columns...');
      
      const testData = {
        user_id: '00000000-0000-0000-0000-000000000001',
        marker: 'TEST',
        trend_direction: 'stable',
        data_points: 1,
        first_test_date: '2024-01-01',
        latest_test_date: '2024-01-01'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('bloodwork_trends')
        .insert([testData])
        .select();
      
      if (insertError) {
        console.log('Insert failed:', insertError.message);
        console.log('\nTrying with different column names...');
        
        // Try with marker_name
        testData.marker_name = testData.marker;
        delete testData.marker;
        
        const { data: insertData2, error: insertError2 } = await supabase
          .from('bloodwork_trends')
          .insert([testData])
          .select();
        
        if (insertError2) {
          console.log('Still failed:', insertError2.message);
        } else {
          console.log('SUCCESS with marker_name! Columns:', Object.keys(insertData2[0]).join(', '));
          // Clean up
          await supabase.from('bloodwork_trends').delete().eq('marker_name', 'TEST');
        }
      } else {
        console.log('SUCCESS! Columns:', Object.keys(insertData[0]).join(', '));
        // Clean up
        await supabase.from('bloodwork_trends').delete().eq('marker', 'TEST');
      }
    }
  }
}

checkColumns().then(() => {
  console.log('\nDone');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
