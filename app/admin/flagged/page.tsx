'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flag, LayoutDashboard, ClipboardList, Tag, Trophy,
  LogOut, CheckCircle, XCircle, Eye, Trash2, AlertTriangle, Users, Milestone, Activity,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { getProfile } from '@/app/actions/profile';
import { logout } from '@/app/actions/auth';
import { useEscapeKey } from '@/components/ui/useEscapeKey';
import AdminLayout from '@/components/AdminLayout';

type FlagStatus = 'pending' | 'resolved' | 'dismissed';

type FlagReport = {
  id: string;
  contentType: 'post' | 'comment';
  contentId: string;
  contentPreview: string;
  authorName: string;
  reportedBy: string;
  reason: string;
  details?: string;
  status: FlagStatus;
  reportedAt: string;
};

type TabFilter = 'All' | 'Pending' | 'Resolved' | 'Dismissed';
const tabs: TabFilter[] = ['All', 'Pending', 'Resolved', 'Dismissed'];

const statusStyles: Record<FlagStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'rgba(230,126,34,0.1)', color: '#e67e22', label: 'Pending Review' },
  resolved:  { bg: 'rgba(39,174,96,0.1)',  color: '#27ae60', label: 'Resolved' },
  dismissed: { bg: 'rgba(90,86,80,0.1)',   color: '#5a5650', label: 'Dismissed' },
};

const navLinkBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '14px 14px', fontFamily: 'DM Sans, sans-serif',
  fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em',
  textTransform: 'uppercase', textDecoration: 'none',
  color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s',
};

export default function AdminFlaggedPage() {
  const router = useRouter();
  const [reports, setReports] = useState<FlagReport[]>([]);
  const [tab, setTab]         = useState<TabFilter>('All');
  const [authChecked, setAuthChecked] = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const [preview, setPreview] = useState<FlagReport | null>(null);

  useEscapeKey(preview !== null, () => setPreview(null));

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

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
    if (!authChecked) return;

    async function loadReports() {
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString()
        });
        if (tab !== 'All') queryParams.append('status', tab.toUpperCase());

        const res = await fetch(`/api/admin/flagged?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const dbReports = data.reports || [];
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
            setTotalResults(data.pagination.total);
          } else {
            setTotalPages(1);
            setTotalResults(dbReports.length);
          }

          const mapped: FlagReport[] = dbReports.map((r: any) => ({
            id: r.id,
            contentType: r.content_type,
            contentId: r.content_id,
            contentPreview: r.content_preview,
            authorName: r.author_name,
            reportedBy: r.reported_by,
            reason: r.reason,
            details: r.details || '',
            status: r.status.toLowerCase() as FlagStatus,
            reportedAt: r.reported_at
          }));
          setReports(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch flagged reports:', err);
      }
    }

    loadReports();
  }, [authChecked, currentPage, tab]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function persist(updated: FlagReport[]) {
    localStorage.setItem('fe_flag_reports', JSON.stringify(updated));
    setReports(updated);
  }

  function resolveReport(id: string) {
    const updated = reports.map(r => r.id === id ? { ...r, status: 'resolved' as const } : r);
    persist(updated);
    // Also mark the post as removed from the feed
    const report = reports.find(r => r.id === id);
    if (report?.contentType === 'post') {
      const posts = JSON.parse(localStorage.getItem('fe_feed_posts') || '[]');
      const updated = posts.map((p: any) => p.id === report.contentId ? { ...p, removed: true } : p);
      localStorage.setItem('fe_feed_posts', JSON.stringify(updated));
    }
    if (report?.contentType === 'comment') {
      const raw = localStorage.getItem('fe_post_comments');
      if (raw) {
        const all = JSON.parse(raw).map((c: any) => c.id === report.contentId ? { ...c, removed: true } : c);
        localStorage.setItem('fe_post_comments', JSON.stringify(all));
      }
    }
    showToast('Content removed and report resolved ✓');
    setPreview(null);
  }

  function dismissReport(id: string) {
    const updated = reports.map(r => r.id === id ? { ...r, status: 'dismissed' as const } : r);
    persist(updated);
    showToast('Report dismissed — no action taken.');
    setPreview(null);
  }

  function deleteReport(id: string) {
    persist(reports.filter(r => r.id !== id));
    showToast('Report deleted.');
    setPreview(null);
  }

  const filtered = reports;

  const stats = {
    total:     reports.length,
    pending:   reports.filter(r => r.status === 'pending').length,
    resolved:  reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e7b605', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>Checking access...</div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab="flagged">

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#000', color: '#fff', padding: '14px 24px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', zIndex: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Content preview modal */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 }}>
          <div role="dialog" aria-modal="true" aria-label="Review flag report" onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '36px', maxWidth: 560, width: '100%' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#c0392b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              {preview.contentType} — {preview.reason}
            </div>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', marginBottom: 16 }}>Review Flag Report</h3>
            <div style={{ background: '#f9f9f7', border: '1px solid #e2e0d8', borderLeft: '4px solid #c0392b', padding: '16px', marginBottom: 20 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Content Preview</div>
              <p style={{ fontFamily: 'Noto Serif, serif', color: '#2a2820', fontSize: '14px', lineHeight: 1.6 }}>"{preview.contentPreview}"</p>
              <div style={{ marginTop: 10, fontSize: '12px', color: '#9a9585' }}>
                by <strong>{preview.authorName}</strong> · reported by <strong>{preview.reportedBy}</strong>
              </div>
            </div>
            {preview.details && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Reporter Notes</div>
                <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.6 }}>{preview.details}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {preview.status === 'pending' && (
                <>
                  <button onClick={() => resolveReport(preview.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: '#c0392b', border: 'none', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    <Trash2 size={14} /> Remove Content
                  </button>
                  <button onClick={() => dismissReport(preview.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: 'transparent', border: '1px solid #e2e0d8', color: '#5a5650', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    <CheckCircle size={14} /> Dismiss Report
                  </button>
                </>
              )}
              <button onClick={() => setPreview(null)} style={{ padding: '12px 20px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#9a9585', marginLeft: 'auto' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px', width: '100%', boxSizing: 'border-box' }}>

        {/* Stats */}
        <div className="grid-4" style={{ gap: 2, marginBottom: 32 }}>
          {[
            { label: 'Total Reports',  value: stats.total,     color: '#2a2820' },
            { label: 'Pending Review', value: stats.pending,   color: '#e67e22' },
            { label: 'Resolved',       value: stats.resolved,  color: '#27ae60' },
            { label: 'Dismissed',      value: stats.dismissed, color: '#5a5650' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '24px 28px' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs + Table */}
        <div style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e0d8', padding: '0 24px' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '14px 20px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #e7b605' : '2px solid transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: tab === t ? '#2a2820' : '#9a9585', cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s' }}>
                {t}
                <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.7 }}>
                  ({t === 'All' ? stats.total : t === 'Pending' ? stats.pending : t === 'Resolved' ? stats.resolved : stats.dismissed})
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px' }}>
              <Flag size={36} style={{ color: '#e2e0d8', marginBottom: 16 }} />
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#9a9585', marginBottom: 8 }}>
                No {tab !== 'All' ? tab.toLowerCase() : ''} reports
              </div>
              <div style={{ fontFamily: 'Noto Serif, serif', color: '#b8b4ae', fontSize: '14px' }}>
                Flagged content from members will appear here.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 130px 130px 130px 140px', gap: 0, padding: '12px 24px', background: '#f9f9f7', borderBottom: '1px solid #e2e0d8', minWidth: 760 }}>
                {['Type', 'Content Preview', 'Author', 'Reported By', 'Reason', 'Actions'].map(h => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>

              {filtered.map(report => {
                const s = statusStyles[report.status];
                return (
                  <div key={report.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 130px 130px 130px 140px', gap: 0, padding: '16px 24px', borderBottom: '1px solid #f0efe9', alignItems: 'center', minWidth: 760 }}>
                    {/* Type */}
                    <div>
                      <span style={{ padding: '3px 10px', background: report.contentType === 'post' ? 'rgba(231,182,5,0.1)' : '#f0efe9', color: report.contentType === 'post' ? '#9b7011' : '#5a5650', fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {report.contentType}
                      </span>
                    </div>

                    {/* Preview */}
                    <div style={{ paddingRight: 16 }}>
                      <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '13px', color: '#2a2820', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        "{report.contentPreview}"
                      </div>
                      <div style={{ fontSize: '11px', color: '#9a9585', marginTop: 4 }}>
                        {new Date(report.reportedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Author */}
                    <div style={{ fontSize: '13px', color: '#2a2820', fontWeight: 600 }}>{report.authorName}</div>

                    {/* Reported by */}
                    <div style={{ fontSize: '13px', color: '#9a9585' }}>{report.reportedBy}</div>

                    {/* Reason */}
                    <div>
                      <div style={{ fontSize: '12px', color: '#5a5650', fontWeight: 600, marginBottom: 4 }}>{report.reason}</div>
                      <span style={{ padding: '2px 8px', background: s.bg, color: s.color, fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {s.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => setPreview(report)} title="View details" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', color: '#5a5650', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#e7b605'; e.currentTarget.style.color = '#9b7011'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#5a5650'; }}>
                        <Eye size={12} /> Review
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button onClick={() => resolveReport(report.id)} title="Remove content" style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', border: '1px solid #e2e0d8', background: 'transparent', cursor: 'pointer', color: '#c0392b', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.background = 'rgba(192,57,43,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.background = 'transparent'; }}>
                            <XCircle size={14} />
                          </button>
                          <button onClick={() => dismissReport(report.id)} title="Dismiss report" style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', border: '1px solid #e2e0d8', background: 'transparent', cursor: 'pointer', color: '#27ae60', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#27ae60'; e.currentTarget.style.background = 'rgba(39,174,96,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.background = 'transparent'; }}>
                            <CheckCircle size={14} />
                          </button>
                        </>
                      )}
                      <button onClick={() => { if (confirm('Delete this report record?')) deleteReport(report.id); }} title="Delete record" style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', border: '1px solid #e2e0d8', background: 'transparent', cursor: 'pointer', color: '#9a9585', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#9a9585'; }}>
                        <Trash2 size={14} />
                      </button>
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
            { icon: <Eye size={14} />, label: 'Review — open full report and act' },
            { icon: <XCircle size={14} style={{ color: '#c0392b' }} />, label: 'Remove — delete content from feed' },
            { icon: <CheckCircle size={14} style={{ color: '#27ae60' }} />, label: 'Dismiss — no violation found' },
            { icon: <Trash2 size={14} />, label: 'Delete — remove report record' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
              {icon} {label}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
