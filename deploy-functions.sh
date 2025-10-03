#!/bin/bash

# Deploy all Supabase Edge Functions
# Run this script after setting up your environment secrets

set -e  # Exit on any error

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Deploy functions
echo "📦 Deploying create-checkout-session..."
supabase functions deploy create-checkout-session --no-verify-jwt

echo ""
echo "📦 Deploying create-billing-portal-session..."
supabase functions deploy create-billing-portal-session --no-verify-jwt

echo ""
echo "📦 Deploying stripe-webhook..."
supabase functions deploy stripe-webhook --no-verify-jwt

echo ""
echo "📦 Deploying send-quote-notification..."
supabase functions deploy send-quote-notification --no-verify-jwt

echo ""
echo "✅ All functions deployed successfully!"
echo ""
echo "📋 Verifying deployment..."
supabase functions list

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify your Stripe webhook endpoint is configured"
echo "2. Test the checkout flow on your app"
echo "3. Monitor function logs: supabase functions logs <function-name>"

