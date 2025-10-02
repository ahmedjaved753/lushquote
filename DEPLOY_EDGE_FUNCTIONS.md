# Deploy Edge Functions to Supabase

## Problem

Getting CORS error: `Access to fetch at 'https://mekynypkkangghybwyxt.supabase.co/functions/v1/create-checkout-session' from origin 'https://lushquote.netlify.app' has been blocked by CORS policy`

**Root Cause:** Edge functions are not deployed to Supabase. The functions need to be deployed for them to be accessible.

## Solution: Deploy Edge Functions

### Prerequisites

1. **Install Supabase CLI** (if not already installed):

```bash
brew install supabase/tap/supabase
```

2. **Login to Supabase CLI:**

```bash
supabase login
```

This will open a browser for authentication.

### Step 1: Link Your Project

Link your local project to your Supabase project:

```bash
cd /Users/mac/Desktop/lushquote
supabase link --project-ref mekynypkkangghybwyxt
```

### Step 2: Set Environment Secrets

Your edge functions need these environment variables. Set them in your Supabase project:

```bash
# Set Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key

# Set Stripe Price ID (for Premium subscription)
supabase secrets set STRIPE_PRICE_ID=price_your_premium_price_id

# Set Stripe Webhook Secret (for webhook verification)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Set Supabase URL (should match your project)
supabase secrets set SUPABASE_URL=https://mekynypkkangghybwyxt.supabase.co

# Set Supabase Service Role Key (found in project settings -> API)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Where to find these values:**

- `STRIPE_SECRET_KEY`: Stripe Dashboard → Developers → API Keys
- `STRIPE_PRICE_ID`: Stripe Dashboard → Products → Your Premium Product → Price ID
- `STRIPE_WEBHOOK_SECRET`: Stripe Dashboard → Developers → Webhooks → Endpoint secret
- `SUPABASE_URL`: Supabase Dashboard → Project Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Project Settings → API → service_role key

### Step 3: Deploy Each Function

Deploy all three edge functions:

```bash
# Deploy create-checkout-session
supabase functions deploy create-checkout-session

# Deploy create-billing-portal-session
supabase functions deploy create-billing-portal-session

# Deploy stripe-webhook
supabase functions deploy stripe-webhook
```

### Step 4: Verify Deployment

Check that your functions are deployed:

```bash
supabase functions list
```

You should see all three functions listed.

### Step 5: Configure Stripe Webhook

After deploying the `stripe-webhook` function:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://mekynypkkangghybwyxt.supabase.co/functions/v1/stripe-webhook`
3. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the webhook signing secret and update your Supabase secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_new_webhook_secret
   ```

## Testing

After deployment, test your checkout flow:

1. Go to your app: https://lushquote.netlify.app
2. Try to upgrade to Premium
3. The checkout should now work without CORS errors

## Troubleshooting

### If you still get CORS errors:

1. **Verify functions are deployed:**

   ```bash
   supabase functions list
   ```

2. **Check function logs:**

   ```bash
   supabase functions logs create-checkout-session
   ```

3. **Test the function directly:**
   ```bash
   curl -i https://mekynypkkangghybwyxt.supabase.co/functions/v1/create-checkout-session \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

### If secrets are not working:

1. **List current secrets:**

   ```bash
   supabase secrets list
   ```

2. **Unset and reset a secret:**
   ```bash
   supabase secrets unset STRIPE_SECRET_KEY
   supabase secrets set STRIPE_SECRET_KEY=sk_live_new_key
   ```

### Common Issues:

1. **"Function not found"** - Function not deployed yet
2. **"Unauthorized"** - Check your Supabase auth token is being sent
3. **"Stripe error"** - Check your Stripe API keys and secrets
4. **"No customer found"** - User needs to complete checkout first before accessing billing portal

## Quick Deploy Script

Create a script to deploy all functions at once:

```bash
#!/bin/bash
echo "Deploying all Supabase Edge Functions..."

supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal-session
supabase functions deploy stripe-webhook

echo "✅ All functions deployed!"
echo "Run 'supabase functions list' to verify."
```

Save as `deploy-functions.sh`, make executable with `chmod +x deploy-functions.sh`, and run with `./deploy-functions.sh`

## Project Structure

Your functions are now organized correctly:

```
supabase/
├── functions/
│   ├── create-checkout-session/
│   │   └── index.ts
│   ├── create-billing-portal-session/
│   │   └── index.ts
│   └── stripe-webhook/
│       └── index.ts
└── migrations/
    └── increment_submission_counter_rpc.sql
```

## Next Steps After Deployment

1. ✅ Test checkout flow on production
2. ✅ Test billing portal access
3. ✅ Verify webhook events are being received
4. ✅ Monitor function logs for any errors
5. ✅ Test subscription upgrades and cancellations

## Support

If you encounter issues:

1. Check Supabase function logs
2. Check Stripe webhook logs
3. Verify all environment secrets are set correctly
4. Ensure your Stripe account is in live mode (not test mode)
