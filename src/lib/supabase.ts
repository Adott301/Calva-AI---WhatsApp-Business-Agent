import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Server-side Supabase client (service role key — full access)
// Used in API routes only
// ============================================
function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.warn(
      '⚠️  Supabase server client not initialized — missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(url || '', serviceRoleKey || '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================
// Browser-side Supabase client (anon key — Realtime + RLS)
// Used in client components for Realtime subscriptions
// ============================================
function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn(
      '⚠️  Supabase browser client not initialized — missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient(url || '', anonKey || '');
}

// Singleton instances
let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

/**
 * Get the server-side Supabase client (service role — full access).
 * Use this in API routes and server-side logic only.
 */
export function getSupabaseServer(): SupabaseClient {
  if (!serverClient) {
    serverClient = createServerClient();
  }
  return serverClient;
}

/**
 * Get the browser-side Supabase client (anon key — Realtime + RLS).
 * Use this in client components for Realtime subscriptions.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}
