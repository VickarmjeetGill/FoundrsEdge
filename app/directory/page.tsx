'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, TrendingUp, Zap, Tag } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

const businesses: {
  id: number;
  name: string;
  industry: string;
  location: string;
  desc: string;
  rating: number;
  reviews: number;
  featured: boolean;
  boosted: boolean;
  hasActiveOffers: boolean;
  tags: string[];
}[] = [];


const industries = [
  'All Industries',
  'Professional Services',
  'Manufacturing',
  'B2B SaaS',
  'Marketing Agency',
  'E-commerce',
  'Technology',
  'Finance',
  'Legal',
  'Health & Wellness',
  'Construction',
  'Other'
];

const locations = [
  'All Locations',
  'Calgary, AB',
  'Edmonton, AB',
  'Online',
  'Other'
];

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All Industries');
  const [showFeatured, setShowFeatured] = useState(false);
  const [location, setLocation] = useState('All Locations');
  const [hasActiveOffers, setHasActiveOffers] = useState(false);

  const filtered = businesses.filter(b => {
    const searchText = search.toLowerCase();

    const matchSearch =
      b.name.toLowerCase().includes(searchText) ||
      b.desc.toLowerCase().includes(searchText) ||
      b.location.toLowerCase().includes(searchText) ||
      b.industry.toLowerCase().includes(searchText) ||
      b.tags.some(t => t.toLowerCase().includes(searchText));

    const matchInd =
      industry === 'All Industries' || b.industry === industry;

    const matchFeat =
      !showFeatured || b.featured;

    const matchLocation =
      location === 'All Locations' || b.location === location;

    const matchActiveOffers =
      !hasActiveOffers || b.hasActiveOffers;

    return matchSearch && matchInd && matchFeat && matchLocation && matchActiveOffers; });

    // Sort: boosted first, then featured, then rest
    const sorted = [...filtered].sort((a, b) => (b.boosted ? 1 : 0) - (a.boosted ? 1 : 0) || (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return (
      <PageLayout>
        <div className="page-hero">
          <div className="container">
            <div className="section-label">Member Directory</div>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(40px, 6vw, 72px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
              BUSINESS<br /><span style={{ color: '#e7b605' }}>DIRECTORY</span>
            </h1>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#999', fontSize: '18px', maxWidth: 520, lineHeight: 1.7 }}>
              Discover and connect with vetted Calgary businesses. Every listing is a screened Founders Edge member.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e0d8', position: 'sticky', top: 72, zIndex: 50 }}>
          <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
                <input className="input-field" placeholder="Search businesses, services, tags..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40, margin: 0 }} />
              </div>
              <select className="select-field" value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
                {industries.map(i => <option key={i}>{i}</option>)}
              </select>

              <select
                className="select-field"
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={{ width: 'auto', minWidth: 150 }}
              >
                {locations.map(l => <option key={l}>{l}</option>)}
              </select>

              <button onClick={() => setShowFeatured(!showFeatured)} style={{
                padding: '14px 20px', background: showFeatured ? '#e7b605' : 'transparent',
                border: `1px solid ${showFeatured ? '#e7b605' : '#e2e0d8'}`,
                color: showFeatured ? '#000' : '#5a5650', fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s', letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                <Star size={14} /> Featured Only
              </button>
              <button onClick={() => setHasActiveOffers(!hasActiveOffers)} style={{
                padding: '14px 20px',
                background: hasActiveOffers ? '#e7b605' : 'transparent',
                border: `1px solid ${hasActiveOffers ? '#e7b605' : '#e2e0d8'}`,
                color: hasActiveOffers ? '#000' : '#5a5650',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                <Tag size={14} /> Has Active Offers
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '60px 0', background: '#f9f9f7' }}>
          <div className="container">
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ color: '#9a9585', fontSize: '14px', fontWeight: 600 }}>{sorted.length} businesses found</span>
              <Link href="/directory/list" className="btn-outline" style={{ padding: '10px 20px', fontSize: '12px' }}>
                List Your Business
              </Link>
            </div>

            {sorted.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid #e2e0d8', marginBottom: 2 }}>
                <div style={{ fontSize: '40px', marginBottom: 16 }}>🏢</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: 8, color: '#2a2820' }}>
                  {search || industry !== 'All Industries' || location !== 'All Locations' || showFeatured || hasActiveOffers ? 'No businesses match your search.' : 'No businesses listed yet'}
                </div>
                <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>
                  {search || industry !== 'All Industries' || location !== 'All Locations' || showFeatured || hasActiveOffers ? 'Try adjusting your filters.' : 'Member businesses will appear here once listed.'}
                </div>
              </div>
            )}

            <div className="grid-2">
              {sorted.map(biz => (
                <div key={biz.id} className="card" style={{
                  borderLeft: biz.boosted ? '4px solid #e7b605' : biz.featured ? '4px solid #9b7011' : '4px solid transparent',
                  position: 'relative',
                }}>
                  {biz.boosted && (
                    <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 4, background: '#e7b605', color: '#000', padding: '3px 10px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      <Zap size={10} /> Boosted
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span className="tag">{biz.industry}</span>
                    {biz.featured && <span className="tag gold">Featured</span>}
                  </div>
                  <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: 8 }}>{biz.name}</h3>
                  <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: 16 }}>{biz.desc}</p>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a9585', fontSize: '13px' }}>
                      <MapPin size={13} style={{ color: '#e7b605' }} /> {biz.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a9585', fontSize: '13px' }}>
                      <Star size={13} style={{ color: '#e7b605', fill: '#e7b605' }} /> {biz.rating} ({biz.reviews} reviews)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {biz.tags.map(tag => (
                      <span key={tag} style={{ padding: '3px 10px', background: '#f0efe9', fontSize: '11px', color: '#5a5650', fontWeight: 600, borderRadius: 2 }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e0d8', display: 'flex', gap: 12 }}>
                    <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '12px', flex: 1 }}>View Profile</button>
                    <button className="btn-outline" style={{ padding: '8px 18px', fontSize: '12px' }}>Connect</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Upgrade CTA */}
            <div style={{ marginTop: 48, background: '#000', padding: '48px', textAlign: 'center' }}>
              <TrendingUp size={32} style={{ color: '#e7b605', marginBottom: 16 }} />
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '28px', color: '#fff', marginBottom: 12 }}>Boost Your Listing</h3>
              <p style={{ fontFamily: 'Noto Serif, serif', color: '#888', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
                Stand out from the crowd. Featured listings get 5x more profile views and top placement in search results.
              </p>
              <Link href="/directory/upgrade" className="btn-primary">Upgrade Your Listing</Link>
            </div>
          </div>
        </div>
        </PageLayout>
  );
}
