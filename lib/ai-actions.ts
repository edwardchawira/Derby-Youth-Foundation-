'use server';

import { supabase } from '@/lib/supabase';
import { getServerSupabaseClient } from '@/lib/supabase-server';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  technical_specs: Record<string, any>;
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

/**
 * Search the products table in Supabase
 * @param query - Search query string
 * @returns Array of products matching the query
 */
export async function searchInventory(query: string): Promise<Product[]> {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Use server-side Supabase client for better RLS handling
    // For public product searches, we can use the anon client
    const serverSupabase = await getServerSupabaseClient();

    // Escape special characters in query for ILIKE pattern matching
    const escapedQuery = query.trim().replace(/%/g, '\\%').replace(/_/g, '\\_');
    
    const { data, error } = await serverSupabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Error searching inventory:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error hint:', error.hint);
      
      // Return empty array instead of throwing - this allows the assistant to handle gracefully
      return [];
    }

    const products = data || [];
    console.log(`✅ searchInventory found ${products.length} products for query: "${query}"`);
    
    if (products.length > 0) {
      console.log(`✅ Products found:`, products.map(p => ({ id: p.id, name: p.name })));
    } else {
      console.log(`⚠️ No products found for query: "${query}"`);
    }
    
    return products;
  } catch (error: any) {
    console.error('❌ Exception in searchInventory:', error);
    console.error('❌ Error stack:', error.stack);
    // Return empty array instead of throwing to prevent breaking the tool call
    // The assistant will see an empty result and can inform the user appropriately
    return [];
  }
}

/**
 * Add a product to the user's cart
 * Checks if the user is authenticated and inserts/updates cart item
 * @param productId - UUID of the product
 * @param quantity - Quantity to add
 * @returns Success message or error
 */
export async function addToCart(
  productId: string,
  quantity: number
): Promise<{ success: boolean; message: string; cartItem?: CartItem }> {
  try {
    // Get server-side Supabase client with auth
    const serverSupabase = await getServerSupabaseClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'You must be authenticated to add items to cart',
      };
    }

    // Validate inputs
    if (!productId || quantity <= 0) {
      return {
        success: false,
        message: 'Invalid product ID or quantity',
      };
    }

    // Check if product exists
    const { data: product, error: productError } = await serverSupabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    // Check if item already exists in cart
    const { data: existingItem } = await serverSupabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    let result;
    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + quantity;
      const { data, error } = await serverSupabase
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      result = data;
    } else {
      // Insert new cart item
      const { data, error } = await serverSupabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity: quantity,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      result = data;
    }

    return {
      success: true,
      message: 'Item added to cart successfully',
      cartItem: result,
    };
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return {
      success: false,
      message: error.message || 'Failed to add item to cart',
    };
  }
}

/**
 * Fetch external technical specifications from API
 * Placeholder for Tavily/Perplexity or mock API
 * @param item - Product name or identifier
 * @returns Technical specifications object
 */
export async function fetchExternalSpecs(item: string): Promise<{
  success: boolean;
  specs?: Record<string, any>;
  error?: string;
}> {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

    // Try Tavily API if key is provided
    if (tavilyApiKey) {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: `technical specifications for ${item}`,
            search_depth: 'advanced',
            include_answer: true,
            include_raw_content: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            specs: {
              source: 'tavily',
              answer: data.answer,
              results: data.results,
            },
          };
        }
      } catch (tavilyError) {
        console.warn('Tavily API error, falling back:', tavilyError);
      }
    }

    // Try Perplexity API if key is provided
    if (perplexityApiKey) {
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${perplexityApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are a technical specification expert. Provide detailed technical specs in JSON format.',
              },
              {
                role: 'user',
                content: `What are the technical specifications for ${item}? Return as JSON object.`,
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            specs: {
              source: 'perplexity',
              content: data.choices[0]?.message?.content,
            },
          };
        }
      } catch (perplexityError) {
        console.warn('Perplexity API error, falling back:', perplexityError);
      }
    }

    // Fallback to mock data if no API keys are provided
    return {
      success: true,
      specs: {
        source: 'mock',
        item: item,
        specifications: {
          category: 'Audio Equipment',
          dimensions: 'N/A',
          weight: 'N/A',
          power_consumption: 'N/A',
          connectivity: 'N/A',
          compatibility: 'N/A',
          warranty: 'Manufacturer warranty applies',
        },
        note: 'Mock data - Provide TAVILY_API_KEY or PERPLEXITY_API_KEY environment variable for real data',
      },
    };
  } catch (error: any) {
    console.error('Error fetching external specs:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch external specifications',
    };
  }
}

/**
 * Fetch web specifications using Tavily API
 * Searches the web for technical specifications and returns top 3-5 results
 * @param query - Search query string
 * @returns Object containing search results with snippets
 */
export async function fetchWebSpecs(query: string): Promise<{
  success: boolean;
  results?: Array<{
    title: string;
    url: string;
    content: string;
    score?: number;
  }>;
  answer?: string;
  error?: string;
}> {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;

    if (!tavilyApiKey) {
      return {
        success: false,
        error: 'TAVILY_API_KEY is not configured. Please add it to your .env.local file.',
      };
    }

    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: 'Query is required and must be a non-empty string',
      };
    }

    // Call Tavily API
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query.trim(),
        search_depth: 'advanced',
        include_answer: true,
        include_raw_content: false,
        max_results: 5, // Get top 5 results
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Tavily API error: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const data = await response.json();

    // Format results
    const results = (data.results || []).slice(0, 5).map((result: any) => ({
      title: result.title || 'Untitled',
      url: result.url || '',
      content: result.content || '',
      score: result.score,
    }));

    return {
      success: true,
      results,
      answer: data.answer || undefined,
    };
  } catch (error: any) {
    console.error('Error fetching web specs:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch web specifications',
    };
  }
}

/**
 * Get YouTube reviews for a product
 * Returns a search link or fetches from YouTube Data API if key is provided
 * @param productName - Name of the product
 * @returns YouTube search URL or API results
 */
export async function getYouTubeReviews(productName: string): Promise<{
  success: boolean;
  url?: string;
  videos?: Array<{
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    url: string;
  }>;
  error?: string;
}> {
  try {
    const youtubeApiKey = process.env.YOUTUBE_DATA_API_KEY;

    // If API key is provided, fetch from YouTube Data API
    if (youtubeApiKey) {
      try {
        const searchQuery = encodeURIComponent(`${productName} review unboxing`);
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=5&key=${youtubeApiKey}`;

        const response = await fetch(apiUrl);

        if (response.ok) {
          const data = await response.json();
          const videos = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          }));

          return {
            success: true,
            videos,
          };
        }
      } catch (apiError) {
        console.warn('YouTube API error, falling back to search link:', apiError);
      }
    }

    // Fallback: Return pre-filtered YouTube search link
    const searchQuery = encodeURIComponent(`${productName} review`);
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

    return {
      success: true,
      url: youtubeSearchUrl,
    };
  } catch (error: any) {
    console.error('Error getting YouTube reviews:', error);
    return {
      success: false,
      error: error.message || 'Failed to get YouTube reviews',
    };
  }
}