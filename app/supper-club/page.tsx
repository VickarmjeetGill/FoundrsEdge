'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, MapPin, Calendar, Lock, Star, ArrowRight } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

type SupperClubEvent = {
  id: string | number;
  date: string;
  venue: string;
  location: string;
  theme: string;
  spots: number;
  total: number;
  waitlist: boolean;
  desc: string;
};

export default function SupperClubPage() {
  const [events, setEvents] = useState<SupperClubEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSupperClub() {
      try {
        const res = await fetch('/api/events?category=Supper Club');
        if (res.ok) {
          const data = await res.json();
          const evList = Array.isArray(data) ? data : data.events || [];
          setEvents(evList.map((e: any) => {
            const capacity = e.capacity || 12;
            const attendees = e.attendees || 0;
            const spotsLeft = Math.max(0, capacity - attendees);
            const isInviteOnly = e.price ? e.price.toLowerCase().includes('invite') : false;
            return {
              id: e.id,
              date: e.date ? `${e.date}${e.time ? ` at ${e.time}` : ''}` : 'Date TBD',
              venue: e.title,
              location: e.location || 'Calgary, AB',
              theme: (e.tags && e.tags[1]) || (isInviteOnly ? 'Invite Only' : 'Founders Dinner'),
              spots: spotsLeft,
              total: capacity,
              waitlist: spotsLeft === 0,
              desc: e.description || '',
            };
          }));
        }
      } catch (err) {
        console.error('Failed to fetch supper club events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSupperClub();
  }, []);
  return (
    <PageLayout>
      {/* Hero - dark, intimate feel */}
      <div style={{ background: '#000', minHeight: '70vh', display: 'flex', alignItems: 'center', paddingTop: 72, position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 80, paddingBottom: 80 }}>
          <div className="section-label" style={{ color: '#e7b605' }}>Exclusive Experience</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(40px, 6vw, 80px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 24 }}>
            THE<br /><span style={{ color: '#e7b605' }}>SUPPER</span><br />CLUB
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#888', fontSize: '18px', maxWidth: 520, lineHeight: 1.8, marginBottom: 32 }}>
            Monthly curated dinners for 12 carefully selected Calgary entrepreneurs. Real conversations over exceptional food. Invite-based. Strictly limited.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['12', 'Seats per dinner'], ['Monthly', 'Frequency'], ['Vetted', 'Guests only'], ['Members', 'Priority access']].map(([val, label]) => (
              <div key={label} style={{ padding: '16px 24px', border: '1px solid #1a1a1a', textAlign: 'center' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '20px', color: '#e7b605' }}>{val}</div>
                <div style={{ fontSize: '11px', color: '#aba7a5', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What is it */}
      <div style={{ padding: '80px 0', background: '#f9f9f7' }}>
        <div className="container">
          <div className="grid-halves">
            <div>
              <div className="section-label">The Experience</div>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '42px', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 24 }}>
                Where Calgary's<br />best founders talk<br /><span style={{ color: '#e7b605' }}>honestly.</span>
              </h2>
              <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '16px', lineHeight: 1.8, marginBottom: 24 }}>
                The Supper Club is not a networking event. It's a facilitated dinner with a curated theme, a small group of intentionally selected guests, and conversations you won't have anywhere else.
              </p>
              <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '16px', lineHeight: 1.8, marginBottom: 32 }}>
                Every dinner has a theme. Every guest is vetted. Phones away, conversations on.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: Lock, text: 'Invite-based or member-priority access' },
                  { icon: Star, text: 'Curated theme and facilitated discussion' },
                  { icon: Users, text: 'Maximum 12-14 guests per dinner' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(231,182,5,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} style={{ color: '#e7b605' }} />
                    </div>
                    <span style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '15px' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#000', padding: '48px', color: '#fff' }}>
              <div style={{ fontSize: '48px', color: '#e7b605', fontFamily: 'Georgia, serif', lineHeight: 1, marginBottom: 16, opacity: 0.5 }}>"</div>
              <p style={{ fontFamily: 'Noto Serif, serif', fontSize: '18px', lineHeight: 1.8, color: '#ddd', marginBottom: 28 }}>
                Member testimonial coming soon.
              </p>
              <div>
                <div style={{ fontWeight: 700 }}>Member Name</div>
                <div style={{ color: '#888', fontSize: '14px', marginTop: 4 }}>Title, Company</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <div className="section-label">Upcoming Dinners</div>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '42px', letterSpacing: '-0.02em', marginBottom: 48 }}>Reserve Your Seat</h2>

          {events.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 40px', background: '#f9f9f7', border: '1px solid #e2e0d8', marginBottom: 48 }}>
              <div style={{ fontSize: '40px', marginBottom: 16 }}>🍽️</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: 8, color: '#2a2820' }}>No dinners scheduled yet</div>
              <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>Upcoming Supper Club dates will be posted here. Members receive first notice.</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {events.map(event => (
              <div key={event.id} className="card-row" style={{
                background: '#f9f9f7', border: '1px solid #e2e0d8',
                padding: '36px', alignItems: 'center',
                borderLeft: '4px solid #e7b605',
              }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <span className="tag dark">{event.theme}</span>
                    {event.waitlist && <span className="tag" style={{ background: '#fee2e2', color: '#dc2626' }}>Waitlist Only</span>}
                    {event.spots > 0 && event.spots <= 3 && <span className="tag" style={{ background: '#fef3c7', color: '#92400e' }}>Only {event.spots} Spots Left</span>}
                  </div>
                  <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 8 }}>{event.venue}</h3>
                  <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: 16 }}>{event.desc}</p>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a9585', fontSize: '13px' }}>
                      <Calendar size={13} style={{ color: '#e7b605' }} /> {event.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a9585', fontSize: '13px' }}>
                      <MapPin size={13} style={{ color: '#e7b605' }} /> {event.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a9585', fontSize: '13px' }}>
                      <Users size={13} style={{ color: '#e7b605' }} /> {event.spots > 0 ? `${event.spots} of ${event.total} spots available` : `Waitlist · ${event.total} guests`}
                    </span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <button className={event.waitlist ? 'btn-outline' : 'btn-primary'} style={{ padding: '12px 24px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {event.waitlist ? 'Join Waitlist' : 'Reserve Seat'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, background: '#000', padding: '48px', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '28px', color: '#fff', marginBottom: 12 }}>Not a member yet?</h3>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#888', marginBottom: 28 }}>Members receive priority access and early invites to all Supper Club events.</p>
            <Link href="/apply" className="btn-primary">Apply for Membership <ArrowRight size={18} /></Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
