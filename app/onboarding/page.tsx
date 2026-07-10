'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, TrendingUp, Globe, ArrowRight, Check } from 'lucide-react';
import { getProfile, setTrack } from '@/app/actions/profile';
import Logo from '@/components/Logo';

type TrackType = 'START' | 'GROW' | 'SCALE';

interface TrackCard {
  id: TrackType;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  focus: string;
  milestones: string[];
  goodFor: string;
}

const tracks: TrackCard[] = [
  {
    id: 'START',
    title: 'Start',
    badge: 'Validate & Launch',
    icon: Zap,
    description: 'For early-stage founders focused on validating ideas, building MVPs, launching products, and securing their first customers.',
    focus: 'Idea Validation & Early Traction',
    milestones: [
      'Validate value proposition',
      'Build and launch MVP',
      'Acquire first 10-50 customers'
    ],
    goodFor: 'Pre-revenue or newly launched startups looking to find product-market fit.'
  },
  {
    id: 'GROW',
    title: 'Grow',
    badge: 'Build & Accelerate',
    icon: TrendingUp,
    description: 'For established businesses looking to optimize operations, scale marketing, professionalize sales, and expand their team.',
    focus: 'Operational Scaling & Team Expansion',
    milestones: [
      'Optimize operational workflows',
      'Build predictable sales funnel',
      'Hire key operational staff'
    ],
    goodFor: 'Companies with existing revenue ($100k-$1M+) looking to accelerate growth.'
  },
  {
    id: 'SCALE',
    title: 'Scale',
    badge: 'Expand & Dominate',
    icon: Globe,
    description: 'For high-growth, mature companies seeking expansion into new markets, institutional funding, joint ventures, or exit positioning.',
    focus: 'Market Expansion & Funding',
    milestones: [
      'Enter new geographic markets',
      'Raise institutional growth capital',
      'Prepare business for exit or M&A'
    ],
    goodFor: 'Mature enterprises looking for exit strategies or rapid global expansion.'
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedTrack, setSelectedTrack] = useState<TrackType | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const verifyUser = async () => {
      const res = await getProfile();
      if (!res.success || !res.user) {
        router.push('/login');
        return;
      }
      // If user already has a track set, they shouldn't need onboarding.
      if (res.user.track) {
        router.push('/dashboard');
        return;
      }
      setCheckingAuth(false);
    };
    verifyUser();
  }, [router]);

  const handleConfirm = async () => {
    if (!selectedTrack) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await setTrack(selectedTrack);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg(res.error || 'Failed to save your selection. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000', color: '#fff' }}>
        <Logo size="lg" />
        <div style={{ marginTop: 24, fontSize: '14px', letterSpacing: '0.05em', color: '#888', textTransform: 'uppercase' }}>
          Initializing onboarding...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Top Background Gradients for Premium Look */}
      <div style={{ position: 'absolute', top: '-10%', left: '15%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(231,182,5,0.05) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '15%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(231,182,5,0.03) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      <header style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px', zIndex: 10 }}>
        <Logo size="md" />
      </header>

      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ display: 'inline-block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e7b605', marginBottom: '12px' }}>
            Choose Your Direction
          </span>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '16px' }}>
            SELECT YOUR ROADMAP TRACK
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#888', fontSize: 'clamp(15px, 1.5vw, 17px)', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto' }}>
            Select the track that best aligns with your business's current operational stage. This will personalize your milestones and dashboard.
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid #c0392b', color: '#e74c3c', padding: '16px', marginBottom: '32px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '14px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '56px'
        }}>
          {tracks.map((track) => {
            const isSelected = selectedTrack === track.id;
            const IconComponent = track.icon;

            return (
              <div
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                style={{
                  background: '#0d0d0d',
                  border: isSelected ? '2px solid #e7b605' : '1px solid #1a1a1a',
                  padding: '40px 32px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isSelected ? 'translateY(-4px)' : 'none',
                  boxShadow: isSelected ? '0 12px 30px rgba(231,182,5,0.15)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(231,182,5,0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#1a1a1a';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                {/* Selection Checkmark Indicator */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#e7b605',
                    color: '#000',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: isSelected ? 'rgba(231,182,5,0.15)' : 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.3s'
                  }}>
                    <IconComponent size={24} style={{ color: isSelected ? '#e7b605' : '#888' }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', margin: 0 }}>{track.title}</h3>
                    <span style={{ fontSize: '11px', color: '#e7b605', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{track.badge}</span>
                  </div>
                </div>

                <p style={{ fontFamily: 'Noto Serif, serif', color: '#aaa', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px', flexGrow: 1 }}>
                  {track.description}
                </p>

                <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '24px', marginTop: 'auto' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', fontWeight: 700, marginBottom: '12px' }}>
                    Key Focus: <span style={{ color: '#ccc', textTransform: 'none', letterSpacing: 'none' }}>{track.focus}</span>
                  </div>

                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', fontWeight: 700, marginBottom: '8px' }}>
                    Roadmap Highlights:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'square', color: '#888', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
                    {track.milestones.map((m, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{m}</li>
                    ))}
                  </ul>

                  <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#555', borderLeft: '2px solid #e7b605', paddingLeft: '10px' }}>
                    Best for: {track.goodFor}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleConfirm}
            disabled={!selectedTrack || loading}
            className={selectedTrack ? 'btn-primary' : 'btn-outline'}
            style={{
              padding: '16px 48px',
              fontSize: '15px',
              fontWeight: 700,
              minWidth: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: selectedTrack ? 1 : 0.4,
              cursor: selectedTrack ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              background: selectedTrack ? '#e7b605' : 'transparent',
              color: selectedTrack ? '#000' : '#888',
              border: selectedTrack ? 'none' : '1px solid #333'
            }}
          >
            {loading ? 'Setting up roadmap...' : 'Confirm and Start'}
            <ArrowRight size={18} />
          </button>
        </div>
      </main>

      <footer style={{ textAlign: 'center', marginTop: '60px', color: '#444', fontSize: '12px', zIndex: 10 }}>
        &copy; {new Date().getFullYear()} Founders Edge. All rights reserved.
      </footer>
    </div>
  );
}
