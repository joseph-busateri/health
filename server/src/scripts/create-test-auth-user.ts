import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email: 'joe-test@example.com',
    password: 'TempPassword123!',
    email_confirm: true,
    user_metadata: { name: 'Joe Test' },
  });

  if (error) {
    console.error('Failed to create auth user:', error);
    process.exit(1);
  }

  console.log('Created auth user:', data.user?.id);
  console.log('Email:', data.user?.email);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});