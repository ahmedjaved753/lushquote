# Quick Fix for CORS Error - Deploy Edge Functions

## 🔴 Problem

```
Access to fetch at 'https://mekynypkkangghybwyxt.supabase.co/functions/v1/create-checkout-session'
from origin 'https://lushquote.netlify.app' has been blocked by CORS policy
```

## ✅ Solution (5 minutes)

### Step 1: Install Supabase CLI (if needed)

```bash
brew install supabase/tap/supabase
```

### Step 2: Login & Link Project

```bash
# Login to Supabase
supabase login

# Link your project (from the lushquote directory)
cd /Users/mac/Desktop/lushquote
supabase link --project-ref mekynypkkangghybwyxt
```

### Step 3: Set Required Secrets

⚠️ **IMPORTANT**: Replace the placeholder values with your actual keys!

```bash
# From Stripe Dashboard → Developers → API Keys
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY

# From Stripe Dashboard → Products → Premium → Price ID
supabase secrets set STRIPE_PRICE_ID=price_YOUR_ACTUAL_PRICE_ID

# Your Supabase project URL
supabase secrets set SUPABASE_URL=https://mekynypkkangghybwyxt.supabase.co

# From Supabase Dashboard → Settings → API → service_role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_ACTUAL_SERVICE_ROLE_KEY
```

### Step 4: Deploy Functions

**Option A - Use the script:**

```bash
./deploy-functions.sh
```

**Option B - Deploy manually:**

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal-session
supabase functions deploy stripe-webhook
```

### Step 5: Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://mekynypkkangghybwyxt.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
5. Copy the webhook signing secret
6. Set it:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

## ✅ Test It

1. Go to https://lushquote.netlify.app
2. Click "Upgrade to Premium"
3. Should redirect to Stripe checkout without CORS error! 🎉

## 📊 Verify Deployment

```bash
# List deployed functions
supabase functions list

# Check logs if there are issues
supabase functions logs create-checkout-session
```

## 🆘 Still Having Issues?

### Check if functions are deployed:

```bash
supabase functions list
```

Should show 3 functions.

### Check if secrets are set:

```bash
supabase secrets list
```

Should show all 5 secrets.

### Test function directly:

```bash
curl -i https://mekynypkkangghybwyxt.supabase.co/functions/v1/create-checkout-session
```

Should return `405 Method not allowed` (that's good! It means function is deployed).

---

## 📝 Where to Find Your Keys

| Secret                      | Location                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`         | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → API Keys → Secret key                                                        |
| `STRIPE_PRICE_ID`           | [Stripe Dashboard](https://dashboard.stripe.com/products) → Your Premium Product → Pricing → Price ID                                   |
| `STRIPE_WEBHOOK_SECRET`     | [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Select endpoint → Signing secret                                            |
| `SUPABASE_URL`              | [Supabase Dashboard](https://supabase.com/dashboard/project/mekynypkkangghybwyxt/settings/api) → Settings → API → Project URL           |
| `SUPABASE_SERVICE_ROLE_KEY` | [Supabase Dashboard](https://supabase.com/dashboard/project/mekynypkkangghybwyxt/settings/api) → Settings → API → service_role (secret) |

---

That's it! Your checkout should work now. 🚀
