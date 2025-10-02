# ✅ Stripe Integration Complete

## Overview

Complete Stripe subscription integration has been implemented for LushQuote. The system supports:
- **Free Plan**: $0/month with limitations (1 template, 25 submissions/month)
- **Premium Plan**: $19.99/month with unlimited features

---

## 🔑 Required Environment Variables

### Frontend (.env file in project root)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend (Supabase Edge Functions - Set in Supabase Dashboard)

Go to **Supabase Dashboard → Edge Functions → Settings** and add:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_... or sk_test_... for testing
STRIPE_PRICE_ID=price_... (your Premium plan Price ID from Stripe)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook setup)

# Supabase Keys (for edge functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📋 Setup Steps

### 1. Create Stripe Product & Price

1. Log into [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Products → Add Product**
3. Create a product named "LushQuote Premium"
4. Set price: **$19.99/month** (recurring)
5. Copy the **Price ID** (starts with `price_`)
6. Add this to your Supabase Edge Function secrets as `STRIPE_PRICE_ID`

### 2. Set Up Stripe Webhook

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add this to Supabase Edge Function secrets as `STRIPE_WEBHOOK_SECRET`

### 3. Deploy Supabase Edge Functions

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy all edge functions
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal-session
supabase functions deploy stripe-webhook

# Set environment variables
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_PRICE_ID=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_URL=https://...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Apply Database Migration

Run the SQL migration for the submission counter:

```bash
# Using Supabase CLI
supabase db push

# OR manually in Supabase SQL Editor
# Copy and run: supabase/migrations/increment_submission_counter_rpc.sql
```

### 5. Configure Stripe Billing Portal

1. In Stripe Dashboard, go to **Settings → Billing → Customer Portal**
2. Enable the portal
3. Configure what customers can do:
   - ✅ Update payment method
   - ✅ Cancel subscription
   - ✅ View invoices
4. Set your business information and branding

---

## 🎯 How It Works

### User Flow

1. **Free User Signs Up**
   - Gets `subscription_tier: 'free'` in `user_profiles`
   - Limited to 1 template and 25 submissions/month

2. **User Clicks "Upgrade to Premium"**
   - Frontend calls `createCheckoutSession()`
   - Edge function creates Stripe checkout session
   - User redirected to Stripe hosted checkout page

3. **User Completes Payment**
   - Stripe fires `checkout.session.completed` webhook
   - Webhook handler updates user profile:
     - `subscription_tier: 'premium'`
     - `subscription_status: 'active'`
     - `stripe_customer_id: <customer_id>`
     - `stripe_subscription_id: <subscription_id>`
     - Resets `monthly_submission_count: 0`

4. **User Manages Subscription**
   - Clicks "Manage Billing" in Settings
   - Frontend calls `createBillingPortalSession()`
   - User redirected to Stripe billing portal
   - Can update payment method, cancel subscription, view invoices

5. **Subscription Cancelled**
   - Stripe fires `customer.subscription.deleted` webhook
   - User downgraded to:
     - `subscription_tier: 'free'`
     - `subscription_status: 'canceled'`

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upgrade user to premium, save customer & subscription IDs |
| `customer.subscription.updated` | Update subscription status and period end |
| `customer.subscription.deleted` | Downgrade user to free tier |
| `invoice.payment_failed` | Set status to `past_due` |

---

## 🔒 Feature Restrictions

### Free Tier
- ✅ 1 template maximum
- ✅ 25 submissions per month
- ✅ Basic branding (header color)
- ❌ Cannot customize/remove "Powered by LushQuote" footer
- ❌ No CSV export of submissions

### Premium Tier ($19.99/month)
- ✅ Unlimited templates
- ✅ Unlimited submissions
- ✅ Full branding control
- ✅ Remove/customize footer branding
- ✅ CSV export of all submissions
- ✅ Priority support

---

## 🧪 Testing

### Test the Integration

1. **Use Stripe Test Mode**
   - Use `sk_test_...` secret key
   - Use test price ID from Stripe test mode
   - Use test webhook secret

2. **Test Cards** (Stripe provides these):
   ```
   Success: 4242 4242 4242 4242
   Decline: 4000 0000 0000 0002
   3D Secure: 4000 0025 0000 3155
   ```
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

3. **Test Webhook Locally**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login
   stripe login

   # Forward webhooks to local edge function
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```

---

## 🚀 Deployment Checklist

- [ ] Create Stripe product and price
- [ ] Set up Stripe webhook endpoint
- [ ] Deploy all 3 edge functions to Supabase
- [ ] Set all required environment variables in Supabase
- [ ] Apply database migration for `increment_submission_counter`
- [ ] Configure Stripe Customer Portal
- [ ] Test checkout flow in test mode
- [ ] Test webhook events
- [ ] Test billing portal
- [ ] Switch to live mode Stripe keys
- [ ] Verify live payment processing

---

## 📝 Code Changes Made

### Edge Functions Updated
1. **`create-checkout-session.ts`**
   - Gets user from auth token
   - Creates/reuses Stripe customer
   - Uses `STRIPE_PRICE_ID` from env
   - Redirects to success/cancel URLs

2. **`stripe-webhook.ts`**
   - Handles 4 webhook events
   - Updates `subscription_tier` and `subscription_status`
   - Stores Stripe customer and subscription IDs
   - Handles payment failures

3. **`create-billing-portal-session.ts`**
   - Gets user from auth token
   - Uses stored `stripe_customer_id`
   - Creates portal session

### Frontend Updated
1. **`src/api/functions.js`**
   - Passes auth token to edge functions
   - Removed hardcoded parameters

2. **Removed All Bypass Hacks**
   - ❌ `BYPASS_TEMPLATE_LIMITS`
   - ❌ `BYPASS_FOOTER_RESTRICTIONS`
   - All premium features now properly enforced

### Database
- Created RPC function: `increment_submission_counter(template_id)`
- Tracks monthly submissions per user
- Used by public quote form submissions

---

## 🆘 Troubleshooting

### Checkout Not Working
- ✅ Check `STRIPE_SECRET_KEY` is set in Supabase secrets
- ✅ Check `STRIPE_PRICE_ID` is set and valid
- ✅ Verify edge function is deployed: `supabase functions list`
- ✅ Check browser console for errors

### Webhook Not Firing
- ✅ Verify webhook endpoint URL is correct
- ✅ Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- ✅ Check edge function logs: Supabase Dashboard → Edge Functions → Logs

### User Not Upgraded
- ✅ Check Supabase edge function logs for errors
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- ✅ Check user_profiles table for updated `subscription_tier`

---

## 💡 Next Steps

1. **Monitor Subscriptions**: Check Stripe Dashboard regularly
2. **Handle Failed Payments**: Send email reminders for `past_due` status
3. **Track Metrics**: Monitor conversion rates from free to premium
4. **Update Pricing**: If needed, create new price in Stripe and update `STRIPE_PRICE_ID`

---

## 📧 Support

For Stripe integration issues:
- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

For Supabase edge functions:
- Supabase Docs: https://supabase.com/docs/guides/functions
