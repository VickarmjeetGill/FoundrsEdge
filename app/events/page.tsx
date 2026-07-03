'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Search, Users, ExternalLink, ChevronRight, Wifi, Star } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

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
};

const categoryColors: Record<string, string> = {
  Networking: '#e7b605',
  Workshop: '#9b7011',
  Webinar: '#5a3a08',
  'Supper Club': '#000',
  Other: '#5a5650',
};

const categories = ['All', 'Networking', 'Workshop', 'Webinar', 'Supper Club', 'Other'];

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function getMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

function parseEventDate(dateStr: string): Date {
  // If the date already contains hyphens or has the year included, parse it directly
  if (dateStr.includes('-') || dateStr.includes('20')) {
    return new Date(dateStr);
  }
  // Fallback for short mock dates (e.g. "Jun 18")
  return new Date(dateStr + ' 2026');
}

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [showBookmarkInfo, setShowBookmarkInfo] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [category, dateFilter, locationFilter, featuredOnly]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (category !== 'All') queryParams.append('category', category);
      if (locationFilter !== 'All Locations') queryParams.append('locationType', locationFilter);
      if (featuredOnly) queryParams.append('featured', 'true');
      if (search) queryParams.append('q', search);

      const res = await fetch(`/api/events?${queryParams.toString()}`);
      if (!res.ok) { setLoadError(true); return; }
      const data = await res.json();
      setDbEvents(data.events || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
        setTotalResults(data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load DB events:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [currentPage, category, locationFilter, featuredOnly, search]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const mappedDbEvents: Event[] = dbEvents.map((e: any) => ({
    id: e.id,
    title: e.title,
    desc: e.description,
    category: e.category,
    date: e.date,
    time: e.time,
    duration: '2 hrs',
    location: e.location,
    isOnline: e.location ? (
      e.location.toLowerCase().includes('online') ||
      e.location.toLowerCase().includes('zoom') ||
      e.location.toLowerCase().includes('meeting link') ||
      e.location.toLowerCase().includes('provided upon registration')
    ) : false,
    price: e.price,
    host: e.host,
    hostBio: 'Member submitted event.',
    capacity: e.capacity || 50,
    attendees: e.attendees || 0,
    featured: e.featured || false,
    status: 'approved',
    tags: [e.category],
  }));

  const allEvents = mappedDbEvents;

  const filtered = allEvents
    .filter(e => {
      let matchDate = true;
      if (dateFilter === 'This Week') {
        const { start, end } = getWeekRange();
        const d = parseEventDate(e.date);
        matchDate = d >= start && d <= end;
      } else if (dateFilter === 'This Month') {
        const { start, end } = getMonthRange();
        const d = parseEventDate(e.date);
        matchDate = d >= start && d <= end;
      }

      return matchDate;
    })
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime();
    });

  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Upcoming Events</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(40px, 6vw, 72px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
            EVENTS &amp;<br /><span style={{ color: '#e7b605' }}>EXPERIENCES</span>
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#999', fontSize: '18px', maxWidth: 520, lineHeight: 1.7, marginBottom: 20 }}>
            From intimate supper clubs to hands-on workshops — every event is curated for Calgary's entrepreneurial community.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <button 
              onClick={() => setShowBookmarkInfo(!showBookmarkInfo)}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 8, 
                background: 'rgba(255,255,255,0.08)', 
                border: '1px solid rgba(255,255,255,0.15)', 
                color: '#fff', 
                padding: '10px 18px', 
                fontSize: '13px', 
                fontWeight: 700, 
                fontFamily: 'DM Sans, sans-serif', 
                borderRadius: 0, 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <Star size={13} fill="#e7b605" stroke="#e7b605" /> Bookmark Calendar
            </button>

            {showBookmarkInfo && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 12,
                background: '#fff',
                border: '1px solid #e2e0d8',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                padding: '20px',
                zIndex: 99,
                width: '320px',
                textAlign: 'left'
              }}>
                <h4 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '14px', color: '#2a2820', margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Bookmark Calendar
                  <button onClick={() => setShowBookmarkInfo(false)} style={{ background: 'none', border: 'none', color: '#9a9585', fontSize: '18px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
                </h4>
                <p style={{ color: '#5a5650', fontFamily: 'Noto Serif, serif', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                  Press <kbd style={{ background: '#f0efe9', padding: '2px 6px', borderRadius: 3, border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'sans-serif' }}>Ctrl + D</kbd> (Windows) or <kbd style={{ background: '#f0efe9', padding: '2px 6px', borderRadius: 3, border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'sans-serif' }}>⌘ + D</kbd> (Mac) to quickly bookmark this calendar page.
                </p>
                <div style={{ marginTop: 12, borderTop: '1px solid #e2e0d8', paddingTop: 8, color: '#9a9585', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>
                  On mobile devices, tap your browser's share icon and select <strong>"Add to Bookmarks"</strong> or <strong>"Add to Home Screen"</strong>.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e0d8', position: 'sticky', top: 72, zIndex: 50 }}>
        <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          <div className="filter-bar-inner" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
              <input
                className="input-field"
                placeholder="Search events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 40, margin: 0 }}
              />
            </div>

            {/* Category */}
            <select className="select-field" value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto', minWidth: 140, margin: 0 }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>

            {/* Date */}
            <select className="select-field" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ width: 'auto', minWidth: 140, margin: 0 }}>
              {['All Dates', 'This Week', 'This Month'].map(d => <option key={d}>{d}</option>)}
            </select>

            {/* Location */}
            <select className="select-field" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} style={{ width: 'auto', minWidth: 140, margin: 0 }}>
              {['All Locations', 'In-Person', 'Online'].map(l => <option key={l}>{l}</option>)}
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
          </div>
        </div>
      </div>

      {/* Events List */}
      <div style={{ padding: '60px 0', background: '#f9f9f7' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ color: '#9a9585', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
              Showing {filtered.length} of {totalResults} event{totalResults !== 1 ? 's' : ''} found </div>
            <Link href="/events/submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}> Submit Event <ExternalLink size={16} /></Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

            {!loading && loadError && (
              <div style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
                <ErrorState kind="network" onRetry={loadEvents} />
              </div>
            )}

            {!loading && !loadError && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid #e2e0d8' }}>
                <div style={{ fontSize: '40px', marginBottom: 16 }}>🔍</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: 8 }}>No events found</div>
                <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>Try adjusting your filters or search terms.</div>
              </div>
            )}

            {!loading && !loadError && filtered.map(event => {
              const spotsLeft = event.capacity - event.attendees;
              const fillPct = Math.round((event.attendees / event.capacity) * 100);
              return (
                <div
                  key={event.id}
                  className="card-row"
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e0d8',
                    padding: '32px',
                    transition: 'all 0.2s',
                    borderLeft: event.featured ? '4px solid #e7b605' : '4px solid transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  {/* Left: Content */}
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span
                        className="tag"
                        style={{
                          background: categoryColors[event.category] ? `${categoryColors[event.category]}20` : '#f0efe9',
                          color: categoryColors[event.category] || '#5a5650',
                        }}
                      >
                        {event.category}
                      </span>
                      {event.featured && <span className="tag gold"><Star size={10} style={{ marginRight: 3 }} fill="#9b7011" />Featured</span>}
                      {event.isOnline && (
                        <span className="tag" style={{ background: '#e8f4ff', color: '#1a6fc4' }}>
                          <Wifi size={10} style={{ marginRight: 3 }} />Online
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: 8, color: '#2a2820' }}>
                      {event.title}
                    </h3>
                    <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: 16, maxWidth: 580 }}>
                      {(event.desc || '').length > 140 ? (event.desc || '').slice(0, 140) + '…' : (event.desc || '')}
                    </p>

                    <div style={{ color: '#9a9585', fontSize: '13px', marginBottom: 16, fontFamily: 'DM Sans, sans-serif' }}>
                      Hosted by <strong style={{ color: '#5a5650' }}>{event.host}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a9585', fontSize: '13px' }}>
                        <Calendar size={14} style={{ color: '#e7b605' }} /> {event.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a9585', fontSize: '13px' }}>
                        <Clock size={14} style={{ color: '#e7b605' }} /> {event.time} · {event.duration}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a9585', fontSize: '13px' }}>
                        <MapPin size={14} style={{ color: '#e7b605' }} /> {event.location}
                      </span>
                    </div>

                    {/* Capacity bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, maxWidth: 160, height: 4, background: '#e2e0d8', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct >= 90 ? '#c0392b' : '#e7b605', borderRadius: 2, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
                        <Users size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {event.attendees}/{event.capacity} · {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                      </span>
                    </div>
                  </div>

                  {/* Right: CTA */}
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '24px',
                      color: event.price?.toLowerCase() === 'free' ? '#2d7a3a' : event.price === 'Members' ? '#9b7011' : '#000',
                    }}>
                      {event.price?.toLowerCase() === 'free' ? 'Free' : event.price}
                    </div>
                    <Link href={`/events/${event.id}`} className="btn-primary" style={{ padding: '10px 20px', fontSize: '12px' }}>
                      View Event <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 40, fontFamily: 'DM Sans, sans-serif' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '10px 16px',
                  border: '1px solid #e2e0d8', background: '#fff', color: currentPage === 1 ? '#ccc' : '#2a2820',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px'
                }}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '10px 16px', border: '1px solid',
                    borderColor: currentPage === pageNum ? '#e7b605' : '#e2e0d8',
                    background: currentPage === pageNum ? '#e7b605' : '#fff',
                    color: currentPage === pageNum ? '#fff' : '#2a2820',
                    cursor: 'pointer', fontWeight: 700, fontSize: '13px'
                  }}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '10px 16px',
                  border: '1px solid #e2e0d8', background: '#fff', color: currentPage === totalPages ? '#ccc' : '#2a2820',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px'
                }}
              >
                Next
              </button>
            </div>
          )}


          {/* Submit Event CTA */}
          <div style={{ marginTop: 48, background: '#000', padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', color: '#fff', marginBottom: 8 }}>Hosting an event?</h3>
              <p style={{ color: '#888', fontFamily: 'Noto Serif, serif', fontSize: '15px' }}>Submit your event for review. Members get priority placement and promotion.</p>
            </div>
            <Link href="/events/submit" className="btn-primary">Submit Event <ExternalLink size={16} /></Link>
          </div>
          {/* Subscribe CTA */}
          <div style={{ marginTop: 48, padding: '48px', background: '#fff', border: '1px solid #e2e0d8', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', color: '#2a2820', marginBottom: 8 }}>Get Weekly Event Alerts</h3>
            <p style={{ color: '#5a5650', fontFamily: 'Noto Serif, serif', fontSize: '15px', lineHeight: 1.6, marginBottom: 24, maxWidth: '520px' }}>
              Subscribe to get notified of new business networking events, startup mixers, and workshops sent straight to your email.
            </p>

            {subscribeSuccess ? (
              <div style={{ background: 'rgba(231,182,5,0.08)', border: '1px solid #e7b605', color: '#9b7011', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', padding: '12px 24px', textAlign: 'center', width: '100%', maxWidth: '480px' }}>
                ✓ You're subscribed! We'll keep you updated.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (subscribedEmail.trim()) setSubscribeSuccess(true);
                }}
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', maxWidth: '480px', justifyContent: 'center' }}
              >
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="Enter your email address"
                  value={subscribedEmail}
                  onChange={(e) => setSubscribedEmail(e.target.value)}
                  style={{ flex: 1, minWidth: '240px', margin: 0 }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '14px 28px' }}>
                  Subscribe
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
