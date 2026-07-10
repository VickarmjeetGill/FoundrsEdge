'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ExternalLink, Globe } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import ResourceCard from '@/components/ResourceCard';

export default function PartnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [partner, setPartner] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPartnerProfile() {
            try {
                const res = await fetch(`/api/partners/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setPartner(data);
                }
            } catch (err) {
                console.error('Error loading partner profile:', err);
            } finally {
                setLoading(false);
            }
        }
        loadPartnerProfile();
    }, [id]);

    if (loading) {
        return (
            <PageLayout>
                <div style={{ padding: '120px 0', background: 'var(--gray-50)', textAlign: 'center', minHeight: '80vh' }}>
                    <div className="container">
                        <p style={{ color: 'var(--gray-400)' }}>Loading profile...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (!partner) {
        return (
            <PageLayout>
                <div style={{ padding: '120px 0', background: 'var(--gray-50)', textAlign: 'center', minHeight: '80vh' }}>
                    <div className="container">
                        <h2 style={{ marginBottom: 16 }}>Partner not found</h2>
                        <Link href="/resources" className="btn-primary">Back to Resources</Link>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout mainStyle={{ background: 'var(--gray-50)' }}>
            {/* Back Button & Banner Hero */}
            <div className="page-hero" style={{ padding: '80px 0 60px' }}>
                <div className="container">
                    <Link href="/resources" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gold)', textDecoration: 'none', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 32 }}>
                        <ChevronLeft size={16} /> Back to Resources
                    </Link>

                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {/* Logo */}
                        {partner.logo_url ? (
                            <div style={{ width: '96px', height: '96px', borderRadius: '12px', background: '#fff', border: '2px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12 }}>
                                <img src={partner.logo_url} alt={partner.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                        ) : (
                            <div style={{ width: '96px', height: '96px', borderRadius: '12px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--black)', fontWeight: 800, fontSize: '36px' }}>
                                {partner.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* Title & Info */}
                        <div style={{ flex: 1, minWidth: 280 }}>
                            <div className="section-label" style={{ marginBottom: 8 }}>Partner Profile</div>
                            <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 'clamp(32px, 4vw, 48px)', color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
                                {partner.name}
                            </h1>
                            {partner.website && (
                                <a href={partner.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--gold)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                                    <Globe size={14} /> Visit Partner Website <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Details & Resources Grid */}
            <div style={{ padding: '60px 0', background: 'var(--gray-50)', minHeight: '500px' }}>
                <div className="container">

                    {/* Bio Description */}
                    <div style={{ background: '#fff', border: '1px solid var(--gray-200)', padding: 40, marginBottom: 48 }}>
                        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '20px', marginBottom: 16, color: 'var(--gray-800)' }}>About {partner.name}</h3>
                        <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-600)', fontSize: '16px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                            {partner.long_desc || partner.short_desc || 'No profile description available.'}
                        </p>
                    </div>

                    {/* Resources List Header */}
                    <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '24px', marginBottom: 24, color: 'var(--gray-800)' }}>
                        Available Resources & Collabs ({partner.resources?.length || 0})
                    </h2>

                    {partner.resources?.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '1px solid var(--gray-200)' }}>
                            <p style={{ color: 'var(--gray-400)', fontFamily: 'var(--font-serif)' }}>No active resources available from this partner at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid-2" style={{ gap: '32px' }}>
                            {[...partner.resources].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).map((res: any) => (
                                <ResourceCard key={res.id} resource={res} showPartner={false} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
