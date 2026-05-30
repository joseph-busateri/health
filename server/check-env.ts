import 'dotenv/config';

console.log('\n=== Environment Variables Check ===\n');

const requiredVars = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const masked = varName === 'OPENAI_API_KEY' 
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : `${value.substring(0, 20)}...`;
    console.log(`✅ ${varName}: ${masked}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n');
