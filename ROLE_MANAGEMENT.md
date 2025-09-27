# User Role Management Guide for LushQuote

## Overview

The LushQuote authentication system supports two user roles:

- **user**: Default role for all new users
- **admin**: Administrative role with elevated permissions

Roles are managed through Supabase's built-in user metadata system, not through the signup form, as per requirements.

## Setting User Roles

### Method 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication** → **Users**
3. Click on a user to edit their profile
4. In the **User Metadata** section, add:
   ```json
   {
     "role": "admin"
   }
   ```
5. Click **Save**

### Method 2: SQL Command

```sql
-- Make a user an admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'user@example.com';

-- Remove admin role (set back to user)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "user"}'::jsonb
WHERE email = 'user@example.com';
```

### Method 3: Supabase CLI

```bash
# Using Supabase CLI with SQL
supabase db reset
supabase db push

# Then run SQL commands through the CLI
echo "UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{\"role\": \"admin\"}'::jsonb WHERE email = 'your-admin@example.com';" | supabase db sql
```

## Role Checking in the Application

The authentication system automatically checks user roles through:

### Frontend Role Access

```javascript
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { userRole, user } = useAuth();

  // Check if user is admin
  if (userRole === "admin") {
    // Show admin features
  }

  // Role is also available in user metadata
  const role = user?.user_metadata?.role || "user";
}
```

### Database Level Role Functions

The system includes helper functions:

```sql
-- Check if specific user is admin
SELECT public.is_admin('user-uuid-here');

-- Get current authenticated user's role
SELECT public.get_user_role();
```

### Protected Routes with Role Requirements

```javascript
// Require admin role for a route
<Route
  path="/admin"
  element={
    <ProtectedRoute requireRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

## Database Schema

### User Metadata Structure

```json
{
  "role": "admin|user",
  "full_name": "John Doe",
  "preferred_name": "John",
  "subscription_tier": "free|premium"
}
```

### User Profile View

A convenience view `public.user_profiles` provides easy access to user information:

```sql
SELECT * FROM public.user_profiles WHERE role = 'admin';
```

## Security Considerations

1. **Row Level Security**: Enabled on the users table
2. **Role Assignment**: Only done by admins via Supabase Dashboard, never through the signup form
3. **Default Role**: All new users default to 'user' role
4. **Metadata Access**: User metadata is available in the JWT token for frontend role checking

## Admin Features

Admin users get additional features:

1. Access to admin-only routes
2. Enhanced user management capabilities
3. Special indicators in the UI (blue "Admin" badge)
4. Elevated permissions for system operations

## Role Migration

When upgrading existing users:

1. All existing users without a role default to 'user'
2. Admin roles must be assigned manually
3. Role changes take effect on next login/token refresh

## Troubleshooting

### Role Not Updating

- Ensure user metadata is saved correctly in Supabase Dashboard
- Force a logout/login cycle to refresh the JWT token
- Check browser console for authentication errors

### Role Persisting After Change

- Clear browser localStorage/sessionStorage
- Check if user has multiple sessions active
- Verify the metadata JSON structure is correct

### Database Permissions

- Ensure RLS policies allow role checking
- Verify helper functions have proper permissions
- Check that authenticated users can access role functions
