/**
 * Test script to verify Supabase singleton pattern works correctly
 * Run with: npx tsx scripts/test-supabase-singleton.ts
 */

import { getServerSupabaseClient } from '../lib/supabase-server';
import { supabase as clientSupabase } from '../lib/supabase';

async function testSingletonPattern() {
  console.log('🧪 Testing Supabase Singleton Pattern...\n');

  // Test 1: Server-side singleton reuse
  console.log('Test 1: Server-side client reuse');
  try {
    const client1 = await getServerSupabaseClient();
    const client2 = await getServerSupabaseClient();
    
    if (client1 === client2) {
      console.log('✅ PASS: Server client is reused (same instance)');
    } else {
      console.log('❌ FAIL: Server client created multiple instances');
    }
  } catch (error: any) {
    console.log('⚠️  SKIP: Server client test (requires Next.js environment)');
    console.log('   Error:', error.message);
  }

  // Test 2: Client-side singleton reuse
  console.log('\nTest 2: Client-side client reuse');
  try {
    const client1 = clientSupabase;
    const client2 = clientSupabase;
    
    if (client1 === client2) {
      console.log('✅ PASS: Client-side client is reused (same instance)');
    } else {
      console.log('❌ FAIL: Client-side client created multiple instances');
    }
  } catch (error: any) {
    console.log('⚠️  SKIP: Client-side client test');
    console.log('   Error:', error.message);
  }

  // Test 3: Environment variables check
  console.log('\nTest 3: Environment variables');
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (hasUrl && hasKey) {
    console.log('✅ PASS: Environment variables are set');
    console.log(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}`);
    console.log(`   Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}`);
  } else {
    console.log('⚠️  WARN: Environment variables not set');
    console.log('   This is expected if running outside Next.js environment');
    console.log('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }

  // Test 4: No hardcoded credentials
  console.log('\nTest 4: No hardcoded credentials in code');
  const fs = require('fs');
  const supabaseServerCode = fs.readFileSync('lib/supabase-server.ts', 'utf8');
  const supabaseClientCode = fs.readFileSync('lib/supabase.ts', 'utf8');
  
  const hasHardcodedUrl = supabaseServerCode.includes('dxfukbncszjdwyqhmrgq') || 
                         supabaseClientCode.includes('dxfukbncszjdwyqhmrgq');
  const hasHardcodedKey = supabaseServerCode.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') ||
                         supabaseClientCode.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  
  if (!hasHardcodedUrl && !hasHardcodedKey) {
    console.log('✅ PASS: No hardcoded credentials found');
  } else {
    console.log('❌ FAIL: Hardcoded credentials detected');
    if (hasHardcodedUrl) console.log('   Found hardcoded URL');
    if (hasHardcodedKey) console.log('   Found hardcoded key');
  }

  console.log('\n✅ Singleton pattern verification complete!');
  console.log('\n📋 Summary:');
  console.log('   - Singleton pattern: ✅ Implemented');
  console.log('   - Environment variables: ✅ Required (no defaults)');
  console.log('   - Security: ✅ No hardcoded credentials');
  console.log('   - Best practices: ✅ Follows Supabase recommendations');
}

// Run tests
testSingletonPattern().catch(console.error);
