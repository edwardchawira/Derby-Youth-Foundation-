#!/usr/bin/env node
/**
 * Deploy vapi-create-booking via Supabase Management API
 * Requires: SUPABASE_ACCESS_TOKEN env var (from supabase login)
 * Usage: node scripts/deploy-vapi-create-booking.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'dxfukbncszjdwyqhmrgq';
const FUNCTION_NAME = 'vapi-create-booking';

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Error: SUPABASE_ACCESS_TOKEN not set. Run: npx supabase login');
  process.exit(1);
}

const indexPath = join(__dirname, '..', 'supabase', 'functions', FUNCTION_NAME, 'index.ts');
const content = readFileSync(indexPath, 'utf8');

const body = {
  slug: FUNCTION_NAME,
  verify_jwt: false,
  import_map: false,
  entrypoint_path: 'index.ts',
  files: [{ name: 'index.ts', content }],
};

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${FUNCTION_NAME}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
);

if (!res.ok) {
  const err = await res.text();
  console.error('Deploy failed:', res.status, err);
  process.exit(1);
}

const data = await res.json();
console.log('✅ Deployed vapi-create-booking:', data.version || 'success');
process.exit(0);
