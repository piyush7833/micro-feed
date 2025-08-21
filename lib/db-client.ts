import { createClient } from '@supabase/supabase-js';
import type { Database } from './db';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client for Client Components
export const createClientComponentClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Route Handler client (for API routes)
export const createRouteHandlerClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};
