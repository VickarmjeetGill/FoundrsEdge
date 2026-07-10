'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, TrendingUp, Globe, RefreshCw, ArrowRight, Loader2, Sparkles, CheckCircle2
} from 'lucide-react';
import { getRoadmap, toggleStepCompletion, setTrack } from '@/app/actions/profile';
import StepCard from './StepCard';

type TrackType = 'START' | 'GROW' | 'SCALE';

const TRACK_INFOS: Record<TrackType, { 
  title: string; 
  badge: string; 
  description: string; 
  gradient: string; 
  border: string; 
  icon: React.ElementType; 
}> = {
  START: {
    title: 'Start Track',
    badge: 'Validate & Launch',
    description: 'For early-stage founders focused on validating ideas, building MVPs, launching products, and securing their first customers.',
    gradient: 'linear-gradient(135deg, #120c02 0%, #000000 100%)',
    border: 'rgba(231, 182, 5, 0.25)',
    icon: Zap
  },
  GROW: {
    title: 'Grow Track',
    badge: 'Build & Accelerate',
    description: 'For established businesses looking to optimize operations, scale marketing, professionalize sales, and expand their team.',
    gradient: 'linear-gradient(135deg, #091a0c 0%, #000000 100%)',
    border: 'rgba(39, 174, 96, 0.25)',
    icon: TrendingUp
  },
  SCALE: {
    title: 'Scale Track',
    badge: 'Expand & Dominate',
    description: 'For high-growth, mature companies seeking expansion into new markets, institutional funding, joint ventures, or exit positioning.',
    gradient: 'linear-gradient(135deg, #0c121e 0%, #000000 100%)',
    border: 'rgba(41, 128, 185, 0.25)',
    icon: Globe
  }
};

interface RoadmapStep {
  id: string;
  track: string;
  weekNumber: number;
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  order: number;
}

interface RoadmapSectionProps {
  userProfile: {
    id: string;
    track: string | null;
  };
  onProfileUpdate: (updatedUser: any) => void;
}

export default function RoadmapSection({ userProfile, onProfileUpdate }: RoadmapSectionProps) {
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeTrack, setActiveTrack] = useState<TrackType>((userProfile.track as TrackType) || 'START');
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isChangingTrack, setIsChangingTrack] = useState(false);
  const [tempTrack, setTempTrack] = useState<TrackType>(activeTrack);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Roadmap and Progress from Database
  const fetchRoadmapData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getRoadmap();
      if (res.success && res.steps && res.progress) {
        setSteps(res.steps);
        setCompletedIds(res.progress.filter(p => p.completed).map(p => p.stepId));
        if (res.track) {
          setActiveTrack(res.track as TrackType);
        }
      } else {
        setErrorMsg(res.error || 'Failed to load roadmap.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmapData();
  }, [userProfile.track]);

  // Calculate Progress Stats
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => completedIds.includes(step.id)).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Identify the Current Step (the first incomplete step in order)
  const currentStep = steps.find(step => !completedIds.includes(step.id));

  // Toggle Action Items
  const handleToggleTask = async (stepId: string) => {
    setUpdating(true);
    const isCompleted = completedIds.includes(stepId);
    
    // Optimistic state update
    if (isCompleted) {
      setCompletedIds(prev => prev.filter(id => id !== stepId));
    } else {
      setCompletedIds(prev => [...prev, stepId]);
    }

    try {
      const res = await toggleStepCompletion(stepId, !isCompleted);
      if (!res.success) {
        // Rollback on failure
        fetchRoadmapData();
      }
    } catch (err) {
      console.error('Failed to toggle step complete:', err);
      fetchRoadmapData();
    } finally {
      setUpdating(false);
    }
  };

  // Handle Track Switching
  const handleTrackChangeSave = async () => {
    setUpdating(true);
    setErrorMsg('');
    try {
      const res = await setTrack(tempTrack);
      if (res.success && res.user) {
        setActiveTrack(tempTrack);
        onProfileUpdate(res.user);
        setIsChangingTrack(false);
        // Refresh roadmap with the new track steps
        await fetchRoadmapData();
      } else {
        setErrorMsg(res.error || 'Failed to update track.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update track.');
    } finally {
      setUpdating(false);
    }
  };

  const currentTrackInfo = TRACK_INFOS[activeTrack];
  const TrackIcon = currentTrackInfo.icon;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', padding: '60px 0' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#e7b605', marginBottom: 12 }} />
        <div style={{ fontSize: '13px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Loading roadmap from database...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {errorMsg && (
        <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid #c0392b', color: '#e74c3c', padding: '14px', marginBottom: '24px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
          {errorMsg}
        </div>
      )}

      {/* Upper Premium Track Card Header */}
      <div 
        style={{ 
          background: currentTrackInfo.gradient, 
          border: `1px solid ${currentTrackInfo.border}`,
          borderRadius: '12px',
          padding: '32px', 
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '36px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          color: '#fff'
        }}
      >
        {/* Absolute Glowing Gradient Orbs */}
        <div style={{ 
          position: 'absolute', 
          right: '-50px', 
          top: '-50px', 
          width: '200px', 
          height: '200px', 
          borderRadius: '50%', 
          background: 'rgba(231, 182, 5, 0.08)', 
          filter: 'blur(40px)',
          zIndex: 1
        }} />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px', 
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#e7b605'
                }}
              >
                <TrackIcon size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '11px', color: '#e7b605', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Roadmap
                  </span>
                  <span style={{ height: 4, width: 4, background: 'rgba(255, 255, 255, 0.3)', borderRadius: '50%' }} />
                  <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 600 }}>
                    {currentTrackInfo.badge}
                  </span>
                </div>
                <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', color: '#fff', margin: 0 }}>
                  {currentTrackInfo.title}
                </h1>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setTempTrack(activeTrack);
                setIsChangingTrack(true);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: '12px',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = '#e7b605';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <RefreshCw size={12} /> Switch Track
            </button>
          </div>

          <p style={{ margin: '16px 0 24px 0', fontSize: '14px', color: '#ccc', lineHeight: 1.6, maxWidth: '600px', fontFamily: 'Noto Serif, serif' }}>
            {currentTrackInfo.description}
          </p>

          {/* Premium Progress Bar Wrapper */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, fontSize: '12px' }}>
              <span style={{ color: '#aaa', fontWeight: 600 }}>Track Progress</span>
              <span style={{ color: '#e7b605', fontWeight: 900 }}>
                {completedSteps} of {totalSteps} Steps ({progressPercent}%)
              </span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${progressPercent}%`, 
                  background: 'linear-gradient(90deg, #9b7011, #e7b605)', 
                  borderRadius: '4px',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' 
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Steps Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', color: '#2a2820', margin: '0 0 4px 0' }}>
          Roadmap Checklist
        </h2>
        
        {progressPercent === 100 && (
          <div 
            style={{ 
              background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
              border: '1px solid #fde047',
              borderRadius: '8px', 
              padding: '24px', 
              boxShadow: '0 4px 12px rgba(254, 240, 138, 0.2)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a16207', flexShrink: 0 }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '16px', color: '#713f12' }}>
                Track Completed! 🎉
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#854d0e', lineHeight: 1.5 }}>
                Congratulations, you've completed all items on the <strong>{currentTrackInfo.title}</strong>! Ready to keep growing? Click the <strong>"Switch Track"</strong> button in the header above to transition to your next set of milestones.
              </p>
            </div>
          </div>
        )}
        
        {steps.length === 0 ? (
          <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e2e0d8', borderRadius: '8px', padding: '48px' }}>
            <Sparkles size={32} style={{ color: '#e7b605', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#5a5650', marginBottom: 4 }}>No steps defined</div>
            <p style={{ margin: 0, fontSize: '13px', color: '#9a9585' }}>No roadmap milestones were found in the database for this track.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {steps.map((step) => {
              const isCompleted = completedIds.includes(step.id);
              const isCurrent = currentStep?.id === step.id;

              return (
                <div 
                  key={step.id} 
                  style={{ 
                    position: 'relative',
                    transition: 'all 0.3s'
                  }}
                >
                  {/* Current step golden indicator badge */}
                  {isCurrent && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: '24px',
                        top: '-10px',
                        background: '#e7b605',
                        color: '#000',
                        fontSize: '9px',
                        fontWeight: 900,
                        fontFamily: 'DM Sans, sans-serif',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: '0 2px 8px rgba(231,182,5,0.2)',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Sparkles size={8} /> Active Step
                    </div>
                  )}

                  <div 
                    style={{
                      borderRadius: '8px',
                      boxShadow: isCurrent ? '0 0 0 2px #e7b605, 0 10px 20px rgba(231, 182, 5, 0.04)' : 'none',
                      transition: 'all 0.3s'
                    }}
                  >
                    <StepCard
                      weekNumber={step.weekNumber}
                      title={step.title}
                      description={step.description}
                      actionText={step.actionText}
                      actionHref={step.actionHref}
                      completed={isCompleted}
                      onToggleComplete={() => handleToggleTask(step.id)}
                      updating={updating}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Switch Track Modal Popup */}
      {isChangingTrack && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div 
            style={{
              background: '#fff',
              border: '1px solid #e2e0d8',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '650px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative'
            }}
          >
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', margin: '0 0 8px 0', color: '#2a2820' }}>
              Select Active Entrepreneur Track
            </h2>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 24px 0', fontFamily: 'Noto Serif, serif' }}>
              Select a stage that aligns best with your startup goals. Switching tracks resets progress records for the current track.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {(Object.keys(TRACK_INFOS) as TrackType[]).map(trackKey => {
                const info = TRACK_INFOS[trackKey];
                const isSelected = tempTrack === trackKey;
                const IconComp = info.icon;
                
                return (
                  <div 
                    key={trackKey}
                    onClick={() => setTempTrack(trackKey)}
                    style={{
                      border: isSelected ? '2px solid #e7b605' : '1px solid #e2e0d8',
                      background: isSelected ? 'rgba(231,182,5,0.03)' : '#fff',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#9a9585';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#e2e0d8';
                    }}
                  >
                    <div 
                      style={{
                        background: isSelected ? '#e7b605' : '#f0efe9',
                        color: isSelected ? '#000' : '#5a5650',
                        borderRadius: '6px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <IconComp size={20} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <h4 style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '15px', color: '#2a2820' }}>
                          {info.title}
                        </h4>
                        <span style={{ fontSize: '9px', background: isSelected ? '#fef9c3' : '#f0efe9', color: isSelected ? '#a16207' : '#5a5650', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                          {info.badge}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                        {info.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setIsChangingTrack(false)}
                disabled={updating}
                style={{
                  background: 'transparent',
                  border: '1px solid #e2e0d8',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleTrackChangeSave}
                disabled={updating}
                style={{
                  background: '#000',
                  border: '1px solid #000',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {updating ? 'Saving...' : 'Apply Track'} <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
