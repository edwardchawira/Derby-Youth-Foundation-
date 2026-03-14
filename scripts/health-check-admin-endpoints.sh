#!/bin/bash
# Health check for PinnacleSSA admin endpoints
# Supabase Edge Functions require: Authorization Bearer (anon key) + admin Basic auth via X-Admin-Auth

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load env
if [ -f .env.local ]; then
  export $(grep -E "^NEXT_PUBLIC_SUPABASE" .env.local | xargs)
elif [ -f .env.local.example ]; then
  export $(grep -E "^NEXT_PUBLIC_SUPABASE_URL=" .env.local.example | xargs)
  NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://dxfukbncszjdwyqhmrgq.supabase.co}"
ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
BASE64_BASIC=$(echo -n "admin:pinnacle2024" | base64)

echo "=== PinnacleSSA Admin Endpoints Health Check ==="
echo "Supabase URL: $SUPABASE_URL"
echo ""

# Test 1: Basic auth only (what admin page currently sends) - EXPECTED TO FAIL at gateway
echo "--- 1. GET bookings (Basic auth only - current admin page behavior) ---"
HTTP1=$(curl -s -o /tmp/h1.json -w "%{http_code}" \
  -H "Authorization: Basic $BASE64_BASIC" \
  "${SUPABASE_URL}/functions/v1/admin-operations/bookings")
echo "HTTP Status: $HTTP1"
echo "Response: $(cat /tmp/h1.json)"
echo ""

# Test 2: Bearer + X-Admin-Auth (correct auth for admin-operations)
echo "--- 2. GET bookings (Bearer anon + X-Admin-Auth) ---"
if [ -z "$ANON_KEY" ] || [ "$ANON_KEY" = "your_anon_key_here" ]; then
  echo "SKIP: No valid ANON_KEY in .env.local"
else
  HTTP2=$(curl -s -o /tmp/h2.json -w "%{http_code}" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "X-Admin-Auth: Basic $BASE64_BASIC" \
    "${SUPABASE_URL}/functions/v1/admin-operations/bookings")
  echo "HTTP Status: $HTTP2"
  echo "Response: $(cat /tmp/h2.json | head -c 500)"
  if [ "$HTTP2" = "200" ]; then
    echo "OK: Bookings endpoint working"
  fi
fi
echo ""

# Test 3: GET blocked-slots (Bearer + X-Admin-Auth)
echo "--- 3. GET blocked-slots (Bearer anon + X-Admin-Auth) ---"
if [ -z "$ANON_KEY" ] || [ "$ANON_KEY" = "your_anon_key_here" ]; then
  echo "SKIP: No valid ANON_KEY in .env.local"
else
  HTTP3=$(curl -s -o /tmp/h3.json -w "%{http_code}" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "X-Admin-Auth: Basic $BASE64_BASIC" \
    "${SUPABASE_URL}/functions/v1/admin-operations/blocked-slots")
  echo "HTTP Status: $HTTP3"
  echo "Response: $(cat /tmp/h3.json)"
  if [ "$HTTP3" = "200" ]; then
    echo "OK: Blocked-slots endpoint working"
  fi
fi
echo ""

echo "=== Summary ==="
if [ "$HTTP1" = "401" ] && grep -q "Bearer" /tmp/h1.json 2>/dev/null; then
  echo "ROOT CAUSE: Supabase gateway requires Authorization: Bearer <anon_key> to invoke edge functions."
  echo "The admin page sends only Basic auth, so requests are rejected before reaching the function."
fi
if [ "$HTTP2" = "200" ]; then
  echo "SUCCESS: Admin endpoints are working. Deploy admin-operations if you haven't."
elif [ "$HTTP2" = "401" ] && grep -q "Unauthorized" /tmp/h2.json 2>/dev/null; then
  echo "ACTION: Deploy the updated admin-operations function: supabase functions deploy admin-operations"
fi
