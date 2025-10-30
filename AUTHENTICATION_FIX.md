# Authentication System Fix

## Overview

This document explains the authentication issues that were occurring and how they've been fixed.

## Problem Description

The application was experiencing authentication failures with the following error:

```
POST https://rolrhhfiakmsmxknutac.supabase.co/rest/v1/rpc/get_user_info 404 (Not Found)
Error: Could not find the function public.get_user_info(p_user_id) in the schema cache
Hint: Perhaps you meant to call the function public.get_user_info(user_uuid)
```

### Root Cause

Multiple database migrations created conflicting versions of the `get_user_info` function with different parameter names and return structures:

1. **Migration 20251007121556**: Created `get_user_info(user_id uuid)`
2. **Migration 20251009184721**: Updated to `get_user_info(p_user_id uuid)`
3. **Migration 20251028220533**: Completely changed to `get_user_info(user_uuid uuid)` with different return structure

The frontend `AuthContext.tsx` was calling the function with `p_user_id` parameter, but the latest migration had changed it to `user_uuid`, causing a mismatch.

## Solution Implemented

### 1. Database Migration Fix

**File**: `supabase/migrations/20251030185817_fix_get_user_info_final.sql`

This migration:
- Drops ALL previous versions of `get_user_info` regardless of signature
- Creates a single, definitive version that matches the frontend expectations
- Uses parameter name `p_user_id` (matching the AuthContext call)
- Returns the structure expected by the frontend: `user_email`, `user_status`, `role_name`, `is_admin`
- Sets `SECURITY DEFINER` to bypass RLS when fetching user info
- Adds explicit `search_path` for security
- Handles cases where users have no role assigned (defaults to 'Pending')

### 2. Enhanced AuthContext

**File**: `src/contexts/AuthContext.tsx`

Improvements include:

#### Better Error Handling
- Added detailed error logging with error codes, messages, and hints
- Special handling for PGRST202 error (function not found)
- Clear error messages to help diagnose migration issues

#### Exponential Backoff Retry Logic
- Changed from fixed 1-second delays to exponential backoff
- Increased retry attempts from 3 to 4
- Maximum delay capped at 5 seconds to prevent excessive waiting

#### Session Validation
- New `validateSession()` function checks session validity
- Automatically refreshes sessions expiring within 5 minutes
- Prevents using expired or invalid sessions

#### Profile Caching
- Stores user profiles in localStorage as backup
- Falls back to cached profile if API fetch fails
- Clears cache on sign out

#### Manual Session Refresh
- New `refreshSession()` method exposed in AuthContext
- Allows manual session refresh when issues are detected
- Useful for recovery from auth state inconsistencies

## How to Apply the Fix

### Step 1: Apply the Database Migration

You need to run the SQL migration against your Supabase database. There are two ways to do this:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com/project/rolrhhfiakmsmxknutac
2. Navigate to the SQL Editor
3. Open the migration file: `supabase/migrations/20251030185817_fix_get_user_info_final.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click "Run" to execute the migration

#### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run migrations
supabase db push
```

### Step 2: Verify the Migration

After applying the migration, test it:

1. Open the SQL Editor in Supabase Dashboard
2. Run this test query (replace `YOUR_USER_ID` with an actual user UUID):

```sql
SELECT * FROM get_user_info('YOUR_USER_ID');
```

You should see a result with these columns:
- `user_email`: The user's email address
- `user_status`: Either 'active', 'pending', or 'suspended'
- `role_name`: The user's role name (e.g., 'Admin', 'Member', 'Pending')
- `is_admin`: Boolean indicating admin status

### Step 3: Deploy the Frontend Changes

The AuthContext improvements are already in the code. Simply deploy your application:

```bash
# Build the application
npm run build

# Deploy to your hosting platform
# (e.g., Netlify, Vercel, etc.)
```

### Step 4: Test the Authentication Flow

1. Clear your browser's localStorage: `localStorage.clear()`
2. Refresh the page
3. Sign in with your credentials
4. Check the browser console for authentication logs
5. Verify that the profile loads correctly

You should see console messages like:
```
[AuthContext] Successfully fetched profile: {email: "...", status: "active", ...}
[AuthContext] Profile cached to localStorage
```

## New Features

### Profile Caching

User profiles are now cached in localStorage. This provides:
- Faster initial load on subsequent visits
- Fallback when API calls fail temporarily
- Better offline experience

### Session Management

The session validation ensures:
- Automatic refresh before expiration
- Detection of invalid sessions
- Graceful handling of session issues

### Enhanced Debugging

Console logs now include:
- Detailed error information
- Retry attempt tracking
- Session expiry times
- Cache hit/miss information

### Manual Recovery

If you experience auth issues:
1. Open browser console
2. Run: `useAuth().refreshSession()`
3. This will manually refresh your session and profile

## Testing Checklist

- [ ] Migration applied to Supabase database
- [ ] Test query returns expected user info
- [ ] Frontend builds without errors
- [ ] Sign in works correctly
- [ ] User profile loads after sign in
- [ ] Page refresh maintains auth state
- [ ] Sign out clears session properly
- [ ] Console shows detailed auth logs
- [ ] Profile cached to localStorage
- [ ] Session validates and refreshes automatically

## Troubleshooting

### Still Getting 404 Errors

1. Verify the migration was applied:
   ```sql
   SELECT routine_name, specific_name
   FROM information_schema.routines
   WHERE routine_name = 'get_user_info';
   ```

2. Check the parameter name:
   ```sql
   SELECT parameters
   FROM information_schema.routines
   WHERE routine_name = 'get_user_info';
   ```

3. Ensure it says `p_user_id uuid` not `user_uuid uuid`

### Profile Not Loading

1. Check browser console for errors
2. Look for detailed error logging from AuthContext
3. Verify your user exists in `public.public_users` table
4. Check RLS policies allow reading from `public_users`, `user_roles`, and `roles` tables

### Session Expires Immediately

1. Check if session validation is too aggressive
2. Verify Supabase project settings for session timeout
3. Look for JWT expiration issues

## Additional Notes

### Security Considerations

- The `get_user_info` function uses `SECURITY DEFINER` which allows it to bypass RLS
- This is necessary to fetch user role information during authentication
- The function only returns info for the specified user, not all users
- Always validate the `user_id` parameter matches `auth.uid()` in your application logic

### Performance

- Profile caching reduces API calls
- Session validation prevents unnecessary refreshes
- Exponential backoff prevents API hammering during failures

### Future Improvements

Consider implementing:
1. Supabase Edge Function for server-side auth validation
2. JWT token validation middleware
3. Rate limiting for auth endpoints
4. Multi-role support (currently single role per user)
5. Role permission caching

## Support

If you continue to experience issues:
1. Check the detailed console logs
2. Verify all migrations have been applied
3. Ensure RLS policies are correctly configured
4. Test the `get_user_info` function directly in SQL Editor
5. Clear browser cache and localStorage completely

## Version History

- **v1.0** (2025-10-30): Initial fix for get_user_info function conflicts
  - Created definitive migration
  - Enhanced AuthContext with better error handling
  - Added session validation and profile caching
  - Implemented exponential backoff retry logic
