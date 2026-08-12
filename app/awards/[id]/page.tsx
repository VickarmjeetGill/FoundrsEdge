'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Calendar, MapPin, Clock, Star, ChevronRight, Share2, Tag, Building2 } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { seedAwards, type Award } from '../page';

function daysUntil(dateStr: string) {
  if (!dateStr || dateStr === 'Rolling') return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function AwardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [award, setAward] = useState<Award | null>(null);
  const [others, setOthers] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [nominated, setNominated] = useState(false);

  useEffect(() => {
    async function loadAwardDetails() {
      try {
        setLoading(true);
        // Fetch current award details
        const detailRes = await fetch(`/api/awards/${id}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const mappedAward: Award = {
            ...detailData,
            awardDate: detailData.award_date || detailData.awardDate || '',
          };
          setAward(mappedAward);
        } else {
          setAward(null);
        }

        // Fetch other awards for the recommendations slider
        const listRes = await fetch('/api/awards');
        if (listRes.ok) {
          const rawData = await listRes.json();
          const listData = Array.isArray(rawData) ? rawData : (rawData.awards || []);
          const mappedList: Award[] = listData.map((a: any) => ({
            ...a,
            awardDate: a.award_date || a.awardDate || '',
          }));
          setOthers(mappedList.filter((a: Award) => a.id !== id && a.nominationsOpen).slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching award details:', error);
      } finally {
        setLoading(false);
      }
    }

    // Check if already nominated
    const nomRaw = localStorage.getItem('fe_my_nominations');
    if (nomRaw) {
      try {
        const noms = JSON.parse(nomRaw);
        setNominated(noms.some((n: any) => n.awardId === id));
      } catch { }
    }

    loadAwardDetails();
  }, [id]);

  if (loading) {
    return (
      <PageLayout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#e7b605' }}>Loading award...</div>
        </div>
      </PageLayout>
    );
  }

  if (!award) {
    return (
      <PageLayout>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 40px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', color: '#2a2820' }}>Award not found</div>
          <p style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>This award may have been removed or the link is incorrect.</p>
          <Link href="/awards" className="btn-primary"><ArrowLeft size={16} /> Back to Awards</Link>
        </div>
      </PageLayout>
    );
  }

  const days = daysUntil(award.deadline);
  const isUrgent = days !== null && days <= 30 && days >= 0;
  const isClosed = !award.nominationsOpen || (days !== null && days < 0);

  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <Link href="/awards" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <ArrowLeft size={14} /> All Awards
          </Link>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="tag" style={{ background: '#333', color: '#ccc' }}><Tag size={10} style={{ marginRight: 3 }} />{award.category}</span>
            <span className="tag" style={{ background: '#333', color: '#ccc' }}><MapPin size={10} style={{ marginRight: 3 }} />{award.region}</span>
            {award.featured && <span className="tag" style={{ background: 'rgba(231,182,5,0.15)', color: '#e7b605' }}><Star size={10} fill="#e7b605" style={{ marginRight: 3 }} />Editor&apos;s Pick</span>}
            {isUrgent && <span className="tag" style={{ background: 'rgba(220,38,38,0.15)', color: '#ff6b6b' }}><Clock size={10} style={{ marginRight: 3 }} />Deadline Soon</span>}
            {isClosed && <span className="tag" style={{ background: 'rgba(255,255,255,0.1)', color: '#888' }}>Nominations Closed</span>}
          </div>

          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 52px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 12, maxWidth: 760 }}>
            {award.name}
          </h1>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#e7b605', marginBottom: 20 }}>
            {award.org}{award.sponsor ? ` · Sponsored by ${award.sponsor}` : ''}
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}>
              <Calendar size={15} style={{ color: '#e7b605' }} />
              Deadline: {award.deadline ? new Date(award.deadline).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Rolling'}
            </span>
            {days !== null && days >= 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: isUrgent ? '#ff6b6b' : '#ccc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}>
                <Clock size={15} style={{ color: isUrgent ? '#ff6b6b' : '#e7b605' }} /> {days} days remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: '#f9f9f7', padding: '80px 0' }}>
        <div className="container">
          <div className="grid-halves" style={{ alignItems: 'start' }}>
            {/* Left */}
            <div>
              <div style={{ marginBottom: 40 }}>
                <div className="section-label" style={{ marginBottom: 20 }}>About This Award</div>
                <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '16px', lineHeight: 1.8 }}>{award.desc}</p>
              </div>

              {/* Award details card */}
              <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px', marginBottom: 32 }}>
                <div className="section-label" style={{ marginBottom: 20 }}>Award Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Category', value: award.category },
                    { label: 'Region', value: award.region },
                    { label: 'Prize / Value', value: award.value },
                    { label: 'Frequency', value: award.cycle },
                    { label: 'Award Date', value: award.awardDate ? new Date(award.awardDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD' },
                    ...(award.sponsor ? [{ label: 'Sponsor', value: award.sponsor }] : []),
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0efe9', paddingBottom: 12, fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
                      <span style={{ color: '#9a9585', fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontWeight: 700, color: '#2a2820' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Organizer card */}
              <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px' }}>
                <div className="section-label" style={{ marginBottom: 16 }}>Presented By</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, background: '#000', color: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '20px', flexShrink: 0 }}>
                    {award.org.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '15px', color: '#2a2820', marginBottom: 2 }}>{award.org}</div>
                    <div style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>{award.region} · {award.cycle}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Nomination widget */}
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderTop: '4px solid #e7b605' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid #e2e0d8' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '32px', color: award.value === 'Prestige' ? '#9b7011' : '#2d7a3a', marginBottom: 4 }}>
                    {award.value}
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#9a9585' }}>
                    {isClosed ? 'Nominations are closed for this award' : 'Prize value for this award'}
                  </div>
                </div>

                <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e0d8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Calendar size={15} style={{ color: '#e7b605', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#2a2820' }}>
                          {award.deadline ? new Date(award.deadline).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Rolling deadline'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
                          Nomination deadline{days !== null && days >= 0 ? ` · ${days} days left` : ''}
                        </div>
                      </div>
                    </div>
                    {award.awardDate && (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <Trophy size={15} style={{ color: '#e7b605', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#2a2820' }}>
                            {new Date(award.awardDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>Award ceremony</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '28px 32px', borderBottom: '1px solid #e2e0d8' }}>
                  {nominated ? (
                    <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)' }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#27ae60', marginBottom: 4 }}>✓ You&apos;ve submitted a nomination</div>
                      <Link href="/dashboard" style={{ fontSize: '12px', color: '#9b7011', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
                        View in dashboard →
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={isClosed ? '#' : `/awards/nominate?awardId=${award.id}`}
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 8, opacity: isClosed ? 0.5 : 1, pointerEvents: isClosed ? 'none' : 'auto' }}
                    >
                      <Trophy size={15} />
                      {isClosed ? 'Nominations Closed' : 'Submit Nomination'}
                    </Link>
                  )}
                </div>

                <div style={{ padding: '20px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', cursor: 'pointer' }}
                    onClick={() => { if (typeof window !== 'undefined') navigator.clipboard?.writeText(window.location.href); }}>
                    <Share2 size={14} /> Share this award
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* More Awards */}
          {others.length > 0 && (
            <div style={{ marginTop: 80 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div className="section-label">More Awards</div>
                <Link href="/awards" style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#9b7011', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {others.map(a => (
                  <div key={a.id} style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '24px', transition: 'box-shadow 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '15px', color: '#2a2820', marginBottom: 4 }}>{a.name}</div>
                    <div style={{ fontSize: '12px', color: '#9b7011', fontWeight: 700, marginBottom: 8 }}>{a.org}</div>
                    <div style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif', marginBottom: 12 }}>
                      <Calendar size={11} style={{ marginRight: 4 }} />
                      Deadline: {a.deadline ? new Date(a.deadline).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : 'Rolling'}
                    </div>
                    <Link href={`/awards/${a.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', color: '#9b7011', textDecoration: 'none' }}>
                      View & Nominate <ChevronRight size={12} />
                    </Link>
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
