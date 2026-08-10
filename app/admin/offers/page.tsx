'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle, XCircle, Star, LayoutDashboard, ClipboardList, LogOut, ChevronDown, ChevronUp, Calendar, MapPin, Tag, Percent, Gift, Zap, Building2, Trophy, Flag, Users, Compass, Ticket, Milestone, Activity, Plus, X, Trash2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { getProfile } from '@/app/actions/profile';
import { logout } from '@/app/actions/auth';
import AdminLayout from '@/components/AdminLayout';
import type { Offer } from '@/app/offers/page';

type Tab = 'All' | 'Pending' | 'Approved' | 'Rejected';
const tabs: Tab[] = ['All', 'Pending', 'Approved', 'Rejected'];

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: 'rgba(230,126,34,0.1)', color: '#e67e22', label: 'Pending' },
  approved: { bg: 'rgba(39,174,96,0.1)',  color: '#27ae60', label: 'Approved' },
  rejected: { bg: 'rgba(192,57,43,0.1)',  color: '#c0392b', label: 'Rejected' },
  archived: { bg: 'rgba(90,86,80,0.1)',   color: '#5a5650', label: 'Archived' },
  expired:  { bg: 'rgba(192,57,43,0.1)',  color: '#c0392b', label: 'Expired' },
};

const typeIcons: Record<Offer['type'], React.ReactNode> = {
  percentage: <Percent size={13} />,
  bogo:       <Gift size={13} />,
  fixed:      <Tag size={13} />,
  custom:     <Zap size={13} />,
};

function persistApprovedOffers(offers: Offer[]) {
  const approved = offers.filter(o => o.status === 'approved');
  localStorage.setItem('fe_approved_offers', JSON.stringify(approved));
}

export default function AdminOffersPage() {
  const router = useRouter();
  const [offers, setOffers]           = useState<Offer[]>([]);
  const [tab, setTab]                 = useState<Tab>('All');
  const [search, setSearch]           = useState('');
  const [toast, setToast]             = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [passportOffers, setPassportOffers] = useState<Record<string, { isPassport: boolean; type: 'ticket' | 'membership'; promoCode: string }>>({});
  const [globalStats, setGlobalStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;

  const [membersList, setMembersList] = useState<{ id: string; name: string; email: string; businessName: string }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creatingOffer, setCreatingOffer] = useState(false);
  const [deleteModalOffer, setDeleteModalOffer] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingOffer, setIsDeletingOffer] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: '',
    businessName: '',
    onBehalfOfMemberId: '',
    category: 'Professional Services',
    type: 'percentage',
    discountValue: '15%',
    description: '',
    expiryDate: '',
    howToRedeem: '',
  });

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
    if (!authChecked) return;

    async function loadAdminOffers() {
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          adminView: 'true'
        });
        if (tab !== 'All') queryParams.append('status', tab.toLowerCase());
        if (search) queryParams.append('search', search);

        const res = await fetch(`/api/offers?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const dbData = data.offers || [];
          if (data.stats) {
            setGlobalStats(data.stats);
          }
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
            setTotalResults(data.pagination.total);
          } else {
            setTotalPages(1);
            setTotalResults(dbData.length);
          }

          const mapped: Offer[] = dbData.map((o: any) => ({
            id: o.id,
            businessName: o.business_name,
            businessId: o.business_id,
            title: o.title,
            type: o.type,
            discount: o.type === 'percentage' ? `${o.discount_value}% off` : o.type === 'fixed' ? `$${o.discount_value} off` : o.type === 'bogo' ? 'Buy 1 Get 1 Free' : o.discount_value || o.fe_discount || 'Special Offer',
            description: o.description,
            category: o.category,
            location: o.location || 'Calgary, AB',
            expiryDate: o.expiry_date,
            status: o.status.toLowerCase() as any,
            featured: o.featured || false,
            submittedAt: o.created_at || o.created_At || new Date().toISOString(),
            foundersEdgeDiscount: o.fe_discount,
            eventsPageUrl: o.events_page_url,
            howToRedeem: o.how_to_redeem,
            isPassport: o.is_passport || false,
            passportType: o.passport_type || 'ticket',
            promoCode: o.promo_code || '',
            submittedBy: o.members ? `${[o.members.first_name, o.members.last_name === 'Member' ? '' : o.members.last_name].filter(Boolean).join(' ')} (${o.members.email})` : 'Foundrs Edge Admin'
          }));
          setOffers(mapped);

          const pOffers: Record<string, { isPassport: boolean; type: 'ticket' | 'membership'; promoCode: string }> = {};
          dbData.forEach((o: any) => {
            pOffers[o.id] = {
              isPassport: o.is_passport || false,
              type: (o.passport_type as any) || 'ticket',
              promoCode: o.promo_code || ''
            };
          });
          setPassportOffers(pOffers);
        }
      } catch (err) {
        console.error("Failed to load admin offers:", err);
      }
    }
    loadAdminOffers();
  }, [authChecked, currentPage, tab, search]);

  useEffect(() => {
    if (!authChecked) return;
    async function loadMembers() {
      try {
        const res = await fetch('/api/admin/users?limit=100');
        if (res.ok) {
          const data = await res.json();
          const rawUsers = Array.isArray(data) ? data : (data.users || []);
          const mapped = rawUsers
            .filter((u: any) => u.memberProfile)
            .map((u: any) => {
              const mp = u.memberProfile;
              const hasBiz = mp.businesses && mp.businesses.length > 0 && mp.businesses[0].business_name;
              const bName = hasBiz ? mp.businesses[0].business_name : '';
              return {
                id: mp.id,
                name: `${mp.first_name || ''} ${mp.last_name || ''}`.trim() || u.name || u.email,
                email: u.email,
                businessName: bName,
              };
            });
          setMembersList(mapped);
        }
      } catch (err) {
        console.error('Failed to load members for offer assignment:', err);
      }
    }
    loadMembers();
  }, [authChecked]);

  async function handleCreateOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!newOffer.title || !newOffer.businessName || !newOffer.description || !newOffer.expiryDate) {
      alert('Please fill out all required fields.');
      return;
    }
    setCreatingOffer(true);
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newOffer.title,
          businessName: newOffer.businessName,
          category: newOffer.category,
          type: newOffer.type,
          discountValue: newOffer.type === 'custom' ? undefined : newOffer.discountValue,
          customDiscount: newOffer.type === 'custom' ? newOffer.discountValue : undefined,
          description: newOffer.description,
          expiryDate: newOffer.expiryDate,
          howToRedeem: newOffer.howToRedeem || 'Contact business directly for member offer redemption.',
          onBehalfOfMemberId: newOffer.onBehalfOfMemberId || undefined,
        }),
      });
      if (res.ok) {
        showToast('Offer created successfully on behalf of member ✓');
        setShowAddModal(false);
        setNewOffer({
          title: '',
          businessName: '',
          onBehalfOfMemberId: '',
          category: 'Professional Services',
          type: 'percentage',
          discountValue: '15%',
          description: '',
          expiryDate: '',
          howToRedeem: '',
        });
        window.location.reload();
      } else {
        const errData = await res.json();
        alert(`Error creating offer: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
    } finally {
      setCreatingOffer(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function updateGlobalStats(fromStatus: string, toStatus: string) {
    setGlobalStats(prev => {
      const copy = { ...prev };
      if (fromStatus === 'pending') copy.pending = Math.max(0, copy.pending - 1);
      else if (fromStatus === 'approved') copy.approved = Math.max(0, copy.approved - 1);
      else if (fromStatus === 'rejected') copy.rejected = Math.max(0, copy.rejected - 1);

      if (toStatus === 'pending') copy.pending += 1;
      else if (toStatus === 'approved') copy.approved += 1;
      else if (toStatus === 'rejected') copy.rejected += 1;
      return copy;
    });
  }

  async function approve(id: string) {
    try {
      const target = offers.find(o => o.id === id);
      const prevStatus = target ? target.status : 'pending';
      const res = await fetch(`/api/offers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      if (res.ok) {
        setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'approved' } : o));
        updateGlobalStats(prevStatus, 'approved');
        showToast('Offer approved ✓');
      } else {
        const data = await res.json();
        alert(`Error approving offer: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function reject(id: string) {
    try {
      const target = offers.find(o => o.id === id);
      const prevStatus = target ? target.status : 'pending';
      const res = await fetch(`/api/offers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (res.ok) {
        setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'rejected' } : o));
        updateGlobalStats(prevStatus, 'rejected');
        showToast('Offer rejected.');
      } else {
        const data = await res.json();
        alert(`Error rejecting offer: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleConfirmDeleteOffer() {
    if (!deleteModalOffer) return;
    setIsDeletingOffer(true);
    try {
      const res = await fetch(`/api/offers/${deleteModalOffer.id}`, { method: 'DELETE' });
      if (res.ok) {
        const target = offers.find(o => o.id === deleteModalOffer.id);
        setOffers(prev => prev.filter(o => o.id !== deleteModalOffer.id));
        if (target) updateGlobalStats(target.status, '');
        showToast('Offer deleted successfully ✓');
        setDeleteModalOffer(null);
      } else {
        const data = await res.json();
        alert(`Error deleting offer: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete offer.');
    } finally {
      setIsDeletingOffer(false);
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !current })
      });
      if (res.ok) {
        setOffers(prev => prev.map(o => o.id === id ? { ...o, featured: !current } : o));
        showToast(!current ? 'Offer featured ✓' : 'Offer unfeatured.');
      } else {
        const data = await res.json();
        alert(`Error featuring offer: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function updatePassportStatus(id: string, isPassport: boolean, type: 'ticket' | 'membership', promoCode: string) {
    try {
      const res = await fetch(`/api/offers/${id}/passport`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPassport, passportType: type, promoCode })
      });
      if (res.ok) {
        setPassportOffers(prev => ({
          ...prev,
          [id]: { isPassport, type, promoCode }
        }));
        showToast(isPassport ? 'Added to Passport ✓' : 'Removed from Passport');
      } else {
        const data = await res.json();
        alert(`Error updating passport status: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to update passport status:", err);
      alert("Failed to update passport status");
    }
  }

  const filtered = offers;

  const stats = globalStats;

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e7b605', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>Checking access...</div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab="offers">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px', width: '100%', boxSizing: 'border-box' }}>

        {/* Stats */}
        <div className="grid-4" style={{ gap: 2, marginBottom: 32 }}>
          {[
            { label: 'Total Submitted', value: stats.total,    color: '#2a2820' },
            { label: 'Pending Review',  value: stats.pending,  color: '#e67e22' },
            { label: 'Approved',        value: stats.approved, color: '#27ae60' },
            { label: 'Rejected',        value: stats.rejected, color: '#c0392b' },
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
                style={{
                  padding: '8px 18px', border: 'none', cursor: 'pointer',
                  background: tab === t ? '#000' : 'transparent',
                  color: tab === t ? '#e7b605' : '#9a9585',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px',
                  letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'all 0.2s',
                }}
              >
                {t}
                {t !== 'All' && (
                  <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.7 }}>
                    ({stats[t.toLowerCase() as keyof typeof stats]})
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                background: '#e7b605',
                color: '#000',
                border: 'none',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Offer For Member
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
              <input
                className="input-field"
                placeholder="Search offers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 36, margin: 0, width: 220 }}
              />
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid #e2e0d8' }}>
            <div style={{ fontSize: '36px', marginBottom: 16 }}>🎁</div>
            <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: 8 }}>No offers found</div>
            <div style={{ color: '#9a9585' }}>
              {tab === 'Pending' ? 'No offers awaiting review.' : 'No offers match your current filter.'}
            </div>
          </div>
        )}

        {/* Offer rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(offer => {
            const sc = statusColors[(offer.status || 'pending').toLowerCase()] || statusColors.pending;
            const isExpanded = expandedId === offer.id;
            const isExpired = offer.expiryDate && new Date(offer.expiryDate) < new Date();

            return (
              <div key={offer.id} style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
                {/* Summary row */}
                <div
                  style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setExpandedId(isExpanded ? null : offer.id)}
                >
                  <div style={{ width: 36, height: 36, background: '#f0efe9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9b7011', flexShrink: 0 }}>
                    {typeIcons[offer.type]}
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#2a2820', marginBottom: 2 }}>{offer.title}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '12px', color: '#9a9585', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={11} />{offer.businessName}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={11} />{offer.category}</span>
                      {offer.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{offer.location}</span>}
                    </div>
                  </div>

                  <div style={{
                    fontWeight: 900,
                    fontSize: (offer.discount || '').length > 15 ? '14px' : (offer.discount || '').length > 10 ? '16px' : '20px',
                    color: '#e7b605',
                    maxWidth: 180,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}>{offer.discount}</div>

                  {offer.expiryDate && (
                    <div style={{ fontSize: '12px', color: isExpired ? '#c0392b' : '#9a9585', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <Calendar size={11} />
                      {isExpired ? 'Expired' : new Date(offer.expiryDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}

                  <span style={{ padding: '4px 10px', background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                    {sc.label}
                  </span>

                  {passportOffers[offer.id]?.isPassport && (
                    <span style={{ 
                      padding: '4px 10px', 
                      background: 'rgba(231,182,5,0.08)', 
                      color: '#9b7011', 
                      border: '1px solid rgba(231,182,5,0.2)',
                      fontSize: '11px', 
                      fontWeight: 800, 
                      letterSpacing: '0.06em', 
                      textTransform: 'uppercase', 
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Compass size={11} /> Passport: {passportOffers[offer.id].type === 'ticket' ? 'Ticket' : 'Club'}
                    </span>
                  )}

                  {offer.featured && <Star size={14} fill="#e7b605" stroke="#9b7011" style={{ flexShrink: 0 }} />}

                  <div style={{ color: '#9a9585', flexShrink: 0 }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e2e0d8', padding: '24px', background: '#fafaf8' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9585', marginBottom: 8 }}>Description</div>
                        <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{offer.description}</p>

                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9585', marginBottom: 8 }}>How to Redeem</div>
                          <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{offer.howToRedeem || 'No redemption instructions provided.'}</p>
                        </div>

                        {offer.promoCode && (
                          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(231,182,5,0.08)', borderLeft: '4px solid #e7b605', borderRadius: 4 }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9b7011', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                              Member Promo Code / Redemption Code
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#2a2820', background: '#fff', border: '1px dashed #e7b605', padding: '4px 10px', display: 'inline-block', borderRadius: 4 }}>
                              {offer.promoCode}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9585', marginBottom: 4 }}>Business</div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#2a2820' }}>{offer.businessName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9585', marginBottom: 4 }}>Submitted By</div>
                          <div style={{ fontSize: '13px', color: '#5a5650', fontWeight: 600 }}>{offer.submittedBy}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9585', marginBottom: 4 }}>Submitted</div>
                          <div style={{ fontSize: '13px', color: '#5a5650' }}>{new Date(offer.submittedAt).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9585', marginBottom: 4 }}>Expiry</div>
                          <div style={{ fontSize: '13px', color: isExpired ? '#c0392b' : '#5a5650' }}>
                            {offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No expiry'}
                            {isExpired ? ' (Expired)' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid #e2e0d8', paddingTop: 20 }}>
                      {offer.status !== 'approved' && (
                        <button
                          onClick={() => approve(offer.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#27ae60', color: '#fff', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.04em' }}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                      )}
                      {offer.status !== 'rejected' && (
                        <button
                          onClick={() => reject(offer.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#c0392b', color: '#fff', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.04em' }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      )}
                      {offer.status === 'approved' && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              const current = passportOffers[offer.id] || { isPassport: false, type: 'ticket', promoCode: '' };
                              updatePassportStatus(offer.id, !current.isPassport, current.type, current.promoCode);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: passportOffers[offer.id]?.isPassport ? 'rgba(231,182,5,0.15)' : 'transparent', color: passportOffers[offer.id]?.isPassport ? '#9b7011' : '#5a5650', border: '1px solid', borderColor: passportOffers[offer.id]?.isPassport ? '#e7b605' : '#e2e0d8', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.04em' }}
                          >
                            <Compass size={13} fill={passportOffers[offer.id]?.isPassport ? '#e7b605' : 'none'} />
                            {passportOffers[offer.id]?.isPassport ? 'In Passport' : 'Add to Passport'}
                          </button>

                          {passportOffers[offer.id]?.isPassport && (
                            <>
                              <select
                                value={passportOffers[offer.id]?.type || 'ticket'}
                                onChange={(e) => {
                                  const newType = e.target.value as 'ticket' | 'membership';
                                  const current = passportOffers[offer.id] || { isPassport: true, type: 'ticket', promoCode: '' };
                                  updatePassportStatus(offer.id, true, newType, current.promoCode);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  border: '1px solid #e2e0d8',
                                  background: '#fff',
                                  fontFamily: 'DM Sans, sans-serif',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: '#2a2820',
                                  outline: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="ticket">Event Ticket</option>
                                <option value="membership">Club Membership</option>
                              </select>

                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  placeholder="Promo Code (e.g. FE-GOLD)"
                                  value={passportOffers[offer.id]?.promoCode || ''}
                                  onChange={(e) => {
                                    const newCode = e.target.value;
                                    setPassportOffers(prev => ({
                                      ...prev,
                                      [offer.id]: { ...(prev[offer.id] || { isPassport: true, type: 'ticket', promoCode: '' }), promoCode: newCode }
                                    }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const current = passportOffers[offer.id] || { isPassport: true, type: 'ticket', promoCode: '' };
                                      updatePassportStatus(offer.id, true, current.type, current.promoCode);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    const current = passportOffers[offer.id] || { isPassport: true, type: 'ticket', promoCode: '' };
                                    updatePassportStatus(offer.id, true, current.type, val);
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e2e0d8',
                                    borderRight: 'none',
                                    background: '#fff',
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#2a2820',
                                    outline: 'none',
                                    width: '180px',
                                    borderRadius: '0px'
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const current = passportOffers[offer.id] || { isPassport: true, type: 'ticket', promoCode: '' };
                                    updatePassportStatus(offer.id, true, current.type, current.promoCode);
                                  }}
                                  title="Save Promo Code"
                                  style={{
                                    padding: '8px 12px',
                                    background: '#27ae60',
                                    color: '#fff',
                                    border: '1px solid #27ae60',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '37px', // Matches input height
                                    borderRadius: '0px'
                                  }}
                                >
                                  <CheckCircle size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {offer.status === 'approved' && !passportOffers[offer.id]?.isPassport && (
                        <button
                          onClick={() => toggleFeatured(offer.id, offer.featured)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: offer.featured ? 'rgba(231,182,5,0.15)' : 'transparent', color: offer.featured ? '#9b7011' : '#5a5650', border: '1px solid', borderColor: offer.featured ? '#e7b605' : '#e2e0d8', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.04em' }}
                        >
                          <Star size={13} fill={offer.featured ? '#e7b605' : 'none'} />
                          {offer.featured ? 'Unfeature' : 'Feature Offer'}
                        </button>
                      )}
                      {offer.status === 'approved' && (
                        <Link
                          href={passportOffers[offer.id]?.isPassport ? '/passport' : `/offers/${offer.id}`}
                          target="_blank"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1px solid #e2e0d8', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#5a5650', textDecoration: 'none', letterSpacing: '0.04em' }}
                        >
                          {passportOffers[offer.id]?.isPassport ? 'View in Passport' : 'View Live'}
                        </Link>
                      )}

                      <button
                        onClick={() => setDeleteModalOffer({ id: offer.id, title: offer.title })}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#c0392b', color: '#fff', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.04em', marginLeft: 'auto' }}
                      >
                        <Trash2 size={14} /> Delete Offer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: '12px', color: '#9a9585', textAlign: 'right' }}>
          Showing {filtered.length} of {totalResults} offers
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

      {/* Add Offer Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #e2e0d8',
            borderRadius: '12px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#888',
              }}
            >
              <X size={22} />
            </button>

            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', color: '#000', margin: '0 0 4px 0' }}>
              Create Offer On Behalf of Member
            </h3>
            <div style={{ fontSize: '13px', color: '#888', fontFamily: 'DM Sans, sans-serif', marginBottom: 20 }}>
              Select a member account to associate with this offer. Externally, it will display under their company profile name.
            </div>

            <form onSubmit={handleCreateOffer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: '#9a9585' }}>
                  Assign To Member Account *
                </label>
                <select
                  className="select-field"
                  required
                  value={newOffer.onBehalfOfMemberId}
                  onChange={e => {
                    const selId = e.target.value;
                    const member = membersList.find(m => m.id === selId);
                    setNewOffer(prev => ({
                      ...prev,
                      onBehalfOfMemberId: selId,
                      businessName: member?.businessName || member?.name || prev.businessName,
                    }));
                  }}
                  style={{ width: '100%', margin: 0 }}
                >
                  <option value="">Select a registered member...</option>
                  {membersList.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.businessName ? ` — ${m.businessName}` : ''} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: '#9a9585' }}>
                  Company Profile / Business Name *
                </label>
                <input
                  className="input-field"
                  required
                  value={newOffer.businessName}
                  onChange={e => setNewOffer(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="e.g. Acme Studio"
                  style={{ width: '100%', margin: 0 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: '#9a9585' }}>
                  Offer Title *
                </label>
                <input
                  className="input-field"
                  required
                  value={newOffer.title}
                  onChange={e => setNewOffer(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. 20% Off First Consulting Package"
                  style={{ width: '100%', margin: 0 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: '#9a9585' }}>
                    Category
                  </label>
                  <select
                    className="select-field"
                    value={newOffer.category}
                    onChange={e => setNewOffer(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', margin: 0 }}
                  >
                    {['Professional Services', 'Marketing & Design', 'Technology', 'Finance & Legal', 'Health & Wellness', 'Events & Venues', 'Retail & Products', 'Food & Beverage', 'Golf', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: '#9a9585' }}>
                    Offer Type
                  </label>
                  <select
                    className="select-field"
                    value={newOffer.type}
                    onChange={e => {
                      const nextType = e.target.value;
                      setNewOffer(prev => ({
                        ...prev,
                        type: nextType,
                        discountValue:
                          nextType === 'bogo' ? 'Buy 1 Get 1 Free' :
                          nextType === 'custom' ? (prev.discountValue === '15%' || prev.discountValue === '15' ? '' : prev.discountValue) :
                          nextType === 'percentage' ? (prev.discountValue.includes('%') || !prev.discountValue ? '15' : prev.discountValue) :
                          nextType === 'fixed' ? '25' : prev.discountValue
                      }));
                    }}
                    style={{ width: '100%', margin: 0 }}
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Amount Discount ($)</option>
                    <option value="bogo">Buy 1 Get 1 Free (BOGO)</option>
                    <option value="custom">Custom Offer (e.g. Free Consultation)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: '#9a9585' }}>
                    {newOffer.type === 'percentage' ? 'Discount Percentage (%)' : newOffer.type === 'fixed' ? 'Discount Amount ($)' : 'Discount / Value Headline'}
                  </label>
                  <input
                    className="input-field"
                    value={newOffer.discountValue}
                    onChange={e => setNewOffer(prev => ({ ...prev, discountValue: e.target.value }))}
                    placeholder={
                      newOffer.type === 'percentage' ? 'e.g. 20 (for 20% off)' :
                      newOffer.type === 'fixed' ? 'e.g. 50 (for $50 off)' :
                      newOffer.type === 'bogo' ? 'e.g. Buy 1 Get 1 Free' :
                      'e.g. Free consultation or Free strategy session'
                    }
                    style={{ width: '100%', margin: 0 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: '#9a9585' }}>
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    required
                    value={newOffer.expiryDate}
                    onChange={e => setNewOffer(prev => ({ ...prev, expiryDate: e.target.value }))}
                    style={{ width: '100%', margin: 0 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: '#9a9585' }}>
                  Description *
                </label>
                <textarea
                  className="input-field"
                  required
                  rows={3}
                  value={newOffer.description}
                  onChange={e => setNewOffer(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what members get with this offer..."
                  style={{ width: '100%', margin: 0, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: '#9a9585' }}>
                  How To Redeem (Optional)
                </label>
                <input
                  className="input-field"
                  value={newOffer.howToRedeem}
                  onChange={e => setNewOffer(prev => ({ ...prev, howToRedeem: e.target.value }))}
                  placeholder="e.g. Mention Founders Edge when booking via website/email"
                  style={{ width: '100%', margin: 0 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #ccc', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOffer}
                  style={{ padding: '12px 24px', background: '#e7b605', color: '#000', border: 'none', cursor: creatingOffer ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}
                >
                  {creatingOffer ? 'Submitting...' : 'Create & Approve Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#000', color: '#fff', padding: '14px 24px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOffer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', width: '100%', maxWidth: 460, padding: 32, position: 'relative', boxShadow: '0 12px 36px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(192,57,43,0.1)', color: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginBottom: 16 }}>
              <Trash2 size={22} />
            </div>

            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '20px', margin: '0 0 8px 0', color: '#2a2820' }}>
              Delete Offer
            </h3>
            <p style={{ fontSize: '14px', color: '#5a5650', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              Are you sure you want to permanently delete <strong style={{ color: '#2a2820' }}>"{deleteModalOffer.title}"</strong>? This will immediately remove the offer from all live listings.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setDeleteModalOffer(null)}
                disabled={isDeletingOffer}
                style={{ padding: '11px 22px', background: '#f4f3ed', border: '1px solid #e2e0d8', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#2a2820' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOffer}
                disabled={isDeletingOffer}
                style={{ padding: '11px 22px', background: '#c0392b', color: '#fff', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '13px', cursor: isDeletingOffer ? 'not-allowed' : 'pointer', opacity: isDeletingOffer ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isDeletingOffer ? 'Deleting...' : 'Delete Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
