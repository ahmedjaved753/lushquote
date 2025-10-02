# Stripe Payment & Webhook Fix

## Issues Fixed ✅

### 1. **Webhook Error - Part A** (CRITICAL - Now Fixed)

**Problem:** Webhook was failing with error:

```
SubtleCryptoProvider cannot be used in a synchronous context.
Use `await constructEventAsync(...)` instead of `constructEvent(...)`
```

**Solution:** Updated both webhook files to use async method:

- ✅ `supabase/functions/stripe-webhook/index.ts`
- ✅ `edge-functions/stripe-webhook.ts`

**Changes:**

```typescript
// BEFORE (Broken):
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

// AFTER (Fixed):
const event = await stripe.webhooks.constructEventAsync(
  body,
  signature,
  webhookSecret
);
```

### 1. **Webhook Error - Part B** (CRITICAL - Now Fixed)

**Problem:** Webhook was still failing with error after Part A fix:

```json
{
  "error": "Invalid time value"
}
```

**Root Cause:** The `customer.subscription.updated` webhook event sometimes doesn't include `current_period_end` at the subscription level. It's nested in `subscription.items.data[0].current_period_end` instead. Trying to create a Date object with `undefined` caused the error.

**Solution:** Implemented robust null checks and fallback logic:

```typescript
// Safely get current_period_end from subscription or subscription items
let periodEnd: number | null = null;

if (updatedSubscription.current_period_end) {
  periodEnd = updatedSubscription.current_period_end;
} else if (updatedSubscription.items?.data?.[0]?.current_period_end) {
  periodEnd = updatedSubscription.items.data[0].current_period_end;
}

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

**Additional Improvements:**

- Added comprehensive status handling for all subscription states
- Proper tier updates (premium/free) based on status
- Enhanced logging for debugging
- Error handling with try-catch blocks

### 2. **Success Page Quick Redirect** (Now Fixed)

**Problem:** After successful payment, the success page would flash and redirect too quickly without showing the upgraded status.

**Solution:** Enhanced Dashboard.jsx to:

1. Show initial success toast: "Payment successful! Loading your upgraded account..."
2. Wait 2 seconds for webhook to process
3. Reload user data to fetch updated subscription tier
4. Show celebratory toast: "Welcome to LushQuote Premium! 🎉"

### 3. **User Plan Not Upgrading** (Now Fixed)

**Problem:** User subscription tier wasn't being updated in the database.

**Root Cause:** The webhook was failing (Issue #1), so the database update never happened.

**Solution:**

- Fixed webhook to properly process events
- Added comprehensive logging to track upgrade process
- Added error handling to catch and log any database update issues

## Webhook Events Handled

Your webhook now properly handles these Stripe events:

### 1. `checkout.session.completed`

- **When:** User completes payment on Stripe checkout page
- **Action:** Updates user to premium, saves customer ID, subscription ID, resets monthly counter
- **Status:** ✅ Fully working

### 2. `customer.subscription.updated`

- **When:** Subscription changes (incomplete → active, active → canceled, etc.)
- **Action:** Updates subscription status and tier based on new status
- **Status:** ✅ Fixed with robust null checks
- **Note:** This is the event that was causing "Invalid time value" errors

### 3. `customer.subscription.deleted`

- **When:** Subscription is permanently deleted
- **Action:** Downgrades user to free tier
- **Status:** ✅ Working

### 4. `invoice.payment_failed`

- **When:** Recurring payment fails
- **Action:** Marks subscription as past_due
- **Status:** ✅ Working

## What Happens Now (Expected Flow)

### Step-by-Step Payment Flow:

1. **User clicks "Upgrade to Premium"**

   - Creates Stripe checkout session
   - Redirects to Stripe payment page

2. **User completes payment on Stripe**

   - Stripe processes payment
   - Redirects user to: `https://your-app.com/dashboard?stripe_success=true`

3. **Stripe sends webhook to your backend**

   - Webhook receives `checkout.session.completed` event
   - Updates user profile in database:
     - `subscription_tier` → `"premium"`
     - `subscription_status` → `"active"`
     - `stripe_customer_id` → customer ID
     - `stripe_subscription_id` → subscription ID
     - `monthly_submission_count` → reset to 0

4. **Dashboard loads and detects success**
   - Shows toast: "Payment successful! Loading your upgraded account..."
   - Waits 2 seconds for webhook processing
   - Reloads user data
   - Shows success message: "Welcome to LushQuote Premium! 🎉"
   - User sees Premium badge and features unlocked

## Enhanced Logging

The webhook now includes detailed console logs to help debug any issues:

```typescript
console.log("Updating user profile with data:", updateData);
const { data, error } = await supabase
  .from("user_profiles")
  .update(updateData)
  .eq("id", session.metadata.supabase_user_id)
  .select();

if (error) {
  console.error("Error updating user profile:", error);
} else {
  console.log("User profile updated successfully:", data);
  console.log(
    `✅ User ${session.metadata.supabase_user_id} upgraded to premium`
  );
}
```

## Testing the Fix

### Test a New Payment:

1. **Login to your app** as a free user
2. **Go to Dashboard** or Settings
3. **Click "Upgrade to Premium"**
4. **Use Stripe test card:**

   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

5. **Complete the payment**
6. **Watch for success messages:**

   - "Payment successful! Loading your upgraded account..."
   - "Welcome to LushQuote Premium! 🎉"

7. **Verify upgrade worked:**
   - Check Dashboard - should show "Premium" badge
   - Check Settings - should show "Current Plan: Premium"
   - Try creating multiple templates (should work now)
   - Check CSV export is available

### Monitor Webhook Logs:

```bash
# View webhook logs in real-time
supabase functions logs stripe-webhook --follow

# Or check in Supabase Dashboard:
# https://supabase.com/dashboard/project/YOUR_PROJECT/functions
```

### Expected Webhook Logs:

**For `checkout.session.completed`:**

```
Received webhook event: checkout.session.completed
Checkout session completed: cs_test_xxxxx
Updating user profile with data: {
  subscription_tier: "premium",
  subscription_status: "active",
  stripe_customer_id: "cus_xxxxx",
  stripe_subscription_id: "sub_xxxxx",
  subscription_current_period_end: "2025-11-02T...",
  monthly_submission_count: 0
}
User profile updated successfully: [...]
✅ User abcd-1234-efgh-5678 upgraded to premium
```

**For `customer.subscription.updated`:**

```
Received webhook event: customer.subscription.updated
Subscription updated: sub_xxxxx
Subscription status: active
Updating subscription with data: {
  subscription_status: "active",
  subscription_tier: "premium",
  subscription_current_period_end: "2025-11-02T..."
}
Subscription updated successfully: [...]
```

**Note:** Both events may fire during a successful checkout. This is normal and expected!

## Troubleshooting

### If webhook still fails:

1. **Check webhook secret is set:**

   ```bash
   supabase secrets list
   ```

   Should show: `STRIPE_WEBHOOK_SECRET`

2. **Verify webhook endpoint in Stripe Dashboard:**

   - Go to: https://dashboard.stripe.com/webhooks
   - URL should be: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
   - Events to send: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

3. **Check webhook signature:**
   - Each webhook endpoint has a unique signing secret
   - Make sure the secret in your Supabase project matches the webhook endpoint

### If user plan doesn't upgrade:

1. **Check webhook processed successfully** (see logs above)
2. **Check user_profiles table:**
   ```sql
   SELECT id, email, subscription_tier, subscription_status
   FROM user_profiles
   WHERE email = 'your-test-email@example.com';
   ```
3. **Verify RLS policies allow service role to update:**
   - Webhook uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS

### If success page redirects too fast:

- The 2-second delay should be enough for most cases
- If webhook is slow, you can increase the delay in Dashboard.jsx (line 62):
  ```javascript
  setTimeout(() => {
    loadData();
  }, 2000); // Increase to 3000 or 4000 if needed
  ```

## Files Modified

1. ✅ `/supabase/functions/stripe-webhook/index.ts` - Fixed async webhook processing
2. ✅ `/edge-functions/stripe-webhook.ts` - Fixed async webhook processing
3. ✅ `/src/pages/Dashboard.jsx` - Enhanced success handling with data reload

## Deployment Status

✅ **Webhook deployed successfully!**

```
Deployed Functions on project mekynypkkangghybwyxt: stripe-webhook
https://supabase.com/dashboard/project/mekynypkkangghybwyxt/functions
```

## Next Steps

1. ✅ **Test the payment flow** with Stripe test card
2. ✅ **Monitor webhook logs** to confirm events are processing
3. ✅ **Verify user upgrades** are working correctly
4. 📝 **Document** any additional issues found during testing

## Production Checklist

Before going live:

- [ ] Switch from test mode to live mode in Stripe
- [ ] Update webhook endpoint with live webhook secret
- [ ] Test with real card (small amount)
- [ ] Set up webhook failure alerts in Stripe
- [ ] Monitor Supabase function logs regularly
- [ ] Test subscription cancellation flow
- [ ] Test subscription renewal flow

---

## Summary of All Fixes

1. ✅ **Fixed `constructEvent` → `constructEventAsync`** for Deno compatibility
2. ✅ **Fixed "Invalid time value" error** with robust null checks and fallback logic
3. ✅ **Enhanced subscription status handling** for all states (active, canceled, incomplete, past_due)
4. ✅ **Added comprehensive logging** to track webhook processing
5. ✅ **Improved success page handling** with delayed data reload
6. ✅ **Error handling** with try-catch blocks everywhere

**Last Updated:** October 2, 2025 (12:15 PM PST)
**Status:** ✅ All Webhook Issues Fixed & Deployed
**Deployment:** Successfully deployed to Supabase Edge Functions
