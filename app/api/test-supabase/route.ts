import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase-server';

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');

    // Use optimized server client (reuses connections)
    const client = await getServerSupabaseClient();

    // Test 1: Check if products table exists
    console.log('Test 1: Checking products table...');
    const { data: products, error: productsError, count } = await client
      .from('products')
      .select('*', { count: 'exact' })
      .limit(5);

    // Test 2: Try search query
    console.log('Test 2: Testing search query...');
    const { data: searchResults, error: searchError } = await client
      .from('products')
      .select('*')
      .or('name.ilike.%microphone%,description.ilike.%microphone%')
      .limit(5);

    // Get environment variables for connection info
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return NextResponse.json({
      success: true,
      tests: {
        connection: {
          url: supabaseUrl ? 'Set (hidden for security)' : 'Not set',
          keyExists: !!supabaseAnonKey,
          authenticated: true, // Client handles auth automatically
        },
        productsTable: {
          exists: !productsError,
          error: productsError ? {
            code: productsError.code,
            message: productsError.message,
            hint: productsError.hint,
            details: productsError.details,
          } : null,
          count: count || 0,
          sample: products?.slice(0, 3) || [],
        },
        searchQuery: {
          success: !searchError,
          error: searchError ? {
            code: searchError.code,
            message: searchError.message,
            hint: searchError.hint,
            details: searchError.details,
          } : null,
          results: searchResults?.length || 0,
          sample: searchResults?.slice(0, 3) || [],
        },
      },
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
      },
    }, { status: 500 });
  }
}
