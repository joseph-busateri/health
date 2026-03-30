import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
