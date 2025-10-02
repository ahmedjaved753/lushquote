# 🚨 REVERT RLS HACK - Quote Submissions

## CRITICAL: RLS Temporarily Disabled

**Row Level Security has been DISABLED on `quote_submissions` table for testing.**

### ⚠️ What Was Disabled

- **Table:** `quote_submissions`
- **Security:** Row Level Security (RLS) completely disabled
- **Risk:** All users can now access all quote submissions
- **Status:** DISABLED for testing only

### 🔄 How to RE-ENABLE (REQUIRED before production)

Run this SQL command in Supabase SQL Editor:

```sql
-- Re-enable RLS on quote_submissions table
ALTER TABLE quote_submissions ENABLE ROW LEVEL SECURITY;
```

### ✅ Verify It's Re-enabled

Run this to confirm:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'quote_submissions' AND schemaname = 'public';
```

**Result should show:** `rowsecurity = true`

### 🧪 Test After Re-enabling

1. Try submitting a quote form as anonymous user
2. Should still work (policy "Allow public quote submissions" should handle it)
3. Try accessing submissions as unauthorized user - should be blocked

### ⚡ Complete Hack Revert Checklist

**Frontend Hacks:**

- [ ] Set `BYPASS_TEMPLATE_LIMITS = false` in 3 files

**Database Hacks:**

- [ ] Run: `ALTER TABLE quote_templates ENABLE TRIGGER enforce_template_limits;`
- [ ] Run: `ALTER TABLE quote_submissions ENABLE ROW LEVEL SECURITY;`

### 🚨 NEVER DEPLOY WITHOUT REVERTING

All hacks (frontend + database) MUST be reverted before production deployment!

