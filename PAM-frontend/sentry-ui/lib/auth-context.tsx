'use client';

/**
 * lib/auth-context.tsx — Global auth state
 *
 * WHY this exists:
 *   After login, two things need to persist across the whole app:
 *     1. The JWT token (for API calls)
 *     2. The current user's profile (name, email, permissions context)
 *
 *   React Context solves this. You wrap the app in <AuthProvider>,
 *   and any component anywhere can call useAuth() to read the current user
 *   or call login/logout without prop drilling.
 *
 * WHY 'use client':
 *   This file uses useState, useEffect, and localStorage — all browser APIs.
 *   Next.js server components can't use these. 'use client' tells Next.js
 *   to only run this code in the browser. Any component that imports useAuth()
 *   automatically becomes a client component too.
 *
 * Token storage flow:
 *   login()  → saves token to localStorage → fetches /auth/me → sets user state
 *   logout() → removes token from localStorage → clears user state → redirects
 *   On mount → checks localStorage for existing token → restores session
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, MeResponse, ApiError } from './api';

interface AuthContextValue {
  user: MeResponse | null;
  permissions: string[];
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On first mount, check if there's an existing token in localStorage.
  // If there is, fetch /auth/me to verify it's still valid and restore the session.
  // If the token is expired or invalid, /auth/me returns 401 → we clear it.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('sentry_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        setUser(me);
        // Fetch user permissions for tab visibility control
        const token = localStorage.getItem('sentry_token');
        const permsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api'}/user-roles/user/${me.userId}/permissions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (permsRes.ok) setPermissions(await permsRes.json());
      } catch (err) {
        // Token is invalid or expired — clean up
        localStorage.removeItem('sentry_token');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Called after a successful POST /auth/login.
  // The caller gets the token from the login response and passes it here.
  const login = useCallback(async (token: string) => {
    localStorage.setItem('sentry_token', token);
    // Immediately fetch the full user profile from /auth/me.
    // The login response only gives us userId/email/name — we also need
    // department and mfaVerified for the permission context display.
    const me = await authApi.me();
    setUser(me);
    // Fetch permissions so sidebar can show/hide tabs immediately
    const permsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api'}/user-roles/user/${me.userId}/permissions`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('sentry_token')}` } }
    );
    if (permsRes.ok) setPermissions(await permsRes.json());
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sentry_token');
    setUser(null);
    setPermissions([]);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — the only way components should access auth state.
// Throws if called outside <AuthProvider> so you get a clear error
// instead of silently getting null.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}