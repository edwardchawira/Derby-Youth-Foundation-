# Deployment Setup Guide for Pinnacle SSA

## Environment Variables Configuration

Your site is experiencing issues because the environment variables are not configured in your Netlify deployment. Follow these steps to fix it:

### 1. Access Netlify Dashboard

1. Go to [Netlify](https://app.netlify.com)
2. Log in to your account
3. Select your **pinnaclessa.co.uk** site

### 2. Configure Environment Variables

1. Go to **Site configuration** → **Environment variables**
2. Add the following variables:

**Required Variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://dxfukbncszjdwyqhmrgq.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZnVrYm5jc3pqZHd5cWhtcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTQ4ODAsImV4cCI6MjA4MTAzMDg4MH0.nUAoAqI0YpaBG5YyK4abTTqkMZeJOZFygaQmxQ1vatk
```

**Optional Variables (for Stripe payments):**

```
STRIPE_SECRET_KEY=your_actual_stripe_secret_key
```

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_actual_stripe_publishable_key
```

### 3. Deploy Scopes

Make sure to set these environment variables for:
- ✅ **Production** (required)
- ✅ **Deploy Previews** (optional)
- ✅ **Branch deploys** (optional)

### 4. Redeploy Your Site

After adding the environment variables:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for the deployment to complete (usually 2-3 minutes)

### 5. Verify the Fix

Once deployed, test:
- ✅ Equipment page should show packages and items
- ✅ Musicians page should show verified musicians
- ✅ Pricing page should show all pricing tables
- ✅ Musician sign up/sign in should work without "failed to fetch" errors

## Common Issues

### Issue: Still seeing "failed to fetch"
**Solution:** Clear your browser cache or try in an incognito window

### Issue: Environment variables not taking effect
**Solution:** Make sure you triggered a new deploy after adding the variables (step 4)

### Issue: Some data still not showing
**Solution:** Check that your database tables have data (see DATABASE_STATUS.md)

## Need Help?

If issues persist after following these steps:
1. Check browser console for specific error messages
2. Verify environment variables are saved in Netlify dashboard
3. Ensure a fresh deployment was triggered after adding variables
