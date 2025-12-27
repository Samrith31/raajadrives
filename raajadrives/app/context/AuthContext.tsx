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

  // Function to fetch username from public.profiles
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (data) setUsername(data.username);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setUsername(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Get initial session with error handling
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // If the token is invalid/not found, clear the local state
          if (error.message.includes('Refresh Token Not Found')) {
            console.warn("Stale session detected. Clearing local auth...");
            await supabase.auth.signOut();
          }
          throw error;
        }

        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
      } catch (err) {
        console.error("Auth initialization failed:", err);
        setUser(null);
        setUsername(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for auth state changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUsername(null);
      }

      // Ensure loading is turned off if an event occurs before init finishes
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUsername(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, username, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);