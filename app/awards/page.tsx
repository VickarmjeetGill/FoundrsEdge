'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Trophy, Search, Calendar, MapPin, Star, ChevronRight, Clock, Tag, Filter } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export type Award = {
  id: string;
  name: string;
  org: string;
  category: string;
  region: string;
  deadline: string;
  awardDate: string;
  value: string;
  cycle: string;
  desc: string;
  featured: boolean;
  nominationsOpen: boolean;
  sponsor?: string;
};

export const seedAwards: Award[] = [];

const awardCategories = ['All Categories', 'General Business', 'Technology', 'Women in Business', 'Leadership', 'SMB', 'Media & Content', 'Other'];
const regions = ['All Regions', 'Calgary', 'Alberta', 'Western Canada', 'National'];
const deadlineFilters = ['All Deadlines', 'Open Now', 'Next 30 Days', 'Next 90 Days'];

function daysUntil(dateStr: string) {
  if (!dateStr || dateStr === 'Rolling') return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AwardsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [region, setRegion] = useState('All Regions');
  const [deadlineFilter, setDeadlineFilter] = useState('All Deadlines');
  const [openOnly, setOpenOnly] = useState(false);
  const [awards, setAwards] = useState<Award[]>(seedAwards);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const itemPerPage = 3;

  useEffect(() => {
    setCurrentPage(1);
  }, [category, region, deadlineFilter, openOnly, search]);

  const loadAwards = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemPerPage.toString(),
      });

      if (category !== 'All Categories') queryParams.append('category', category);
      if (region !== 'All Regions') queryParams.append('region', region);
      if (openOnly) queryParams.append('nominationsOpen', 'true');
      if (search) queryParams.append('search', search);
      if (deadlineFilter !== 'All Deadlines') queryParams.append('deadlineFilter', deadlineFilter);

      const res = await fetch(`/api/awards?${queryParams.toString()}`);
      if (!res.ok) { setLoadError(true); return; }
      const data = await res.json();
      const dbData = data.awards || [];

      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
        setTotalResults(data.pagination.total);
      }

      const mapped: Award[] = dbData.map((a: any) => ({
        ...a,
        awardDate: a.award_date || a.awardDate || '',
      }));
      setAwards(mapped);
    } catch (error) {
      console.error('Error fetching awards:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [currentPage, category, region, openOnly, search, deadlineFilter]);

  useEffect(() => { loadAwards(); }, [loadAwards]);

  const filtered = awards.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.org.toLowerCase().includes(q);
    const matchCat = category === 'All Categories' || a.category === category;
    const matchRegion = region === 'All Regions' || a.region === region;
    const matchOpen = !openOnly || a.nominationsOpen;
    const days = daysUntil(a.deadline);
    let matchDeadline = true;
    if (deadlineFilter === 'Open Now') matchDeadline = a.nominationsOpen && (days === null || days > 0);
    if (deadlineFilter === 'Next 30 Days') matchDeadline = days !== null && days >= 0 && days <= 30;
    if (deadlineFilter === 'Next 90 Days') matchDeadline = days !== null && days >= 0 && days <= 90;
    return matchSearch && matchCat && matchRegion && matchOpen && matchDeadline;
  }).sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const da = daysUntil(a.deadline) ?? 9999;
    const db = daysUntil(b.deadline) ?? 9999;
    return da - db;
  });

  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Awards & Recognition</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(40px, 6vw, 72px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
            AWARDS &<br /><span style={{ color: '#e7b605' }}>ACCOLADES</span>
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#999', fontSize: '18px', maxWidth: 520, lineHeight: 1.7 }}>
            Every business award and recognition opportunity in one place. Nominate yourself or your business — never miss a deadline again.
          </p>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e0d8', position: 'sticky', top: 72, zIndex: 50 }}>
        <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
              <input className="input-field" placeholder="Search awards..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40, margin: 0 }} />
            </div>
            <select className="select-field" value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto', minWidth: 160, margin: 0 }}>
              {awardCategories.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="select-field" value={region} onChange={e => setRegion(e.target.value)} style={{ width: 'auto', minWidth: 150, margin: 0 }}>
              {regions.map(r => <option key={r}>{r}</option>)}
            </select>
            <select className="select-field" value={deadlineFilter} onChange={e => setDeadlineFilter(e.target.value)} style={{ width: 'auto', minWidth: 150, margin: 0 }}>
              {deadlineFilters.map(d => <option key={d}>{d}</option>)}
            </select>
            <button
              onClick={() => setOpenOnly(!openOnly)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 18px', border: '1px solid', borderColor: openOnly ? '#e7b605' : '#e2e0d8', background: openOnly ? 'rgba(231,182,5,0.08)' : 'transparent', color: openOnly ? '#9b7011' : '#9a9585', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Filter size={13} /> Open Only
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '60px 0', background: '#f9f9f7' }}>
        <div className="container">
          <div style={{ marginBottom: 24, color: '#9a9585', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
            Showing {filtered.length} of {totalResults} award{totalResults !== 1 ? 's' : ''} found
          </div>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && loadError && (
            <div style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
              <ErrorState kind="network" onRetry={loadAwards} />
            </div>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid #e2e0d8' }}>
              <Trophy size={40} style={{ color: '#e2e0d8', marginBottom: 16 }} />
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: 8 }}>No awards found</div>
              <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>Try adjusting your filters.</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!loading && !loadError && filtered.map(award => {
              const days = daysUntil(award.deadline);
              const isUrgent = days !== null && days <= 30 && days >= 0;
              const isPast = days !== null && days < 0;
              const isClosed = !award.nominationsOpen || isPast;
              return (
                <div
                  key={award.id}
                  className="card-row"
                  style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '32px', borderLeft: award.featured ? '4px solid #e7b605' : '4px solid transparent', transition: 'box-shadow 0.2s', opacity: isClosed ? 0.75 : 1 }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="tag"><Tag size={10} style={{ marginRight: 3 }} />{award.category}</span>
                      <span className="tag"><MapPin size={10} style={{ marginRight: 3 }} />{award.region}</span>
                      {award.featured && <span className="tag gold"><Star size={10} fill="#9b7011" style={{ marginRight: 3 }} />Editor&apos;s Pick</span>}
                      {isUrgent && <span className="tag" style={{ background: '#fee2e2', color: '#dc2626' }}><Clock size={10} style={{ marginRight: 3 }} />Deadline Soon</span>}
                      {isClosed && <span className="tag" style={{ background: '#f0efe9', color: '#9a9585' }}>Closed</span>}
                    </div>
                    <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: 4, color: '#2a2820' }}>{award.name}</h3>
                    <div style={{ color: '#9b7011', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 12 }}>{award.org}{award.sponsor ? ` · Sponsored by ${award.sponsor}` : ''}</div>
                    <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: 16, maxWidth: 600 }}>
                      {(award.desc || '').length > 160 ? (award.desc || '').slice(0, 160) + '…' : (award.desc || '')}
                    </p>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9a9585', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                        <Calendar size={13} style={{ color: '#e7b605' }} /> Deadline: {award.deadline ? new Date(award.deadline).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling'}
                      </span>
                      {days !== null && days >= 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: isUrgent ? '#dc2626' : '#9a9585', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                          <Clock size={13} style={{ color: isUrgent ? '#dc2626' : '#e7b605' }} /> {days} days remaining
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right CTA */}
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '22px', color: award.value === 'Prestige' ? '#9b7011' : '#2d7a3a' }}>
                      {award.value}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{award.cycle}</div>
                    <Link
                      href={`/awards/${award.id}`}
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: '12px', opacity: isClosed ? 0.5 : 1, pointerEvents: isClosed ? 'none' : 'auto' }}
                    >
                      {isClosed ? 'Closed' : 'View & Nominate'} <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGE NAVIGATION RENDERING ENGINE */}
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
        </div>
      </div>
    </PageLayout>
  );
}
