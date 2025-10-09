import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_info', { p_user_id: userId })
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (data) {
        return {
          id: userId,
          email: data.user_email,
          full_name: data.user_email,
          status: data.user_status,
          is_active: data.user_status === 'active',
          role_name: data.role_name || 'Pending',
          is_admin: data.is_admin || false
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[AuthContext] Got session:', session ? 'exists' : 'null');

        if (!mounted) return;

        if (session?.user) {
          console.log('[AuthContext] Setting user from session:', session.user.email);
          setUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          console.log('[AuthContext] Fetched profile:', profile);
          if (mounted) {
            setUserProfile(profile);
          }
        } else {
          console.log('[AuthContext] No session, clearing user');
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          console.log('[AuthContext] Setting loading to false after initialization');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event, session ? 'has session' : 'no session');
        if (!mounted) return;

        if (session?.user) {
          console.log('[AuthContext] Auth state change - setting user:', session.user.email);
          setUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          console.log('[AuthContext] Auth state change - fetched profile:', profile);
          if (mounted) {
            setUserProfile(profile);
          }
        } else {
          console.log('[AuthContext] Auth state change - clearing user');
          setUser(null);
          setUserProfile(null);
        }

        console.log('[AuthContext] Auth state change complete');
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    console.log('[AuthContext] signInWithEmail called');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[AuthContext] signInWithPassword result:', error ? 'error' : 'success');

    if (!error) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('[AuthContext] Fetching profile after login');
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
        console.log('[AuthContext] Profile set after login');
      }
    }

    console.log('[AuthContext] Setting loading to false after signInWithEmail');
    setLoading(false);
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
