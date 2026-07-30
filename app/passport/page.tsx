'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Ticket, 
  Building2, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  MapPin, 
  ExternalLink,
  Copy,
  CheckCircle,
  Info,
  Search
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { getProfile } from '@/app/actions/profile';

// Mock types
type PassportOffer = {
  id: string;
  title: string;
  provider: string;
  type: 'ticket' | 'membership';
  originalPrice?: string;
  discountedPrice?: string;
  savingValue: string;
  description: string;
  location: string;
  eventDate?: string;
  promoCode: string;
  redeemUrl: string;
  howToRedeem: string;
  expiryDate: string;
};

export default function NetworkingPassportPage() {
  const [isMember, setIsMember] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [events, setEvents] = useState<PassportOffer[]>([]);
  const [memberships, setMemberships] = useState<PassportOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load real member session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getProfile();
        if (res.success && res.user) {
          setIsMember(true);
        } else {
          setIsMember(false);
        }
      } catch (err) {
        console.error("Auth check failed on passport page:", err);
        setIsMember(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch live passport offers
  useEffect(() => {
    async function loadPassportOffers() {
      try {
        const res = await fetch('/api/passport/offers');
        if (res.ok) {
          const data: PassportOffer[] = await res.json();
          setEvents(data.filter(o => o.type === 'ticket'));
          setMemberships(data.filter(o => o.type === 'membership'));
        }
      } catch (err) {
        console.error("Failed to load passport offers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPassportOffers();
  }, []);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  // lists of offers
  const filteredEvents = events;
  const filteredMemberships = memberships;
  const totalResults = filteredEvents.length + filteredMemberships.length;

  return (
    <PageLayout>
      <div className="passport-bg" style={{ background: '#11100e', minHeight: '100vh', color: '#e5e4de', position: 'relative' }}>
        
        {/* HERO SECTION */}
        <div className="page-hero" style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(17,16,14,0.7) 0%, rgba(17,16,14,0.95) 100%), url("/images/event3.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative'
        }}>
          <div className="container" style={{ position: 'relative', zIndex: 5 }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              background: 'rgba(231,182,5,0.12)', 
              border: '1px solid rgba(231,182,5,0.25)',
              padding: '6px 16px',
              color: '#e7b605',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
              borderRadius: '20px'
            }}>
              <Sparkles size={13} /> Flagship Feature
            </div>

            <h1 style={{ 
              fontFamily: 'var(--font-sans)', 
              fontWeight: 900, 
              fontSize: 'clamp(44px, 6vw, 76px)', 
              lineHeight: 1.05, 
              letterSpacing: '-0.02em', 
              color: '#fff',
              marginBottom: 24,
            }}>
              THE NETWORKING <br />
              <span style={{ 
                background: 'linear-gradient(90deg, #ffd700 0%, #e7b605 50%, #b8860b 100%)', 
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                PASSPORT
              </span>
            </h1>

            <p style={{ 
              fontFamily: 'var(--font-sans)', 
              fontWeight: 600,
              fontSize: 'clamp(18px, 2.5vw, 24px)', 
              color: '#fff', 
              lineHeight: 1.4, 
              maxWidth: '750px', 
              margin: '0 0 16px' 
            }}>
              Your all-access pass to Calgary&apos;s business community — at a price only Foundrs Edge members get.
            </p>

            <p style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: 'clamp(15px, 2vw, 17px)', 
              color: '#999', 
              lineHeight: 1.7, 
              maxWidth: '680px', 
              margin: '0 0 40px' 
            }}>
              The Networking Passport is one perk, two ways to save: discounted tickets to business networking events, and discounted rates on business memberships. Nothing else falls under it — just the connections that actually move your business forward.
            </p>

            <button 
              onClick={() => document.getElementById('passport-covers')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary" 
              style={{ padding: '16px 40px', fontSize: '14px', borderRadius: '2px', cursor: 'pointer', border: 'none' }}
            >
              See What&apos;s Included <ArrowRight size={16} style={{ marginLeft: 8 }} />
            </button>
          </div>
        </div>

        {/* WHAT THE PASSPORT COVERS SECTION */}
        <div id="passport-covers" style={{ background: 'transparent', padding: '80px 0', borderBottom: '1px solid rgba(231,182,5,0.1)' }}>
          <div className="container">
            <div style={{ maxWidth: '800px', marginBottom: '48px' }}>
              <div className="section-label" style={{ color: '#e7b605', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', marginBottom: 12 }}>What the Passport Covers</div>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 42px)', color: '#fff', marginBottom: 20 }}>
                Two Categories. One Passport.
              </h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, marginBottom: 60 }}>
              {/* Event Tickets */}
              <div style={{ padding: '36px', background: '#1a1917', border: '1px solid rgba(231,182,5,0.12)', borderRadius: '4px' }}>
                <div style={{ width: 48, height: 48, background: 'rgba(231,182,5,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', marginBottom: 24 }}>
                  <Ticket size={24} style={{ color: '#e7b605' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: 14 }}>
                  Networking Event Tickets
                </h3>
                <p style={{ fontFamily: 'var(--font-serif)', color: '#bbb', fontSize: '15px', lineHeight: 1.7 }}>
                  Get member-only pricing on tickets to curated business networking events across Calgary — the kind of rooms where deals, partnerships, and referrals actually happen.
                </p>
              </div>
              
              {/* Memberships */}
              <div style={{ padding: '36px', background: '#1a1917', border: '1px solid rgba(231,182,5,0.12)', borderRadius: '4px' }}>
                <div style={{ width: 48, height: 48, background: 'rgba(231,182,5,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', marginBottom: 24 }}>
                  <Building2 size={24} style={{ color: '#e7b605' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: 14 }}>
                  Business Memberships
                </h3>
                <p style={{ fontFamily: 'var(--font-serif)', color: '#bbb', fontSize: '15px', lineHeight: 1.7 }}>
                  Access discounted rates on select business memberships, so the organizations worth joining cost you less to join.
                </p>
              </div>
            </div>

            {/* WHAT IT'S NOT SECTION */}
            <div style={{ 
              background: 'rgba(231,182,5,0.03)', 
              border: '1px solid rgba(231,182,5,0.15)', 
              borderLeft: '4px solid var(--gold)',
              padding: '32px 40px', 
              borderRadius: '4px',
              marginBottom: 60
            }}>
              <h3 style={{ 
                fontFamily: 'var(--font-sans)', 
                fontWeight: 800, 
                fontSize: '18px', 
                color: '#fff', 
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Info size={18} style={{ color: 'var(--gold)' }} /> Just So We&apos;re Clear
              </h3>
              <p style={{ fontFamily: 'var(--font-serif)', color: '#bbb', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                The Networking Passport isn&apos;t a general discount program. You won&apos;t find deals on services, tools, or one-off perks here — those live in our regular Offers feed. The Passport is reserved for one thing: making it cheaper to show up and be part of the business community, through events and memberships only.
              </p>
            </div>

            {/* HOW IT WORKS SECTION */}
            <div style={{ 
              borderTop: '1px solid rgba(231,182,5,0.1)', 
              paddingTop: '60px',
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 40,
              alignItems: 'center'
            }}>
              <div>
                <div className="section-label" style={{ color: '#e7b605', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', marginBottom: 12 }}>Instructions</div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '28px', color: '#fff', marginBottom: 20 }}>
                  How to Use Your Passport
                </h3>
                <button 
                  onClick={() => document.getElementById('passport-deals')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-primary"
                  style={{ padding: '12px 28px', fontSize: '13px', border: 'none', cursor: 'pointer' }}
                >
                  Browse Passport Deals <ArrowRight size={14} style={{ marginLeft: 6 }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {[
                  'Browse eligible events and memberships — each one marked with the Passport badge.',
                  'Unlock your member discount at checkout automatically.',
                  'Show up, network, grow.'
                ].map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      background: 'var(--gold)', 
                      color: '#000', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 700, 
                      fontSize: '13px',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <p style={{ fontFamily: 'var(--font-serif)', color: '#bbb', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* MAIN OFFERS GRID SECTION */}
        <div id="passport-deals" style={{ background: '#f9f9f7', padding: '60px 0 100px', borderTop: '1px solid #e2e0d8', color: '#2a2820' }}>
          <div className="container">
            
            {/* EVENT TICKETS CATEGORY */}
            {filteredEvents.length > 0 && (
              <div style={{ marginBottom: '80px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  marginBottom: 32,
                  borderBottom: '1px solid #e2e0d8',
                  paddingBottom: 16
                }}>
                  <div style={{ width: 42, height: 42, background: 'rgba(231,182,5,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', border: '1px solid rgba(231,182,5,0.2)' }}>
                    <Ticket size={20} style={{ color: '#9b7011' }} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '26px', color: '#2a2820' }}>
                      Discounted Event Tickets
                    </h2>
                    <p style={{ color: '#5a5650', fontSize: '14px', marginTop: 2 }}>VIP access codes and price cuts for flagship tech conferences, investor dinners, and founder summits.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {filteredEvents.map((offer) => (
                    <PassportOfferCard key={offer.id} offer={offer} isMember={isMember} onCopy={handleCopy} copiedId={copiedId} />
                  ))}
                </div>
              </div>
            )}

            {/* MEMBERSHIPS CATEGORY */}
            {filteredMemberships.length > 0 && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  marginBottom: 32,
                  borderBottom: '1px solid #e2e0d8',
                  paddingBottom: 16
                }}>
                  <div style={{ width: 42, height: 42, background: 'rgba(231,182,5,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', border: '1px solid rgba(231,182,5,0.2)' }}>
                    <Building2 size={20} style={{ color: '#9b7011' }} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '26px', color: '#2a2820' }}>
                      Discounted Club & Business Memberships
                    </h2>
                    <p style={{ color: '#5a5650', fontSize: '14px', marginTop: 2 }}>Curated savings on executive golf clubs, coworking networks, and mastermind application fees.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {filteredMemberships.map((offer) => (
                    <PassportOfferCard key={offer.id} offer={offer} isMember={isMember} onCopy={handleCopy} copiedId={copiedId} />
                  ))}
                </div>
              </div>
            )}

            {/* BOTTOM CONVERSION CTA BANNER */}
            {!isMember && (
              <div style={{
                marginTop: '100px',
                padding: '48px',
                backgroundImage: 'linear-gradient(to right, rgba(26,25,23,0.92) 0%, rgba(26,25,23,0.8) 50%, rgba(26,25,23,0.92) 100%), url("/images/event2.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                border: '1px solid rgba(231,182,5,0.15)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
                borderRadius: '8px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  filter: 'blur(120px)',
                  opacity: 0.08,
                  pointerEvents: 'none'
                }} />
                
                <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '28px', color: '#fff', marginBottom: 14 }}>
                  Your Network Is Your Net Worth
                </h3>
                <p style={{ fontFamily: 'var(--font-serif)', color: '#bbb', fontSize: '16px', maxWidth: '580px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                  The Networking Passport is built for founders who know that the right room, and the right membership, pays for itself. This one&apos;s exclusive to Foundrs Edge — you won&apos;t find it anywhere else.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/membership" className="btn-primary" style={{ padding: '12px 28px' }}>
                    Activate Your Passport
                  </Link>
                  <Link 
                    href="/login" 
                    className="btn-outline" 
                    style={{ 
                      padding: '11px 26px', 
                      border: '2px solid var(--gold)', 
                      color: 'var(--gold)',
                      clipPath: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    Log In
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </PageLayout>
  );
}

// Offer Card Subcomponent
function PassportOfferCard({ 
  offer, 
  isMember, 
  onCopy, 
  copiedId 
}: { 
  offer: PassportOffer; 
  isMember: boolean; 
  onCopy: (id: string, code: string) => void;
  copiedId: string | null;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div 
      className="passport-card-row"
      style={{
        background: '#fff',
        border: '1px solid #e2e0d8'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.05)';
        if (isMember) e.currentTarget.style.borderColor = 'rgba(231,182,5,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
        e.currentTarget.style.borderColor = '#e2e0d8';
      }}
    >
      {/* Left Details Panel */}
      <div className="passport-card-left">
        <div>
          {/* Header metadata */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              color: '#9a9585',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {offer.provider}
            </span>
          </div>

          <h3 style={{ 
            fontFamily: 'var(--font-sans)', 
            fontWeight: 800, 
            fontSize: '22px', 
            color: '#2a2820',
            marginBottom: 10
          }}>
            {offer.title}
          </h3>

          {/* Location & Date Details */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#5a5650', fontSize: '13px' }}>
              <MapPin size={13} style={{ color: '#9a9585' }} />
              <span>{offer.location}</span>
            </div>
            {offer.eventDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#5a5650', fontSize: '13px' }}>
                <Calendar size={13} style={{ color: '#9a9585' }} />
                <span>{offer.eventDate}</span>
              </div>
            )}
            {offer.expiryDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#5a5650', fontSize: '13px' }}>
                <Calendar size={13} style={{ color: '#9a9585' }} />
                <span>Expires: {new Date(offer.expiryDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          <p style={{ 
            color: '#5a5650', 
            fontSize: '14px', 
            lineHeight: 1.6, 
            marginBottom: 20,
            fontFamily: 'var(--font-serif)'
          }}>
            {offer.description}
          </p>
        </div>

        {/* Member Savings Box */}
        {offer.discountedPrice && (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'baseline', 
            gap: 8, 
            background: '#f9f9f7',
            padding: '8px 14px',
            borderRadius: '4px',
            border: '1px solid #e2e0d8',
            alignSelf: 'flex-start'
          }}>
            <span style={{ color: '#5a5650', fontSize: '12px' }}>Member Savings:</span>
            <span style={{ color: '#2a2820', fontSize: '18px', fontWeight: 800 }}>{offer.discountedPrice}</span>
          </div>
        )}
      </div>

      {/* Right Redemption/Lock Action Panel */}
      <div className="passport-card-right" style={{ background: '#fdfdfc', borderLeft: '1px solid #e2e0d8' }}>
        {/* Savings Badge */}
        <div style={{
          alignSelf: 'center',
          background: 'rgba(231,182,5,0.08)',
          color: '#9b7011',
          border: '1px solid rgba(231,182,5,0.25)',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 800,
          borderRadius: '4px',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          marginBottom: 20,
          textAlign: 'center',
          width: 'fit-content'
        }}>
          {offer.savingValue}
        </div>

        {/* REDEMPTION BOX: LOCKED VS UNLOCKED */}
        {!isMember ? (
          /* LOCKED (GUEST VIEW) */
          <div style={{
            background: '#f9f9f7',
            border: '1px dashed #cbd5e1',
            borderRadius: '4px',
            padding: '20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9b7011' }}>
              <Lock size={14} />
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members Only</span>
            </div>
            <p style={{ color: '#5a5650', fontSize: '11px', margin: 0, fontFamily: 'var(--font-serif)', lineHeight: 1.4 }}>This code and booking link are reserved for premium members.</p>
            <Link 
              href="/membership" 
              style={{
                width: '100%',
                background: 'var(--gold)',
                color: '#000',
                textDecoration: 'none',
                padding: '10px 0',
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gold-dark)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gold)'}
            >
              Unlock Promo <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          /* UNLOCKED (MEMBER VIEW) */
          <div style={{
            background: 'rgba(231,182,5,0.03)',
            border: '1px solid rgba(231,182,5,0.12)',
            borderRadius: '4px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#27ae60', marginBottom: 2 }}>
              <Unlock size={14} />
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Unlocked</span>
            </div>
            
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                style={{
                  width: '100%',
                  background: 'var(--gold)',
                  color: '#000',
                  border: 'none',
                  padding: '10px 0',
                  fontSize: '12px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gold-dark)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gold)'}
              >
                <Unlock size={12} /> Reveal Promo Code
              </button>
            ) : (
              <>
                {/* Promo Code Box */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: '#f9f9f7',
                  border: '1px solid #e2e0d8',
                  borderRadius: '4px',
                  padding: '8px 12px',
                }}>
                  <code style={{ color: '#2a2820', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {offer.promoCode}
                  </code>
                  <button 
                    onClick={() => onCopy(offer.id, offer.promoCode)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedId === offer.id ? '#27ae60' : '#9b7011',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {copiedId === offer.id ? <CheckCircle size={14} /> : <Copy size={14} />}
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                      {copiedId === offer.id ? 'Copied' : 'Copy'}
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* Action button or description */}
            {offer.redeemUrl && offer.redeemUrl !== '#' ? (
              <a 
                href={offer.redeemUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  background: '#2a2820',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '10px 0',
                  fontSize: '12px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#000'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2a2820'}
              >
                Go to Booking Site <ExternalLink size={12} />
              </a>
            ) : (
              <div
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '10px 12px',
                  fontSize: '11px',
                  color: '#a09d94',
                  borderRadius: '4px',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}
              >
                <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: '#e7b605' }} />
                Present this code directly in person or during checkout with the provider.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
