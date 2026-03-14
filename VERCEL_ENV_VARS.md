# Vercel Environment Variables Setup

Add these environment variables in your Vercel project settings.

## Required Variables

### OPENAI_API_KEY
- **Description**: Your OpenAI API key
- **Example**: `sk-proj-YOUR_OPENAI_API_KEY` (get from OpenAI dashboard)
- **Where to get it**: https://platform.openai.com/api-keys

### OPENAI_ASSISTANT_ID
- **Description**: Your OpenAI Assistant ID
- **Example**: `asst_SibvhD1eJir6qxrECfVa2vC5`
- **Where to get it**: https://platform.openai.com/assistants

## Optional Variables (for enhanced features)

### TAVILY_API_KEY
- **Description**: API key for Tavily search (used by fetchWebSpecs tool)
- **Where to get it**: https://tavily.com

### PERPLEXITY_API_KEY
- **Description**: API key for Perplexity (fallback search option)
- **Where to get it**: https://www.perplexity.ai

### YOUTUBE_DATA_API_KEY
- **Description**: API key for YouTube Data API (used by getYouTubeReviews tool)
- **Where to get it**: https://console.cloud.google.com/apis/credentials

### NEXT_PUBLIC_SUPABASE_URL
- **Description**: Your Supabase project URL
- **Note**: Already has a default value in code, but recommended to set explicitly

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Description**: Your Supabase anonymous/public key
- **Note**: Already has a default value in code, but recommended to set explicitly

## How to Add in Vercel

1. Go to your Vercel project dashboard
2. Click on your project name
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter the variable name and value
6. Select all environments (Production, Preview, Development)
7. Click **Save**
8. **Redeploy** your application for changes to take effect

## After Adding Variables

After adding environment variables, you need to trigger a new deployment:

1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Select **Redeploy**
4. Or push a new commit to trigger automatic deployment
