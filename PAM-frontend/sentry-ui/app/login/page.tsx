'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authApi, ApiError } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const router    = useRouter();

  // WHY this pattern:
  // 1. Call POST /auth/login with credentials
  // 2. On success, pass the token to auth context login()
  //    which saves it to localStorage and fetches /auth/me
  // 3. Redirect to /dashboard
  // If login fails, NestJS returns 401 with a message — ApiError surfaces it.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      await login(res.access_token);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Connection failed. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 12,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            marginBottom: 16,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Sentry
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Privileged Access Management
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@sentry.dev"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 6, fontSize: 13,
                background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--red)',
              }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4, width: '100%' }}>
              {loading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          Use seed credentials: admin@sentry.dev / Admin@1234
        </p>
      </div>
    </div>
  );
}