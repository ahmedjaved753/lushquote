# Quick Webhook Test Guide

## The "Invalid time value" Error - FIXED! ✅

### What Was Wrong:

The `customer.subscription.updated` webhook event has a complex nested structure. The `current_period_end` field can be in two different locations:

- `subscription.current_period_end` (sometimes present)
- `subscription.items.data[0].current_period_end` (always present)

The old code assumed it was always at the top level, causing crashes when it wasn't there.

### How It's Fixed:

```typescript
// New robust approach:
let periodEnd: number | null = null;

// Try primary location
if (updatedSubscription.current_period_end) {
  periodEnd = updatedSubscription.current_period_end;
}
// Fallback to items array
else if (updatedSubscription.items?.data?.[0]?.current_period_end) {
  periodEnd = updatedSubscription.items.data[0].current_period_end;
}

// Only process if we found a valid value
if (periodEnd) {
  try {
    updateData.subscription_current_period_end = new Date(
      periodEnd * 1000
    ).toISOString();
  } catch (e) {
    console.error("Error converting period end date:", e);
  }
}
```

## Quick Test (30 seconds)

### Option 1: Retry Failed Webhook in Stripe

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find your webhook endpoint
3. Click on it
4. Look for the failed events
5. Click "Send test webhook" or "Retry" on the failed events
6. Should now return: `200 OK` with `{"received": true}`

### Option 2: Test with New Payment

1. Login to your app
2. Click "Upgrade to Premium"
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. You should see:
   - ✅ Success message on dashboard
   - ✅ Premium badge appears
   - ✅ Can create multiple templates

## Check Webhook Logs

```bash
# In terminal
supabase functions logs stripe-webhook --follow

# Or in browser:
# https://supabase.com/dashboard/project/mekynypkkangghybwyxt/functions
```

### What You Should See:

**Successful webhook processing:**

```
✅ Received webhook event: customer.subscription.updated
✅ Subscription updated: sub_xxxxx
✅ Subscription status: active
✅ Updating subscription with data: {...}
✅ Subscription updated successfully
```

**NO MORE ERRORS:**

- ❌ "Invalid time value" ← GONE!
- ❌ "SubtleCryptoProvider cannot be used" ← GONE!
- ❌ Any other webhook errors ← GONE!

## Verify Database Update

Check your user profile was actually updated:

```sql
SELECT
  email,
  subscription_tier,
  subscription_status,
  stripe_subscription_id,
  subscription_current_period_end
FROM user_profiles
WHERE email = 'your-test-email@example.com';
```

Should show:

- `subscription_tier`: "premium"
- `subscription_status`: "active"
- `stripe_subscription_id`: "sub_xxxxx"
- `subscription_current_period_end`: Valid ISO date

## What Events Fire During Checkout?

When a user completes payment, Stripe typically sends **TWO webhooks** in this order:

1. **`checkout.session.completed`** (fired first)

   - Subscription was just created
   - Status might still be "incomplete"
   - This webhook saves customer and subscription IDs

2. **`customer.subscription.updated`** (fired immediately after)
   - Subscription status changed from "incomplete" → "active"
   - This webhook confirms the subscription is now active
   - **This is the one that was failing!** Now fixed. ✅

Both webhooks update the user profile, which is fine. The second one ensures the status is correct.

## Still Having Issues?

### Check These:

1. **Webhook Secret Matches:**

   ```bash
   supabase secrets list
   ```

   Should show `STRIPE_WEBHOOK_SECRET`

2. **Webhook URL in Stripe:**

   - Should be: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
   - Should have these events enabled:
     - ✅ checkout.session.completed
     - ✅ customer.subscription.updated
     - ✅ customer.subscription.deleted
     - ✅ invoice.payment_failed

3. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click on your webhook
   - Check "Recent attempts"
   - All should show "200 OK" now!

## Test Complete Subscription Lifecycle

To thoroughly test, try these scenarios:

### Scenario 1: New Subscription ✅

- Free user upgrades to premium
- **Expected:** Both webhooks fire, user becomes premium

### Scenario 2: Subscription Active ✅

- Payment processes monthly
- **Expected:** `invoice.paid` webhook fires (optional event, but shouldn't crash)

### Scenario 3: Payment Failed ⚠️

- Test with card `4000 0000 0000 0341`
- **Expected:** User status → "past_due"

### Scenario 4: Cancel Subscription ❌

- User cancels in billing portal
- **Expected:** User status → "canceled", tier → "free"

All these should work without any "Invalid time value" errors!

---

**Need Help?**

- Check full docs: `STRIPE_PAYMENT_FIX.md`
- View webhook code: `supabase/functions/stripe-webhook/index.ts`
- Monitor logs: `supabase functions logs stripe-webhook --follow`
