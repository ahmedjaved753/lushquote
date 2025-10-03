# Quote Notification Email Setup Guide

This guide will help you set up automatic email notifications to template owners when someone submits a quote on their template using Resend.

## Overview

When a customer submits a quote, the template owner will automatically receive a beautiful HTML email containing:

- Customer contact information (name, email, phone)
- Requested date/time (if provided)
- Customer notes
- Estimated total price
- Direct link to view the quote in their dashboard

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Verified Domain**: Verify your domain in Resend (or use their test domain for development)
3. **Supabase CLI**: Installed and authenticated
4. **pg_net Extension**: Enabled in your Supabase project (for async HTTP calls)

## Setup Steps

### 1. Get Your Resend API Key

1. Log in to [resend.com](https://resend.com)
2. Navigate to **API Keys** in the dashboard
3. Click **Create API Key**
4. Copy the API key (starts with `re_`)

### 2. Configure Supabase Secrets

Set the following environment variables in your Supabase project:

```bash
# Set Resend API Key
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Set the "from" email address (must be from your verified domain)
supabase secrets set RESEND_FROM_EMAIL="LushQuote <notifications@yourdomain.com>"

# Set your app URL (for dashboard links in emails)
supabase secrets set APP_URL=https://yourdomain.com
```

**For Development:**

```bash
# Use Resend's test domain for development
supabase secrets set RESEND_FROM_EMAIL="LushQuote <onboarding@resend.dev>"
```

### 3. Enable pg_net Extension

The trigger uses `pg_net` for asynchronous HTTP calls to prevent blocking the quote submission.

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to necessary roles
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
```

### 4. Configure Supabase Settings

Add these settings to your Supabase project (run in SQL Editor):

```sql
-- Set Supabase URL (replace with your project URL)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project-ref.supabase.co';

-- Set Service Role Key (get this from your Supabase dashboard Settings > API)
-- IMPORTANT: Keep this secret! Don't commit it to version control
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
```

**To get your Service Role Key:**

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy the `service_role` key (starts with `eyJ`)
4. **⚠️ WARNING**: This key has full access to your database. Never expose it publicly!

### 5. Deploy the Edge Function

Deploy the quote notification function:

```bash
# Deploy all functions (including the new send-quote-notification)
./deploy-functions.sh

# Or deploy just the notification function
supabase functions deploy send-quote-notification --no-verify-jwt
```

### 6. Apply the Database Migration

Run the migration to create the trigger:

```bash
# Apply the migration
supabase db push

# Or manually run the SQL file in Supabase SQL Editor
```

Alternatively, copy the contents of `supabase/migrations/send_quote_notification_trigger.sql` and run it in the Supabase SQL Editor.

## Testing

### Test the Edge Function Directly

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/send-quote-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "ownerEmail": "owner@example.com",
    "ownerName": "John Doe",
    "templateName": "Wedding Photography",
    "businessName": "John'\''s Photography",
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "customerPhone": "+1-555-123-4567",
    "customerNotes": "Looking for weekend availability",
    "requestedDate": "2024-06-15",
    "requestedTime": "14:00:00",
    "estimatedTotal": 1500.00,
    "submittedAt": "2024-01-15T10:30:00Z",
    "submissionId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Test the Full Flow

1. **Enable notifications** for a user:

   ```sql
   UPDATE user_profiles
   SET email_notifications_enabled = true,
       notification_email = 'your-test-email@example.com'
   WHERE id = 'your-user-id';
   ```

2. **Submit a test quote** through your app or API

3. **Check the logs**:

   ```bash
   supabase functions logs send-quote-notification
   ```

4. **Verify the email** was received in your inbox

## Email Notifications Toggle

Users can enable/disable email notifications in their settings. The trigger automatically checks this preference:

```sql
-- In the trigger function, we check:
IF template_record.email_notifications_enabled IS FALSE THEN
  RAISE NOTICE 'Email notifications disabled for user: %', template_record.user_id;
  RETURN NEW;
END IF;
```

## Customization

### Customize Email Template

Edit `supabase/functions/send-quote-notification/index.ts` to customize:

- Email subject line
- HTML layout and styling
- Information included in the email
- Button links and CTAs

### Customize "From" Name

Change the `RESEND_FROM_EMAIL` secret:

```bash
supabase secrets set RESEND_FROM_EMAIL="Your Business <notifications@yourdomain.com>"
```

## Troubleshooting

### Email Not Sending

1. **Check function logs**:

   ```bash
   supabase functions logs send-quote-notification --tail
   ```

2. **Verify secrets are set**:

   ```bash
   supabase secrets list
   ```

3. **Check trigger fired**:

   ```sql
   -- Check PostgreSQL logs
   SELECT * FROM pg_stat_statements
   WHERE query LIKE '%send_quote_notification%';
   ```

4. **Verify pg_net extension**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

### Emails Going to Spam

1. **Verify your domain in Resend**
2. **Set up SPF, DKIM, and DMARC records**
3. **Use a professional "from" address** from your verified domain
4. **Avoid spam trigger words** in subject/content

### Missing Template Owner Email

The system uses this priority for owner email:

1. `notification_email` from `user_profiles` (if set)
2. `email` from `auth.users` (fallback)

Ensure users have valid email addresses.

## Production Checklist

- [ ] Verified domain in Resend
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] `RESEND_API_KEY` set in Supabase secrets
- [ ] `RESEND_FROM_EMAIL` using verified domain
- [ ] `APP_URL` points to production domain
- [ ] `pg_net` extension enabled
- [ ] Supabase URL and Service Role Key configured
- [ ] Edge function deployed
- [ ] Database migration applied
- [ ] Tested with real quote submission
- [ ] Email delivery confirmed
- [ ] Spam folder checked
- [ ] Notification settings available in user settings

## Security Considerations

1. **Service Role Key**: Only stored in database settings, never in code
2. **Environment Variables**: All secrets managed via Supabase secrets
3. **Trigger Permissions**: Function runs with SECURITY DEFINER to access user data
4. **Error Handling**: Errors don't prevent quote submission (fail gracefully)
5. **Email Validation**: Resend validates email addresses
6. **Rate Limiting**: Consider implementing rate limits for high-volume scenarios

## Cost Considerations

- **Resend Free Tier**: 100 emails/day, 3,000 emails/month
- **Resend Paid Plans**: Start at $20/month for 50,000 emails
- **Supabase**: Edge function invocations included in free tier (500K/month)

## Support

- **Resend Docs**: https://resend.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **pg_net Extension**: https://supabase.com/docs/guides/database/extensions/pg_net

## Next Steps

After setup is complete:

1. **User Settings Page**: Add toggle for email notifications
2. **Email Preferences**: Let users customize notification preferences
3. **Additional Notifications**: Consider adding notifications for:
   - Quote status changes (viewed, contacted, accepted)
   - Weekly/daily quote summaries
   - Payment reminders
4. **Analytics**: Track email open rates using Resend's webhook events
