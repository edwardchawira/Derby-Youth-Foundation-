/**
 * Client-side Supabase client (for browser usage)
 * 
 * IMPORTANT: Never hardcode credentials - always use environment variables
 * The NEXT_PUBLIC_ prefix makes these available in the browser
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get credentials from environment variables (required)
// Supports both anon key and publishable key (sb_publishable_...)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Only throw in browser - server-side should use lib/supabase-server.ts
  if (typeof window !== 'undefined') {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
    );
  }
}

// Singleton instance for client-side usage
let clientInstance: SupabaseClient | null = null;

/**
 * Get client-side Supabase client
 * Reuses the same client instance to reduce connection overhead
 */
function getSupabaseClient(): SupabaseClient {
  // Return placeholder if credentials are missing (server-side should use supabase-server.ts)
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client that will fail gracefully
    // This prevents build-time errors, but runtime will fail if env vars aren't set
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  // Reuse existing client if available
  if (clientInstance) {
    return clientInstance;
  }

  // Create new client for browser
  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Browser can persist sessions
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    // Optimize connection settings
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'pinnacle-ssa-client',
      },
    },
  });

  return clientInstance;
}

export const supabase = getSupabaseClient();
