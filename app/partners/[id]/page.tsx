'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Globe, Mail, ArrowLeft } from 'lucide-react';
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
};

type Partner = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  category: string | null;
  contact_email: string | null;
  resources: Resource[];
};

const categoryIcons: Record<string, string> = {
  'Funding': '💰', 'Business Services': '🤝', 'Tax & Grants': '📋',
  'Innovation & IP': '💡', 'Banking & Finance': '🏦', 'Ecosystem': '🌐', 'Export & Trade': '✈️',
};

export default function PartnerProfilePage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [partner, setPartner] = useState<Partner | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'notfound' | 'ready'>('loading');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/partners/${id}`);
      if (res.status === 404) { setState('notfound'); return; }
      if (!res.ok) { setState('error'); return; }
      const data = await res.json();
      setPartner(data.partner);
      setState('ready');
    } catch (err) {
      console.error('Failed to load partner:', err);
      setState('error');
    }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <Link href="/resources" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9a9585', fontSize: '13px', fontWeight: 700, textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to Resources
          </Link>
          <div className="section-label">Resource Partner</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(34px, 5vw, 60px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 16 }}>
            {state === 'ready' && partner ? partner.name : state === 'loading' ? 'Loading…' : 'Partner'}
          </h1>
          {state === 'ready' && partner?.description && (
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#999', fontSize: '18px', maxWidth: 620, lineHeight: 1.7 }}>{partner.description}</p>
          )}
          {state === 'ready' && partner && (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 20 }}>
              {partner.category && <span style={{ color: '#e7b605', fontSize: '13px', fontWeight: 700 }}>{partner.category}</span>}
              {partner.website && (
                <a href={partner.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#ccc', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                  <Globe size={14} /> {partner.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {partner.contact_email && (
                <a href={`mailto:${partner.contact_email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#ccc', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                  <Mail size={14} /> {partner.contact_email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '60px 0', background: '#f9f9f7' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 24 }}>
            {state === 'ready' && partner ? `Resources from ${partner.name}` : 'Resources'}
          </h2>

          {state === 'loading' && (
            <div className="grid-2">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {state === 'error' && (
            <div style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
              <ErrorState kind="network" onRetry={load} />
            </div>
          )}

          {state === 'notfound' && (
            <div style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
              <ErrorState kind="notFound" title="Partner not found" message="This partner may have been removed or the link is incorrect." />
            </div>
          )}

          {state === 'ready' && partner && partner.resources.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid #e2e0d8' }}>
              <div style={{ fontSize: '40px', marginBottom: 16 }}>📚</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: 8, color: '#2a2820' }}>No resources yet</div>
              <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>This partner hasn&apos;t published any resources yet.</div>
            </div>
          )}

          {state === 'ready' && partner && partner.resources.length > 0 && (
            <div className="grid-2">
              {partner.resources.map(r => (
                <div key={r.id} className="card" style={{ borderLeft: r.featured ? '4px solid #e7b605' : '4px solid transparent' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className="tag">{categoryIcons[r.category] || '📌'} {r.category}</span>
                    {r.featured && <span className="tag gold">Editor&apos;s Pick</span>}
                  </div>
                  <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', marginBottom: 8 }}>{r.title}</h3>
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
