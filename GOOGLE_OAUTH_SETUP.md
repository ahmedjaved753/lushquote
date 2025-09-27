# Google OAuth Setup Guide for LushQuote

## 1. Google Cloud Console Setup

### Step 1: Create a Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (required for OAuth)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**

### Step 2: Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: "LushQuote"
   - User support email: Your email
   - Developer contact information: Your email

### Step 3: Create OAuth 2.0 Client ID

1. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Name: "LushQuote Web Client"
4. Authorized redirect URIs:
   - Production: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Local development: `http://localhost:54321/auth/v1/callback`

## 2. Supabase Configuration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click the toggle to enable it
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Click **Save**

### Option B: Via Management API

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="mekynypkkangghybwyxt"

# Configure Google auth provider
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_google_enabled": true,
    "external_google_client_id": "your-google-client-id",
    "external_google_secret": "your-google-client-secret"
  }'
```

## 3. Update Site URL (Important!)

In your Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain (e.g., `https://yourdomain.com`)
3. Add redirect URLs:
   - Production: `https://yourdomain.com/auth/callback`
   - Local: `http://localhost:5173/auth/callback`

## 4. Test the Integration

1. Start your development server: `npm run dev`
2. Go to the login page
3. Click "Continue with Google"
4. Complete the OAuth flow
5. Verify you're redirected back and logged in

## 5. Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch"**: Ensure the callback URL in Google Cloud Console matches your Supabase project
2. **"Invalid client"**: Double-check your Client ID and Secret
3. **Email not retrieved**: Add the email scope explicitly if needed:

```javascript
await signInWithGoogle({
  options: {
    scopes: "https://www.googleapis.com/auth/userinfo.email",
  },
});
```

## 6. Production Considerations

1. Update authorized redirect URIs in Google Cloud Console for your production domain
2. Set the correct Site URL in Supabase Dashboard
3. Consider rate limiting and abuse prevention
4. Monitor authentication logs in both Google Cloud Console and Supabase Dashboard

## Next Steps

Once Google OAuth is configured, users can:

- Sign up with Google
- Sign in with Google
- Link Google account to existing email/password account

The authentication system automatically handles:

- Session management
- Token refresh
- User profile data from Google
- Role assignment (admin roles managed via Supabase Dashboard)
