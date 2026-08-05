'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Tag, MapPin, Calendar, Star, ChevronRight, Percent, Gift, Zap, Filter } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

export type Offer = {
  id: string;
  businessName: string;
  businessId?: string;
  title: string;
  type: 'percentage' | 'bogo' | 'fixed' | 'custom';
  discount: string;
  description: string;
  category: string;
  location: string;
  expiryDate: string;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  submittedAt: string;
  foundersEdgeDiscount?: string;
  eventsPageUrl?: string;
  howToRedeem?: string;
  isPassport?: boolean;
  passportType?: 'ticket' | 'membership';
  promoCode?: string;
  submittedBy?: string;
};

const offerCategories = [
  'All Categories',
  'Professional Services',
  'Marketing & Design',
  'Technology',
  'Finance & Legal',
  'Health & Wellness',
  'Events & Venues',
  'Retail & Products',
  'Food & Beverage',
  'Other',
];

const offerTypes = ['All Types', 'Percentage Off', 'Buy One Get One', 'Fixed Amount Off', 'Custom Offer'];

const typeMap: Record<string, Offer['type'] | 'all'> = {
  'All Types': 'all',
  'Percentage Off': 'percentage',
  'Buy One Get One': 'bogo',
  'Fixed Amount Off': 'fixed',
  'Custom Offer': 'custom',
};

const typeColors: Record<Offer['type'], { bg: string; color: string; icon: React.ReactNode; label: string }> = {
  percentage: { bg: 'rgba(231,182,5,0.12)', color: '#9b7011', icon: <Percent size={11} />, label: '% Off' },
  bogo: { bg: 'rgba(39,174,96,0.1)', color: '#27ae60', icon: <Gift size={11} />, label: 'BOGO' },
  fixed: { bg: 'rgba(26,111,196,0.1)', color: '#1a6fc4', icon: <Tag size={11} />, label: 'Fixed' },
  custom: { bg: 'rgba(90,58,8,0.08)', color: '#5a3a08', icon: <Zap size={11} />, label: 'Custom' },
};

function isExpired(dateStr: string) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function OffersPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [hideExpired, setHideExpired] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [category, typeFilter, featuredOnly, search, locationFilter, hideExpired]);

  useEffect(() => {
    async function loadOffers() {
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });

        if (category !== 'All Categories') queryParams.append('category', category);

        const selectedType = typeMap[typeFilter];
        if (selectedType !== 'all') queryParams.append('type', selectedType);
        if (featuredOnly) queryParams.append('featured', 'true');
        if (search) queryParams.append('search', search);
        if (locationFilter !== 'All Locations') queryParams.append('location', locationFilter);
        if (hideExpired) queryParams.append('hideExpired', 'true');

        const res = await fetch(`/api/offers?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const dbData = data.offers || [];

          if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
            setTotalResults(data.pagination.total);
          }

          const mapped: Offer[] = dbData.map((o: any) => ({
            id: o.id,
            businessName: o.business_name,
            businessId: o.business_id,
            title: o.title,
            type: o.type,
            discount: o.type === 'percentage' ? `${o.discount_value}% off` : o.type === 'fixed' ? `$${o.discount_value} off` : o.type === 'bogo' ? `Buy One Get One Free` : o.discount_value || o.fe_discount || `Special Offer`,
            description: o.description,
            category: o.category,
            location: o.location || 'Calgary, AB',
            expiryDate: o.expiry_date,
            status: o.status.toLowerCase(),
            featured: !!o.featured,
            submittedAt: o.created_at,
            foundersEdgeDiscount: o.fe_discount,
            eventsPageUrl: o.events_page_url,
            howToRedeem: o.how_to_redeem,
          }));
          setOffers(mapped);
        }
      } catch (err) {
        console.error("Failed to load offers:", err);
      }
    }
    loadOffers();
  }, [currentPage, category, typeFilter, featuredOnly, search, locationFilter, hideExpired]);

  const filtered = offers;

  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Member Offers</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(40px, 6vw, 72px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
            EXCLUSIVE<br /><span style={{ color: '#e7b605' }}>MEMBER OFFERS</span>
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#999', fontSize: '18px', maxWidth: 520, lineHeight: 1.7 }}>
            Special deals and discounts shared exclusively by Founders Edge members — for the community, by the community.
          </p>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e0d8', position: 'sticky', top: 72, zIndex: 50 }}>
        <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
              <input
                className="input-field"
                placeholder="Search offers or businesses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 40, margin: 0 }}
              />
            </div>

            {/* Category */}
            <select className="select-field" value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto', minWidth: 160, margin: 0 }}>
              {offerCategories.map(c => <option key={c}>{c}</option>)}
            </select>

            {/* Type */}
            <select className="select-field" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 'auto', minWidth: 150, margin: 0 }}>
              {offerTypes.map(t => <option key={t}>{t}</option>)}
            </select>

            {/* Location */}
            <select className="select-field" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} style={{ width: 'auto', minWidth: 140, margin: 0 }}>
              {['All Locations', 'Calgary', 'Edmonton', 'Online'].map(l => <option key={l}>{l}</option>)}
            </select>

            {/* Featured toggle */}
            <button
              onClick={() => setFeaturedOnly(!featuredOnly)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '12px 18px', border: '1px solid',
                borderColor: featuredOnly ? '#e7b605' : '#e2e0d8',
                background: featuredOnly ? 'rgba(231,182,5,0.08)' : 'transparent',
                color: featuredOnly ? '#9b7011' : '#9a9585',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px',
                letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Star size={13} fill={featuredOnly ? '#e7b605' : 'none'} stroke={featuredOnly ? '#9b7011' : '#9a9585'} />
              Featured
            </button>

            {/* Hide expired */}
            <button
              onClick={() => setHideExpired(!hideExpired)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '12px 18px', border: '1px solid',
                borderColor: hideExpired ? '#27ae60' : '#e2e0d8',
                background: hideExpired ? 'rgba(39,174,96,0.06)' : 'transparent',
                color: hideExpired ? '#27ae60' : '#9a9585',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px',
                letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Filter size={13} />
              {hideExpired ? 'Active Only' : 'Show All'}
            </button>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      <div style={{ padding: '60px 0', background: '#f9f9f7' }}>
        <div className="container">
          <div style={{ marginBottom: 24, color: '#9a9585', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
            {filtered.length} offer{filtered.length !== 1 ? 's' : ''} found
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid #e2e0d8' }}>
              <div style={{ fontSize: '40px', marginBottom: 16 }}>🎁</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: 8 }}>No offers found</div>
              <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif', marginBottom: 24 }}>
                Try adjusting your filters, or be the first to share an offer with the community.
              </div>
              <Link href="/offers/submit" className="btn-primary">Share Your Offer</Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map(offer => {
              const typeInfo = typeColors[offer.type];
              const expired = isExpired(offer.expiryDate);
              return (
                <div
                  key={offer.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e0d8',
                    borderTop: offer.featured ? '4px solid #e7b605' : '4px solid transparent',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    opacity: expired ? 0.6 : 1,
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  {/* Tags row */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: typeInfo.bg, color: typeInfo.color,
                      fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px',
                      letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px',
                    }}>
                      {typeInfo.icon}{typeInfo.label}
                    </span>
                    <span className="tag">{offer.category}</span>
                    {offer.featured && <span className="tag gold"><Star size={10} fill="#9b7011" style={{ marginRight: 3 }} />Featured</span>}
                    {expired && (
                      <span style={{ fontSize: '11px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#c0392b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Expired
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', color: '#2a2820', lineHeight: 1.2 }}>
                    {offer.title}
                  </div>

                  {/* Discount headline */}
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '18px', color: '#e7b605', lineHeight: 1.2, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {offer.discount}
                  </div>

                  {/* Description */}
                  <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                    {(offer.description || '').length > 120 ? (offer.description || '').slice(0, 120) + '…' : (offer.description || '')}
                  </p>

                  {/* Business + meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
                      <span style={{ color: '#9a9585' }}>By</span>
                      <Link
                        href={offer.businessId ? `/directory/${offer.businessId}` : '/directory'}
                        style={{ fontWeight: 700, color: '#9b7011', textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {offer.businessName}
                      </Link>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {offer.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9a9585', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                          <MapPin size={12} style={{ color: '#e7b605' }} />{offer.location}
                        </span>
                      )}
                      {offer.expiryDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: expired ? '#c0392b' : '#9a9585', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                          <Calendar size={12} style={{ color: expired ? '#c0392b' : '#e7b605' }} />
                          Expires {new Date(offer.expiryDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <Link
                      href={`/offers/${offer.id}`}
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '10px 20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      View Offer <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 40, fontFamily: 'DM Sans, sans-serif' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-outline"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  background: 'transparent',
                  border: '1px solid #e2e0d8',
                  color: '#5a5650'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '14px', color: '#2a2820', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-outline"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  background: 'transparent',
                  border: '1px solid #e2e0d8',
                  color: '#5a5650'
                }}
              >
                Next
              </button>
            </div>
          )}

          {/* Submit Offer CTA */}
          <div style={{ marginTop: 48, background: '#000', padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', color: '#fff', marginBottom: 8 }}>Have an offer to share?</h3>
              <p style={{ color: '#888', fontFamily: 'Noto Serif, serif', fontSize: '15px' }}>Members can list up to 3 exclusive offers. Submit yours for review.</p>
            </div>
            <Link href="/offers/submit" className="btn-primary">Share Your Offer <ChevronRight size={16} /></Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
