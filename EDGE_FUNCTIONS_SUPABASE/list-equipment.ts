// deno-lint-ignore-file no-explicit-any
// List available equipment items for rental with optional filters
// Supports both GET (query params) and POST (JSON body) for Vapi compatibility
// Route: /list-equipment or /vapi-list-equipment
// Method: GET or POST

import { createClient } from "npm:@supabase/supabase-js@2.45.3";

interface Query {
  category?: string;
  search?: string;
  available_only?: string | boolean;
}

interface EquipmentRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_per_day: number | null;
  available: boolean | null;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Use SERVICE_ROLE_KEY for Vapi (bypasses RLS)
// Fallback to ANON_KEY if SERVICE_ROLE_KEY not available
const SUPABASE_KEY = SUPABASE_SERVICE_KEY || Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { headers: { "X-Client-Info": "edge-fn:list-equipment@2.0.0" } },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function boolFromString(value: string | boolean | null | undefined, defaultValue = true): boolean {
  if (value == null || value === undefined) return defaultValue;
  if (typeof value === "boolean") return value;
  const v = String(value).toLowerCase();
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return defaultValue;
}

function buildSearchFilter(q: string | undefined | null) {
  if (!q) return undefined;
  return `%${q}%`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let params: Query = {};

    // Handle POST (Vapi sends JSON body)
    if (req.method === "POST") {
      try {
        params = await req.json();
      } catch {
        params = {};
      }
    }
    // Handle GET (read from URL params for backwards compatibility)
    else if (req.method === "GET") {
      const url = new URL(req.url);
      params = Object.fromEntries(url.searchParams.entries()) as Query;
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🔍 Equipment list requested:", { method: req.method, params });

    const category = params.category?.trim();
    const search = params.search?.trim();
    const availableOnly = boolFromString(params.available_only ?? null, true);

    // Try equipment_items table first (newer structure), fallback to equipment
    let query = supabase
      .from<EquipmentRow>("equipment_items")
      .select("id, name, description, price_per_day, available, category_id, equipment_categories(name)");

    const { data, error } = await query.order("name", { ascending: true });

    // If equipment_items doesn't exist, try equipment table (legacy)
    if (error && error.code === "PGRST116") {
      console.log("⚠️ equipment_items table not found, trying equipment table...");
      
      let legacyQuery = supabase
        .from<EquipmentRow>("equipment")
        .select("id, name, description, category, price_per_day, available");

      if (category && category.length > 0) {
        legacyQuery = legacyQuery.eq("category", category);
      }

      if (availableOnly) {
        legacyQuery = legacyQuery.eq("available", true);
      }

      const searchPattern = buildSearchFilter(search);
      if (searchPattern) {
        legacyQuery = legacyQuery.or(
          `name.ilike.${searchPattern},description.ilike.${searchPattern}`
        );
      }

      const { data: legacyData, error: legacyError } = await legacyQuery.order("name", { ascending: true });

      if (legacyError) {
        console.error("❌ Error fetching equipment:", legacyError);
        return new Response(
          JSON.stringify({ error: legacyError.message, success: false }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const items = (legacyData || []).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || "",
        category: r.category || "Uncategorized",
        price_per_day: r.price_per_day || 0,
        available: !!r.available,
      }));

      return new Response(
        JSON.stringify({ success: true, equipment: items, count: items.length }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (error) {
      console.error("❌ Error fetching equipment:", error);
      return new Response(
        JSON.stringify({ error: error.message, success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter results in memory (for equipment_items with categories)
    let filteredData = data || [];

    if (availableOnly) {
      filteredData = filteredData.filter((item) => item.available === true);
    }

    if (category) {
      filteredData = filteredData.filter((item: any) => {
        const catName = item.equipment_categories?.name || "";
        return catName.toLowerCase().includes(category.toLowerCase());
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter((item) => {
        return (
          item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        );
      });
    }

    const items = filteredData.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description || "",
      category: r.equipment_categories?.name || "Uncategorized",
      price_per_day: parseFloat(String(r.price_per_day || 0)),
      available: !!r.available,
    }));

    console.log(`✅ Found ${items.length} equipment items`);

    return new Response(
      JSON.stringify({ success: true, equipment: items, count: items.length }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e: any) {
    console.error("❌ Unexpected error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unexpected error",
        details: String(e?.message ?? e),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
