# Base44 to Supabase Migration Guide

## ✅ Completed Migration Steps

### 1. Dependencies Updated

- Removed `@base44/sdk`
- Added `@supabase/supabase-js`

### 2. Client Configuration

- **File**: `src/api/supabaseClient.js` (renamed from base44Client.js)
- **Configuration**:
  - Project URL: `https://mekynypkkangghybwyxt.supabase.co`
  - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (configured)
  - Auth settings: autoRefresh, persistSession, detectSessionInUrl enabled

### 3. Database Schema Created

- **Tables**:
  - `user_profiles` - Extended user information
  - `quote_templates` - Quote template data with JSONB for services/branding
  - `quote_submissions` - Quote submissions with client info and data
- **Features**:
  - Row Level Security (RLS) enabled
  - Proper foreign key relationships
  - Indexes for performance
  - PostgreSQL function for incrementing counters

### 4. API Layer Migration

- **Entities** (`src/api/entities.js`):

  - `QuoteTemplate` - Full CRUD operations using Supabase queries
  - `QuoteSubmission` - Full CRUD operations using Supabase queries
  - `User` - Mapped to `supabase.auth`

- **Functions** (`src/api/functions.js`):

  - Stripe functions mapped to Supabase Edge Functions
  - Database operations using Supabase RPC calls
  - Public template data queries

- **Integrations** (`src/api/integrations.js`):
  - LLM, Email, File operations mapped to Edge Functions
  - Storage operations using Supabase Storage
  - Signed URL generation

## 🔧 Next Steps Required

### 1. Create Supabase Edge Functions

You need to deploy these Edge Functions to your Supabase project:

#### Required Edge Functions:

- `create-checkout-session` - Stripe checkout
- `create-billing-portal-session` - Stripe billing
- `stripe-webhook` - Handle Stripe webhooks
- `send-email` - Email notifications
- `invoke-llm` - AI integrations (optional)
- `generate-image` - Image generation (optional)
- `extract-file-data` - File processing (optional)

### 2. Set up Supabase Storage

Create storage buckets for file uploads:

- `quote-attachments` - For quote-related files
- `user-uploads` - For user profile images
- `generated-content` - For AI-generated content

### 3. Environment Variables (Recommended)

While credentials are hardcoded for now, consider using environment variables:

```env
VITE_SUPABASE_URL=https://mekynypkkangghybwyxt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Authentication Setup

The current setup uses Supabase Auth. Ensure your authentication flow works:

- Sign up/Sign in
- Session management
- User profiles

### 5. Test All Features

- Quote template creation/editing
- Quote submission workflow
- Stripe integration
- File uploads
- Email notifications

## 📋 Database Structure

### Quote Templates Table

```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- title (TEXT)
- description (TEXT)
- services (JSONB)
- branding (JSONB)
- is_public (BOOLEAN)
- submission_counter (INTEGER)
- created_at, updated_at (TIMESTAMP)
```

### Quote Submissions Table

```sql
- id (UUID, Primary Key)
- template_id (UUID, Foreign Key)
- client_email (TEXT)
- client_name (TEXT)
- quote_data (JSONB)
- total_amount (DECIMAL)
- status (TEXT: pending/accepted/rejected/expired)
- submitted_at, created_at, updated_at (TIMESTAMP)
```

## 🔒 Security Notes

1. **Row Level Security (RLS)** is enabled on all tables
2. **Policies** ensure users can only access their own data
3. **Public templates** can be viewed by anyone when `is_public = true`
4. **Quote submissions** can be created by anyone (for public forms)

## 🚀 Ready to Use

Your application should now work with Supabase! The API layer maintains the same interface, so your React components should continue working without changes.

Run your development server to test:

```bash
npm run dev
```
