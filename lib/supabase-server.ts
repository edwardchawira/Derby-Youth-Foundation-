/**
 * Server-side Supabase client with singleton pattern
 * This reduces compute hours by reusing connections
 * 
 * IMPORTANT: Never hardcode credentials - always use environment variables
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Get credentials from environment variables (required)
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

// Singleton instance for server-side usage
let serverClient: SupabaseClient | null = null;

/**
 * Get server-side Supabase client with authentication
 * Reuses the same client instance to reduce connection overhead
 */
export async function getServerSupabaseClient(): Promise<SupabaseClient> {
  // Reuse existing client if available
  if (serverClient) {
    return serverClient;
  }

  // Get credentials (validated)
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  // Create new client with auth support
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  serverClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Server-side doesn't persist
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    // Optimize connection settings
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'pinnacle-ssa-server',
      },
    },
  });

  // Set session if tokens are available
  if (accessToken) {
    await serverClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    } as any);
  }

  return serverClient;
}

/**
 * Get server-side Supabase client without authentication
 * Use this for public queries that don't require user context
 */
export function getServerSupabaseClientPublic(): SupabaseClient {
  // Reuse existing client if available
  if (serverClient) {
    return serverClient;
  }

  // Get credentials (validated)
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  // Create new client without auth
  serverClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'pinnacle-ssa-server-public',
      },
    },
  });

  return serverClient;
}
