import { createBrowserClient } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser client — uses anon key (RLS enforced)
export function getBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Server client for use in Server Components — reads/writes cookies
export async function getServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll is called from a Server Component where cookies() is read-only
          // The middleware handles setting cookies; this is safe to ignore
        }
      },
    },
  });
}

// Admin client — uses service role key (bypasses RLS), for API routes only
export function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }
  return createAdminClient(supabaseUrl, supabaseServiceKey);
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          gender: 'male' | 'female' | 'other' | null;
          height: number | null;
          weight: number | null;
          chest: number | null;
          waist: number | null;
          hip: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'pro' | 'premium';
          status: 'active' | 'expired' | 'cancelled';
          started_at: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      shopee_clicks: {
        Row: {
          id: string;
          brand: string;
          product_name: string | null;
          shopee_url: string | null;
          user_ip: string | null;
          source: string | null;
          clicked_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shopee_clicks']['Row'], 'id' | 'clicked_at'>;
      };
      feedback: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          message: string;
          rating: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['feedback']['Row'], 'id' | 'created_at'>;
      };
    };
  };
};
