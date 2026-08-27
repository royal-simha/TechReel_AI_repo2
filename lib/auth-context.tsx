'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase-client';
import { toast } from 'sonner';

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (event === 'SIGNED_OUT') {
          setIsDemoMode(false);
        }
        setLoading(false);
      })();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || 'Student User' } },
    });
    if (error) {
      console.error('Signup error:', error.message, error.code || '');
      throw error;
    }
    if (!data.user) {
      throw new Error('Signup failed: no user returned');
    }
    if (data.session) {
      toast.success('Welcome to TechReel AI', { description: 'Your account is ready.' });
      return true;
    }
    toast.success('Account created', { description: 'Please check your email to confirm your account, then sign in.' });
    return false;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast.success('Welcome back', { description: 'You are now signed in.' });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsDemoMode(false);
    setUser(null);
    setSession(null);
    toast.info('Signed out', { description: 'You have been signed out.' });
  }, []);

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true);
    toast.success('Demo Mode Active', {
      description: 'Hackathon demo scenario loaded. Explore the full pipeline!',
    });
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  const value: AuthState = {
    user,
    session,
    loading,
    isDemoMode,
    signUp,
    signIn,
    signOut,
    enterDemoMode,
    exitDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
