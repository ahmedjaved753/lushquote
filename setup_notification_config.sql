-- LushQuote Email Notification Configuration
-- Run this in your Supabase SQL Editor

-- Step 1: Enable pg_net extension for async HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Step 2: Configure Supabase settings
-- Replace YOUR_SERVICE_ROLE_KEY with your actual Service Role Key from:
-- Supabase Dashboard > Settings > API > service_role (secret)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://mekynypkkangghybwyxt.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';

-- Verify the settings
SELECT name, setting FROM pg_settings WHERE name LIKE 'app.settings%';

