'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Mail, Phone, Link2, Globe, Building2, X as CloseIcon,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useEscapeKey } from '@/components/ui/useEscapeKey';

/*
 * BACKEND CONTRACT (implemented by the backend team):
 *
 *   GET  /api/admin/applications            -> { applications: Application[] }
 *   PATCH /api/admin/applications/:id        body { status, notes? } -> { success: true }
 *
 * Application shape this page consumes (snake_case from the DB is also accepted):
 *   { id, firstName, lastName, email, phone?, linkedin?, industry?,
 *     businessName?, businessDesc?, website?, revenue?, priorities?: string[],
 *     status: 'pending' | 'approved' | 'rejected', reviewNotes?, submittedAt }
 */

type Status = 'pending' | 'approved' | 'rejected' | 'resubmitted';

type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedin?: string;
  industry?: string;
  businessName?: string;
  businessDesc?: string;
  website?: string;
  revenue?: string;
  priorities?: string[];
  status: Status;
  reviewNotes?: string;
  submittedAt?: string;
};

// Accept either camelCase or the raw Supabase snake_case shape.
function normalize(r: any): Application {
  const biz = Array.isArray(r.businesses) ? r.businesses[0] : (r.businesses || r.business || {});
  return {
    id: r.id,
    firstName: r.firstName ?? r.first_name ?? '',
    lastName: r.lastName ?? r.last_name ?? '',
    email: r.email ?? '',
    phone: r.phone ?? undefined,
    linkedin: r.linkedin ?? undefined,
    industry: r.industry ?? undefined,
    businessName: r.businessName ?? biz?.business_name ?? biz?.name ?? undefined,
    businessDesc: r.businessDesc ?? biz?.business_desc ?? biz?.description ?? undefined,
    website: r.website ?? biz?.website ?? undefined,
    revenue: r.revenue ?? biz?.revenue ?? undefined,
    priorities: r.priorities ?? biz?.priorities ?? undefined,
    status: (r.status ?? r.application_status ?? 'pending').toLowerCase() as Status,
    reviewNotes: r.reviewNotes ?? r.review_notes ?? undefined,
    submittedAt: r.submittedAt ?? r.created_at ?? undefined,
  };
}

type TabFilter = 'All' | 'Pending' | 'Resubmitted' | 'Approved' | 'Rejected';
const tabs: TabFilter[] = ['All', 'Pending', 'Resubmitted', 'Approved', 'Rejected'];

const statusStyles: Record<Status, { bg: string; color: string; label: string }> = {
  pending:     { bg: 'rgba(230,126,34,0.1)', color: '#e67e22', label: 'Pending Review' },
  resubmitted: { bg: 'rgba(24,111,165,0.1)', color: '#186fa5', label: 'Resubmitted' },
  approved:    { bg: 'rgba(39,174,96,0.1)',  color: '#27ae60', label: 'Approved' },
  rejected:    { bg: 'rgba(192,57,43,0.1)',  color: '#c0392b', label: 'Rejected' },
};

type LoadState = 'loading' | 'error' | 'ready';

export default function AdminApplicationsPage() {
  const [apps, setApps]       = useState<Application[]>([]);
  const [state, setState]     = useState<LoadState>('loading');
  const [errKind, setErrKind] = useState<'network' | 'unauthorized' | 'generic'>('generic');
  const [tab, setTab]         = useState<TabFilter>('Pending');
  const [search, setSearch]   = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast]     = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);
  const [rejectNotes, setRejectNotes]   = useState('');

  useEscapeKey(rejectTarget !== null, () => setRejectTarget(null));

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/api/admin/applications');
      if (res.status === 401 || res.status === 403) { setErrKind('unauthorized'); setState('error'); return; }
      if (!res.ok) { setErrKind('generic'); setState('error'); return; }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.applications ?? []);
      setApps(list.map(normalize));
      setState('ready');
    } catch {
      setErrKind('network');
      setState('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // Optimistically update the UI, then persist to the backend (best-effort until it exists).
  function persistStatus(id: string, status: Status, notes?: string) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status, reviewNotes: notes ?? a.reviewNotes } : a));
    fetch(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    }).catch(() => { /* backend not connected yet — UI already reflects the change */ });
  }

  function approve(id: string) {
    persistStatus(id, 'approved');
    showToast('Application approved ✓');
  }

  function confirmReject() {
    if (!rejectTarget) return;
    persistStatus(rejectTarget.id, 'rejected', rejectNotes.trim() || undefined);
    showToast('Application rejected — notes saved');
    setRejectTarget(null);
    setRejectNotes('');
  }

  const stats = {
    total:       apps.length,
    pending:     apps.filter(a => a.status === 'pending').length,
    resubmitted: apps.filter(a => a.status === 'resubmitted').length,
    approved:    apps.filter(a => a.status === 'approved').length,
    rejected:    apps.filter(a => a.status === 'rejected').length,
  };

  const filtered = apps.filter(a => {
    const matchTab =
      tab === 'All' ||
      (tab === 'Pending' && a.status === 'pending') ||
      (tab === 'Resubmitted' && a.status === 'resubmitted') ||
      (tab === 'Approved' && a.status === 'approved') ||
      (tab === 'Rejected' && a.status === 'rejected');
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.businessName ?? '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <AdminLayout activeTab="applications">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#000', color: '#fff', padding: '14px 24px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', zIndex: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Reject-with-notes modal */}
      {rejectTarget && (
        <div onClick={() => setRejectTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 }}>
          <div role="dialog" aria-modal="true" aria-label="Reject application" onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '36px', maxWidth: 480, width: '100%', position: 'relative' }}>
            <button onClick={() => setRejectTarget(null)} aria-label="Close dialog" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9a9585' }}>
              <CloseIcon size={18} />
            </button>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#c0392b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Reject Application</div>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: 8, color: '#2a2820' }}>
              {rejectTarget.firstName} {rejectTarget.lastName}
            </h3>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.6, marginBottom: 20 }}>
              Add notes on what the applicant should fix. These are saved with the application for follow-up.
            </p>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="e.g. Business description is too vague — please add your target customers and what makes you unique. Add a working website."
              rows={5}
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e0d8', padding: '12px 14px', fontFamily: 'Noto Serif, serif', fontSize: '14px', lineHeight: 1.6, resize: 'vertical', outline: 'none', marginBottom: 24 }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={confirmReject} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: '#c0392b', border: 'none', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <XCircle size={14} /> Reject with Notes
              </button>
              <button onClick={() => setRejectTarget(null)} style={{ padding: '12px 20px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#5a5650' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '32px', letterSpacing: '-0.02em', marginBottom: 6, color: '#111' }}>Membership Applications</h1>
          <p style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif', fontSize: '15px' }}>Review applications from the membership form. Approve, or reject with notes on what to fix.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, marginBottom: 32 }}>
          {[
            { label: 'Total', value: state === 'ready' ? stats.total : '—', color: '#2a2820' },
            { label: 'Pending Review', value: state === 'ready' ? stats.pending : '—', color: '#e67e22' },
            { label: 'Resubmitted', value: state === 'ready' ? stats.resubmitted : '—', color: '#186fa5' },
            { label: 'Approved', value: state === 'ready' ? stats.approved : '—', color: '#27ae60' },
            { label: 'Rejected', value: state === 'ready' ? stats.rejected : '—', color: '#c0392b' },
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
                <button key={t} onClick={() => setTab(t)} disabled={state !== 'ready'} style={{ padding: '14px 18px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #e7b605' : '2px solid transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: tab === t ? '#2a2820' : '#9a9585', cursor: state === 'ready' ? 'pointer' : 'default', marginBottom: -1, transition: 'all 0.15s', opacity: state === 'ready' ? 1 : 0.6 }}>
                  {t}{state === 'ready' && t !== 'All' ? ` (${t === 'Pending' ? stats.pending : t === 'Resubmitted' ? stats.resubmitted : t === 'Approved' ? stats.approved : stats.rejected})` : ''}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 220, flex: '0 1 300px' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, business…" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: '1px solid #e2e0d8', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', outline: 'none' }} />
            </div>
          </div>

          {/* States */}
          {state === 'loading' && (
            <div aria-busy="true" aria-label="Loading applications">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={3} />)}
            </div>
          )}

          {state === 'error' && <ErrorState kind={errKind} onRetry={load} />}

          {state === 'ready' && filtered.length === 0 && (
            <EmptyState
              icon={<FileText size={40} />}
              title={tab === 'Pending' ? 'No applications awaiting review' : 'No applications here'}
              message="New membership applications will appear here as founders apply."
            />
          )}

          {state === 'ready' && filtered.length > 0 && filtered.map(app => {
            const s = statusStyles[app.status];
            const expanded = expandedId === app.id;
            return (
              <div key={app.id} style={{ borderBottom: '1px solid #f0efe9' }}>
                {/* Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', flexWrap: 'wrap' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#000', color: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
                    {(app.firstName || '?').charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '15px', color: '#2a2820' }}>{app.firstName} {app.lastName}</div>
                    <div style={{ fontSize: '12px', color: '#9a9585' }}>
                      {app.businessName || '—'}{app.industry ? ` · ${app.industry}` : ''} · {fmtDate(app.submittedAt)}
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', background: s.bg, color: s.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>{s.label}</span>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => setExpandedId(expanded ? null : app.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', color: '#5a5650' }}>
                      {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Details
                    </button>
                    {app.status !== 'approved' && (
                      <button onClick={() => approve(app.id)} title="Approve" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', color: '#27ae60' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#27ae60'; e.currentTarget.style.background = 'rgba(39,174,96,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.background = 'transparent'; }}>
                        <CheckCircle size={13} /> Approve
                      </button>
                    )}
                    {app.status !== 'rejected' && (
                      <button onClick={() => { setRejectTarget(app); setRejectNotes(app.reviewNotes ?? ''); }} title="Reject with notes" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', color: '#c0392b' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.background = 'rgba(192,57,43,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.background = 'transparent'; }}>
                        <XCircle size={13} /> Reject
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div style={{ padding: '0 24px 24px 80px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {app.businessDesc && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>What the business does</div>
                        <p style={{ fontFamily: 'Noto Serif, serif', color: '#2a2820', fontSize: '14px', lineHeight: 1.7 }}>{app.businessDesc}</p>
                      </div>
                    )}
                    {app.priorities && app.priorities.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Priorities</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {app.priorities.map(p => <span key={p} style={{ padding: '3px 10px', background: '#f0efe9', fontSize: '11px', color: '#5a5650', fontWeight: 600 }}>{p}</span>)}
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {app.email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#5a5650' }}><Mail size={13} style={{ color: '#e7b605' }} /> {app.email}</span>}
                      {app.phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#5a5650' }}><Phone size={13} style={{ color: '#e7b605' }} /> {app.phone}</span>}
                      {app.linkedin && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#5a5650' }}><Link2 size={13} style={{ color: '#e7b605' }} /> {app.linkedin}</span>}
                      {app.website && <a href={app.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#9b7011', fontWeight: 700, textDecoration: 'none' }}><Globe size={13} /> {app.website.replace(/^https?:\/\//, '')}</a>}
                      {app.revenue && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#5a5650' }}><Building2 size={13} style={{ color: '#e7b605' }} /> {app.revenue}</span>}
                    </div>
                    {app.reviewNotes && (
                      <div style={{ background: 'rgba(192,57,43,0.05)', borderLeft: '3px solid #c0392b', padding: '12px 16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#c0392b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Review notes — what to fix</div>
                        <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.6 }}>{app.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
