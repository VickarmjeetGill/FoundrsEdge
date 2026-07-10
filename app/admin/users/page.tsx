'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, LayoutDashboard, ClipboardList, Tag, Trophy, Flag, Milestone,
  LogOut, Search, UserCheck, UserX, Repeat, ShieldCheck, X, Activity,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useEscapeKey } from '@/components/ui/useEscapeKey';
import { getProfile } from '@/app/actions/profile';
import { logout } from '@/app/actions/auth';

type Role = 'MEMBER' | 'ADMIN';
type Status = 'active' | 'suspended';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  joined: string;        // ISO date
  business?: string;
};

const ROLES: Role[] = ['MEMBER', 'ADMIN'];

const roleStyles: Record<Role, { bg: string; color: string }> = {
  MEMBER: { bg: '#f0efe9', color: '#5a5650' },
  ADMIN: { bg: 'rgba(231,182,5,0.14)', color: '#9b7011' },
};

type TabFilter = 'All' | 'Members' | 'Admins' | 'Suspended';
const tabs: TabFilter[] = ['All', 'Members', 'Admins', 'Suspended'];

const navLinkBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '14px 14px', fontFamily: 'DM Sans, sans-serif',
  fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em',
  textTransform: 'uppercase', textDecoration: 'none',
  color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<TabFilter>('All');
  const [search, setSearch] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<AdminUser | null>(null);

  useEscapeKey(impersonateTarget !== null, () => setImpersonateTarget(null));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>('Action Failed');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const res = await getProfile();

      if (!res.success || !res.user) {
        router.push('/login');
        return;
      }

      if ((res.user as any).role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      setAuthChecked(true);
    };

    checkAdminAccess();
  }, [router]);

  useEffect(() => {
    if (authChecked) {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      if (tab !== 'All') queryParams.append('tab', tab);
      if (search) queryParams.append('search', search);

      fetch(`/api/admin/users?${queryParams.toString()}`).then(res => res.json()).then(data => {
        const dbUsers = data.users || [];
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalResults(data.pagination.total);
        } else {
          setTotalPages(1);
          setTotalResults(dbUsers.length);
        }

        const mapped = dbUsers.map((u: any) => ({
          id: u.id,
          name: u.name || 'Member',
          email: u.email,
          role: u.role,
          status: u.status === 'DEACTIVATED' ? 'suspended' : 'active',
          joined: u.createdAt,
          business: u.memberProfile?.business?.[0]?.business_name || u.memberProfile?.industry || ''
        }));
        setUsers(mapped);
      }).catch(console.error);
    }
  }, [authChecked, currentPage, tab, search]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function changeRole(id: string, role: Role) {
    // Cache the original role in case the backend request fails
    const originalUser = users.find(u => u.id === id);
    const originalRole = originalUser?.role;

    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
        showToast(`${originalUser?.name ?? 'User'} is now ${role}`);
      } else {
        // Display backend error message in the modal and revert UI selector state
        setErrorTitle('Role Update Failed');
        setErrorMsg(data.error || 'Failed to update user role.');
        if (originalRole) {
          setUsers(prev => prev.map(u => u.id === id ? { ...u, role: originalRole } : u));
        }
      }
    } catch (err) {
      console.error('Error changing role:', err);
      setErrorTitle('Role Update Failed');
      setErrorMsg('An unexpected error occurred while updating role.');
      if (originalRole) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role: originalRole } : u));
      }
    }
  }

  async function toggleStatus(id: string) {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const nextStatus = user.status === 'active' ? 'DEACTIVATED' : 'ACTIVE';

    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u));
        showToast(nextStatus === 'DEACTIVATED' ? 'User suspended' : 'User reactivated');
      } else {
        setErrorTitle('Status Update Failed');
        setErrorMsg(data.error || 'Failed to update user status.');
      }
    } catch (err) {
      console.error('Error changing status:', err);
      setErrorTitle('Status Update Failed');
      setErrorMsg('An unexpected error occurred while updating status.');
    }
  }

  async function confirmImpersonate() {
    if (!impersonateTarget) return;

    try {
      const res = await fetch(`/api/admin/users/${impersonateTarget.id}/impersonate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Now impersonating ${impersonateTarget.name}`);
        window.location.href = `/dashboard`;
      } else {
        setErrorTitle('Impersonation Error');
        setErrorMsg(data.error || "Impersonation failed");
        setImpersonateTarget(null);
      }
    } catch (err) {
      console.error(err);
      setErrorTitle('Impersonation Error');
      setErrorMsg("An unexpected error occurred during impersonation.");
    }
  }

  const stats = {
    total: users.filter(u => u.status !== 'suspended').length,
    members: users.filter(u => u.role === 'MEMBER' && u.status !== 'suspended').length,
    admins: users.filter(u => u.role === 'ADMIN' && u.status !== 'suspended').length,
    suspended: users.filter(u => u.status === 'suspended').length,
  };

  const filtered = users;

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e7b605', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>Checking access...</div>
      </div>
    );
  }


  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#000', color: '#fff', padding: '14px 24px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', zIndex: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Impersonate confirm modal */}
      {impersonateTarget && (
        <div onClick={() => setImpersonateTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 }}>
          <div role="dialog" aria-modal="true" aria-label={`Impersonate ${impersonateTarget.name}`} onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '36px', maxWidth: 460, width: '100%', position: 'relative' }}>
            <button onClick={() => setImpersonateTarget(null)} aria-label="Close dialog" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9a9585' }}>
              <X size={18} />
            </button>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9b7011', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Impersonate User</div>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: 8, color: '#2a2820' }}>View as {impersonateTarget.name}?</h3>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.6, marginBottom: 24 }}>
              You'll see the platform exactly as <strong>{impersonateTarget.name}</strong> ({impersonateTarget.email}) sees it. Use this to debug member issues, then exit impersonation to return to your admin account.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={confirmImpersonate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#e7b605', border: 'none', color: '#000', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <Repeat size={14} /> Start Impersonating
              </button>
              <button onClick={() => setImpersonateTarget(null)} style={{ padding: '12px 20px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#5a5650' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error modal */}
      {errorMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 450, padding: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderTop: '4px solid #c0392b', padding: '36px', maxWidth: 440, width: '100%', position: 'relative', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <button onClick={() => setErrorMsg(null)} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9a9585' }}>
              <X size={18} />
            </button>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#c0392b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Action Failed</div>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', color: '#2a2820', marginBottom: 12 }}>
              {errorTitle}
            </h3>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.6, marginBottom: 24 }}>
              {(() => {
                // Regex checks if the error message begins with a colon-terminated prefix (e.g., "Error:" or "Conflict:")
                // If matched, it separates the prefix and bolds it for better readability in the modal.
                const match = errorMsg.match(/^([^:]+:)\s*(.*)$/);
                if (match) {
                  return (
                    <>
                      <strong>{match[1]}</strong> {match[2]}
                    </>
                  );
                }
                return errorMsg;
              })()}
            </p>
            <button onClick={() => setErrorMsg(null)} style={{ padding: '10px 24px', background: '#c0392b', border: 'none', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div style={{ background: '#000', borderBottom: '1px solid #1a1a1a', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
          <div style={{ width: 1, height: 24, background: '#2a2a2a' }} />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</span>
        </div>
        <button onClick={async () => { localStorage.removeItem('fe_admin'); localStorage.removeItem('fe_my_submissions'); await logout(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid #2a2a2a', color: '#888', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer' }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Secondary Nav */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', display: 'flex', gap: 0, overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <Link href="/admin/dashboard" style={navLinkBase}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <LayoutDashboard size={14} /> Content Manager
          </Link>
          <Link href="/admin/events" style={navLinkBase}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <ClipboardList size={14} /> Review Events
          </Link>
          <Link href="/admin/offers" style={navLinkBase}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Tag size={14} /> Review Offers
          </Link>
          <Link href="/admin/awards" style={navLinkBase}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Trophy size={14} /> Review Awards
          </Link>
          <Link href="/admin/flagged" style={navLinkBase}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Flag size={14} /> Flagged Content
          </Link>
          <Link href="/admin/users" style={{ ...navLinkBase, color: '#e7b605', borderBottom: '2px solid #e7b605' }}>
            <Users size={14} /> Users
          </Link>
          <Link href="/admin/roadmap" style={navLinkBase}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Milestone size={14} /> Roadmap Editor
          </Link>
          <Link href="/admin/activity" style={navLinkBase}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Activity size={14} /> Activity Log
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px' }}>

        {/* Stats */}
        <div className="grid-4" style={{ gap: 2, marginBottom: 32 }}>
          {[
            { label: 'Total Users', value: stats.total, color: '#2a2820' },
            { label: 'Members', value: stats.members, color: '#5a5650' },
            { label: 'Admins', value: stats.admins, color: '#9b7011' },
            { label: 'Suspended', value: stats.suspended, color: '#c0392b' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '24px 28px' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
          {/* Tabs + search */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e0d8', padding: '0 24px', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '14px 18px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #e7b605' : '2px solid transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: tab === t ? '#2a2820' : '#9a9585', cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s' }}>
                  {t}
                  <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.7 }}>
                    ({t === 'All' ? stats.total : t === 'Members' ? stats.members : t === 'Admins' ? stats.admins : stats.suspended})
                  </span>
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 220, flex: '0 1 280px' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, business…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: '1px solid #e2e0d8', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px' }}>
              <Users size={36} style={{ color: '#e2e0d8', marginBottom: 16 }} />
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#9a9585', marginBottom: 8 }}>No users found</div>
              <div style={{ fontFamily: 'Noto Serif, serif', color: '#b8b4ae', fontSize: '14px' }}>Try a different tab or search term.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 120px 110px 260px', gap: 0, padding: '12px 24px', background: '#f9f9f7', borderBottom: '1px solid #e2e0d8', minWidth: 720 }}>
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>

              {filtered.map(u => {
                const rs = roleStyles[u.role];
                const suspended = u.status === 'suspended';
                return (
                  <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 120px 110px 260px', gap: 0, padding: '14px 24px', borderBottom: '1px solid #f0efe9', alignItems: 'center', opacity: suspended ? 0.7 : 1, minWidth: 720 }}>
                    {/* User */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 16, minWidth: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#000', color: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', flexShrink: 0 }}>
                        {u.name.charAt(0)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#2a2820', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: '#9a9585', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      </div>
                    </div>

                    {/* Role — inline editable if active, static badge if suspended */}
                    <div>
                      {suspended ? (
                        <span style={{ display: 'inline-flex', padding: '6px 12px', background: rs.bg, color: rs.color, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', borderRadius: 2 }}>
                          {u.role}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value as Role)}
                          style={{ padding: '6px 8px', border: '1px solid #e2e0d8', background: rs.bg, color: rs.color, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', outline: 'none', borderRadius: 2 }}
                        >
                          {ROLES.map(r => <option key={r} value={r} style={{ background: '#fff', color: '#2a2820' }}>{r}</option>)}
                        </select>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: suspended ? 'rgba(192,57,43,0.1)' : 'rgba(39,174,96,0.1)', color: suspended ? '#c0392b' : '#27ae60', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: suspended ? '#c0392b' : '#27ae60' }} />
                        {suspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>

                    {/* Joined */}
                    <div style={{ fontSize: '13px', color: '#9a9585' }}>
                      {new Date(u.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {suspended ? (
                        <button disabled title="Cannot impersonate a suspended user" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'not-allowed', color: '#aba7a5', opacity: 0.5 }}>
                          <Repeat size={13} /> Impersonate
                        </button>
                      ) : (
                        <button onClick={() => setImpersonateTarget(u)} title="Impersonate user" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', color: '#5a5650', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#e7b605'; e.currentTarget.style.color = '#9b7011'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#5a5650'; }}>
                          <Repeat size={13} /> Impersonate
                        </button>
                      )}
                      {suspended ? (
                        <button onClick={() => toggleStatus(u.id)} title="Reactivate account" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: '1px solid #27ae60', background: '#27ae60', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', color: '#fff', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#219653'; e.currentTarget.style.borderColor = '#219653'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#27ae60'; e.currentTarget.style.borderColor = '#27ae60'; }}>
                          <UserCheck size={13} /> Activate
                        </button>
                      ) : (
                        <button onClick={() => toggleStatus(u.id)} title="Suspend account" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', color: '#c0392b', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.background = 'rgba(192,57,43,0.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.background = 'transparent'; }}>
                          <UserX size={13} /> Suspend
                        </button>
                      )}
                    </div>
                  </div>
                )})}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32, fontFamily: 'DM Sans, sans-serif' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px',
                border: '1px solid #e2e0d8', background: '#fff', color: currentPage === 1 ? '#ccc' : '#2a2820',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s'
              }}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  padding: '8px 14px', border: '1px solid',
                  borderColor: currentPage === pageNum ? '#e7b605' : '#e2e0d8',
                  background: currentPage === pageNum ? '#e7b605' : '#fff',
                  color: currentPage === pageNum ? '#fff' : '#2a2820',
                  cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s'
                }}
              >
                {pageNum}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px',
                border: '1px solid #e2e0d8', background: '#fff', color: currentPage === totalPages ? '#ccc' : '#2a2820',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s'
              }}
            >
              Next
            </button>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { icon: <ShieldCheck size={14} style={{ color: '#9b7011' }} />, label: 'Role — change a user’s access level' },
            { icon: <Repeat size={14} />, label: 'Impersonate — view the platform as that user' },
            { icon: <UserX size={14} style={{ color: '#c0392b' }} />, label: 'Suspend — block account access' },
            { icon: <UserCheck size={14} style={{ color: '#27ae60' }} />, label: 'Activate — restore a suspended account' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
              {icon} {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
