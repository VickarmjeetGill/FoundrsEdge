'use client';
import Link from 'next/link';
import { ArrowRight, Check, Link2 } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

// Replace these placeholders with the real Founders Edge team.
const team = [
  { name: 'Founder Name', role: 'Founder & CEO', bio: 'Add a short bio — background, what they build, and why Founders Edge exists.' },
  { name: 'Team Member', role: 'Community & Partnerships', bio: 'Add a short bio for this team member and what they lead at Founders Edge.' },
  { name: 'Team Member', role: 'Product & Operations', bio: 'Add a short bio for this team member and what they lead at Founders Edge.' },
];

const values = [
  { title: 'Curated, not crowded', desc: 'We screen every member. Quality of connection beats quantity of contacts, every time.' },
  { title: 'Local first', desc: 'We\'re Calgary founders building for Calgary founders — we know this ecosystem because we\'re in it.' },
  { title: 'Real relationships', desc: 'No cold networking. Every event, intro, and recommendation is built to create genuine connection.' },
];

export default function AboutPage() {
  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <div className="section-label">About Us</div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 'clamp(40px, 6vw, 72px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
            THE TEAM BEHIND<br /><span style={{ color: 'var(--gold)' }}>FOUNDERS EDGE</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-serif)', color: '#999', fontSize: '18px', maxWidth: 560, lineHeight: 1.7 }}>
            We&apos;re a small team of Calgary entrepreneurs who believe the right connection can change the trajectory of a business — so we built the community we wished we had.
          </p>
        </div>
      </div>

      {/* Our story */}
      <div style={{ padding: '80px 0', background: '#f9f9f7' }}>
        <div className="container">
          <div className="grid-halves">
            <div>
              <div className="section-label">Our story</div>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 'clamp(30px, 4vw, 42px)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 24 }}>
                Founders helping<br /><span style={{ color: 'var(--gold)' }}>founders.</span>
              </h2>
              <p style={{ fontFamily: 'var(--font-serif)', color: '#5a5650', fontSize: '16px', lineHeight: 1.8, marginBottom: 20 }}>
                Founders Edge started with a simple observation: most founders in Calgary are one introduction away from their next client, hire, or partner — they just don&apos;t know who that person is yet.
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', color: '#5a5650', fontSize: '16px', lineHeight: 1.8 }}>
                So we set out to build a members-only community that&apos;s intentionally curated — where every member is screened, every event has a purpose, and every connection is made on purpose. Today, we&apos;re proud to be the home base for Calgary&apos;s entrepreneurs.
              </p>
            </div>
            <div style={{ background: '#000', padding: '48px', color: '#fff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {values.map(v => (
                  <div key={v.title}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, background: 'rgba(231,182,5,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={14} style={{ color: 'var(--gold)' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '15px', color: '#fff' }}>{v.title}</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-serif)', color: '#aaa', fontSize: '14px', lineHeight: 1.7, marginLeft: 40 }}>{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meet the team */}
      <div style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <div className="section-label">Meet the team</div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 'clamp(30px, 4vw, 42px)', letterSpacing: '-0.02em', marginBottom: 48 }}>The people behind the platform</h2>
          <div className="grid-3">
            {team.map(m => (
              <div key={m.name + m.role} style={{ background: '#f9f9f7', border: '1px solid #e2e0d8', padding: '32px', textAlign: 'center' }}>
                <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#000', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '32px', margin: '0 auto 20px' }}>
                  {m.name.charAt(0)}
                </div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '20px', marginBottom: 4 }}>{m.name}</h3>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 14 }}>{m.role}</div>
                <p style={{ fontFamily: 'var(--font-serif)', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: 18 }}>{m.bio}</p>
                <span style={{ display: 'inline-flex', width: 34, height: 34, background: '#fff', border: '1px solid #e2e0d8', alignItems: 'center', justifyContent: 'center', color: '#9a9585' }} aria-hidden="true">
                  <Link2 size={16} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '80px 0', background: '#000' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 'clamp(30px, 5vw, 48px)', color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
            Want to be part of it?
          </h2>
          <p style={{ fontFamily: 'var(--font-serif)', color: '#888', fontSize: '17px', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
            We review every application personally. We&apos;d love to learn about what you&apos;re building.
          </p>
          <Link href="/apply" className="btn-primary" style={{ padding: '14px 32px' }}>
            Apply for Membership <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
