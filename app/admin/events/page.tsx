'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle, XCircle, Star, LayoutDashboard, ClipboardList, Calendar, MapPin, LogOut, ChevronDown, ChevronUp, Clock, Users, DollarSign, Mail, Tag, Trophy, Flag, Milestone, Activity } from 'lucide-react';
import Logo from '@/components/Logo';
import { getProfile } from '@/app/actions/profile';
import { logout } from '@/app/actions/auth';
import AdminLayout from '@/components/AdminLayout';

type EventStatus = 'approved' | 'pending' | 'rejected' | 'archived';

type AdminEvent = {
  id: string | number;
  title: string;
  category: string;
  host: string;
  hostEmail: string;
  date: string;
  time: string;
  duration: string;
  capacity: number;
  price: string;
  submittedDate: string;
  status: EventStatus;
  featured: boolean;
  isOnline: boolean;
  location: string;
  description: string;
  tags: string[];
  submissionType: 'Guest' | 'Member';
  guestName?: string;
  guestEmail?: string;
  guestBusiness?: string;
};

type Tab = 'All' | 'Pending' | 'Approved' | 'Rejected';

const tabs: Tab[] = ['All', 'Pending', 'Approved', 'Rejected'];

const statusColors: Record<EventStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(230,126,34,0.1)', color: '#e67e22', label: 'Pending' },
  approved: { bg: 'rgba(39,174,96,0.1)', color: '#27ae60', label: 'Approved' },
  rejected: { bg: 'rgba(192,57,43,0.1)', color: '#c0392b', label: 'Rejected' },
  archived: { bg: 'rgba(90,86,80,0.1)', color: '#5a5650', label: 'Archived' },
};

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [tab, setTab] = useState<Tab>('All');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

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

  // Persist approved events to localStorage so Content Manager can read them
  function persistApproved(evts: AdminEvent[]) {
    const approved = evts.filter(e => e.status === 'approved');
    localStorage.setItem('fe_approved_events', JSON.stringify(approved));
  }

  useEffect(() => {
    async function loadEvents() {
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          adminView: 'true'
        });
        if (tab !== 'All') queryParams.append('status', tab.toUpperCase());
        if (search) queryParams.append('q', search);

        const res = await fetch(`/api/events?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const dbData = data.events || [];
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
            setTotalResults(data.pagination.total);
          } else {
            setTotalPages(1);
            setTotalResults(dbData.length);
          }

          const mapped: AdminEvent[] = dbData.map((e: any) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            host: e.guestName || e.host || "Member",
            hostEmail: e.guestEmail || "Registered Member",
            submissionType: e.guestEmail ? "Guest" : "Member",
            guestName: e.guestName,
            guestEmail: e.guestEmail,
            guestBusiness: e.guestBusiness,
            date: e.date,
            time: e.time,
            duration: e.duration || "2 Hours",
            capacity: e.capacity || 50,
            price: e.price,
            submittedDate: new Date(e.created_at || Date.now()).toLocaleDateString(),
            status: e.status.toLowerCase() as EventStatus,
            featured: e.featured || false,
            isOnline: e.location ? (
              e.location.toLowerCase().includes('online') ||
              e.location.toLowerCase().includes('zoom') ||
              e.location.toLowerCase().includes('meeting link') ||
              e.location.toLowerCase().includes('provided upon registration')
            ) : false,
            location: e.location,
            description: e.description,
            tags: e.tags && e.tags.length > 0 ? e.tags : [e.category]
          }));
          setEvents(mapped);
          persistApproved(mapped);
        }
      } catch (err) {
        console.error("Failed to load admin events:", err);
      }
    }
    if (authChecked) {
      loadEvents();
    }
  }, [authChecked, currentPage, tab, search]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function approve(id: string | number) {
    try {
      await fetch(`/api/events/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' })
      });
    } catch (err) { console.error(err); }
    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, status: 'approved' as EventStatus } : e);
      persistApproved(updated);
      return updated;
    });
    showToast('Event approved ✓');
  }

  async function reject(id: string | number) {
    try {
      await fetch(`/api/events/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' })
      });
    } catch (err) { console.error(err); }
    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, status: 'rejected' as EventStatus, featured: false } : e);
      persistApproved(updated);
      return updated;
    });
    showToast('Event rejected.');
  }

  async function toggleFeatured(id: string | number) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const nowFeatured = !ev.featured;
    try {
      await fetch(`/api/events/${id}/feature`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: nowFeatured })
      });
    } catch (err) { console.error(err); }
    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, featured: nowFeatured } : e);
      persistApproved(updated);
      return updated;
    });
    showToast(nowFeatured ? 'Event featured ✓' : 'Event unfeatured.');
  }

  const filtered = events;

  const stats = {
    total: events.length,
    pending: events.filter(e => e.status === 'pending').length,
    approved: events.filter(e => e.status === 'approved').length,
    rejected: events.filter(e => e.status === 'rejected').length,
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e7b605', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>Checking access...</div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab="events">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px', width: '100%', boxSizing: 'border-box' }}>
        {/* Stats */}
        <div className="grid-4" style={{ gap: 2, marginBottom: 32 }}>
          {[
            { label: 'Total Submitted', value: stats.total, color: '#2a2820' },
            { label: 'Pending Review', value: stats.pending, color: '#e67e22' },
            { label: 'Approved', value: stats.approved, color: '#27ae60' },
            { label: 'Rejected', value: stats.rejected, color: '#c0392b' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '24px 28px' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '20px 24px', marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 18px', border: 'none', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px',
                  letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'all 0.2s',
                  background: tab === t ? '#000' : 'transparent',
                  color: tab === t ? '#e7b605' : '#9a9585',
                }}
              >
                {t}
                {t !== 'All' && (
                  <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.7 }}>
                    ({t === 'Pending' ? stats.pending : t === 'Approved' ? stats.approved : stats.rejected})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
            <input
              className="input-field"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, margin: 0, fontSize: '14px', padding: '10px 14px 10px 36px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
              No events match your filters.
            </div>
          )}

          {filtered.map((event, i) => {
            const s = statusColors[event.status];
            const isExpanded = expandedId === event.id;
            return (
              <div key={event.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #e2e0d8' : 'none', borderLeft: event.featured ? '3px solid #e7b605' : '3px solid transparent' }}>
                {/* Row header — clickable */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 20,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    background: isExpanded ? '#fafaf8' : '#fff',
                  }}
                  onMouseEnter={el => (el.currentTarget.style.background = '#fafaf8')}
                  onMouseLeave={el => (el.currentTarget.style.background = isExpanded ? '#fafaf8' : '#fff')}
                >
                  {/* Expand chevron */}
                  <div style={{ flexShrink: 0, marginTop: 2, color: '#9a9585' }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#2a2820' }}>{event.title}</span>
                      {event.featured && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(231,182,5,0.12)', color: '#9b7011', padding: '2px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 2 }}>
                          <Star size={9} fill="#9b7011" /> Featured
                        </span>
                      )}
                      {event.guestName || event.guestEmail ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', background: '#eae8e1', color: '#5a5650', padding: '2px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 2 }}>
                          Guest Submission
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(231,182,5,0.08)', color: '#9b7011', padding: '2px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: 2 }}>
                          Member Submission
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: '13px', color: '#9a9585' }}>
                        <strong style={{ color: '#5a5650' }}>{event.category}</strong> · by {event.host}
                        <span
                          style={{
                            marginLeft: 8,
                            padding: '2px 8px',
                            background:
                              event.submissionType === 'Guest'
                                ? '#fff3cd'
                                : '#e8f5e9',
                            color:
                              event.submissionType === 'Guest'
                                ? '#856404'
                                : '#2e7d32',
                            borderRadius: 4,
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {event.submissionType}
                        </span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#9a9585' }}>
                        <Calendar size={11} style={{ color: '#e7b605' }} /> {event.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#9a9585' }}>
                        <MapPin size={11} style={{ color: '#e7b605' }} /> {event.location}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9a9585' }}>Submitted: {event.submittedDate}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <span style={{ background: s.bg, color: s.color, padding: '4px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2 }}>
                      {s.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {event.status === 'pending' && (
                      <>
                        <ActionBtn onClick={() => approve(event.id)} color="#27ae60" hoverColor="#1e8449" label="Approve" icon={<CheckCircle size={13} />} />
                        <ActionBtn onClick={() => reject(event.id)} color="#c0392b" hoverColor="#a93226" label="Reject" icon={<XCircle size={13} />} />
                        <FeatureBtn featured={event.featured} onClick={() => toggleFeatured(event.id)} />
                      </>
                    )}
                    {event.status === 'approved' && (
                      <>
                        <ActionBtn onClick={() => reject(event.id)} color="#c0392b" hoverColor="#a93226" label="Reject" icon={<XCircle size={13} />} />
                        <FeatureBtn featured={event.featured} onClick={() => toggleFeatured(event.id)} />
                      </>
                    )}
                    {event.status === 'rejected' && (
                      <ActionBtn onClick={() => approve(event.id)} color="#27ae60" hoverColor="#1e8449" label="Approve" icon={<CheckCircle size={13} />} />
                    )}
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div style={{ background: '#fafaf8', borderTop: '1px solid #e2e0d8', padding: '28px 32px 28px 52px' }}>
                    {/* Guest details if applicable */}
                    {(event.guestName || event.guestBusiness) && (
                      <div style={{ marginBottom: 24, padding: '16px', background: '#f0efe9', borderLeft: '3px solid #e7b605' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#5a5650', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Guest Submitter Details</div>
                        <div style={{ fontSize: '13px', color: '#2a2820' }}>
                          <strong>Name:</strong> {event.guestName || 'N/A'}
                          {event.guestBusiness && <> · <strong>Company:</strong> {event.guestBusiness}</>}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Description</div>
                      <p style={{ fontSize: '14px', color: '#3a3830', lineHeight: 1.7, margin: 0 }}>{event.description}</p>
                    </div>

                    {/* Details grid */}
                    <div className="admin-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 32px', marginBottom: 24 }}>
                      <DetailField icon={<Clock size={13} />} label="Time" value={`${event.date} at ${event.time}`} />
                      <DetailField icon={<Clock size={13} />} label="Duration" value={event.duration} />
                      <DetailField icon={<Users size={13} />} label="Capacity" value={`${event.capacity} attendees`} />
                      <DetailField icon={<DollarSign size={13} />} label="Price / Tickets" value={event.price} />
                      <DetailField icon={<MapPin size={13} />} label="Location" value={event.isOnline ? 'Online Event' : event.location} />
                      <DetailField icon={<Mail size={13} />} label="Contact Email" value={event.hostEmail} />
                    </div>

                    {/* Tags */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={11} /> Tags
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {event.tags.map(tag => (
                          <span key={tag} style={{ background: '#f0efe9', color: '#5a5650', padding: '4px 10px', fontSize: '12px', fontWeight: 600, borderRadius: 2 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: '12px', color: '#9a9585', textAlign: 'right' }}>
          Showing {filtered.length} of {totalResults} events
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
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 999,
          background: '#e7b605', color: '#000',
          padding: '14px 24px', fontFamily: 'DM Sans, sans-serif',
          fontWeight: 800, fontSize: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </AdminLayout>
  );
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: '#e7b605' }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: '14px', color: '#3a3830', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function ActionBtn({
  onClick, color, hoverColor, label, icon,
}: {
  onClick: () => void;
  color: string;
  hoverColor: string;
  label: string;
  icon: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '7px 14px', border: 'none', cursor: 'pointer',
        background: hovered ? hoverColor : color,
        color: '#fff', fontFamily: 'DM Sans, sans-serif',
        fontWeight: 700, fontSize: '12px', letterSpacing: '0.04em',
        transition: 'background 0.15s', borderRadius: 2,
      }}
    >
      {icon} {label}
    </button>
  );
}

function FeatureBtn({ featured, onClick }: { featured: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '7px 14px', border: `1px solid ${featured ? '#e7b605' : '#e2e0d8'}`,
        cursor: 'pointer',
        background: featured ? (hovered ? '#f0d000' : '#e7b605') : (hovered ? '#f0efe9' : '#fff'),
        color: featured ? '#000' : '#9a9585',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px',
        letterSpacing: '0.04em', transition: 'all 0.15s', borderRadius: 2,
      }}
    >
      <Star size={12} fill={featured ? '#000' : 'none'} stroke={featured ? '#000' : '#9a9585'} />
      {featured ? 'Unfeature' : 'Feature'}
    </button>
  );
}
