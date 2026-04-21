import { AuthError, Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  created_at?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  fetchUserProfile: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      const userId = (data as any)?.user?.id;
      await fetchUserProfile(email, userId);
    }

    return { error };
  };

  const fetchUserProfile = async (email?: string, userId?: string) => {
    try {
      let query = supabase.from('users').select('*');

      if (userId) query = query.eq('user_id', userId);
      else if (email) query = query.eq('email', email);
      else {
        console.warn('fetchUserProfile called without identifier');
        return;
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUserProfile({
          id: data.user_id ?? data.id,
          email: data.email,
          name: data.name,
          age: data.age,
          height: data.height,
          weight: data.weight,
          created_at: data.created_at ?? null,
        });
      } else {
        setUserProfile(null);
        console.warn('No user profile found for', userId ?? email);

        // Debugging helpers: try alternative lookups and log results
        try {
          if (userId) {
            const byUserId = await supabase.from('users').select('*').eq('user_id', userId).maybeSingle();
            console.warn('Debug fetchUserProfile (by user_id):', { data: byUserId.data ?? null, error: byUserId.error ?? null });
          }

          if (email) {
            // exact email
            const byEmail = await supabase.from('users').select('*').eq('email', email).maybeSingle();
            console.warn('Debug fetchUserProfile (by email exact):', { data: byEmail.data ?? null, error: byEmail.error ?? null });

            // case-insensitive fallback
            const byEmailIlike = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
            console.warn('Debug fetchUserProfile (by email ilike):', { data: byEmailIlike.data ?? null, error: byEmailIlike.error ?? null });
          }
        } catch (dbgErr) {
          console.error('Debug lookup failed:', dbgErr);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    // 1. Create Supabase Auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) return { error };

    // 2. Insert a profile row in the custom 'users' table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            user_id: data.user.id,
            email: email,
            name: name,
          },
        ]);

      if (profileError) {
        console.warn('Profile creation warning:', profileError.message);
        // Don't fail the signup — auth user is already created
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, userProfile, isLoading, signIn, signUp, signOut, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
