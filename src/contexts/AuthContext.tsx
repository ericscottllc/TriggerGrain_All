import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
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

        if (retryCount < 2) {
          console.log(`[AuthContext] Retrying profile fetch (attempt ${retryCount + 2}/3)...`);
          fetchingProfileRef.current = false;
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserProfile(userId, retryCount + 1);
        }

        return null;
      }

      if (data) {
        const profile = {
          id: userId,
          email: data.user_email,
          full_name: data.user_email,
          status: data.user_status,
          is_active: data.user_status === 'active',
          role_name: data.role_name || 'Pending',
          is_admin: data.is_admin || false
        };
        console.log('[AuthContext] Successfully fetched profile:', profile);
        return profile;
      }
      console.log('[AuthContext] No profile data returned');
      return null;
    } catch (error) {
      console.error('[AuthContext] Exception fetching user profile:', error);

      if (retryCount < 2) {
        console.log(`[AuthContext] Retrying after exception (attempt ${retryCount + 2}/3)...`);
        fetchingProfileRef.current = false;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUserProfile(userId, retryCount + 1);
      }

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

  const handleAuthStateChange = useCallback(async (session: any) => {
    console.log('[AuthContext] handleAuthStateChange called, session:', !!session);

    if (session?.user) {
      console.log('[AuthContext] Session has user:', session.user.email);
      if (mountedRef.current) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        if (mountedRef.current) {
          setUserProfile(profile);
        }
      }
    } else {
      console.log('[AuthContext] No session user, clearing state');
      if (mountedRef.current) {
        setUser(null);
        setUserProfile(null);
      }
    }

    if (mountedRef.current) {
      setLoading(false);
    }
    console.log('[AuthContext] Auth state processing complete, loading set to false');
  }, [fetchUserProfile]);

  useEffect(() => {
    mountedRef.current = true;
    console.log('[AuthContext] useEffect running, setting up auth');

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

    return () => {
      console.log('[AuthContext] Cleaning up auth listener');
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

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
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
