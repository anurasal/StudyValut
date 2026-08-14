import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'studyvault_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Student',
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
            });
          }
        } catch (err) {
          console.error('Supabase session load error:', err);
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user && mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Student',
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
            });
          } else if (mounted) {
            setUser(null);
          }
          setLoading(false);
        });

        if (mounted) setLoading(false);

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } else {
        // Fallback Local Storage Demo Session
        const savedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (savedDemo) {
          try {
            setUser(JSON.parse(savedDemo));
          } catch {
            const defaultUser: UserProfile = {
              id: 'demo-student-id-101',
              email: 'student@studyvault.edu',
              display_name: 'Alex Rivera',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              created_at: new Date().toISOString(),
            };
            setUser(defaultUser);
            localStorage.setItem(DEMO_USER_KEY, JSON.stringify(defaultUser));
          }
        } else {
          const defaultUser: UserProfile = {
            id: 'demo-student-id-101',
            email: 'student@studyvault.edu',
            display_name: 'Alex Rivera',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            created_at: new Date().toISOString(),
          };
          setUser(defaultUser);
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(defaultUser));
        }
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
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
        if (error.message?.toLowerCase().includes('provider is not enabled') || error.message?.toLowerCase().includes('unsupported provider')) {
          const newUser: UserProfile = {
            id: 'user-' + Date.now(),
            email,
            display_name: name || email.split('@')[0],
            created_at: new Date().toISOString(),
          };
          setUser(newUser);
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newUser));
          return {};
        }
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
    } else {
      const newUser: UserProfile = {
        id: 'user-' + Date.now(),
        email,
        display_name: name || email.split('@')[0],
        created_at: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newUser));
      return {};
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        if (error.message?.toLowerCase().includes('provider is not enabled') || error.message?.toLowerCase().includes('unsupported provider')) {
          const newUser: UserProfile = {
            id: 'user-' + Date.now(),
            email,
            display_name: email.split('@')[0],
            created_at: new Date().toISOString(),
          };
          setUser(newUser);
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newUser));
          return {};
        }
        return { error: error.message };
      }
      return {};
    } else {
      const newUser: UserProfile = {
        id: 'user-' + Date.now(),
        email,
        display_name: email.split('@')[0],
        created_at: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newUser));
      return {};
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
    } else {
      localStorage.removeItem(DEMO_USER_KEY);
    }
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
