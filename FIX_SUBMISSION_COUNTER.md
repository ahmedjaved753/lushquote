# Fix: Monthly Submission Counter Not Incrementing

## Problem
When someone submits a quote on a user's template, the template owner's `monthly_submission_count` was not incrementing.

## Root Cause
The `incrementSubmissionCounter` function in `QuoteForm.jsx` was being called with incorrect parameters:
- **Expected:** `template_id` (string/UUID)
- **Was passing:** Object with `{ owner_email, owner_subscription_tier }`

Additionally, the database RPC function `increment_submission_counter` did not exist.

## Solution

### 1. Fixed the function call in QuoteForm.jsx
Changed from:
```javascript
await incrementSubmissionCounter({
    owner_email: template.owner_email,
    owner_subscription_tier: template.owner_subscription_tier
});
```

To:
```javascript
const { error: incrementError } = await incrementSubmissionCounter(template.id);
```

### 2. Created database RPC function
Created `supabase/migrations/increment_submission_counter_rpc.sql` with:
- Takes `template_id` as parameter
- Finds the template owner
- Increments their `monthly_submission_count`
- Works for all users (not just free tier)
- Returns success/error status

### 3. Removed free-tier-only restriction
Now increments for ALL users (free and premium) because:
- It's useful tracking data for all users
- Database/app logic can still enforce limits based on tier
- Better analytics and reporting

## How to Apply

### Run the SQL migration in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the contents of `supabase/migrations/increment_submission_counter_rpc.sql`

**OR** use the Supabase CLI:
```bash
supabase migration new increment_submission_counter_rpc
# Copy the SQL content to the new migration file
supabase db push
```

## Testing

After applying the migration:

1. Create a test template
2. Submit a quote using the public form link
3. Check the template owner's `monthly_submission_count` in the database:
```sql
SELECT email, monthly_submission_count, subscription_tier
FROM user_profiles
WHERE email = 'owner@example.com';
```
4. The count should increment by 1 after each submission

## Files Changed

- ✅ `src/pages/QuoteForm.jsx` - Fixed function call
- ✅ `supabase/migrations/increment_submission_counter_rpc.sql` - New RPC function
- ✅ `src/api/functions.js` - No changes needed (already correct)
