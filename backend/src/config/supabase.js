import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY). Check .env file.'
  );
}

// Auth client - ONLY for auth operations (signup, login, getUser, signOut)
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// Admin client - for ALL database queries (bypasses RLS, app-level filtering enforced in controllers)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
