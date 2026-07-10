'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle, XCircle, Star, Trophy, LayoutDashboard, ClipboardList, LogOut, ChevronDown, ChevronUp, Calendar, Tag, Mail, Globe, Flag, Users, Milestone, Activity } from 'lucide-react';
import Logo from '@/components/Logo';
import { getProfile } from '@/app/actions/profile';
import { logout } from '@/app/actions/auth';
import AdminLayout from '@/components/AdminLayout';
import type { Nomination } from '@/app/awards/nominate/page';

type Tab = 'All' | 'Pending' | 'Approved' | 'Rejected' | 'Winner';
const tabs: Tab[] = ['All', 'Pending', 'Approved', 'Rejected', 'Winner'];

const statusColors: Record<Nomination['status'], { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(230,126,34,0.1)', color: '#e67e22', label: 'Pending' },
  approved: { bg: 'rgba(39,174,96,0.1)', color: '#27ae60', label: 'Approved' },
  rejected: { bg: 'rgba(192,57,43,0.1)', color: '#c0392b', label: 'Rejected' },
  winner: { bg: 'rgba(231,182,5,0.12)', color: '#9b7011', label: '🏆 Winner' },
};

export default function AdminAwardsPage() {
  const router = useRouter();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [tab, setTab] = useState<Tab>('All');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemPerPage = 3;

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

    async function loadNominations() {
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemPerPage.toString(),
        });

        const res = await fetch(`/api/nominations?${queryParams.toString()}`);
        if (!res.ok) return;
        const data = await res.json();

        const dbNoms = Array.isArray(data) ? data : (data.nominations || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalResults(data.pagination.total);
        } else {
          setTotalPages(1);
          setTotalResults(dbNoms.length);
        }

        const mapped: Nomination[] = dbNoms.map((n: any) => ({
          id: n.id,
          awardId: n.award_id,
          awardName: n.award?.name || '',
          awardOrg: n.award?.org || '',
          businessName: n.business_name,
          category: n.award?.category || '',
          contactName: n.contact_name,
          contactEmail: n.contact_email,
          website: n.website || '',
          achievement: n.achievement,
          statement: n.statement,
          status: n.status.toLowerCase() as any,
          submittedAt: n.created_at,
        }));
        setNominations(mapped);
      } catch (err) {
        console.error('Failed to load nominations from DB:', err);
      }
    }

    loadNominations();
  }, [authChecked, currentPage, tab]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  async function updateNom(id: string, changes: Partial<Nomination>) {
    try {
      const dbChanges: any = {};
      if (changes.status) dbChanges.status = changes.status.toUpperCase();
      if (changes.businessName) dbChanges.business_name = changes.businessName;
      if (changes.contactName) dbChanges.contact_name = changes.contactName;
      if (changes.contactEmail) dbChanges.contact_email = changes.contactEmail;
      if (changes.website) dbChanges.website = changes.website;
      if (changes.achievement) dbChanges.achievement = changes.achievement;
      if (changes.statement) dbChanges.statement = changes.statement;

      const res = await fetch(`/api/nominations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbChanges),
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(errData.error || 'Failed to update nomination in DB');
        return;
      }

      setNominations(prev => prev.map(n => n.id === id ? { ...n, ...changes } : n));
    } catch (err) {
      console.error('Error updating nomination status:', err);
      showToast('Error connecting to the server');
    }
  }

  const filtered = nominations
    .filter(n => tab === 'All' || n.status === tab.toLowerCase())
    .filter(n => {
      const q = search.toLowerCase();
      return !search || n.businessName.toLowerCase().includes(q) || n.awardName.toLowerCase().includes(q) || n.contactName.toLowerCase().includes(q);
    });

  const counts = {
    All: nominations.length,
    Pending: nominations.filter(n => n.status === 'pending').length,
    Approved: nominations.filter(n => n.status === 'approved').length,
    Rejected: nominations.filter(n => n.status === 'rejected').length,
    Winner: nominations.filter(n => n.status === 'winner').length,
  };

  if (!authChecked) {
    return <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#e7b605', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>Checking access...</div>
    </div>;
  }

  return (
    <AdminLayout activeTab="awards">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px', width: '100%', boxSizing: 'border-box' }}>

        {/* Stats */}
        <div className="grid-4" style={{ gap: 2, marginBottom: 32 }}>
          {[
            { label: 'Total Nominations', value: counts.All, color: '#2a2820' },
            { label: 'Pending Review', value: counts.Pending, color: '#e67e22' },
            { label: 'Approved', value: counts.Approved, color: '#27ae60' },
            { label: 'Winners Selected', value: counts.Winner, color: '#9b7011' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '24px 28px' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '20px 24px', marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{ padding: '8px 18px', border: 'none', cursor: 'pointer', background: tab === t ? '#000' : 'transparent', color: tab === t ? '#e7b605' : '#9a9585', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'all 0.2s' }}
              >
                {t}{t !== 'All' && <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.7 }}>({counts[t]})</span>}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
            <input className="input-field" placeholder="Search nominations..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, margin: 0, width: 280 }} />
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid #e2e0d8' }}>
            <Trophy size={36} style={{ color: '#e2e0d8', marginBottom: 16 }} />
            <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: 8 }}>No nominations found</div>
            <div style={{ color: '#9a9585' }}>{tab === 'Pending' ? 'No nominations awaiting review.' : 'No nominations match your current filter.'}</div>
          </div>
        )}

        {/* Nomination rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(nom => {
            const sc = statusColors[nom.status];
            const isExpanded = expandedId === nom.id;
            return (
              <div key={nom.id} style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
                {/* Summary row */}
                <div
                  style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setExpandedId(isExpanded ? null : nom.id)}
                >
                  <div style={{ width: 36, height: 36, background: '#f0efe9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9b7011', flexShrink: 0 }}>
                    <Trophy size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#2a2820', marginBottom: 2 }}>{nom.businessName}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '12px', color: '#9a9585', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Trophy size={11} />{nom.awardName}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={11} />{nom.category}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{nom.contactEmail}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9a9585', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Calendar size={11} />
                    {new Date(nom.submittedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <span style={{ padding: '4px 10px', background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                    {sc.label}
                  </span>
                  <div style={{ color: '#9a9585', flexShrink: 0 }}>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e2e0d8', padding: '24px', background: '#fafaf8' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9585', marginBottom: 8 }}>Key Achievement</div>
                        <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, margin: 0, marginBottom: 16 }}>{nom.achievement}</p>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9585', marginBottom: 8 }}>Nomination Statement</div>
                        <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{nom.statement}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { label: 'Business', value: nom.businessName },
                          { label: 'Contact', value: nom.contactName },
                          { label: 'Email', value: nom.contactEmail },
                          { label: 'Award', value: nom.awardName },
                          { label: 'Organisation', value: nom.awardOrg },
                          ...(nom.website ? [{ label: 'Website', value: nom.website }] : []),
                        ].map(row => (
                          <div key={row.label}>
                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9585', marginBottom: 3 }}>{row.label}</div>
                            <div style={{ fontSize: '13px', color: '#2a2820', fontWeight: 600 }}>{row.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid #e2e0d8', paddingTop: 20 }}>
                      {nom.status !== 'approved' && nom.status !== 'winner' && (
                        <button onClick={() => { updateNom(nom.id, { status: 'approved' }); showToast('Nomination approved ✓'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#27ae60', color: '#fff', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                          <CheckCircle size={14} /> Approve
                        </button>
                      )}
                      {nom.status !== 'rejected' && nom.status !== 'winner' && (
                        <button onClick={() => { updateNom(nom.id, { status: 'rejected' }); showToast('Nomination rejected.'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#c0392b', color: '#fff', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                          <XCircle size={14} /> Reject
                        </button>
                      )}
                      {(nom.status === 'approved') && (
                        <button onClick={() => { updateNom(nom.id, { status: 'winner' }); showToast('🏆 Marked as Winner!'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#000', color: '#e7b605', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                          <Trophy size={14} /> Mark as Winner
                        </button>
                      )}
                      {nom.status === 'winner' && (
                        <button onClick={() => { updateNom(nom.id, { status: 'approved' }); showToast('Winner status removed.'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'transparent', color: '#9a9585', border: '1px solid #e2e0d8', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                          Remove Winner
                        </button>
                      )}
                      {nom.website && (
                        <a href={nom.website.startsWith('http') ? nom.website : `https://${nom.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1px solid #e2e0d8', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#5a5650', textDecoration: 'none' }}>
                          <Globe size={13} /> Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#000', color: '#fff', padding: '14px 24px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
