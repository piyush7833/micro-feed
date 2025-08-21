import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Re-export client component client for backward compatibility
export { createClientComponentClient } from './db-client';

// Server-side Supabase client for Server Components and Server Actions
export const createServerComponentClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          const cookieStore = cookies();
          return cookieStore.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          try {
            const cookieStore = cookies();
            cookieStore.set(key, value);
          } catch (error) {
            // Can't set cookies in Server Components
          }
        },
        removeItem: (key: string) => {
          try {
            const cookieStore = cookies();
            cookieStore.delete(key);
          } catch (error) {
            // Can't remove cookies in Server Components
          }
        },
      },
    },
  });
};

// Re-export route handler client for backward compatibility
export { createRouteHandlerClient } from './db-client';

// Database type definitions
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
};
