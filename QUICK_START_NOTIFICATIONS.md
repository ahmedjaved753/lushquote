# Quick Start: Email Notifications

Get quote notification emails working in 5 minutes!

## Step 1: Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard

## Step 2: Set Supabase Secrets

```bash
# Required: Your Resend API key
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# For testing, use Resend's test domain
supabase secrets set RESEND_FROM_EMAIL="LushQuote <onboarding@resend.dev>"

# Your app URL (for dashboard links)
supabase secrets set APP_URL=https://lushquote.com
```

## Step 3: Enable pg_net

Run in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
```

## Step 4: Configure Database Settings

**⚠️ Replace with YOUR actual values:**

```sql
-- Get your Project URL from: Supabase Dashboard > Settings > API > Project URL
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://xxxxx.supabase.co';

-- Get your Service Role Key from: Supabase Dashboard > Settings > API > service_role (secret)
-- ⚠️ Keep this secret! Don't commit to git!
ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGc...your-key-here';
```

## Step 5: Deploy Function

```bash
supabase functions deploy send-quote-notification --no-verify-jwt
```

## Step 6: Apply Migration

```bash
supabase db push
```

Or run `supabase/migrations/send_quote_notification_trigger.sql` in SQL Editor.

## Step 7: Test It!

1. Go to your user profile settings:

```sql
UPDATE user_profiles
SET email_notifications_enabled = true,
    notification_email = 'your-email@example.com'
WHERE id = 'your-user-id';
```

2. Submit a test quote through your app

3. Check your email! 📧

## Troubleshooting

**No email received?**

Check the logs:

```bash
supabase functions logs send-quote-notification --tail
```

**Common issues:**

- Email notifications disabled in user profile
- Wrong Resend API key
- pg_net not enabled
- Database settings not configured

## For Production

1. Verify your domain in Resend
2. Update `RESEND_FROM_EMAIL`:
   ```bash
   supabase secrets set RESEND_FROM_EMAIL="Your Business <notifications@yourdomain.com>"
   ```
3. Set up DNS records (SPF, DKIM, DMARC)

See `QUOTE_NOTIFICATION_SETUP.md` for complete documentation.
