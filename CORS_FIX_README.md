# CORS Fix Applied - Edge Functions Updated

## Problem
Getting CORS error when calling Supabase Edge Functions from Netlify:
```
Access to fetch at 'https://mekynypkkangghybwyxt.supabase.co/functions/v1/create-checkout-session'
from origin 'https://lushquote.netlify.app' has been blocked by CORS policy
```

## Solution Applied
Added CORS headers to all three edge functions:

### Files Updated:
1. ✅ `edge-functions/create-checkout-session.ts`
2. ✅ `edge-functions/create-billing-portal-session.ts`
3. ✅ `edge-functions/stripe-webhook.ts`

### Changes Made:

1. **Added CORS headers constant:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

2. **Handle OPTIONS requests (preflight):**
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

3. **Added CORS headers to all responses:**
```typescript
return new Response(JSON.stringify({ data }), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
  status: 200,
});
```

## Next Steps - REDEPLOY Required!

### 🚨 IMPORTANT: You MUST redeploy the edge functions for the fix to work

```bash
# Deploy all three functions
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal-session
supabase functions deploy stripe-webhook
```

### Verify Deployment

After deploying, test in your browser:

1. Go to https://lushquote.netlify.app
2. Try to upgrade to premium
3. Should redirect to Stripe checkout without CORS error

### Alternative: Use Supabase Dashboard

If you don't have Supabase CLI installed:

1. Go to Supabase Dashboard → Edge Functions
2. Click on each function
3. Copy the updated code from the local files
4. Paste and deploy

## Why This Happened

Edge functions run on Supabase's servers, not on your domain. When your Netlify app (https://lushquote.netlify.app) makes a request to Supabase (https://mekynypkkangghybwyxt.supabase.co), browsers enforce CORS policy:

- ❌ **Without CORS headers:** Browser blocks the request
- ✅ **With CORS headers:** Browser allows the request

## What the Fix Does

1. **Preflight Request (OPTIONS):** Browser sends OPTIONS request first to check if CORS is allowed
2. **Actual Request (POST):** If OPTIONS succeeds, browser sends the real POST request
3. **Response:** Server returns data with CORS headers, browser allows it

## Testing

After redeploying, you should see:

✅ No CORS errors in browser console
✅ Successful redirect to Stripe checkout
✅ Stripe webhook events working
✅ Billing portal working

## Troubleshooting

### Still getting CORS errors after deploy?
- Clear browser cache
- Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check edge function logs in Supabase dashboard

### Edge functions not deploying?
```bash
# Make sure you're logged in
supabase login

# Link your project
supabase link --project-ref mekynypkkangghybwyxt

# Try deploy again
supabase functions deploy create-checkout-session --no-verify-jwt
```

### Want to restrict CORS to specific domain?
Change the corsHeaders to:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://lushquote.netlify.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

But `'*'` (allow all) is fine for public APIs.
