'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { accessRequestsApi, rolesApi, usersApi, auditApi, AccessRequest, User, Role, AuditLog, ApiError } from '@/lib/api';

// ── Shared components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
  );
}

function Sidebar({ tab, setTab, user, logout }: any) {
  const { permissions } = useAuth();
  const canViewUsers = permissions.includes('users:read') || permissions.includes('*:*');
  const canViewAudit = permissions.includes('audit:read') || permissions.includes('*:*');
  const canApprove   = permissions.includes('access:approve') || permissions.includes('*:*');

  const tabs = [
    { id: 'my-requests', label: 'My Requests',    icon: '◈', show: true },
    { id: 'new-request', label: 'New Request',     icon: '+', show: true },
    { id: 'queue',       label: 'Approval Queue',  icon: '⊞', show: canApprove },
    { id: 'users',       label: 'Users & Roles',   icon: '⊙', show: canViewUsers },
    { id: 'audit',       label: 'Audit Log',        icon: '◎', show: canViewAudit },
  ].filter(t => t.show);

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>Sentry</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'var(--bg-hover)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 13, fontFamily: 'inherit', fontWeight: tab === t.id ? 500 : 400,
              textAlign: 'left', marginBottom: 2,
              transition: 'all 0.1s',
              borderLeft: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 14, opacity: 0.7 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 500 }}>{user?.name}</p>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>{user?.email}</p>
          {user?.department && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user.department}</p>
          )}
        </div>
        <button className="btn btn-ghost" style={{ width: '100%', fontSize: 12 }} onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ── My Requests tab ───────────────────────────────────────────────────────────

function MyRequestsTab() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading]   = useState(true);

  // useEffect with [] runs once on mount — equivalent to componentDidMount.
  // This is the standard pattern for "fetch data when page loads."
  useEffect(() => {
    accessRequestsApi.getMine()
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32, display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-secondary)' }}><Spinner /> Loading your requests...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>My Access Requests</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Track the status of your submitted requests.</p>

      {requests.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: 13 }}>No requests yet. Submit your first one →</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.map(r => (
            <div key={r._id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
                      {r.resource}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{r.justification}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                    Duration: {r.requestedDuration} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {r.reviewNote && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 4, background: 'var(--bg-elevated)', borderLeft: '2px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Reviewer note:</strong> {r.reviewNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── New Request tab ───────────────────────────────────────────────────────────

function NewRequestTab() {
  const [resource, setResource]   = useState('');
  const [justification, setJust]  = useState('');
  const [duration, setDuration]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(false);
    try {
      await accessRequestsApi.create({ resource, justification, requestedDuration: duration });
      setSuccess(true);
      setResource(''); setJust(''); setDuration('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const presets = ['production-database', 'payment-gateway-admin', 'staging-api-keys', 'analytics-export', 'infra-ssh-access'];

  return (
    <div style={{ padding: 32, maxWidth: 560 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Request Access</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
        Submit a request for privileged resource access. An approver will review it.
      </p>

      {success && (
        <div style={{ padding: '12px 16px', borderRadius: 6, background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--green)', fontSize: 13, marginBottom: 20 }}>
          ✓ Request submitted successfully. Check "My Requests" for status updates.
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resource
            </label>
            <input className="input" value={resource} onChange={e => setResource(e.target.value)}
              placeholder="e.g. production-database" required />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {presets.map(p => (
                <button key={p} type="button" onClick={() => setResource(p)}
                  style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Justification
            </label>
            <textarea className="input" value={justification} onChange={e => setJust(e.target.value)}
              placeholder="Why do you need this access? Be specific." required rows={3}
              style={{ resize: 'vertical' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Duration
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['2 hours', '1 day', '1 week', 'permanent'].map(d => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  style={{
                    padding: '6px 14px', borderRadius: 5, border: '1px solid',
                    borderColor: duration === d ? 'var(--accent)' : 'var(--border)',
                    background: duration === d ? 'var(--accent-dim)' : 'transparent',
                    color: duration === d ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {d}
                </button>
              ))}
            </div>
            {!duration && <input className="input" style={{ marginTop: 8 }} value={duration}
              onChange={e => setDuration(e.target.value)} placeholder="Or type custom duration" />}
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: 6, background: 'var(--red-dim)', color: 'var(--red)', fontSize: 13 }}>{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading || !duration}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Approval Queue tab ────────────────────────────────────────────────────────

function ApprovalQueueTab({ currentUserId }: { currentUserId: string }) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'pending' | 'approved' | 'rejected' | 'revoked'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const fetchRequests = useCallback(() => {
    setLoading(true);
    accessRequestsApi.getAll(filter)
      .then(setRequests)
      .catch(err => { if (!(err instanceof ApiError && err.status === 403)) console.error(err); })
      .finally(() => setLoading(false));
  }, [filter]);

  // Re-fetch when filter changes — filter is in the dependency array
  // so useEffect runs again whenever it changes.
  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const act = async (id: string, action: 'approve' | 'reject' | 'revoke') => {
    if (!note[id]?.trim()) { setError(`A review note is required to ${action} this request.`); return; }
    setActionLoading(id + action); setError('');
    try {
      if (action === 'approve') await accessRequestsApi.approve(id, note[id]);
      if (action === 'reject')  await accessRequestsApi.reject(id, note[id] ?? '');
      if (action === 'revoke')  await accessRequestsApi.revoke(id, note[id] ?? '');
      fetchRequests();
    } catch (err) {
      // This is where you'll see ABAC errors:
      // "Permission denied: Access approvals are only permitted Monday through Friday"
      // "Permission denied: MFA verification required to approve access requests"
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Approval Queue</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
        Review and act on access requests. Approvals require MFA and are restricted to weekdays.
      </p>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 6, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {(['pending', 'approved', 'rejected', 'revoked'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'transparent', fontSize: 13,
              color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${filter === f ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.1s',
              textTransform: 'capitalize',
            }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 13 }}><Spinner /> Loading...</div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
          No {filter} requests.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.map(r => (
            <div key={r._id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{r.resource}</span>
                    <StatusBadge status={r.status} />
                    {r.requesterId === currentUserId && (
                      <span className="badge" style={{ background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.2)' }}>yours</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{r.justification}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                    By {r.requesterEmail} · {r.requestedDuration} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                  {r.reviewNote && (
                    <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 4, background: 'var(--bg-elevated)', fontSize: 12, color: 'var(--text-secondary)', borderLeft: '2px solid var(--border)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> {r.reviewNote} · by {r.reviewerEmail}
                    </div>
                  )}
                </div>

                {/* Action area — only show for pending (approve/reject) or approved (revoke) */}
                {(r.status === 'pending' || r.status === 'approved') && r.requesterId !== currentUserId && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                    <input className="input" style={{ fontSize: 12 }}
                      placeholder='Review note (required)'
                      value={note[r._id] ?? ''}
                      onChange={e => setNote(n => ({ ...n, [r._id]: e.target.value }))}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm" style={{ flex: 1 }}
                            disabled={actionLoading === r._id + 'approve'}
                            onClick={() => act(r._id, 'approve')}>
                            {actionLoading === r._id + 'approve' ? '...' : 'Approve'}
                          </button>
                          <button className="btn btn-danger btn-sm" style={{ flex: 1 }}
                            disabled={actionLoading === r._id + 'reject'}
                            onClick={() => act(r._id, 'reject')}>
                            {actionLoading === r._id + 'reject' ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button className="btn btn-danger btn-sm" style={{ flex: 1 }}
                          disabled={actionLoading === r._id + 'revoke'}
                          onClick={() => act(r._id, 'revoke')}>
                          {actionLoading === r._id + 'revoke' ? '...' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users & Roles tab ─────────────────────────────────────────────────────────

function UsersTab() {
  const { user: currentUser, permissions } = useAuth();
  const [users, setUsers]   = useState<User[]>([]);
  const [roles, setRoles]   = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, Role[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canManageRoles = permissions.includes('roles:read') || permissions.includes('*:*');

  useEffect(() => {
    const fetches: [Promise<any>, Promise<any>] = [
      usersApi.getAll().catch(() => []),
      canManageRoles ? rolesApi.getAll().catch(() => []) : Promise.resolve([]),
    ];
    Promise.all(fetches)
      .then(([u, r]) => { setUsers(u); setRoles(r); })
      .finally(() => setLoading(false));
  }, [canManageRoles]);

  const loadUserRoles = async (userId: string) => {
    if (userRoles[userId]) { setExpanded(expanded === userId ? null : userId); return; }
    try {
      const roles = await rolesApi.getUserRoles(userId);
      setUserRoles(r => ({ ...r, [userId]: roles }));
      setExpanded(userId);
    } catch { /* silently ignore — user may not have permission */ }
  };

  const assignRole = async (userId: string, roleId: string) => {
    if (userId === currentUser?.userId) {
      setToast('You cannot assign roles to yourself.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    try {
      await rolesApi.assignRole(userId, roleId, currentUser?.email ?? 'admin');
      const updated = await rolesApi.getUserRoles(userId);
      setUserRoles(r => ({ ...r, [userId]: updated }));
      setToast('Role assigned successfully.');
    } catch (e: any) {
      setToast(e?.message ?? 'Failed to assign role.');
    }
    setTimeout(() => setToast(null), 3000);
  };

  const removeRole = async (userId: string, roleId: string) => {
    try {
      await rolesApi.removeRole(userId, roleId);
      const updated = await rolesApi.getUserRoles(userId);
      setUserRoles(r => ({ ...r, [userId]: updated }));
      setToast('Role removed.');
    } catch (e: any) {
      setToast(e?.message ?? 'Failed to remove role.');
    }
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div style={{ padding: 32, display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-secondary)' }}><Spinner /> Loading...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Users & Roles</h2>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.includes('cannot') || toast.includes('Failed') ? '#7f1d1d' : '#14532d',
          color: '#fff', padding: '10px 18px', borderRadius: 8,
          fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>{toast}</div>
      )}
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
        Assign and remove roles. Role changes take effect immediately — permission cache is invalidated on change.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u._id} className="card">
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => loadUserRoles(u._id)}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>{u.name}
                  {!u.isActive && <span className="badge badge-rejected" style={{ marginLeft: 8 }}>inactive</span>}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
                  {u.email}{u.department ? ` · ${u.department}` : ''}
                </p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{expanded === u._id ? '▲' : '▼'}</span>
            </div>

            {expanded === u._id && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '12px 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Roles</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {(userRoles[u._id] ?? []).length === 0
                    ? <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No roles assigned</span>
                    : (userRoles[u._id] ?? []).map(r => (
                      <span key={r._id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '3px 8px', borderRadius: 4, fontSize: 12,
                        background: 'var(--accent-dim)', color: 'var(--accent)',
                        border: '1px solid var(--accent-border)', fontFamily: 'JetBrains Mono',
                      }}>
                        {r.name}
                        {(!r.isSystemRole || permissions.includes('*:*')) && (
                          <button onClick={() => removeRole(u._id, r._id)}
                            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, opacity: 0.6, fontSize: 14, lineHeight: 1 }}>
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  }
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assign Role</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {roles.filter(r => !(userRoles[u._id] ?? []).find(ur => ur._id === r._id)).map(r => (
                    <button key={r._id} onClick={() => assignRole(u._id, r._id)}
                      className="btn btn-ghost btn-sm" style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                      + {r.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Audit Log tab ─────────────────────────────────────────────────────────────

function AuditLogCard({ log }: { log: AuditLog }) {
  const [resource, action] = log.permission.split(':');
  const resultColor = log.granted ? 'var(--green)' : '#ef4444';
  const resultBg    = log.granted ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
  return (
    <div className="card" style={{ padding: '14px 18px', borderLeft: `3px solid ${resultColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: resultBg, color: resultColor, letterSpacing: '0.05em' }}>
            {log.granted ? '✓ GRANTED' : '✗ DENIED'}
          </span>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
            {resource}<span style={{ color: 'var(--text-muted)' }}>:</span>{action}
          </span>
          {log.resourceType && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: 4 }}>
              {log.resourceType}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', whiteSpace: 'nowrap' }}>
          {new Date(log.timestamp).toLocaleString()}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: log.reason || log.suspiciousReason ? 8 : 0 }}>
        <div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>User</p>
          <p style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 1 }}>
            {log.userEmail}{log.userDepartment && <span style={{ color: 'var(--text-muted)' }}> · {log.userDepartment}</span>}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>IP</p>
          <p style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 1, fontFamily: 'JetBrains Mono' }}>{log.ipAddress}</p>
        </div>
        {log.sessionAge !== undefined && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Session</p>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 1 }}>{log.sessionAge}m old</p>
          </div>
        )}
      </div>

      {!log.granted && log.reason && (
        <div style={{ padding: '5px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Blocked because · </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.reason}</span>
        </div>
      )}

      {log.suspiciousReason && (
        <div style={{ padding: '5px 8px', borderRadius: 4, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <span style={{ fontSize: 10, color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠ Alert · </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.suspiciousReason}</span>
        </div>
      )}
    </div>
  );
}

function AuditTab() {
  const [recent, setRecent]       = useState<AuditLog[]>([]);
  const [alerts, setAlerts]       = useState<AuditLog[]>([]);
  const [section, setSection]     = useState<'alerts' | 'all'>('alerts');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const dedup = (logs: AuditLog[]) => {
    const seen = new Set<string>();
    return logs.filter(l => { if (seen.has(l._id)) return false; seen.add(l._id); return true; });
  };

  useEffect(() => {
    Promise.all([
      auditApi.getSuspicious(),
      auditApi.getRecent(),
    ])
      .then(([sus, rec]) => {
        setAlerts(dedup(sus));
        setRecent(dedup(rec));
      })
      .catch(err => {
        if (err instanceof ApiError && err.status === 403) {
          setError('You do not have permission to view audit logs.');
        } else {
          setError(err instanceof ApiError ? err.message : 'Failed to load audit logs');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32, display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-secondary)' }}><Spinner /> Loading audit logs...</div>;

  const displayed = section === 'alerts' ? alerts : recent;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Audit Log</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Complete record of all permission checks and access decisions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSection('alerts')}
            className={section === 'alerts' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            style={{ position: 'relative' }}>
            Security Alerts
            {alerts.length > 0 && (
              <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>
                {alerts.length}
              </span>
            )}
          </button>
          <button onClick={() => setSection('all')}
            className={section === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}>
            All Activity
            <span style={{ marginLeft: 6, background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderRadius: 10, fontSize: 10, padding: '1px 6px' }}>
              {recent.length}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 6, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {section === 'alerts' && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Events flagged by the anomaly detection engine — rapid denial patterns, off-hours sensitive operations, and privilege escalation indicators.
        </p>
      )}

      {displayed.length === 0 && !error ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
          {section === 'alerts' ? 'No security alerts. The system is clean.' : 'No activity recorded yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayed.map(log => <AuditLogCard key={log._id} log={log} />)}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('my-requests');

  // Redirect to login if no session — loading guard prevents flash
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Sidebar tab={tab} setTab={setTab} user={user} logout={logout} />
      <main style={{ flex: 1, overflowY: 'auto' }} className="fade-up">
        {tab === 'my-requests' && <MyRequestsTab />}
        {tab === 'new-request' && <NewRequestTab />}
        {tab === 'queue'       && <ApprovalQueueTab currentUserId={user.userId} />}
        {tab === 'users'       && <UsersTab />}
        {tab === 'audit'       && <AuditTab />}
      </main>
    </div>
  );
}