'use client';
import { useState, useEffect } from 'react';
import { Search, Calendar, Award } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import OpportunityCard, { Opportunity } from '@/components/OpportunityCard';

const opportunityTypes = [
  'All',
  'Grants',
  'Events',
  'Speaking',
  'Funding',
  'Pitch',
  'Media',
  'Procurement'
];

export default function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOpportunities() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (selectedType !== 'All') queryParams.append('type', selectedType);
        if (search) queryParams.append('search', search);

        const res = await fetch(`/api/opportunities?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setOpportunities(data.opportunities || []);
        }
      } catch (err) {
        console.error('Failed to load opportunities:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOpportunities();
  }, [selectedType, search]);

  return (
    <PageLayout mainStyle={{ background: '#fafaf8' }}>
      {/* Hero Section */}
      <div className="page-hero" style={{ background: '#000', padding: '80px 0', color: '#fff', textAlign: 'left' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#e7b605', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Business Feed
          </div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 5vw, 64px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
            OPPORTUNITY <span style={{ color: '#e7b605' }}>FEED</span>
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#9a9585', fontSize: '18px', maxWidth: 600, lineHeight: 1.6 }}>
            Browse curated local contracts, speaking calls, pitch contests, grants, and funding opportunities for your business.
          </p>
        </div>
      </div>

      {/* Main Feed Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Filter bar and search */}
        <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {opportunityTypes.map(t => {
              const isActive = selectedType === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '100px',
                    border: '1px solid',
                    borderColor: isActive ? '#000' : '#e2e0d8',
                    cursor: 'pointer',
                    background: isActive ? '#000' : '#fff',
                    color: isActive ? '#e7b605' : '#5a5650',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#f0efe9';
                      e.currentTarget.style.borderColor = '#b8b4ae';
                      e.currentTarget.style.color = '#2a2820';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#e2e0d8';
                      e.currentTarget.style.color = '#5a5650';
                    }
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
            <input
              className="input-field"
              placeholder="Search opportunities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, margin: 0, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#9a9585' }}>
            Loading opportunities...
          </div>
        ) : opportunities.length === 0 ? (
          /* Empty State */
          <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid #e2e0d8' }}>
            <Award size={48} style={{ color: '#e2e0d8', marginBottom: 16 }} />
            <div style={{ fontWeight: 700, fontSize: '20px', marginBottom: 8, color: '#2a2820', fontFamily: 'DM Sans, sans-serif' }}>
              Check back tomorrow
            </div>
            <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>
              New opportunities are added daily. No opportunities match your current filter.
            </div>
          </div>
        ) : (
          /* Feed Items */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {opportunities.map(opp => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
