import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  status: 'active' | 'pending' | 'suspended';
  is_active: boolean;
  role_name: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const mountedRef = useRef(true);
  const fetchingProfileRef = useRef(false);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastVisibilityCheckRef = useRef<number>(Date.now());
  const isRecoveringSessionRef = useRef(false);

  const fetchUserProfile = useCallback(async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    console.log('[AuthContext] fetchUserProfile called for:', userId);

    if (fetchingProfileRef.current) {
      console.log('[AuthContext] Profile fetch already in progress, skipping');
      return null;
    }

    fetchingProfileRef.current = true;

    try {
      const { data, error } = await supabase
        .rpc('get_user_info', { p_user_id: userId })
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Error fetching user profile:', error);
        console.error('[AuthContext] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        if (error.code === 'PGRST202') {
          console.error('[AuthContext] CRITICAL: get_user_info function not found in database!');
          console.error('[AuthContext] This usually means the database migration has not been applied.');
          console.error('[AuthContext] Please ensure all Supabase migrations are up to date.');
        }

        if (retryCount < 3) {
          const delayMs = Math.min(1000 * Math.pow(2, retryCount), 5000);
          console.log(`[AuthContext] Retrying profile fetch in ${delayMs}ms (attempt ${retryCount + 2}/4)...`);
          fetchingProfileRef.current = false;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return fetchUserProfile(userId, retryCount + 1);
        }

        console.error('[AuthContext] Max retries reached, profile fetch failed permanently');
        return null;
      }

      if (data) {
        const profile: UserProfile = {
          id: userId,
          email: data.user_email || '',
          full_name: data.user_email || 'Unknown User',
          status: data.user_status || 'pending',
          is_active: data.user_status === 'active',
          role_name: data.role_name || 'Pending',
          is_admin: data.is_admin || false
        };
        console.log('[AuthContext] Successfully fetched profile:', profile);

        try {
          localStorage.setItem('userProfile', JSON.stringify(profile));
          console.log('[AuthContext] Profile cached to localStorage');
        } catch (storageError) {
          console.warn('[AuthContext] Failed to cache profile to localStorage:', storageError);
        }

        return profile;
      }
      console.log('[AuthContext] No profile data returned');
      return null;
    } catch (error) {
      console.error('[AuthContext] Exception fetching user profile:', error);

      if (retryCount < 3) {
        const delayMs = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`[AuthContext] Retrying after exception in ${delayMs}ms (attempt ${retryCount + 2}/4)...`);
        fetchingProfileRef.current = false;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return fetchUserProfile(userId, retryCount + 1);
      }

      console.error('[AuthContext] Max retries reached after exception, profile fetch failed permanently');
      return null;
    } finally {
      fetchingProfileRef.current = false;
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      console.log('[AuthContext] Manually refreshing user profile');
      const profile = await fetchUserProfile(user.id);
      if (mountedRef.current) {
        setUserProfile(profile);
      }
    }
  }, [user, fetchUserProfile]);

  const validateSession = useCallback(async (session: Session): Promise<boolean> => {
    if (!session || !session.access_token) {
      console.log('[AuthContext] Invalid session: missing access token');
      return false;
    }

    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiryTime = expiresAt * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      console.log('[AuthContext] Session expires in:', Math.floor(timeUntilExpiry / 1000 / 60), 'minutes');

      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('[AuthContext] Session expiring soon, refreshing...');
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('[AuthContext] Failed to refresh expiring session:', error);
            return false;
          }
          if (data.session) {
            console.log('[AuthContext] Session refreshed successfully');
            return true;
          }
        } catch (error) {
          console.error('[AuthContext] Exception refreshing session:', error);
          return false;
        }
      }
    }

    return true;
  }, []);

  const refreshSession = useCallback(async () => {
    console.log('[AuthContext] Manually refreshing session');
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('[AuthContext] Error refreshing session:', error);
        return;
      }
      if (session) {
        console.log('[AuthContext] Session refreshed successfully');
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        if (mountedRef.current) {
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Exception refreshing session:', error);
    }
  }, [fetchUserProfile]);

  const checkAndRecoverSession = useCallback(async () => {
    if (isRecoveringSessionRef.current) {
      console.log('[AuthContext] Session recovery already in progress, skipping');
      return;
    }

    isRecoveringSessionRef.current = true;
    console.log('[AuthContext] Checking and recovering session...');

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthContext] Error getting session:', error);
        if (mountedRef.current) {
          setUser(null);
          setUserProfile(null);
          localStorage.removeItem('userProfile');
        }
        return;
      }

      if (!session) {
        console.log('[AuthContext] No session found during recovery check');
        if (mountedRef.current) {
          setUser(null);
          setUserProfile(null);
          localStorage.removeItem('userProfile');
        }
        return;
      }

      const isValid = await validateSession(session);
      if (!isValid) {
        console.warn('[AuthContext] Session invalid during recovery, attempting refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !refreshedSession) {
          console.error('[AuthContext] Failed to refresh session during recovery:', refreshError);
          if (mountedRef.current) {
            setUser(null);
            setUserProfile(null);
            localStorage.removeItem('userProfile');
          }
          return;
        }

        console.log('[AuthContext] Session refreshed successfully during recovery');
        if (mountedRef.current) {
          setUser(refreshedSession.user);
          const profile = await fetchUserProfile(refreshedSession.user.id);
          if (mountedRef.current) {
            setUserProfile(profile);
          }
        }
        return;
      }

      console.log('[AuthContext] Session valid, ensuring user state is current');
      if (mountedRef.current && (!user || user.id !== session.user.id)) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        if (mountedRef.current) {
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Exception during session recovery:', error);
    } finally {
      isRecoveringSessionRef.current = false;
    }
  }, [user, validateSession, fetchUserProfile]);

  const handleAuthStateChange = useCallback(async (session: Session | null) => {
    console.log('[AuthContext] handleAuthStateChange called, session:', !!session);

    if (session?.user) {
      console.log('[AuthContext] Session has user:', session.user.email);

      const isValid = await validateSession(session);
      if (!isValid) {
        console.error('[AuthContext] Session validation failed, signing out');
        if (mountedRef.current) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          localStorage.removeItem('userProfile');
        }
        return;
      }

      if (mountedRef.current) {
        setUser(session.user);

        let profile = await fetchUserProfile(session.user.id);

        if (!profile) {
          console.warn('[AuthContext] Failed to fetch profile, attempting to load from cache');
          try {
            const cachedProfile = localStorage.getItem('userProfile');
            if (cachedProfile) {
              profile = JSON.parse(cachedProfile);
              console.log('[AuthContext] Loaded profile from cache:', profile);
            }
          } catch (error) {
            console.error('[AuthContext] Failed to load cached profile:', error);
          }
        }

        if (mountedRef.current) {
          setUserProfile(profile);
        }
      }
    } else {
      console.log('[AuthContext] No session user, clearing state');
      if (mountedRef.current) {
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('userProfile');
      }
    }

    if (mountedRef.current) {
      setLoading(false);
    }
    console.log('[AuthContext] Auth state processing complete, loading set to false');
  }, [fetchUserProfile, validateSession]);

  useEffect(() => {
    mountedRef.current = true;
    console.log('[AuthContext] useEffect running, setting up auth');

    if (isInitializedRef.current) {
      console.log('[AuthContext] Already initialized, skipping setup');
      return;
    }

    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthContext] Error getting session:', error);
        }

        console.log('[AuthContext] Initial session check:', session ? `User: ${session.user.email}` : 'No session');

        if (!mountedRef.current) {
          console.log('[AuthContext] Component unmounted, aborting');
          return;
        }

        await handleAuthStateChange(session);
        isInitializedRef.current = true;
        console.log('[AuthContext] Initialization complete');
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        if (mountedRef.current) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          isInitializedRef.current = true;
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] onAuthStateChange fired:', event);

        if (!mountedRef.current) {
          console.log('[AuthContext] Component unmounted, ignoring auth change');
          return;
        }

        if (!isInitializedRef.current) {
          console.log('[AuthContext] Not yet initialized, skipping auth state change handler');
          return;
        }

        await handleAuthStateChange(session);
      }
    );

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[AuthContext] Tab became hidden');
        lastVisibilityCheckRef.current = Date.now();
        if (sessionCheckIntervalRef.current) {
          clearInterval(sessionCheckIntervalRef.current);
          sessionCheckIntervalRef.current = null;
        }
      } else {
        console.log('[AuthContext] Tab became visible');
        const timeSinceLastCheck = Date.now() - lastVisibilityCheckRef.current;
        console.log(`[AuthContext] Time since last visibility check: ${Math.floor(timeSinceLastCheck / 1000)}s`);

        if (timeSinceLastCheck > 30000) {
          console.log('[AuthContext] Been away for more than 30 seconds, checking session...');
          checkAndRecoverSession();
        }

        if (!sessionCheckIntervalRef.current) {
          sessionCheckIntervalRef.current = setInterval(() => {
            if (!document.hidden) {
              console.log('[AuthContext] Periodic session check');
              checkAndRecoverSession();
            }
          }, 5 * 60 * 1000);
        }
      }
    };

    const handleFocus = () => {
      console.log('[AuthContext] Window gained focus');
      const timeSinceLastCheck = Date.now() - lastVisibilityCheckRef.current;
      if (timeSinceLastCheck > 10000) {
        console.log('[AuthContext] Checking session after focus...');
        checkAndRecoverSession();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('supabase.auth.token')) {
        console.log('[AuthContext] Supabase auth storage changed in another tab');
        checkAndRecoverSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    sessionCheckIntervalRef.current = setInterval(() => {
      if (!document.hidden) {
        console.log('[AuthContext] Periodic session check');
        checkAndRecoverSession();
      }
    }, 5 * 60 * 1000);

    return () => {
      console.log('[AuthContext] Cleaning up auth listener');
      mountedRef.current = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    console.log('[AuthContext] signInWithEmail called for:', email);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[AuthContext] signInWithPassword completed:', error ? `Error: ${error.message}` : 'Success');

    if (error) {
      setLoading(false);
    }

    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('userProfile');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshUserProfile,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
