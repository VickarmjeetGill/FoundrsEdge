'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ExternalLink, Search, Building2 } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  category: string;
  tags: string[];
  featured: boolean;
  partners?: { id: string; name: string } | null;
};

const categories = ['All Categories', 'Funding', 'Business Services', 'Tax & Grants', 'Innovation & IP', 'Banking & Finance', 'Ecosystem', 'Export & Trade'];

const categoryIcons: Record<string, string> = {
  'Funding': '💰', 'Business Services': '🤝', 'Tax & Grants': '📋',
  'Innovation & IP': '💡', 'Banking & Finance': '🏦', 'Ecosystem': '🌐', 'Export & Trade': '✈️',
};

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Filter by type (category) server-side; search stays client-side.
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const qs = category !== 'All Categories' ? `?category=${encodeURIComponent(category)}` : '';
      const res = await fetch(`/api/resources${qs}`);
      if (!res.ok) { setLoadError(true); return; }
      const data = await res.json();
      setResources(Array.isArray(data.resources) ? data.resources : []);
    } catch (err) {
      console.error('Failed to load resources:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const filtered = resources.filter(r => {
    const q = search.toLowerCase();
    return !q || r.title.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q);
  });

  return (
    <PageLayout>
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Curated Resources</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(40px, 6vw, 72px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
            RESOURCES<br /><span style={{ color: '#e7b605' }}>HUB</span>
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#999', fontSize: '18px', maxWidth: 520, lineHeight: 1.7 }}>
            Vetted tools, programs, and organizations to help you build, grow, and scale your business in Calgary and beyond.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e0d8', position: 'sticky', top: 72, zIndex: 50 }}>
        <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
              <input className="input-field" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40, margin: 0 }} />
            </div>
            <select className="select-field" value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto', minWidth: 180 }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ padding: '60px 0', background: '#f9f9f7' }}>
        <div className="container">
          <div style={{ marginBottom: 20, color: '#9a9585', fontSize: '14px', fontWeight: 600 }}>
            {loading ? 'Loading resources…' : `${filtered.length} resource${filtered.length !== 1 ? 's' : ''} found`}
          </div>

          {loading && (
            <div className="grid-2">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && loadError && (
            <div style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
              <ErrorState kind="network" onRetry={load} />
            </div>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid #e2e0d8' }}>
              <div style={{ fontSize: '40px', marginBottom: 16 }}>📚</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: 8, color: '#2a2820' }}>
                {search || category !== 'All Categories' ? 'No resources match your filters' : 'No resources yet'}
              </div>
              <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>
                {search || category !== 'All Categories' ? 'Try a different type or search term.' : 'Resources will be added by our team shortly. Check back soon.'}
              </div>
            </div>
          )}

          {!loading && !loadError && filtered.length > 0 && (
            <div className="grid-2">
              {filtered.map(r => (
                <div key={r.id} className="card" style={{ borderLeft: r.featured ? '4px solid #e7b605' : '4px solid transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="tag">{categoryIcons[r.category] || '📌'} {r.category}</span>
                      {r.featured && <span className="tag gold">Editor&apos;s Pick</span>}
                    </div>
                  </div>
                  <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', marginBottom: 8 }}>{r.title}</h3>
                  {r.partners && (
                    <Link href={`/partners/${r.partners.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '12px', color: '#9b7011', fontWeight: 700, textDecoration: 'none', marginBottom: 10 }}>
                      <Building2 size={12} /> {r.partners.name}
                    </Link>
                  )}
                  {r.description && <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: 16 }}>{r.description}</p>}
                  {r.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                      {r.tags.map(t => (
                        <span key={t} style={{ padding: '3px 10px', fontSize: '11px', color: '#9a9585', fontWeight: 600, border: '1px solid #e2e0d8', borderRadius: 2 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '10px 20px', fontSize: '12px', width: 'fit-content' }}>
                      Visit Resource <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
