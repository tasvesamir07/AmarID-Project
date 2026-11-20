"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { sessionLogout, sessionRefresh } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthState {
  identityId: string | null;
  universalId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  setAuth: (identityId: string, universalId: string) => void;
}

const AuthContext = createContext<AuthState>({
  identityId: null,
  universalId: null,
  loading: true,
  logout: async () => {},
  setAuth: () => {},
});

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [universalId, setUniversalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On mount, check if the CSRF cookie exists (proxy for being logged in).
  // If yes, try a silent refresh to get a fresh access token.
  useEffect(() => {
    const csrf = getCookie("amarid-csrf");
    if (!csrf) {
      // Restore from sessionStorage if user just registered
      const stored = sessionStorage.getItem("amarid-auth");
      if (stored) {
        try {
          const { identityId: iid, universalId: uid } = JSON.parse(stored);
          setIdentityId(iid);
          setUniversalId(uid);
        } catch { /* ignore */ }
      }
      setLoading(false);
      return;
    }
    // Try to refresh the session silently
    sessionRefresh()
      .then(() => {
        const stored = sessionStorage.getItem("amarid-auth");
        if (stored) {
          try {
            const { identityId: iid, universalId: uid } = JSON.parse(stored);
            setIdentityId(iid);
            setUniversalId(uid);
          } catch { /* ignore */ }
        }
      })
      .catch(() => {
        // Session expired — clear storage
        sessionStorage.removeItem("amarid-auth");
      })
      .finally(() => setLoading(false));
  }, []);

  const setAuth = useCallback((iid: string, uid: string) => {
    setIdentityId(iid);
    setUniversalId(uid);
    sessionStorage.setItem("amarid-auth", JSON.stringify({ identityId: iid, universalId: uid }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await sessionLogout();
    } catch { /* ignore network errors */ }
    setIdentityId(null);
    setUniversalId(null);
    sessionStorage.removeItem("amarid-auth");
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ identityId, universalId, loading, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
