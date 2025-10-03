#!/bin/bash

# LushQuote - Quote Notification Email Setup Script
# This script helps you configure email notifications using Resend

set -e

echo "📧 LushQuote Quote Notification Setup"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Please install it first:"
    echo "  brew install supabase/tap/supabase"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI found"
echo ""

# Step 1: Get Resend API Key
echo -e "${BLUE}Step 1: Resend API Key${NC}"
echo "Get your API key from: https://resend.com/api-keys"
echo ""
read -p "Enter your Resend API Key (re_xxxxx): " RESEND_KEY

if [[ ! $RESEND_KEY =~ ^re_ ]]; then
    echo -e "${RED}❌ Invalid Resend API key format${NC}"
    echo "API key should start with 're_'"
    exit 1
fi

echo -e "${GREEN}✓${NC} Resend API key validated"
echo ""

# Step 2: From Email
echo -e "${BLUE}Step 2: From Email Address${NC}"
echo "For testing, you can use: onboarding@resend.dev"
echo "For production, use your verified domain: notifications@yourdomain.com"
echo ""
read -p "Enter 'from' email address: " FROM_EMAIL

if [[ ! $FROM_EMAIL =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${YELLOW}⚠️  Warning: Email format looks unusual${NC}"
fi

echo ""

# Step 3: App URL
echo -e "${BLUE}Step 3: Application URL${NC}"
read -p "Enter your app URL (e.g., https://lushquote.com): " APP_URL

echo ""
echo -e "${YELLOW}Setting Supabase secrets...${NC}"

# Set secrets
supabase secrets set RESEND_API_KEY="$RESEND_KEY"
supabase secrets set RESEND_FROM_EMAIL="LushQuote <$FROM_EMAIL>"
supabase secrets set APP_URL="$APP_URL"

echo -e "${GREEN}✓${NC} Secrets configured successfully"
echo ""

# Step 4: Get Supabase credentials
echo -e "${BLUE}Step 4: Supabase Project Configuration${NC}"
echo "Get these from your Supabase Dashboard > Settings > API"
echo ""
read -p "Enter your Supabase Project URL: " SUPABASE_URL
read -p "Enter your Service Role Key: " SERVICE_ROLE_KEY

echo ""
echo -e "${YELLOW}Configuring database settings...${NC}"
echo ""

# Create SQL file for database settings
cat > /tmp/supabase_notification_config.sql << EOF
-- Enable pg_net extension for async HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Configure Supabase settings
ALTER DATABASE postgres SET app.settings.supabase_url = '$SUPABASE_URL';
ALTER DATABASE postgres SET app.settings.service_role_key = '$SERVICE_ROLE_KEY';
EOF

echo "Generated SQL configuration. Please run the following in your Supabase SQL Editor:"
echo ""
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
cat /tmp/supabase_notification_config.sql
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo ""
echo "Or apply automatically (requires database connection):"
echo "  supabase db execute /tmp/supabase_notification_config.sql"
echo ""

read -p "Press Enter to continue to deployment..."

# Step 5: Deploy function
echo ""
echo -e "${BLUE}Step 5: Deploying Edge Function${NC}"
echo ""

supabase functions deploy send-quote-notification --no-verify-jwt

echo ""
echo -e "${GREEN}✓${NC} Edge function deployed successfully"
echo ""

# Step 6: Apply migration
echo -e "${BLUE}Step 6: Applying Database Migration${NC}"
echo ""

if [ -f "supabase/migrations/send_quote_notification_trigger.sql" ]; then
    echo "Found migration file. Applying..."
    supabase db push
    echo -e "${GREEN}✓${NC} Migration applied successfully"
else
    echo -e "${YELLOW}⚠️  Migration file not found${NC}"
    echo "Please manually run: supabase/migrations/send_quote_notification_trigger.sql"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. ${BLUE}Verify deployment:${NC}"
echo "   supabase functions list"
echo ""
echo "2. ${BLUE}Test the notification:${NC}"
echo "   - Enable email notifications for a user"
echo "   - Submit a test quote"
echo "   - Check your email!"
echo ""
echo "3. ${BLUE}Monitor logs:${NC}"
echo "   supabase functions logs send-quote-notification --tail"
echo ""
echo "4. ${BLUE}For production:${NC}"
echo "   - Verify your domain in Resend"
echo "   - Set up SPF, DKIM, and DMARC records"
echo "   - Update RESEND_FROM_EMAIL with your domain"
echo ""
echo "📚 Documentation: QUOTE_NOTIFICATION_SETUP.md"
echo "🚀 Quick Start: QUICK_START_NOTIFICATIONS.md"
echo ""

