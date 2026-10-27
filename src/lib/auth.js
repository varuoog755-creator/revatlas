"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signInWithDemo: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local demo user first if present
    const demoUserStr = localStorage.getItem("revatlas_demo_user");
    if (demoUserStr) {
      try {
        const demo = JSON.parse(demoUserStr);
        setUser(demo);
        setLoading(false);
      } catch (e) {
        // ignore
      }
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        localStorage.removeItem("revatlas_demo_user");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        localStorage.removeItem("revatlas_demo_user");
      } else if (!localStorage.getItem("revatlas_demo_user")) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("revatlas_demo_user");
    setUser(null);
    setSession(null);
  };

  const signInWithDemo = (role = "Founder / Pro Member") => {
    const demo = {
      id: "demo-user-1",
      email: "founder@revatlas.com",
      user_metadata: {
        full_name: "Gourav",
        role,
        credits: 88,
      },
    };
    localStorage.setItem("revatlas_demo_user", JSON.stringify(demo));
    setUser(demo);
    return demo;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signInWithDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
