# Session Recovery Fix - Tab Switch Authentication Issues

## Status: ✅ FIXED

## Problem Summary

Users were experiencing authentication issues when switching browser tabs and returning to the application. After switching to another tab for a period of time, the application would stop loading data, requiring a page refresh to restore functionality.

## Issues Encountered During Fix

1. **Function Dependency Order**: Initial implementation had `checkAndRecoverSession` trying to use `validateSession` before it was defined, causing a "Cannot access before initialization" error
2. **Infinite Re-render Loop**: The `useEffect` dependency array included callbacks that changed on every render, causing the auth context to continuously mount/unmount

Both issues have been resolved in the final implementation.

## Root Cause

The issue stemmed from browser behavior when tabs become inactive:

1. **Browser Tab Throttling**: Browsers throttle JavaScript execution for inactive tabs, which can interfere with Supabase's automatic token refresh timers
2. **Session State Drift**: When a tab becomes active again, the session state may be stale or expired
3. **No Visibility Handling**: The app had no specific handling for visibility changes or tab focus events
4. **Missing Recovery Logic**: Failed API requests due to expired sessions had no retry mechanism

## Solution Implemented

### 1. Enhanced AuthContext with Visibility Detection

**File**: `src/contexts/AuthContext.tsx`

Added comprehensive browser visibility and focus event handling:

- **Visibility Change Detection**: Monitors when the tab becomes hidden/visible
- **Focus Event Handling**: Detects when the window regains focus
- **Time-based Recovery**: Triggers session check if inactive for more than 30 seconds
- **Periodic Health Checks**: Validates session every 5 minutes when tab is active

#### Key Features:

```typescript
// Automatic session recovery when tab becomes visible
document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('focus', handleFocus);

// Periodic session validation every 5 minutes
setInterval(() => {
  if (!document.hidden && user) {
    checkAndRecoverSession();
  }
}, 5 * 60 * 1000);

// Cross-tab session synchronization
window.addEventListener('storage', handleStorageChange);
```

#### Session Recovery Logic:

The `checkAndRecoverSession()` function:
1. Gets current session from Supabase
2. Validates session is not expired
3. If invalid, attempts automatic refresh
4. Updates user state and profile on successful recovery
5. Clears auth state if recovery fails

### 2. Enhanced Supabase Client Configuration

**File**: `src/lib/supabase.ts`

Improved the Supabase client initialization with better defaults:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',  // More secure authentication flow
    debug: false,
  },
  // Additional configuration for reliability
});
```

### 3. Request Retry Utility

**File**: `src/utils/retryUtils.ts`

Created a new utility module for handling failed requests with intelligent retry logic:

#### Features:

- **Automatic Retry**: Retries failed requests up to 3 times
- **Exponential Backoff**: Delays between retries increase exponentially (1s, 2s, 4s)
- **Auth Error Detection**: Specifically identifies authentication-related errors
- **Session Refresh**: Attempts to refresh the session before retrying
- **Network Error Handling**: Detects and handles network connectivity issues

#### Usage:

```typescript
const { data, error } = await withAuthRetry(() =>
  supabase.from('table_name').select('*')
);
```

### 4. Updated Data Fetching Hooks

Applied retry logic to critical data fetching hooks:

- `src/pages/grainEntries/hooks/useGrainEntryData.ts`
- `src/pages/scenario/hooks/useScenarioData.ts`

These hooks now automatically retry failed requests after attempting session recovery.

## How It Works

### Normal Flow:
1. User actively uses the app
2. Session is validated periodically (every 5 minutes)
3. Token auto-refresh happens before expiration

### Tab Switch Recovery Flow:
1. User switches to another tab
2. Browser throttles the inactive tab
3. User returns to the app tab
4. `visibilitychange` event fires
5. App checks time elapsed since last check
6. If > 30 seconds, triggers `checkAndRecoverSession()`
7. Session is validated/refreshed if needed
8. App continues normally with valid session

### Failed Request Recovery Flow:
1. Data fetch request fails with auth error
2. `withAuthRetry()` catches the error
3. Attempts to refresh the session
4. Retries the original request
5. Returns data or final error after 3 attempts

## Benefits

1. **Seamless User Experience**: No more forced page refreshes
2. **Automatic Recovery**: Session issues are resolved transparently
3. **Reduced Errors**: Retry logic handles temporary failures
4. **Better Logging**: Comprehensive console logs for debugging
5. **Cross-Tab Sync**: Session changes in one tab are detected in others

## Testing

The fixes handle these scenarios:

- ✅ Switching to another tab for 30+ seconds
- ✅ Minimizing the browser window
- ✅ Computer sleep/wake cycles
- ✅ Network connectivity interruptions
- ✅ Token expiration during inactivity
- ✅ Multiple browser tabs with the same app
- ✅ Session changes in other tabs

## Console Logs

When debugging, you'll see logs like:

```
[AuthContext] Tab became hidden
[AuthContext] Tab became visible
[AuthContext] Time since last visibility check: 45s
[AuthContext] Been away for more than 30 seconds, checking session...
[AuthContext] Checking and recovering session...
[AuthContext] Session valid, ensuring user state is current
[retryWithAuth] Attempt 1/4
[retryWithAuth] Session refreshed successfully
```

## Migration Notes

No database migrations or environment variable changes are required. The fixes are purely client-side improvements to the authentication and data fetching logic.

## Performance Impact

- Minimal performance overhead
- Event listeners are cleaned up properly on unmount
- Intervals are cleared when not needed
- No unnecessary API calls when tab is hidden

## Future Improvements

Consider these enhancements:

1. **User Notifications**: Show a subtle indicator when session is being recovered
2. **Offline Mode**: Cache data and sync when connection is restored
3. **Exponential Backoff Tuning**: Adjust retry timing based on error patterns
4. **Session Monitoring Dashboard**: Real-time view of session health
5. **Analytics**: Track session recovery success rates

## Troubleshooting

If you still experience issues:

1. Open browser console and check for auth logs
2. Verify the session is being stored in localStorage
3. Check network tab for failed auth requests
4. Ensure Supabase project settings allow token refresh
5. Clear browser cache and localStorage completely

## Support

The implementation includes extensive logging. To debug issues:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Filter for "[AuthContext]" or "[retryWithAuth]"
4. Check the timestamps and messages to understand the flow
