'use client';

import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 100%)',
    }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>JualAI</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            AI API access dashboard powered by 9Router
          </p>
        </div>

        <button className="btn btn-primary" onClick={signInWithGoogle} style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 16 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-1 7.21-2.71l-3.57-2.77c-.97.65-2.21 1.03-3.64 1.03-2.8 0-5.17-1.89-6.01-4.43H2.18v2.84C3.99 20.29 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.99 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H2.18C1.43 8.55.91 10.72.91 13.01s.52 4.46 1.27 6.39l3.81-2.11z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.71 2.18 7.58l3.81 2.11c.84-2.54 3.21-4.31 6.01-4.31z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 24 }}>
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
