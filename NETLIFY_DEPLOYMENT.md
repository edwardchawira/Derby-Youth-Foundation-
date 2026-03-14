# Netlify Deployment Guide

## Environment Variables Setup

Your deployment is failing because Netlify needs your Supabase environment variables to be configured. Follow these steps:

### 1. Access Netlify Environment Variables

1. Log in to your [Netlify dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** > **Environment variables**
4. Click **Add a variable**

### 2. Add Required Variables

Add the following environment variables:

**NEXT_PUBLIC_SUPABASE_URL**
```
https://dxfukbncszjdwyqhmrgq.supabase.co
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk
```

### 3. Set Variable Scopes

For each variable:
- Check both **Build time** and **Runtime** scopes
- This ensures the variables are available during both the build process and when the site is running

### 4. Trigger a New Deploy

After adding the environment variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** > **Clear cache and deploy site**

## What Was Fixed

The deployment was failing with "Error: supabaseUrl is required" because:

1. **Root Cause**: Supabase client initialization required environment variables that weren't available during Netlify's build process

2. **Solution Applied**:
   - Updated `/lib/supabase.ts` to include fallback values for build-time compatibility
   - This allows the build to succeed even if environment variables aren't set
   - However, for the app to function properly at runtime, you must still set the environment variables in Netlify

3. **Build Verification**: Local build now succeeds with all pages generating correctly

## Verification

After deploying with the environment variables set:

1. Visit your deployed site
2. Test the following pages:
   - `/equipment` - Should load packages and equipment from Supabase
   - `/studio` - Should load studio services
   - `/pricing` - Should display pricing information
   - `/cart` - Should allow bookings
   - `/admin` - Should allow admin access

If pages show "Loading..." indefinitely, check that:
- Environment variables are set correctly in Netlify
- Both Build time and Runtime scopes are checked
- You've triggered a fresh deploy after adding the variables

## Support

If you encounter issues:
1. Check the deploy logs in Netlify for specific error messages
2. Verify environment variables are set with correct values (no extra spaces)
3. Ensure both scopes (Build time and Runtime) are enabled for each variable
