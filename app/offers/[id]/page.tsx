'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Share2, Tag, Percent, Gift, Zap, Star, ChevronRight, ExternalLink, Building2, Copy, Check } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import type { Offer } from '../page';

const typeColors: Record<Offer['type'], { bg: string; color: string; icon: React.ReactNode; label: string }> = {
  percentage: { bg: 'rgba(231,182,5,0.12)', color: '#9b7011', icon: <Percent size={13} />, label: 'Percentage Off' },
  bogo: { bg: 'rgba(39,174,96,0.1)', color: '#27ae60', icon: <Gift size={13} />, label: 'Buy One Get One Free' },
  fixed: { bg: 'rgba(26,111,196,0.1)', color: '#1a6fc4', icon: <Tag size={13} />, label: 'Fixed Amount Off' },
  custom: { bg: 'rgba(90,58,8,0.08)', color: '#5a3a08', icon: <Zap size={13} />, label: 'Custom Offer' },
};

function isExpired(dateStr: string) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [otherOffers, setOtherOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function loadOfferDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/offers/${id}`);
        if (res.ok) {
          const o = await res.json();
          const mappedOffer: Offer = {
            id: o.id,
            businessName: o.business_name,
            businessId: o.business_directory_id,
            title: o.title,
            type: o.type,
            discount: o.type === 'percentage' ? `${o.discount_value}% off` : o.type === 'fixed' ? `$${o.discount_value} off` : o.type === 'bogo' ? 'Buy 1 Get 1 Free' : o.discount_value || o.fe_discount || 'Special Offer',
            description: o.description,
            category: o.category,
            location: o.location || 'Calgary, AB',
            expiryDate: o.expiry_date,
            status: o.status.toLowerCase(),
            featured: o.featured || false,
            submittedAt: o.created_at || o.created_At || new Date().toISOString(),
            foundersEdgeDiscount: o.fe_discount,
            eventsPageUrl: o.events_page_url,
            howToRedeem: o.how_to_redeem,
            promoCode: o.promo_code || o.promoCode || '',
          };
          setOffer(mappedOffer);
        } else {
          setOffer(null);
        }

        const resOthers = await fetch('/api/offers');
        if (resOthers.ok) {
          const rawOthers = await resOthers.json();
          const dbOthers = Array.isArray(rawOthers) ? rawOthers : (rawOthers.offers || []);
          const mappedOthers: Offer[] = dbOthers
            .filter((o: any) => o.id !== id)
            .slice(0, 3)
            .map((o: any) => ({
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
              status: o.status.toLowerCase(),
              featured: o.featured || false,
              submittedAt: o.created_at || o.created_At || new Date().toISOString(),
              foundersEdgeDiscount: o.fe_discount,
              eventsPageUrl: o.events_page_url,
              howToRedeem: o.how_to_redeem
            }));
          setOtherOffers(mappedOthers);
        }
      } catch (err) {
        console.error("Failed to load offer details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOfferDetail();
  }, [id]);

  if (loading) {
    return (
      <PageLayout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#e7b605' }}>Loading offer...</div>
        </div>
      </PageLayout>
    );
  }

  if (!offer) {
    return (
      <PageLayout>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 40px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', color: '#2a2820' }}>Offer not found</div>
          <p style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>This offer may have been removed or the link is incorrect.</p>
          <Link href="/offers" className="btn-primary" style={{ marginTop: 8 }}>
            <ArrowLeft size={16} /> Back to Offers
          </Link>
        </div>
      </PageLayout>
    );
  }

  const typeInfo = typeColors[offer.type];
  const expired = isExpired(offer.expiryDate);

  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <Link
            href="/offers"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            <ArrowLeft size={14} /> All Offers
          </Link>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px',
              letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px',
            }}>
              {typeInfo.icon}{typeInfo.label}
            </span>
            <span className="tag" style={{ background: '#333', color: '#ccc' }}>{offer.category}</span>
            {offer.featured && (
              <span className="tag" style={{ background: 'rgba(231,182,5,0.15)', color: '#e7b605' }}>
                <Star size={10} fill="#e7b605" style={{ marginRight: 3 }} />Featured
              </span>
            )}
            {expired && (
              <span style={{ fontSize: '11px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#ff6b6b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Expired
              </span>
            )}
          </div>

          {/* Discount */}
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 6vw, 64px)', color: '#e7b605', lineHeight: 1.0, marginBottom: 12 }}>
            {offer.discount}
          </div>

          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 42px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 24, maxWidth: 720 }}>
            {offer.title}
          </h1>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {offer.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}>
                <MapPin size={15} style={{ color: '#e7b605' }} />{offer.location}
              </span>
            )}
            {offer.expiryDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: expired ? '#ff6b6b' : '#ccc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}>
                <Calendar size={15} style={{ color: expired ? '#ff6b6b' : '#e7b605' }} />
                Expires {new Date(offer.expiryDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: '#f9f9f7', padding: '80px 0' }}>
        <div className="container">
          <div className="grid-halves" style={{ alignItems: 'start' }}>
            {/* Left: Details */}
            {/* Left: Details */}
            <div>
              {/* Structured discount terms */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e2e0d8',
                  borderTop: '4px solid #e7b605',
                  padding: '28px',
                  marginBottom: 40,
                }}
              >
                <div
                  className="section-label"
                  style={{ marginBottom: 20 }}
                >
                  Discount Terms
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 20,
                  }}
                >
                  {/* Discount value */}
                  <div>
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        color: '#9a9585',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Discount
                    </div>

                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        color: '#e7b605',
                        fontSize: '24px',
                        fontWeight: 900,
                        lineHeight: 1.2,
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                      }}
                    >
                      {offer.discount}
                    </div>
                  </div>

                  {/* Offer type */}
                  <div>
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        color: '#9a9585',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Offer Type
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: 'DM Sans, sans-serif',
                        color: typeInfo.color,
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      {typeInfo.icon}
                      {typeInfo.label}
                    </div>
                  </div>

                  {/* Expiry date */}
                  <div>
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        color: '#9a9585',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Valid Until
                    </div>

                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        color: expired ? '#c0392b' : '#2a2820',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      {offer.expiryDate
                        ? new Date(offer.expiryDate).toLocaleDateString('en-CA', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        : 'No expiry date provided'}
                      {expired ? ' — Expired' : ''}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        color: '#9a9585',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Available At
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: 'DM Sans, sans-serif',
                        color: '#2a2820',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      <MapPin size={14} style={{ color: '#e7b605' }} />
                      {offer.location || 'Location not specified'}
                    </div>
                  </div>
                </div>

                {offer.foundersEdgeDiscount && (
                  <div
                    style={{
                      marginTop: 24,
                      paddingTop: 20,
                      borderTop: '1px solid #e2e0d8',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        color: '#9a9585',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Founders Edge Member Terms
                    </div>

                    <div
                      style={{
                        fontFamily: 'Noto Serif, serif',
                        color: '#5a5650',
                        fontSize: '14px',
                        lineHeight: 1.7,
                      }}
                    >
                      {offer.foundersEdgeDiscount}
                    </div>
                  </div>
                )}

                {offer.howToRedeem && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: '16px 18px',
                      background: '#f9f9f7',
                      borderLeft: '3px solid #e7b605',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        color: '#9b7011',
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      How to Redeem
                    </div>

                    <div
                      style={{
                        fontFamily: 'Noto Serif, serif',
                        color: '#5a5650',
                        fontSize: '14px',
                        lineHeight: 1.7,
                      }}
                    >
                      {offer.howToRedeem}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: 40 }}>
                <div
                  className="section-label"
                  style={{ marginBottom: 20 }}
                >
                  About This Offer
                </div>

                <p
                  style={{
                    fontFamily: 'Noto Serif, serif',
                    color: '#5a5650',
                    fontSize: '16px',
                    lineHeight: 1.8,
                  }}
                >
                  {offer.description}
                </p>
              </div>

              {/* Business card */}
              <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px', marginBottom: 32 }}>
                <div className="section-label" style={{ marginBottom: 20 }}>Offered By</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, background: '#000', color: '#e7b605',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '22px', flexShrink: 0,
                  }}>
                    {offer.businessName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '16px', color: '#2a2820', marginBottom: 4 }}>
                      {offer.businessName}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#9a9585' }}>
                      Founders Edge Member
                    </div>
                  </div>
                  <Link
                    href={offer.businessId ? `/directory/${offer.businessId}` : '/directory'}
                    style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', color: '#9b7011', textDecoration: 'none', letterSpacing: '0.04em' }}
                  >
                    <Building2 size={13} /> View Profile
                  </Link>
                </div>
              </div>

              {/* Offer details */}
              <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '24px 28px' }}>
                <div className="section-label" style={{ marginBottom: 16 }}>Offer Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
                    <span style={{ color: '#9a9585', fontWeight: 600 }}>Category</span>
                    <span style={{ fontWeight: 700, color: '#2a2820' }}>{offer.category}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
                    <span style={{ color: '#9a9585', fontWeight: 600 }}>Offer Type</span>
                    <span style={{ fontWeight: 700, color: '#2a2820' }}>{typeInfo.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
                    <span style={{ color: '#9a9585', fontWeight: 600 }}>Location</span>
                    <span style={{ fontWeight: 700, color: '#2a2820' }}>{offer.location || 'Not specified'}</span>
                  </div>
                  {offer.expiryDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
                      <span style={{ color: '#9a9585', fontWeight: 600 }}>Valid Until</span>
                      <span style={{ fontWeight: 700, color: expired ? '#c0392b' : '#2a2820' }}>
                        {new Date(offer.expiryDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {expired ? ' (Expired)' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Redeem widget */}
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderTop: '4px solid #e7b605' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid #e2e0d8' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(22px, 4vw, 36px)', color: '#e7b605', marginBottom: 4, lineHeight: 1.15, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {offer.discount}
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#9a9585' }}>
                    {expired ? 'This offer has expired' : 'Exclusive Founders Edge member offer'}
                  </div>
                </div>

                <div style={{ padding: '28px 32px', borderBottom: '1px solid #e2e0d8' }}>
                  {offer.promoCode && !expired && (
                    <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(231,182,5,0.08)', border: '1px dashed #e7b605', borderRadius: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#9b7011', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
                        Promo / Redemption Code
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '16px', color: '#2a2820', letterSpacing: '0.05em' }}>
                          {offer.promoCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined' && offer.promoCode) {
                              navigator.clipboard?.writeText(offer.promoCode);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            border: '1px solid #e7b605',
                            background: copiedCode ? '#27ae60' : '#fff',
                            color: copiedCode ? '#fff' : '#9b7011',
                            borderRadius: 4,
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif',
                            transition: 'all 0.15s'
                          }}
                        >
                          {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                          {copiedCode ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '14px', opacity: expired ? 0.5 : 1, cursor: expired ? 'not-allowed' : 'pointer' }}
                    disabled={expired}
                    onClick={() => {
                      if (expired) return;
                      if (offer.eventsPageUrl) {
                        const url = offer.eventsPageUrl.startsWith('http') ? offer.eventsPageUrl : `https://${offer.eventsPageUrl}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      } else if (offer.businessId) {
                        window.location.href = `/directory/${offer.businessId}`;
                      } else {
                        window.location.href = '/directory';
                      }
                    }}
                  >
                    {expired ? 'Offer Expired' : 'Contact Business'}
                    {!expired && <ExternalLink size={14} />}
                  </button>
                  {!expired && (
                    <p style={{ textAlign: 'center', marginTop: 12, fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
                      Mention &ldquo;Founders Edge&rdquo; when redeeming
                    </p>
                  )}
                </div>

                <div style={{ padding: '20px 32px' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', cursor: 'pointer' }}
                    onClick={() => { if (typeof window !== 'undefined') navigator.clipboard?.writeText(window.location.href); }}
                  >
                    <Share2 size={14} /> Share this offer
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* More Offers */}
          {otherOffers.length > 0 && (
            <div style={{ marginTop: 80 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div className="section-label">More Offers</div>
                <Link href="/offers" style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#9b7011', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {otherOffers.map(o => {
                  const ti = typeColors[o.type];
                  return (
                    <div
                      key={o.id}
                      style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '24px', transition: 'all 0.2s' }}
                      onMouseEnter={el => (el.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                      onMouseLeave={el => (el.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '22px', color: '#e7b605', marginBottom: 6, lineHeight: 1.2, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{o.discount}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', marginBottom: 4, color: '#2a2820' }}>{o.title}</div>
                      <div style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif', marginBottom: 12 }}>By {o.businessName}</div>
                      <Link href={`/offers/${o.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', color: '#9b7011', textDecoration: 'none' }}>
                        View Offer <ChevronRight size={12} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
