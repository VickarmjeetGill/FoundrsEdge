'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, ExternalLink } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import ResourceCard from '@/components/ResourceCard';

export default function ResourcesPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'partners' | 'resources'>('partners');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [partnersRes, resourcesRes] = await Promise.all([
          fetch('/api/partners'),
          fetch('/api/resources')
        ]);
        
        if (partnersRes.ok) {
          const partnersData = await partnersRes.json();
          setPartners(Array.isArray(partnersData) ? partnersData : partnersData.partners || []);
        } else {
          console.error('Failed to fetch partners');
        }

        if (resourcesRes.ok) {
          const resourcesData = await resourcesRes.json();
          setResources(Array.isArray(resourcesData) ? resourcesData : resourcesData.resources || []);
        } else {
          console.error('Failed to fetch resources');
        }
      } catch (err) {
        console.error('Error loading resources hub data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter types and categories dynamically based on loaded resources
  const types = Array.from(new Set(resources.map(r => r.type).filter(Boolean)));
  const categories = Array.from(new Set(resources.map(r => r.category).filter(Boolean)));
  const partnerNames = Array.from(new Set(resources.map(r => r.partner?.name).filter(Boolean)));

  const filteredPartners = partners.filter(p => {
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.short_desc && p.short_desc.toLowerCase().includes(term))
    );
  });

  const filteredResources = resources.filter(r => {
    const term = search.toLowerCase();
    const matchesSearch = 
      r.title.toLowerCase().includes(term) ||
      (r.description && r.description.toLowerCase().includes(term)) ||
      (r.partner?.name && r.partner.name.toLowerCase().includes(term));

    const matchesType = !selectedType || r.type === selectedType;
    const matchesCategory = !selectedCategory || r.category === selectedCategory;
    const matchesPartner = !selectedPartner || r.partner?.name === selectedPartner;

    return matchesSearch && matchesType && matchesCategory && matchesPartner;
  });

  return (
    <PageLayout mainStyle={{ background: 'var(--gray-50)' }}>
      {/* Hero Section */}
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Partner Collabs</div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 'clamp(40px, 6vw, 72px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
            RESOURCES<br /><span style={{ color: 'var(--gold)' }}>HUB</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-serif)', color: '#999', fontSize: '18px', maxWidth: 540, lineHeight: 1.7 }}>
            Connect with Calgary's top accelerators, innovation agencies, and service providers offering exclusive programs and funding.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)' }}>
        <div className="container" style={{ display: 'flex', gap: 32 }}>
          <button
            onClick={() => {
              setActiveTab('partners');
              setSelectedType('');
              setSelectedCategory('');
              setSelectedPartner('');
            }}
            style={{
              padding: '20px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'partners' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'partners' ? 'var(--black)' : 'var(--gray-400)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.2s'
            }}
          >
            Partners ({partners.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            style={{
              padding: '20px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'resources' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'resources' ? 'var(--black)' : 'var(--gray-400)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.2s'
            }}
          >
            All Resources ({resources.length})
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 72, zIndex: 50 }}>
        <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input 
                className="input-field" 
                placeholder={activeTab === 'partners' ? 'Search partners, agencies, or services...' : 'Search resources, topics, or partners...'}
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ paddingLeft: 40, margin: 0 }} 
              />
            </div>

            {activeTab === 'resources' && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="select-field"
                  style={{ width: 'auto', minWidth: '150px', padding: '12px 16px', fontSize: '14px', margin: 0, height: '49px' }}
                >
                  <option value="">All Types</option>
                  {types.map((t: any) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="select-field"
                  style={{ width: 'auto', minWidth: '150px', padding: '12px 16px', fontSize: '14px', margin: 0, height: '49px' }}
                >
                  <option value="">All Categories</option>
                  {categories.map((c: any) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={selectedPartner}
                  onChange={e => setSelectedPartner(e.target.value)}
                  className="select-field"
                  style={{ width: 'auto', minWidth: '150px', padding: '12px 16px', fontSize: '14px', margin: 0, height: '49px' }}
                >
                  <option value="">All Partners</option>
                  {partnerNames.map((p: any) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {((activeTab === 'partners' && search) || 
              (activeTab === 'resources' && (search || selectedType || selectedCategory || selectedPartner))) && (
              <button 
                onClick={() => {
                  setSearch('');
                  setSelectedType('');
                  setSelectedCategory('');
                  setSelectedPartner('');
                }}
                style={{
                  background: 'none', border: 'none', color: 'var(--gray-600)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={{ padding: '60px 0', background: 'var(--gray-50)', minHeight: '400px' }}>
        <div className="container">
          
          <div style={{ marginBottom: 24, color: 'var(--gray-400)', fontSize: '14px', fontWeight: 600 }}>
            {activeTab === 'partners' ? (
              loading ? 'Loading partners...' : `${filteredPartners.length} partner${filteredPartners.length !== 1 ? 's' : ''} found`
            ) : (
              loading ? 'Loading resources...' : `${filteredResources.length} resource${filteredResources.length !== 1 ? 's' : ''} found`
            )}
          </div>

          {loading ? (
            /* Premium Loading Skeleton */
            <div className="grid-3" style={{ gap: '32px' }}>
              {[1, 2, 3].map(n => (
                <div key={n} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'pulse-gold 2s infinite ease-in-out' }}>
                  <div style={{ width: '64px', height: '64px', background: 'var(--gray-100)', borderRadius: '8px' }} />
                  <div style={{ width: '60%', height: '20px', background: 'var(--gray-100)', borderRadius: '4px' }} />
                  <div style={{ width: '40%', height: '14px', background: 'var(--gray-100)', borderRadius: '4px' }} />
                  <div style={{ width: '100%', height: '60px', background: 'var(--gray-100)', borderRadius: '4px', marginTop: '8px' }} />
                </div>
              ))}
            </div>
          ) : activeTab === 'partners' ? (
            filteredPartners.length === 0 ? (
              /* Empty State */
              <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '40px', marginBottom: 16 }}>🤝</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '18px', marginBottom: 8, color: 'var(--gray-800)' }}>No partners match your search</div>
                <div style={{ color: 'var(--gray-400)', fontFamily: 'var(--font-serif)' }}>Try adjusting your keywords or clearing the search.</div>
              </div>
            ) : (
              /* Partners Grid */
              <div className="grid-3" style={{ gap: '32px' }}>
                {filteredPartners.map(partner => {
                  const resourceCount = partner._count?.resources || 0;
                  return (
                    <Link key={partner.id} href={`/resources/partners/${partner.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        
                        {/* Logo and Badge Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          {partner.logo_url ? (
                            <div style={{ width: '64px', height: '64px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                              <img src={partner.logo_url} alt={partner.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontWeight: 800, fontSize: '24px', fontFamily: 'var(--font-sans)' }}>
                              {partner.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="tag gold" style={{ fontSize: '11px', fontWeight: 700 }}>
                            {resourceCount} resource{resourceCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Partner Details */}
                        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '20px', color: 'var(--gray-800)', marginBottom: 8 }}>
                          {partner.name}
                        </h3>
                        
                        <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-600)', fontSize: '14px', lineHeight: 1.6, flexGrow: 1, marginBottom: 20 }}>
                          {partner.description || partner.short_desc || 'No description available.'}
                        </p>

                        {/* Bottom Link Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold-dark)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid var(--gray-200)', paddingTop: 16, marginTop: 'auto' }}>
                          View Resources <ChevronRight size={14} />
                        </div>

                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          ) : (
            filteredResources.length === 0 ? (
              /* Empty State */
              <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '40px', marginBottom: 16 }}>🚀</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '18px', marginBottom: 8, color: 'var(--gray-800)' }}>No resources match your search</div>
                <div style={{ color: 'var(--gray-400)', fontFamily: 'var(--font-serif)' }}>Try adjusting your filters, keywords, or clearing search.</div>
              </div>
            ) : (
              /* Resources Grid */
              <div className="grid-3" style={{ gap: '32px' }}>
                {[...filteredResources].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).map(resource => (
                  <ResourceCard key={resource.id} resource={resource} showPartner={true} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </PageLayout>
  );
}
