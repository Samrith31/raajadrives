'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  username: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
      if (data) setUsername(data.username);
    } catch (err) {
      console.error("Profile fetch failed:", err);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. Get current session from storage immediately
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // If token is corrupted, clear it so user isn't 'stuck'
          if (error.message.includes('Refresh Token Not Found')) {
            await supabase.auth.signOut();
          }
          throw error;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        // ALWAYS set loading to false to unfreeze the UI
        setLoading(false);
      }
    };

    initialize();

    // 2. Listen for Auth changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setUsername(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername(null);
    // Hard refresh to clear all app states
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, username, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);