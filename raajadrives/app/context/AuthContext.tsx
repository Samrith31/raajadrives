'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  username: string | null;
  avatarUrl: string | null; // Added this
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>; // Added this to allow manual updates
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  username: null,
  avatarUrl: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // Added this
  const [loading, setLoading] = useState(true);

  // Updated to fetch both username and avatar_url
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url') // Fetch both
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUsername(data.username);
      setAvatarUrl(data.avatar_url);
    }
  };

  // This function can be called from any page to force a UI refresh
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        fetchProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setUsername(null);
          setAvatarUrl(null);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername(null);
    setAvatarUrl(null);
  };

  return (
    <AuthContext.Provider value={{ user, username, avatarUrl, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
