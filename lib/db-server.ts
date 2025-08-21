import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createSupabaseServerClient() {
  const cookieStore = cookies();
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookieStore.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          try {
            cookieStore.set(key, value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            });
          } catch (error) {
            // Can't set cookies in Server Components
          }
        },
        removeItem: (key: string) => {
          try {
            cookieStore.delete(key);
          } catch (error) {
            // Can't remove cookies in Server Components
          }
        },
      },
    },
  });
}
