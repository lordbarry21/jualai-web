'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '@/lib/auth';
import { API_BASE } from '@/lib/firebase';

interface ProxyUser {
  uid: string;
  email: string;
  name: string;
  photoUrl?: string;
  role: 'admin' | 'user';
}

interface UsageStats {
  period: string;
  usage?: { requests: number; input_tokens: number; output_tokens: number; cost: number };
  daily?: { date: string; requests: number; cost: number; input_tokens: number; output_tokens: number }[];
  total?: { total_requests: number; total_input?: number; total_output?: number; total_cost: number };
  since?: string;
}

interface AdminUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: string;
  max_requests: number;
  is_active: number;
  today_requests: number;
  created_at: string;
}

interface ModelInfo {
  id: string;
  owned_by: string;
  context_length: number;
  max_output: number;
}

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || res.statusText);
  }
  return res.json();
}

export default function Dashboard({ user }: { user: User }) {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<'overview' | 'usage' | 'admin' | 'models'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<ProxyUser | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUserInfo();
    loadUsage();
  }, [user]);

  async function loadUserInfo() {
    try {
      const token = await user.getIdToken();
      const data = await apiFetch('/auth/me', token);
      setUserInfo(data.user);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadUsage(period = '7d') {
    try {
      const token = await user.getIdToken();
      const data = await apiFetch(`/usage?period=${period}`, token);
      setUsage(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadAdminUsers() {
    setLoading(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const data = await apiFetch('/admin/users', token);
      setAdminUsers(data.users || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadModels() {
    setLoading(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const data = await apiFetch('/admin/models', token);
      setModels(data.models || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(uid: string, updates: { max_requests?: number; is_active?: number }) {
    try {
      const token = await user.getIdToken();
      await apiFetch(`/admin/users/${uid}`, token);
      loadAdminUsers();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function copyExample() {
    const text = `curl -X POST ${API_BASE}/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gemini-3.8-flash-high","messages":[{"role":"user","content":"Hello"}]}'`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isAdmin = userInfo?.role === 'admin';
  const maxReq = userInfo ? (userInfo as any).max_requests : 500;

  // Chart
  const maxChart = usage?.daily && usage.daily.length > 0
    ? Math.max(...usage.daily.map(d => d.requests), 1)
    : 1;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>JualAI</span>
          {isAdmin && <span className="badge badge-blue">Admin</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{user.displayName || user.email}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</div>
          </div>
          <button className="btn btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'usage', label: 'Usage' },
          ...(isAdmin ? [
            { key: 'admin', label: 'Admin' },
            { key: 'models', label: 'Models' },
          ] : []),
        ].map(item => (
          <button
            key={item.key}
            onClick={() => {
              setTab(item.key as any);
              if (item.key === 'admin') loadAdminUsers();
              if (item.key === 'models') loadModels();
            }}
            style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
              background: tab === item.key ? 'var(--accent)' : 'transparent',
              color: tab === item.key ? 'white' : 'var(--muted)',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Error banner */}
      {error && (
        <div style={{ padding: '12px 24px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', fontSize: 14 }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>x</button>
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, padding: 24 }}>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div>
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <div className="card">
                <div className="stat">
                  <span className="stat-label">Today Requests</span>
                  <span className="stat-value">{(usage?.usage?.requests || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="card">
                <div className="stat">
                  <span className="stat-label">7-Day Requests</span>
                  <span className="stat-value">{(usage?.total?.total_requests || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="card">
                <div className="stat">
                  <span className="stat-label">7-Day Cost</span>
                  <span className="stat-value">${(usage?.total?.total_cost || 0).toFixed(4)}</span>
                </div>
              </div>
              <div className="card">
                <div className="stat">
                  <span className="stat-label">Daily Limit</span>
                  <span className="stat-value">{maxReq.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* API info */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>API Endpoint</h3>
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 13 }}>
                <div style={{ color: 'var(--muted)', marginBottom: 8 }}>Base URL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <code style={{ flex: 1, minWidth: 200 }}>{API_BASE}</code>
                  <button className="btn btn-ghost" onClick={copyExample} style={{ fontSize: 12 }}>
                    {copied ? 'Copied!' : 'Copy curl example'}
                  </button>
                </div>
                <div style={{ color: 'var(--muted)', marginTop: 12 }}>Auth header</div>
                <code style={{ fontSize: 12 }}>Authorization: Bearer &#123;FIREBASE_ID_TOKEN&#125;</code>
              </div>
            </div>

            {/* Chart */}
            {usage?.daily && usage.daily.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Daily Requests</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
                  {usage.daily.map(d => {
                    const h = Math.max(4, Math.round((d.requests / maxChart) * 100));
                    return (
                      <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', height: h, background: 'var(--accent)', borderRadius: 4 }} title={`${d.requests} requests`} />
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage Tab */}
        {tab === 'usage' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {[['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['today', 'Today']].map(([p, label]) => (
                <button key={p} className={`btn ${usage?.period === p ? 'btn-primary' : 'btn-ghost'}`} onClick={() => loadUsage(p)}>{label}</button>
              ))}
            </div>
            <div className="grid-3">
              <div className="card"><div className="stat"><span className="stat-label">Total Requests</span><span className="stat-value">{(usage?.total?.total_requests || 0).toLocaleString()}</span></div></div>
              <div className="card"><div className="stat"><span className="stat-label">Input Tokens</span><span className="stat-value">{(usage?.total?.total_input || 0).toLocaleString()}</span></div></div>
              <div className="card"><div className="stat"><span className="stat-label">Output Tokens</span><span className="stat-value">{(usage?.total?.total_output || 0).toLocaleString()}</span></div></div>
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {tab === 'admin' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>User Management</h2>
            {loading ? (
              <div style={{ color: 'var(--muted)' }}>Loading...</div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Daily Limit</th>
                      <th>Today</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.uid}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</div>
                        </td>
                        <td><span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>{u.role}</span></td>
                        <td>
                          <input
                            type="number"
                            className="input"
                            style={{ width: 100 }}
                            defaultValue={u.max_requests}
                            onBlur={e => updateUser(u.uid, { max_requests: parseInt(e.target.value) || 500 })}
                          />
                        </td>
                        <td>{u.today_requests}</td>
                        <td><span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 12 }}
                            onClick={() => updateUser(u.uid, { is_active: u.is_active ? 0 : 1 })}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Models Tab */}
        {tab === 'models' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Available Models</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
              Use these model IDs when making API requests.
            </p>
            {loading ? (
              <div style={{ color: 'var(--muted)' }}>Loading...</div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                  <thead>
                    <tr><th>Model ID</th><th>Provider</th><th>Context</th><th>Max Output</th></tr>
                  </thead>
                  <tbody>
                    {models.map(m => (
                      <tr key={m.id}>
                        <td><code style={{ fontSize: 12 }}>{m.id}</code></td>
                        <td><span className="badge badge-green">{m.owned_by}</span></td>
                        <td>{Math.round(m.context_length / 1000)}K</td>
                        <td>{Math.round(m.max_output / 1000)}K</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
