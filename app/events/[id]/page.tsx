'use client';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, Share2, ArrowLeft, Wifi, Star, ChevronRight } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { use, useState, useEffect } from 'react';
import { getProfile } from '@/app/actions/profile';

type Event = {
  id: number;
  title: string;
  desc: string;
  category: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  isOnline: boolean;
  price: string;
  host: string;
  hostBio: string;
  capacity: number;
  attendees: number;
  featured: boolean;
  status: 'approved' | 'pending' | 'rejected';
  tags: string[];
  member_promo_code?: string;
  memberPromoCode?: string;
};

const categoryColors: Record<string, string> = {
  Networking: '#e7b605',
  Workshop: '#9b7011',
  Webinar: '#5a3a08',
  'Supper Club': '#000',
  Other: '#5a5650',
};

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) {
    return timeStr;
  }
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      return `${displayHours}:${minutes} ${ampm}`;
    }
  }
  return timeStr;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // 1. Setup states to hold your event data, other events, and loading status
  const [event, setEvent] = useState<any | null>(null);
  const [otherEvents, setOtherEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [hasRsvpd, setHasRsvpd] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpFeedback, setRsvpFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 2. Fetch the event details and recommendations when the page loads
  useEffect(() => {
    async function loadEventDetails() {
      try {
        setLoading(true);

        // Fetch this specific event details from the database
        const res = await fetch(`/api/events/${id}`);
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
        } else {
          setEvent(null);
        }

        // Fetch other approved events for recommendations
        const resOthers = await fetch('/api/events');
        if (resOthers.ok) {
          const rawOthers = await resOthers.json();
          const othersData = Array.isArray(rawOthers) ? rawOthers : (rawOthers.events || []);
          // Filter out the current event and get up to 2 recommendations
          setOtherEvents(othersData.filter((e: any) => e.id !== id).slice(0, 2));
        }

        // Check user profile
        const profRes = await getProfile();
        if (profRes.success && profRes.user) {
          setUserProfile(profRes.user);
        }

        // Check local storage for RSVP status
        if (typeof window !== 'undefined') {
          const rsvps = JSON.parse(localStorage.getItem('fe_rsvp_events') || '[]');
          if (rsvps.includes(id)) {
            setHasRsvpd(true);
          }
        }
      } catch (err) {
        console.error("Failed to load event details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEventDetails();
  }, [id]);

  const handleRsvp = async () => {
    if (!userProfile) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    if (hasRsvpd) return;

    try {
      setRsvpLoading(true);
      setRsvpFeedback(null);
      const res = await fetch(`/api/events/${id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        // Update local storage
        const rsvps = JSON.parse(localStorage.getItem('fe_rsvp_events') || '[]');
        if (!rsvps.includes(id)) {
          rsvps.push(id);
          localStorage.setItem('fe_rsvp_events', JSON.stringify(rsvps));
        }
        setHasRsvpd(true);
        // Refresh event data to show updated attendees count
        setEvent(data.event);
        setRsvpFeedback({ type: 'success', message: "Successfully registered for the event!" });
      } else {
        const errorData = await res.json();
        setRsvpFeedback({ type: 'error', message: errorData.error || "Failed to RSVP." });
      }
    } catch (err) {
      console.error("RSVP error:", err);
      setRsvpFeedback({ type: 'error', message: "An error occurred. Please try again." });
    } finally {
      setRsvpLoading(false);
    }
  };

  // 3. Show a loading screen while fetching
  if (loading) {
    return (
      <PageLayout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#e7b605' }}>
            Loading event details...
          </div>
        </div>
      </PageLayout>
    );
  }

  // 4. Show "Event not found" if the load completed but we didn't find any event
  if (!event) {
    return (
      <PageLayout>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 40px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', color: '#2a2820' }}>Event not found</div>
          <p style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>This event may have been removed or the link is incorrect.</p>
          <Link href="/events" className="btn-primary" style={{ marginTop: 8 }}>
            <ArrowLeft size={16} /> Back to Events
          </Link>
        </div>
      </PageLayout>
    );
  }

  // Helper variables for the rest of your UI (already in your file)
  const spotsLeft = event.capacity - event.attendees;
  const fillPct = Math.round((event.attendees / event.capacity) * 100);
  const hostInitial = (event.host || "M").charAt(0).toUpperCase();

  // NOTE: You'll also need to update the description split logic slightly,
  // because in the database, description is saved as 'description', not 'desc':
  const descriptionText = event.description || event.desc || "";
  const descParagraphs = descriptionText.split('\n\n').filter(Boolean);

  const isOnlineEvent = event.isOnline || 
    event.location?.toLowerCase().includes("online") || 
    event.location?.toLowerCase().includes("zoom") ||
    event.location?.toLowerCase().includes("meeting link") ||
    event.location?.toLowerCase().includes("provided upon registration");

  const eventTags = event.tags && event.tags.length > 0
    ? event.tags
    : [
        event.category,
        isOnlineEvent ? "Online" : "In-Person",
        event.price === "Free" || event.price?.toLowerCase() === "free" ? "Free" : "Paid"
      ].filter(Boolean);


  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <Link
            href="/events"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            <ArrowLeft size={14} /> All Events
          </Link>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span
              className="tag"
              style={{
                background: categoryColors[event.category] ? `${categoryColors[event.category]}30` : '#333',
                color: categoryColors[event.category] || '#fff',
              }}
            >
              {event.category}
            </span>
            {event.featured && (
              <span className="tag" style={{ background: 'rgba(231,182,5,0.15)', color: '#e7b605' }}>
                <Star size={10} fill="#e7b605" style={{ marginRight: 3 }} />Featured
              </span>
            )}
            {isOnlineEvent && (
              <span className="tag" style={{ background: 'rgba(26,111,196,0.2)', color: '#60aaff' }}>
                <Wifi size={10} style={{ marginRight: 3 }} />Online
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(32px, 5vw, 60px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 28, maxWidth: 760 }}>
            {event.title}
          </h1>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}>
              <Calendar size={16} style={{ color: '#e7b605' }} />
              {event.date} at {formatTime(event.time)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}>
              <Clock size={16} style={{ color: '#e7b605' }} />
              {event.duration || "2 hrs"}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}>
              <MapPin size={16} style={{ color: '#e7b605' }} />
              {event.location}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: '#f9f9f7', padding: '80px 0' }}>
        <div className="container">
          <div className="grid-halves" style={{ alignItems: 'start' }}>
            {/* Left: Description + Host + Tags */}
            <div>
              {/* Description */}
              <div style={{ marginBottom: 48 }}>
                <div className="section-label" style={{ marginBottom: 20 }}>About This Event</div>
                {(descParagraphs || []).map((para: string, i: number) => (
                  <p key={i} style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '16px', lineHeight: 1.8, marginBottom: 20 }}>
                    {para}
                  </p>
                ))}
              </div>

              {/* Host card */}
              <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px', marginBottom: 32 }}>
                <div className="section-label" style={{ marginBottom: 20 }}>Your Host</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, background: '#000', color: '#e7b605',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '22px', flexShrink: 0,
                  }}>
                    {hostInitial}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '16px', color: '#2a2820', marginBottom: 6 }}>
                      {event.host}
                    </div>
                    <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7 }}>
                      {event.hostBio || "Member submitted event."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="section-label" style={{ marginBottom: 16 }}>Tags</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {eventTags.map((tag: string) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Booking widget */}
            <div className="booking-widget-sticky" style={{ position: 'sticky', top: 100 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderTop: '4px solid #000' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid #e2e0d8' }}>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '36px',
                    color: event.price === 'Free' ? '#2d7a3a' : event.price === 'Members' ? '#9b7011' : '#000',
                    marginBottom: 4,
                  }}>
                    {event.price}
                  </div>
                  <div style={{ color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
                    {event.price === 'Free' ? 'No cost to attend' : event.price === 'Members' ? 'Members only — login to access' : 'Per attendee'}
                  </div>
                </div>

                <div style={{ padding: '28px 32px', borderBottom: '1px solid #e2e0d8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 700, color: '#5a5650' }}>
                      <Users size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                      {event.attendees} registered
                    </span>
                    <span style={{
                      fontSize: '12px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                      color: spotsLeft <= 5 ? '#c0392b' : '#9a9585',
                    }}>
                      {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Fully booked'}
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#e2e0d8', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', width: `${fillPct}%`,
                      background: fillPct >= 90 ? '#c0392b' : '#e7b605',
                      borderRadius: 3, transition: 'width 0.4s',
                    }} />
                  </div>
                </div>

                {(event.member_promo_code || event.memberPromoCode) && (
                  <div style={{
                    padding: '16px 32px',
                    background: 'rgba(231,182,5,0.08)',
                    borderBottom: '1px solid #e2e0d8',
                    borderLeft: '4px solid #e7b605',
                  }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '11px', color: '#9b7011', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                      Foundrs Edge Member Promo Code
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '15px', color: '#2a2820', background: '#fff', border: '1px dashed #e7b605', padding: '6px 12px', display: 'inline-block', borderRadius: 4, letterSpacing: '0.05em' }}>
                      {event.member_promo_code || event.memberPromoCode}
                    </div>
                  </div>
                )}

                <div style={{ padding: '28px 32px', borderBottom: '1px solid #e2e0d8' }}>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '14px' }}
                    onClick={handleRsvp}
                    disabled={spotsLeft === 0 || hasRsvpd || rsvpLoading}
                  >
                    {spotsLeft === 0 ? 'Event Full' : hasRsvpd ? 'Registered ✓' : rsvpLoading ? 'Registering...' : (!userProfile && event.price === 'Members') ? 'Login to Register' : 'RSVP / Register'}
                  </button>
                  {event.price !== 'Free' && event.price !== 'Members' && !hasRsvpd && (
                    <p style={{ textAlign: 'center', marginTop: 12, fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
                      Secure payment via Stripe
                    </p>
                  )}
                  {rsvpFeedback && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      background: rsvpFeedback.type === 'success' ? '#f0faf2' : '#fdf3f2',
                      border: `1px solid ${rsvpFeedback.type === 'success' ? '#b2dfbd' : '#f5c6cb'}`,
                      color: rsvpFeedback.type === 'success' ? '#1e7e34' : '#721c24',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 600,
                      fontSize: '13px',
                      textAlign: 'center'
                    }}>
                      {rsvpFeedback.message}
                    </div>
                  )}
                </div>

                <div style={{ padding: '20px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', cursor: 'pointer' }}
                    onClick={() => { if (typeof window !== 'undefined') navigator.clipboard?.writeText(window.location.href); }}
                  >
                    <Share2 size={14} />
                    Share this event
                  </div>
                </div>
              </div>

              {/* Quick details */}
              <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e2e0d8', padding: '24px 28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Calendar size={16} style={{ color: '#e7b605', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#2a2820' }}>{event.date}</div>
                      <div style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>{formatTime(event.time)} · {event.duration}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <MapPin size={16} style={{ color: '#e7b605', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#2a2820' }}>
                        {isOnlineEvent ? 'Online Event' : event.location}
                      </div>
                      {isOnlineEvent && (
                        <div style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>Link sent upon registration</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* More Events */}
          {otherEvents.length > 0 && (
            <div style={{ marginTop: 80 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div className="section-label">More Events</div>
                <Link href="/events" style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#9b7011', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {otherEvents.map(e => (
                  <div
                    key={e.id}
                    className="card-row"
                    style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px', transition: 'all 0.2s' }}
                    onMouseEnter={el => (el.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                    onMouseLeave={el => (el.currentTarget.style.boxShadow = 'none')}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <span className="tag" style={{ background: categoryColors[e.category] ? `${categoryColors[e.category]}20` : '#f0efe9', color: categoryColors[e.category] || '#5a5650' }}>{e.category}</span>
                        {e.featured && <span className="tag gold">Featured</span>}
                      </div>
                      <h4 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '17px', marginBottom: 8, color: '#2a2820' }}>{e.title}</h4>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9a9585', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                          <Calendar size={13} style={{ color: '#e7b605' }} /> {e.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9a9585', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                          <MapPin size={13} style={{ color: '#e7b605' }} /> {e.location}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '18px', color: e.price === 'Free' ? '#2d7a3a' : '#000' }}>{e.price}</div>
                      <Link href={`/events/${e.id}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '11px' }}>
                        View <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
