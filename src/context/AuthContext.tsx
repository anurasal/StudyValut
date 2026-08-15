import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string
  ) => Promise<{ error?: string }>;
  signInWithEmail: (
    email: string,
    pass: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'studyvault_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user && mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              display_name:
                session.user.user_metadata?.display_name ||
                session.user.email?.split('@')[0] ||
                'Student',
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
            });
          }
        } catch (err) {
          console.error('Supabase session load error:', err);
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session?.user && mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                display_name:
                  session.user.user_metadata?.display_name ||
                  session.user.email?.split('@')[0] ||
                  'Student',
                avatar_url: session.user.user_metadata?.avatar_url,
                created_at: session.user.created_at,
              });
            } else if (mounted) {
              setUser(null);
            }

            setLoading(false);
          }
        );

        if (mounted) {
          setLoading(false);
        }

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } else {
        // No automatic demo account.
        // The app starts logged out and shows the login page.
        localStorage.removeItem(DEMO_USER_KEY);

        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string
  ) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            display_name: name,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: email,
            display_name: name,
            created_at: new Date().toISOString(),
          });
        } catch (_) {}
      }

      return {};
    }

    // Local fallback when Supabase is not configured.
    // Creates an account only after the user signs up.
    const newUser: UserProfile = {
      id: 'user-' + Date.now(),
      email,
      display_name: name || email.split('@')[0],
      created_at: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newUser));

    return {};
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    }

    // Local fallback when Supabase is not configured.
    const savedUser = localStorage.getItem(DEMO_USER_KEY);

    if (!savedUser) {
      return {
        error: 'No account found. Please create an account first.',
      };
    }

    try {
      const existingUser: UserProfile = JSON.parse(savedUser);

      if (existingUser.email !== email) {
        return {
          error: 'No account found with this email.',
        };
      }

      setUser(existingUser);
      return {};
    } catch {
      localStorage.removeItem(DEMO_USER_KEY);

      return {
        error: 'Unable to load your account. Please create an account again.',
      };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
    }

    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseConnected: isSupabaseConfigured,
        signUpWithEmail,
        signInWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
