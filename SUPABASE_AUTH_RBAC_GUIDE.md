# Supabase Authentication with Role-Based Access Control (RBAC)

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Common Pitfalls: The RLS Infinite Recursion Problem](#common-pitfalls-the-rls-infinite-recursion-problem)
4. [Row Level Security Implementation](#row-level-security-implementation)
5. [Edge Functions for Admin Operations](#edge-functions-for-admin-operations)
6. [Frontend Authentication Context](#frontend-authentication-context)
7. [Application Flow and Route Protection](#application-flow-and-route-protection)
8. [Best Practices and Recommendations](#best-practices-and-recommendations)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

This guide documents a production-ready authentication system built on Supabase Auth with custom role-based access control (RBAC). The system implements a three-tier permission model with automatic role assignment and admin approval workflows.

### Key Features

- **Email/Password Authentication**: Uses Supabase's built-in auth system
- **Three User Roles**: ADMIN, USER, and PENDING
- **Automatic Role Assignment**: First user becomes ADMIN, subsequent users start as PENDING
- **Admin Approval Workflow**: Admins can approve/modify user roles through a settings interface
- **Secure RLS Policies**: Row Level Security protects all data based on user roles
- **Edge Function Admin Operations**: Admin user management uses service role for operations that would cause RLS recursion

### Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| `ADMIN` | System administrator | Full access to all features, can manage users and roles |
| `USER` | Approved standard user | Full access to business features, cannot manage users |
| `PENDING` | New user awaiting approval | No access to system, sees pending approval screen |

### Architecture Principles

1. **Separation of Concerns**: Auth state (Supabase Auth) is separate from role/permission data (user_roles table)
2. **Defense in Depth**: RLS policies protect data at the database level, frontend checks provide UX
3. **Service Role for Admin Ops**: Admin operations use Edge Functions with service role to avoid RLS recursion
4. **Simple, Non-Recursive Policies**: Users can read their own role, everything else uses helper functions

---

## Database Schema

### Core Tables

#### 1. user_roles Table

Stores the role for each user, linked to Supabase's `auth.users` table.

```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'USER', 'PENDING')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Key Points:**
- `user_id` has a UNIQUE constraint - one role per user
- `ON DELETE CASCADE` ensures orphaned roles are cleaned up
- Role is constrained to only valid values

#### 2. user_invitations Table

Tracks user invitations sent by admins (for future use).

```sql
CREATE TABLE user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);
```

### Automatic Role Assignment

A database trigger automatically assigns roles when new users sign up.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count integer;
  assigned_role text;
BEGIN
  -- Count existing user roles
  SELECT COUNT(*) INTO user_count FROM public.user_roles;

  -- First user gets ADMIN, everyone else gets PENDING
  IF user_count = 0 THEN
    assigned_role := 'ADMIN';
  ELSE
    assigned_role := 'PENDING';
  END IF;

  -- Insert the role for the new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**How It Works:**
1. Trigger fires after a user is inserted into `auth.users`
2. Function counts existing roles in `user_roles`
3. If count is 0, assigns ADMIN (first user)
4. Otherwise, assigns PENDING (needs approval)
5. Function uses `SECURITY DEFINER` to bypass RLS during role creation

**Why This Works:**
- The trigger runs with elevated privileges, so it can insert into `user_roles` even though RLS is enabled
- The count check is simple and race-condition safe
- New users immediately have a role, no manual intervention needed

---

## Common Pitfalls: The RLS Infinite Recursion Problem

### The Problem

One of the most challenging issues encountered was **RLS infinite recursion** when trying to implement admin-only policies on the `user_roles` table.

#### What Was Attempted (And Failed)

The initial approach tried to create policies that would allow admins to read all roles and update other users' roles:

```sql
-- ❌ THIS CAUSES INFINITE RECURSION - DO NOT USE
CREATE POLICY "Admins can read all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ❌ THIS ALSO CAUSES INFINITE RECURSION - DO NOT USE
CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
    AND user_id != auth.uid()
  );
```

#### Why This Fails

These policies create an **infinite recursion** because:

1. User tries to query `user_roles` table
2. RLS policy needs to check if user is an admin
3. To check if user is admin, it queries `user_roles` table
4. That query triggers RLS, which needs to check if user is an admin
5. Go to step 3, repeat infinitely

**Error Symptoms:**
- Queries hang or timeout
- PostgreSQL max recursion depth errors
- Frontend receives 500 errors or no response
- Database CPU spikes

### The Solution

The solution involved a multi-part approach:

#### 1. Keep Only Simple, Non-Recursive Policies

```sql
-- ✅ This works - no recursion
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

This policy works because it doesn't query `user_roles` - it just compares the current user ID.

#### 2. Create Service Role Policy

```sql
-- ✅ Service role can do everything
CREATE POLICY "Service role can manage all roles"
  ON user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

The service role bypasses user-level RLS and can perform any operation.

#### 3. Use Edge Functions for Admin Operations

Instead of trying to make RLS policies that check admin status, admin operations are performed through Edge Functions that:
- Verify the user is authenticated
- Check the user's role using a direct query
- Use the service role connection to perform operations

This is covered in detail in the [Edge Functions section](#edge-functions-for-admin-operations).

### Key Takeaway

**Never query the same table you're defining a policy for within the policy's USING or WITH CHECK clauses.** This causes recursion. Instead:
- Use Edge Functions with service role for complex authorization
- Keep RLS policies simple and non-recursive
- Use helper functions for checks on OTHER tables (but never self-referencing)

---

## Row Level Security Implementation

### Helper Function for Role Checks

A helper function allows business tables to check if a user is approved without causing recursion.

```sql
CREATE OR REPLACE FUNCTION public.is_admin_or_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'USER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why This Works:**
- When called from policies on OTHER tables (not `user_roles`), there's no recursion
- Uses `SECURITY DEFINER` to run with elevated privileges
- Simple boolean return makes it easy to use in policies

### RLS Policies on Business Tables

Once you have the helper function, you can protect business tables easily.

#### Read-Only Mercury Data

External data synced from Mercury API is read-only for approved users:

```sql
CREATE POLICY "Approved users can read mercury_accounts"
  ON mercury_accounts FOR SELECT
  TO authenticated
  USING (public.is_admin_or_user());

CREATE POLICY "Approved users can insert mercury_accounts"
  ON mercury_accounts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_user());

CREATE POLICY "Approved users can update mercury_accounts"
  ON mercury_accounts FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_user())
  WITH CHECK (public.is_admin_or_user());
```

Note: INSERT and UPDATE are needed for the sync process to write data.

#### Full Access Business Tables

Internal business tables allow full CRUD for approved users:

```sql
CREATE POLICY "Approved users can manage vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (public.is_admin_or_user())
  WITH CHECK (public.is_admin_or_user());

CREATE POLICY "Approved users can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (public.is_admin_or_user())
  WITH CHECK (public.is_admin_or_user());

CREATE POLICY "Approved users can manage transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (public.is_admin_or_user())
  WITH CHECK (public.is_admin_or_user());
```

**Best Practice:** Use `FOR ALL` to avoid creating separate policies for SELECT, INSERT, UPDATE, DELETE when they all have the same conditions.

### RLS on user_roles Table

The `user_roles` table has minimal policies to avoid recursion:

```sql
-- Users can see their own role
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can do anything (used by Edge Functions)
CREATE POLICY "Service role can manage all roles"
  ON user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

**What's Missing:** There are NO policies allowing users to read other users' roles or update roles. These operations are handled by Edge Functions.

---

## Edge Functions for Admin Operations

### Why Edge Functions?

As explained in the recursion section, you cannot create RLS policies on `user_roles` that check "is this user an admin" without causing infinite recursion. The solution is to move admin operations to Edge Functions that:

1. Use the service role (bypasses RLS)
2. Manually verify the requesting user is an admin
3. Perform the operation with full privileges

### Architecture

```
Frontend (Admin UI)
    ↓ (authenticated request with user JWT)
Edge Function
    ↓ (validates JWT)
    ↓ (checks user role)
    ↓ (uses service role client)
Supabase Database (bypasses RLS)
```

### Implementation

#### Edge Function: admin-users

This function handles listing users and updating roles.

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Create service role client (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    // Parse action from URL
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // List all users with their roles
    if (action === 'list') {
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('user_id, role, created_at');

      const { data: { users: authUsers } } = await supabaseClient.auth.admin.listUsers();

      const usersWithRoles = authUsers.map(u => {
        const role = roles?.find(r => r.user_id === u.id);
        return {
          id: u.id,
          email: u.email || '',
          role: role?.role || 'PENDING',
          created_at: role?.created_at || u.created_at,
        };
      });

      return new Response(
        JSON.stringify({ users: usersWithRoles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update a user's role
    if (action === 'update') {
      const { userId, newRole } = await req.json();

      // Prevent admins from changing their own role
      if (userId === user.id) {
        throw new Error('Cannot modify your own role');
      }

      const { error: updateError } = await supabaseClient
        .from('user_roles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' || error.message === 'Admin access required' ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### Key Security Features

1. **JWT Validation**: Verifies the user is authenticated via their session token
2. **Role Check**: Manually queries `user_roles` to confirm admin status
3. **Service Role**: Uses service role key to bypass RLS and perform operations
4. **Self-Protection**: Admins cannot change their own role
5. **CORS Headers**: Properly configured for browser requests

### Calling from Frontend

```typescript
const { data: session } = await supabase.auth.getSession();

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`,
  {
    headers: {
      'Authorization': `Bearer ${session.session.access_token}`,
      'Content-Type': 'application/json',
    },
  }
);

const data = await response.json();
```

The frontend sends the user's access token, which the Edge Function validates.

---

## Frontend Authentication Context

### AuthContext Structure

The frontend uses React Context to provide auth state throughout the application.

```typescript
interface AuthContextType {
  user: User | null;              // Supabase user object
  role: UserRole | null;          // User's role from user_roles table
  loading: boolean;               // Initial auth state loading
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;  // Reload role from database
  isAdmin: boolean;               // Convenience: role === 'ADMIN'
  isApproved: boolean;            // Convenience: role === 'ADMIN' || role === 'USER'
}
```

### Implementation

```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserRole(session.user.id);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      const userRole = data?.role as UserRole || null;
      setRole(userRole);
    } catch (error) {
      console.error('Error loading user role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function refreshRole() {
    if (user?.id) {
      await loadUserRole(user.id);
    }
  }

  const isAdmin = role === 'ADMIN';
  const isApproved = role === 'ADMIN' || role === 'USER';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        refreshRole,
        isAdmin,
        isApproved,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### Key Features

1. **Dual State Management**: Tracks both Supabase user and custom role
2. **Auto-Loading**: Loads role immediately after authentication
3. **Session Listener**: Updates auth state when user logs in/out
4. **Error Handling**: Gracefully handles role loading failures
5. **Convenience Flags**: `isAdmin` and `isApproved` for easy checks

### Important: Using maybeSingle()

```typescript
.maybeSingle()  // ✅ Returns null if no rows, doesn't throw
.single()       // ❌ Throws error if no rows
```

Always use `maybeSingle()` when expecting zero or one row. This prevents errors if the role hasn't been created yet.

---

## Application Flow and Route Protection

### Conditional Rendering Pattern

The main App component uses the auth context to conditionally render different views:

```typescript
function AppContent() {
  const { user, loading, isApproved } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  // Show login/signup if not authenticated
  if (!user) {
    if (authView === 'login') {
      return <Login onSwitchToSignup={() => setAuthView('signup')} />;
    }
    return <Signup onSwitchToLogin={() => setAuthView('login')} />;
  }

  // Show pending approval screen if not approved
  if (!isApproved) {
    return <PendingApproval />;
  }

  // Show main application for approved users
  return (
    <Layout currentPage={currentPage} onNavigate={(page) => navigate(page)}>
      {renderPage()}
    </Layout>
  );
}
```

### Four Application States

1. **Loading**: Checking authentication and loading role
   - Shows loading spinner
   - Prevents flash of wrong content

2. **Unauthenticated**: No user logged in
   - Shows login or signup form
   - Users can switch between forms

3. **Pending Approval**: User logged in but role is PENDING
   - Shows pending approval message
   - Provides "Check Status" button to refresh role
   - Allows sign out

4. **Approved**: User has ADMIN or USER role
   - Shows full application
   - Can access all approved features

### Pending Approval Screen

The pending approval screen provides a good user experience for new users:

```typescript
export function PendingApproval() {
  const { signOut, user, refreshRole } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshRole();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-xl">
        <h1>Pending Approval</h1>

        <p>
          Your account has been created but requires administrator approval
          before you can access the system.
        </p>

        <p>Account Email: {user?.email}</p>

        <button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Checking...' : 'Check Approval Status'}
        </button>

        <button onClick={signOut}>Sign Out</button>
      </div>
    </div>
  );
}
```

**User Experience:**
- Clear message explaining why they can't access the system
- Shows their email for confirmation
- Allows checking if they've been approved
- Easy sign out if they used wrong account

### Admin-Only Features

For features that should only be accessible to admins, check the `isAdmin` flag:

```typescript
export function Settings() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div>
        <p>Only administrators can access settings.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Admin settings UI */}
      <UserManagement />
      <SystemConfiguration />
    </div>
  );
}
```

**Best Practice:** Always check authorization on both frontend and backend. Frontend checks provide UX, backend (RLS + Edge Functions) provide security.

---

## Best Practices and Recommendations

### 1. When to Use RLS vs Edge Functions

**Use RLS Policies When:**
- Checking ownership (e.g., user can only see their own data)
- Simple role checks on OTHER tables (using helper functions)
- The policy doesn't need to query the same table it's protecting
- The check is straightforward and non-recursive

**Use Edge Functions When:**
- Performing admin operations on the user_roles table
- Complex authorization logic that would cause recursion
- Need to use service role to bypass RLS
- Combining data from auth.users and custom tables
- Need to perform operations that regular users shouldn't do via RLS

### 2. Security Considerations

**Always:**
- Enable RLS on every table
- Use `SECURITY DEFINER` carefully and only when necessary
- Validate user tokens in Edge Functions
- Check authorization before performing operations
- Use service role only in Edge Functions, never expose it to frontend
- Prevent admins from changing their own role
- Log admin actions for audit trails

**Never:**
- Create RLS policies that query the same table they're protecting
- Expose the service role key to the frontend
- Trust frontend checks for security (always verify on backend)
- Allow users to set their own roles
- Use `USING (true)` or `WITH CHECK (true)` for regular users

### 3. Extending the System

#### Adding New Roles

To add a new role (e.g., "MANAGER"):

1. Update the check constraint:
```sql
ALTER TABLE user_roles DROP CONSTRAINT user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('ADMIN', 'USER', 'MANAGER', 'PENDING'));
```

2. Update the helper function if needed:
```sql
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'USER', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

3. Update TypeScript types:
```typescript
type UserRole = 'ADMIN' | 'USER' | 'MANAGER' | 'PENDING';
```

4. Add role-specific checks in Edge Functions and frontend

#### Adding Protected Resources

When adding a new table that should be protected:

1. Enable RLS:
```sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

2. Create policies:
```sql
CREATE POLICY "Approved users can manage new_table"
  ON new_table FOR ALL
  TO authenticated
  USING (public.is_admin_or_user())
  WITH CHECK (public.is_admin_or_user());
```

3. For admin-only tables:
```sql
-- No user policies needed
-- Access via Edge Functions only
```

### 4. Testing Strategies

#### Testing RLS Policies

Use Supabase's `auth.uid()` override in tests:

```sql
-- Set current user for testing
SET request.jwt.claim.sub = 'user-uuid-here';

-- Test query as that user
SELECT * FROM protected_table;

-- Reset
RESET request.jwt.claim.sub;
```

#### Testing Auth Flows

1. **First User Becomes Admin:**
   - Create fresh database
   - Sign up first user
   - Verify role is ADMIN

2. **Subsequent Users are Pending:**
   - Sign up second user
   - Verify role is PENDING
   - Verify they see pending approval screen

3. **Admin Approval:**
   - Login as admin
   - Approve pending user
   - Have pending user refresh
   - Verify they can access system

4. **Permission Checks:**
   - Login as USER
   - Verify cannot access Settings
   - Verify can access business features

#### Testing Edge Functions Locally

```bash
# Start Supabase locally
supabase start

# Serve functions
supabase functions serve

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/admin-users?action=list' \
  --header 'Authorization: Bearer YOUR_TOKEN_HERE' \
  --header 'Content-Type: application/json'
```

### 5. Performance Optimization

**Indexes for Auth:**
```sql
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
```

**Connection Pooling:**
- Use Supabase's built-in connection pooling
- Edge Functions automatically use pooling
- Frontend uses the same client instance

**Caching Role Data:**
- Store role in context after loading
- Only refresh when needed (after approval, role change)
- Consider using React Query for automatic caching

---

## Troubleshooting Guide

### Problem: RLS Policy Causes Infinite Recursion

**Symptoms:**
- Queries hang or timeout
- PostgreSQL errors about max recursion depth
- Database CPU spikes

**Solution:**
- Check if your policy queries the same table it protects
- Move complex authorization to Edge Functions
- Use simple, non-recursive policies

**Example Fix:**
```sql
-- ❌ Causes recursion
CREATE POLICY "Admins only" ON user_roles
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN'));

-- ✅ Use Edge Functions instead
-- No policy needed, handle via Edge Function with service role
```

### Problem: User Can't Access Data After Login

**Symptoms:**
- User logged in but gets permission errors
- Queries return empty results
- Frontend shows "unauthorized"

**Checklist:**
1. Verify user has a role in `user_roles` table
2. Check role is ADMIN or USER (not PENDING)
3. Verify RLS policies allow access for authenticated users
4. Check `is_admin_or_user()` function exists
5. Ensure policies use correct role check function

**Debug Query:**
```sql
-- Check user's role
SELECT role FROM user_roles WHERE user_id = auth.uid();

-- Test policy function
SELECT public.is_admin_or_user();
```

### Problem: Trigger Not Creating Role

**Symptoms:**
- New user created but no role in `user_roles`
- User stuck on loading screen
- Queries fail with "no role found"

**Checklist:**
1. Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
2. Check trigger function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
3. Look for errors in Supabase logs
4. Verify function has `SECURITY DEFINER`

**Manual Fix:**
```sql
-- Manually create role for user
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid', 'USER');
```

### Problem: Admin Can't See User Management

**Symptoms:**
- Admin logged in but Settings shows "admins only"
- `isAdmin` is false in frontend
- Edge Function returns 403

**Checklist:**
1. Verify user's role in database: `SELECT role FROM user_roles WHERE user_id = 'uuid';`
2. Check role loaded in frontend: Add console.log in AuthContext
3. Verify Edge Function authentication is working
4. Check browser console for errors
5. Try refreshing the role: call `refreshRole()`

**Debug Steps:**
```typescript
// In AuthContext, add logging
async function loadUserRole(userId: string) {
  console.log('Loading role for:', userId);
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('Role data:', data);
  console.log('Role error:', error);
}
```

### Problem: Edge Function Returns 403

**Symptoms:**
- Admin operations fail
- Browser console shows 403 errors
- Edge Function logs show "Admin access required"

**Checklist:**
1. Verify user is authenticated: Check session token exists
2. Verify token is being sent: Check Network tab in browser
3. Verify user has ADMIN role in database
4. Check Edge Function is using correct environment variables
5. Verify CORS headers are set correctly

**Debug Edge Function:**
```typescript
// Add logging
console.log('User ID:', user.id);
console.log('User role data:', userRole);
console.log('Is admin:', userRole?.role === 'ADMIN');
```

### Problem: New Users Can Access System Without Approval

**Symptoms:**
- PENDING users can see main application
- Role check not working correctly

**Checklist:**
1. Verify `isApproved` check in App.tsx
2. Check role value in context: `console.log(role)`
3. Verify `isApproved` calculation: should be `role === 'ADMIN' || role === 'USER'`
4. Check if RLS policies are blocking PENDING users

**Fix:**
```typescript
// Ensure proper check in App.tsx
if (!isApproved) {
  return <PendingApproval />;
}
```

### Problem: Users See Flash of Wrong Content

**Symptoms:**
- Login page briefly appears when already logged in
- Protected content flashes before redirect

**Solution:**
Show loading state until auth is determined:

```typescript
if (loading) {
  return <LoadingSpinner />;
}
```

Ensure `loading` stays true until BOTH user and role are loaded.

---

## Summary

This authentication system provides a robust, scalable foundation for role-based access control in Supabase applications. Key achievements:

✅ **Automatic Role Assignment**: First user becomes admin, others require approval
✅ **Non-Recursive RLS**: Avoids infinite recursion through careful policy design
✅ **Service Role Admin Ops**: Uses Edge Functions for complex authorization
✅ **Secure by Default**: All tables protected with RLS, operations verified on backend
✅ **Great UX**: Clear feedback for pending users, easy approval workflow

The system successfully navigated the complex challenge of RLS recursion by strategically separating concerns: simple policies for self-access, helper functions for cross-table checks, and Edge Functions for admin operations.

### Key Lessons Learned

1. **RLS Recursion is Real**: Never query the same table within its own RLS policy
2. **Service Role is Powerful**: Use Edge Functions + service role for complex auth
3. **Separation of Concerns**: Auth state ≠ role data ≠ permissions
4. **Defense in Depth**: Frontend checks for UX, backend checks for security
5. **Simple is Better**: Keep RLS policies as simple as possible

This guide can be adapted to any Supabase project requiring role-based access control with an approval workflow.
