'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings, Calendar, Building2, Users, BookOpen, Trophy, Star,
  ChevronRight, TrendingUp, MessageSquare, Zap, LogOut, User,
  Plus, Pencil, Trash2, Tag, ExternalLink, CheckCircle,
  UserCircle, Globe, MapPin, Rss, Sparkles, Menu, X as CloseIcon,
} from 'lucide-react';
import FeedSection from './FeedSection';
import RoadmapSection from './RoadmapSection';
import StepCard from './StepCard';
import NotificationBell from './NotificationBell';
import { computeProfileCompletion } from './profile-completion';
import { useEscapeKey } from '@/components/ui/useEscapeKey';
import type { Nomination } from '@/app/awards/nominate/page';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { logout } from '@/app/actions/auth';
import { getProfile, getRoadmap, toggleStepCompletion } from '@/app/actions/profile';

type Section = 'dashboard' | 'feed' | 'events' | 'offers' | 'awards' | 'directoryProfile' | 'business' | 'owners' | 'roadmap' | 'matches';

const defaultMember = {
  name: 'Loading User',
  business: 'Loading Business',
  industry: 'Member',
  stage: '',
  joined: 'May 2026',
  profileCompletion: 0,
};

const recommendations = {
  events: [
    { title: 'YYC Founders Mixer', date: 'Jun 12', type: 'Networking', match: 95 },
    { title: 'Scale-Up Workshop', date: 'Jun 18', type: 'Workshop', match: 88 },
  ],
  matches: [
    { name: 'Sarah K.', business: 'Pinnacle Marketing', reason: 'Your ideal referral partner type', mutual: 3 },
    { name: 'Amanda C.', business: 'Foothills Financial', reason: 'Serves your ideal client base', mutual: 2 },
  ],
  resources: [
    { title: 'Alberta Investor Tax Credit', category: 'Funding', relevance: 'High match for Grow stage' },
    { title: 'BDC Growth Capital', category: 'Financing', relevance: 'Matches your revenue range' },
  ],
};

// Nav items: `section` = stay on dashboard and switch view; `href` = navigate away
const navItems: { icon: React.ElementType; label: string; section?: Section; href?: string }[] = [
  { icon: Rss, label: 'Feed', section: 'feed' },
  { icon: TrendingUp, label: 'Dashboard', section: 'dashboard' },
  { icon: CheckCircle, label: 'My Roadmap', section: 'roadmap' },
  { icon: Calendar, label: 'Events', section: 'events' },
  { icon: Tag, label: 'Offers', section: 'offers' },
  { icon: Trophy, label: 'Awards', section: 'awards' },
  { icon: Building2, label: 'My Directory Profile', section: 'directoryProfile' },
  { icon: Building2, label: 'Business', section: 'business' },
  { icon: UserCircle, label: 'Owners', section: 'owners' },
  { icon: Users, label: 'My Matches', section: 'matches' },
  { icon: BookOpen, label: 'Resources', href: '/resources' },
  { icon: Star, label: 'Supper Club', href: '/supper-club' },
];

type Submission = {
  id: string;
  title: string;
  category: string;
  submittedAt: string;
  updatedAt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
};

type MyOffer = {
  id: string;
  title: string;
  discount: string;
  category: string;
  type: string;
  template?: string;
  expiryDate?: string;
  submittedAt: string;
  updatedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
};

const offerTemplateLabels: Record<string, string> = {
  percentage: 'Percentage Discount',
  fixed: 'Fixed Amount Discount',
  bogo: 'Buy One Get One',
  custom: 'Custom Offer',
  passport: 'Passport Offer',
  event: 'Event Offer',
  affiliate: 'Affiliate Offer',
};




const statusStyles: Record<'pending' | 'approved' | 'rejected' | 'archived', { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(230,126,34,0.1)', color: '#e67e22', label: 'Pending Review' },
  approved: { bg: 'rgba(39,174,96,0.1)', color: '#27ae60', label: 'Approved' },
  rejected: { bg: 'rgba(192,57,43,0.1)', color: '#c0392b', label: 'Rejected' },
  archived: { bg: 'rgba(90,86,80,0.1)', color: '#5a5650', label: 'Archived' },
};

function formatOfferTemplate(template?: string) {
  if (!template) return 'Standard Offer';

  return template
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

const sectionTitles: Record<Section, string> = {
  dashboard: 'Dashboard',
  feed: 'Community Feed',
  roadmap: 'My Roadmap',
  events: 'My Events',
  offers: 'My Offers',
  awards: 'My Awards',
  directoryProfile: 'My Directory Profile',
  business: 'Business Profiles',
  owners: 'Owner Network',
  matches: 'My Matches',
};

// ── Shared label style ───────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
  fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase',
  marginBottom: 8, color: '#2a2820',
};

// ── Profile types ────────────────────────────────────────────────
type BusinessProfile = {
  id: string; name: string; industry: string; location: string;
  description: string; website?: string; lookingFor?: string;
  tags: string[]; createdAt: string;
};

type OwnerProfile = {
  id: string; name: string; title: string; business: string;
  bio: string; lookingFor?: string; tags: string[]; createdAt: string;
};

type OwnerPost = {
  id: string; ownerName: string; business: string;
  type: 'seeking' | 'offering'; headline: string; details: string;
  tags: string[]; postedAt: string; isOwn?: boolean;
};

const bizIndustries = [
  'Technology', 'Professional Services', 'Manufacturing', 'Marketing Agency',
  'E-commerce', 'Finance', 'Legal', 'Health & Wellness', 'Construction', 'B2B SaaS', 'Other',
];

// ── Business Section ─────────────────────────────────────────────
function BusinessSection({ memberBusiness }: { memberBusiness: string }) {
  const [myProfile, setMyProfile] = useState<BusinessProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<BusinessProfile[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '', industry: 'Technology', location: 'Calgary, AB',
    description: '', website: '', lookingFor: '', tags: '',
  });

  useEffect(() => {
    const myRaw = localStorage.getItem('fe_my_biz_profile');
    if (myRaw) {
      try {
        const p: BusinessProfile = JSON.parse(myRaw);
        setMyProfile(p);
        setForm({ name: p.name, industry: p.industry, location: p.location, description: p.description, website: p.website || '', lookingFor: p.lookingFor || '', tags: p.tags.join(', ') });
      } catch { }
    } else {
      setEditMode(true);
      setForm(f => ({ ...f, name: memberBusiness !== 'Founders Edge Member' ? memberBusiness : '' }));
    }
    const allRaw = localStorage.getItem('fe_biz_profiles');
    if (allRaw) { try { setAllProfiles(JSON.parse(allRaw)); } catch { } }
  }, [memberBusiness]);

  function saveProfile() {
    if (!form.name.trim() || !form.description.trim()) return;
    const profile: BusinessProfile = {
      id: myProfile?.id || `biz_${Date.now()}`,
      name: form.name, industry: form.industry, location: form.location,
      description: form.description, website: form.website,
      lookingFor: form.lookingFor,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: myProfile?.createdAt || new Date().toISOString(),
    };
    localStorage.setItem('fe_my_biz_profile', JSON.stringify(profile));
    const existing: BusinessProfile[] = JSON.parse(localStorage.getItem('fe_biz_profiles') || '[]');
    const idx = existing.findIndex(p => p.id === profile.id);
    const updated = idx >= 0 ? existing.map(p => p.id === profile.id ? profile : p) : [...existing, profile];
    localStorage.setItem('fe_biz_profiles', JSON.stringify(updated));
    setMyProfile(profile); setAllProfiles(updated); setEditMode(false);
  }

  const otherProfiles = myProfile ? allProfiles.filter(p => p.id !== myProfile.id) : allProfiles;

  return (
    <div style={{ padding: '40px' }}>
      {/* My Business Profile */}
      <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px', marginBottom: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 4 }}>My Business Profile</h2>
            <div style={{ fontSize: '13px', color: '#9a9585' }}>Visible to all Founders Edge members</div>
          </div>
          {myProfile && !editMode && (
            <button onClick={() => setEditMode(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', color: '#5a5650', transition: 'all 0.2s' }}>
              <Pencil size={13} /> Edit Profile
            </button>
          )}
        </div>

        {editMode ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Business Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your business name" style={{ margin: 0 }} />
              </div>
              <div>
                <label style={labelStyle}>Industry</label>
                <select className="select-field" value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}>
                  {bizIndustries.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input className="input-field" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Calgary, AB" style={{ margin: 0 }} />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input className="input-field" type="url" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://yourbusiness.com" style={{ margin: 0 }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Business Description *</label>
              <textarea className="input-field" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What does your business do? Who do you serve?" rows={3} style={{ resize: 'vertical', fontFamily: 'Noto Serif, serif' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Currently Looking For</label>
              <input className="input-field" value={form.lookingFor} onChange={e => setForm(p => ({ ...p, lookingFor: e.target.value }))} placeholder="e.g. Looking to hire a sales lead, seeking a strategic partner in tech..." style={{ margin: 0 }} />
              <div style={{ fontSize: '12px', color: '#9a9585', marginTop: 6, fontFamily: 'Noto Serif, serif' }}>Optional — let other members know what your business needs right now.</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input className="input-field" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. SaaS, B2B, Growth, Calgary, Tech" style={{ margin: 0 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={saveProfile} className="btn-primary" style={{ padding: '12px 28px', fontSize: '13px' }}>Save Business Profile</button>
              {myProfile && (
                <button onClick={() => setEditMode(false)} style={{ padding: '12px 24px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#5a5650' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : myProfile ? (
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 10 }}>{myProfile.name}</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <span className="tag">{myProfile.industry}</span>
                {myProfile.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '13px', color: '#9a9585' }}>
                    <MapPin size={12} style={{ color: '#e7b605' }} />{myProfile.location}
                  </span>
                )}
              </div>
              <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: 16 }}>{myProfile.description}</p>
              {myProfile.website && (
                <a href={myProfile.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9b7011', fontSize: '13px', fontWeight: 700, textDecoration: 'none', marginBottom: 16 }}>
                  <Globe size={14} /> {myProfile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {myProfile.lookingFor && (
                <div style={{ padding: '12px 16px', background: 'rgba(231,182,5,0.06)', borderLeft: '3px solid #e7b605' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b7011', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Currently Looking For</div>
                  <div style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px' }}>{myProfile.lookingFor}</div>
                </div>
              )}
            </div>
            {myProfile.tags.length > 0 && (
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Services & Tags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 220 }}>
                  {myProfile.tags.map(t => (
                    <span key={t} style={{ padding: '3px 10px', background: '#f0efe9', fontSize: '11px', color: '#5a5650', fontWeight: 600, borderRadius: 2 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Business Directory */}
      <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 4 }}>Member Businesses</h2>
            <div style={{ fontSize: '13px', color: '#9a9585' }}>{otherProfiles.length} other business{otherProfiles.length !== 1 ? 'es' : ''} in the network</div>
          </div>
        </div>
        {otherProfiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', borderTop: '1px solid #f0efe9' }}>
            <Building2 size={40} style={{ color: '#e2e0d8', marginBottom: 16 }} />
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#9a9585', marginBottom: 8 }}>No other businesses yet</div>
            <div style={{ fontSize: '14px', color: '#b8b4ae', fontFamily: 'Noto Serif, serif' }}>Other member business profiles will appear here once created.</div>
          </div>
        ) : (
          <div className="grid-2">
            {otherProfiles.map(p => (
              <div key={p.id} className="card" style={{ borderLeft: '4px solid transparent' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span className="tag">{p.industry}</span>
                  {p.location && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#9a9585' }}>
                      <MapPin size={11} style={{ color: '#e7b605' }} />{p.location}
                    </span>
                  )}
                </div>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', marginBottom: 8 }}>{p.name}</h3>
                <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: 12 }}>{p.description}</p>
                {p.lookingFor && (
                  <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(231,182,5,0.06)', borderLeft: '3px solid #e7b605' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#9b7011', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Looking For</div>
                    <div style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '13px' }}>{p.lookingFor}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {p.tags.map(t => <span key={t} style={{ padding: '3px 8px', background: '#f0efe9', fontSize: '11px', color: '#5a5650', fontWeight: 600, borderRadius: 2 }}>{t}</span>)}
                </div>
                <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #f0efe9' }}>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: '1px solid #e2e0d8', color: '#5a5650', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
                      <Globe size={12} /> Website
                    </a>
                  )}
                  <button className="btn-primary" style={{ padding: '7px 14px', fontSize: '12px' }}>
                    <MessageSquare size={12} /> Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Matches Section ──────────────────────────────────────────────
function MatchesSection({ setConfirmModal }: { setConfirmModal: any }) {
  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '32px', borderRadius: '8px', marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '24px', margin: '0 0 6px 0', color: '#2a2820' }}>
          My Curated Matches
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#9a9585', fontFamily: 'Noto Serif, serif', lineHeight: 1.5 }}>
          These are customized recommendations based on your industry, stage, and referral criteria to help you grow.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {recommendations.matches.map((match, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1px solid #e2e0d8',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#e7b605';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(231,182,5,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e0d8';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.01)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0efe9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#2a2820', fontSize: '15px' }}>
                  {match.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '16px', color: '#2a2820' }}>
                    {match.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#9a9585' }}>
                    {match.business}
                  </div>
                </div>
              </div>

              <div style={{ background: '#fafaf9', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: '#9a9585', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Match Reason
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#5a5650', lineHeight: 1.4 }}>
                  {match.reason}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0efe9', paddingTop: '16px' }}>
              <span style={{ fontSize: '11px', color: '#9a9585', fontWeight: 600 }}>
                {match.mutual} Mutual Connection{match.mutual !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: `Connect with ${match.name}`,
                    message: `Would you like us to facilitate a warm email introduction to ${match.name} from ${match.business}?`,
                    onConfirm: () => {
                      setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
                      alert(`Introduction request submitted! Our team will contact ${match.name} shortly.`);
                    }
                  });
                }}
                style={{
                  background: '#000',
                  border: '1px solid #000',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e7b605';
                  e.currentTarget.style.borderColor = '#e7b605';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#000';
                  e.currentTarget.style.borderColor = '#000';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                Connect
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Owners Section ───────────────────────────────────────────────
function OwnersSection({ memberName, memberBusiness, setConfirmModal }: { memberName: string; memberBusiness: string; setConfirmModal: any }) {
  const [myProfile, setMyProfile] = useState<OwnerProfile | null>(null);
  const [posts, setPosts] = useState<OwnerPost[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [form, setForm] = useState({ name: '', title: '', business: '', bio: '', lookingFor: '', tags: '' });
  const [postForm, setPostForm] = useState({ type: 'seeking' as 'seeking' | 'offering', headline: '', details: '', tags: '' });

  useEffect(() => {
    const myRaw = localStorage.getItem('fe_my_owner_profile');
    if (myRaw) {
      try {
        const p: OwnerProfile = JSON.parse(myRaw);
        setMyProfile(p);
        setForm({ name: p.name, title: p.title, business: p.business, bio: p.bio, lookingFor: p.lookingFor || '', tags: p.tags.join(', ') });
      } catch { }
    } else {
      setEditMode(true);
      setForm(f => ({
        ...f,
        name: memberName !== 'Loading User' ? memberName : '',
        business: memberBusiness !== 'Founders Edge Member' ? memberBusiness : '',
      }));
    }
    const postsRaw = localStorage.getItem('fe_owner_posts');
    if (postsRaw) { try { setPosts(JSON.parse(postsRaw)); } catch { } }
  }, [memberName, memberBusiness]);

  function saveProfile() {
    if (!form.name.trim() || !form.bio.trim()) return;
    const profile: OwnerProfile = {
      id: myProfile?.id || `owner_${Date.now()}`,
      name: form.name, title: form.title, business: form.business, bio: form.bio,
      lookingFor: form.lookingFor,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: myProfile?.createdAt || new Date().toISOString(),
    };
    localStorage.setItem('fe_my_owner_profile', JSON.stringify(profile));
    setMyProfile(profile); setEditMode(false);
  }

  function submitPost() {
    if (!postForm.headline.trim() || !postForm.details.trim()) return;
    const post: OwnerPost = {
      id: `post_${Date.now()}`,
      ownerName: myProfile?.name || memberName,
      business: myProfile?.business || memberBusiness,
      type: postForm.type, headline: postForm.headline, details: postForm.details,
      tags: postForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      postedAt: new Date().toISOString(), isOwn: true,
    };
    const updated = [post, ...posts];
    localStorage.setItem('fe_owner_posts', JSON.stringify(updated));
    setPosts(updated);
    setPostForm({ type: 'seeking', headline: '', details: '', tags: '' });
    setShowPostForm(false);
  }

  function deletePost(id: string) {
    const updated = posts.filter(p => p.id !== id);
    localStorage.setItem('fe_owner_posts', JSON.stringify(updated));
    setPosts(updated);
  }

  return (
    <div style={{ padding: '40px' }}>
      {/* My Owner Profile */}
      <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px', marginBottom: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 4 }}>My Owner Profile</h2>
            <div style={{ fontSize: '13px', color: '#9a9585' }}>Your personal founder presence in the network</div>
          </div>
          {myProfile && !editMode && (
            <button onClick={() => setEditMode(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', color: '#5a5650', transition: 'all 0.2s' }}>
              <Pencil size={13} /> Edit Profile
            </button>
          )}
        </div>

        {editMode ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" style={{ margin: 0 }} />
              </div>
              <div>
                <label style={labelStyle}>Title / Role</label>
                <input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Founder & CEO, Co-Founder" style={{ margin: 0 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Business</label>
                <input className="input-field" value={form.business} onChange={e => setForm(p => ({ ...p, business: e.target.value }))} placeholder="Your business name" style={{ margin: 0 }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Bio *</label>
              <textarea className="input-field" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell the network about yourself — your background, what you're building, what drives you..." rows={4} style={{ resize: 'vertical', fontFamily: 'Noto Serif, serif' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Looking to Grow — What Do You Need?</label>
              <input className="input-field" value={form.lookingFor} onChange={e => setForm(p => ({ ...p, lookingFor: e.target.value }))} placeholder="e.g. Looking to scale my sales team, need a fractional CFO, seeking a co-founder in tech..." style={{ margin: 0 }} />
              <div style={{ fontSize: '12px', color: '#9a9585', marginTop: 6, fontFamily: 'Noto Serif, serif' }}>This shows prominently on your profile — let others know how they can help you.</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input className="input-field" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. Bootstrapped, SaaS, Series A, Calgary" style={{ margin: 0 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={saveProfile} className="btn-primary" style={{ padding: '12px 28px', fontSize: '13px' }}>Save Owner Profile</button>
              {myProfile && (
                <button onClick={() => setEditMode(false)} style={{ padding: '12px 24px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#5a5650' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : myProfile ? (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 56, height: 56, background: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '22px', color: '#000', flexShrink: 0 }}>
              {myProfile.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: 4 }}>{myProfile.name}</h3>
              <div style={{ fontSize: '14px', color: '#9b7011', fontWeight: 600, marginBottom: 12 }}>
                {myProfile.title}{myProfile.title && myProfile.business ? ' · ' : ''}{myProfile.business}
              </div>
              <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: myProfile.lookingFor ? 16 : 0 }}>{myProfile.bio}</p>
              {myProfile.lookingFor && (
                <div style={{ padding: '12px 16px', background: 'rgba(231,182,5,0.06)', borderLeft: '3px solid #e7b605' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b7011', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Looking to Grow</div>
                  <div style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px' }}>{myProfile.lookingFor}</div>
                </div>
              )}
              {myProfile.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
                  {myProfile.tags.map(t => <span key={t} style={{ padding: '3px 10px', background: '#f0efe9', fontSize: '11px', color: '#5a5650', fontWeight: 600, borderRadius: 2 }}>{t}</span>)}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Owner Board */}
      <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 4 }}>Member Board</h2>
            <div style={{ fontSize: '13px', color: '#9a9585' }}>What founders are seeking and offering</div>
          </div>
          {myProfile && (
            <button onClick={() => setShowPostForm(!showPostForm)} className={showPostForm ? 'btn-outline' : 'btn-primary'} style={{ fontSize: '12px', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {showPostForm ? 'Cancel' : <><Plus size={14} /> Post a Need</>}
            </button>
          )}
        </div>

        {/* Post Form */}
        {showPostForm && (
          <div style={{ background: '#f9f9f7', border: '1px solid #e2e0d8', padding: '24px', marginBottom: 24 }}>
            <div className="section-label" style={{ marginBottom: 16 }}>New Post</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {(['seeking', 'offering'] as const).map(t => (
                <button key={t} type="button" onClick={() => setPostForm(p => ({ ...p, type: t }))} style={{ padding: '10px 20px', border: '2px solid', borderColor: postForm.type === t ? '#e7b605' : '#e2e0d8', background: postForm.type === t ? 'rgba(231,182,5,0.06)' : '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', color: postForm.type === t ? '#9b7011' : '#9a9585', textTransform: 'capitalize' }}>
                  {t === 'seeking' ? '🔍 Seeking' : '🤝 Offering'}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Headline *</label>
              <input className="input-field" value={postForm.headline} onChange={e => setPostForm(p => ({ ...p, headline: e.target.value }))} placeholder={postForm.type === 'seeking' ? 'e.g. Looking to hire a VP of Sales' : 'e.g. Offering free financial planning session'} style={{ margin: 0 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Details *</label>
              <textarea className="input-field" value={postForm.details} onChange={e => setPostForm(p => ({ ...p, details: e.target.value }))} placeholder={postForm.type === 'seeking' ? 'Describe what you need, ideal experience, budget range...' : 'Describe what you are offering, who it is for, any conditions...'} rows={3} style={{ resize: 'vertical', fontFamily: 'Noto Serif, serif' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input className="input-field" value={postForm.tags} onChange={e => setPostForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. HR, Sales, Tech, Finance" style={{ margin: 0 }} />
            </div>
            <button onClick={submitPost} className="btn-primary" style={{ padding: '12px 28px', fontSize: '13px' }}>Post to Board</button>
          </div>
        )}

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', borderTop: '1px solid #f0efe9' }}>
            <Users size={40} style={{ color: '#e2e0d8', marginBottom: 16 }} />
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#9a9585', marginBottom: 8 }}>No posts yet</div>
            <div style={{ fontSize: '14px', color: '#b8b4ae', fontFamily: 'Noto Serif, serif', maxWidth: 380, margin: '0 auto' }}>
              Be the first to post what you're looking for. Other members will see your post and reach out.
            </div>
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <div key={post.id} style={{ padding: '20px', background: '#f9f9f7', border: '1px solid #e2e0d8', borderLeft: `4px solid ${post.type === 'seeking' ? '#e7b605' : '#27ae60'}`, marginBottom: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', background: post.type === 'seeking' ? 'rgba(231,182,5,0.12)' : 'rgba(39,174,96,0.1)', color: post.type === 'seeking' ? '#9b7011' : '#27ae60', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {post.type === 'seeking' ? '🔍 Seeking' : '🤝 Offering'}
                  </span>
                  {post.isOwn && (
                    <button onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Remove Post',
                        message: 'Are you sure you want to remove this post from the board?',
                        onConfirm: () => deletePost(post.id),
                      });
                    }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'transparent', border: '1px solid #e2e0d8', color: '#9a9585', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#9a9585'; }}
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  )}
                </div>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '17px', marginBottom: 8, color: '#2a2820' }}>{post.headline}</h3>
                <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.7, marginBottom: 12 }}>{post.details}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {post.tags.map(t => <span key={t} style={{ padding: '3px 8px', background: '#f0efe9', fontSize: '11px', color: '#5a5650', fontWeight: 600, borderRadius: 2 }}>{t}</span>)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9a9585' }}>
                    <span style={{ fontWeight: 700, color: '#2a2820' }}>{post.ownerName}</span>
                    {post.business && <> · {post.business}</>}
                    {' · '}{new Date(post.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                {!post.isOwn && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e0d8' }}>
                    <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <MessageSquare size={12} /> Reach Out
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('feed');
  const [member, setMember] = useState(defaultMember);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Track viewport so the fixed sidebar can go off-canvas on small screens.
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const isAdmin = userProfile?.role === 'ADMIN';
  const visibleNavItems = isAdmin
    ? [
      ...navItems,
      { icon: Settings, label: 'Admin Panel', href: '/admin/dashboard' },
    ]
    : navItems;
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [myOffers, setMyOffers] = useState<MyOffer[]>([]);
  const [dashboardPosts, setDashboardPosts] = useState<any[]>([]);
  const [myNominations, setMyNominations] = useState<Nomination[]>([]);
  const [nomPage, setNomPage] = useState(1);
  const [nomTotalPages, setNomTotalPages] = useState(1);
  const itemPerPage = 3;

  const [roadmapSteps, setRoadmapSteps] = useState<any[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [roadmapLoading, setRoadmapLoading] = useState(true);

  const [showStepCongratulations, setShowStepCongratulations] = useState(false);
  const [completingStepId, setCompletingStepId] = useState<string | null>(null);
  const [dismissedStepIds, setDismissedStepIds] = useState<string[]>([]);

  const loadRoadmap = async () => {
    try {
      const res = await getRoadmap();
      if (res.success && res.steps && res.progress) {
        setRoadmapSteps(res.steps);
        setCompletedStepIds(res.progress.filter((p: any) => p.completed).map((p: any) => p.stepId));
      }
    } catch (err) {
      console.error('Failed to load roadmap for widget:', err);
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleToggleWidgetStep = async (stepId: string) => {

    const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
    }>({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => { },
    });

    useEscapeKey(confirmModal.isOpen, () => setConfirmModal(prev => ({ ...prev, isOpen: false })));

    const loadProfile = async () => {
      const res = await getProfile();

      if (!res.success || !res.user) {
        router.push('/login');
        return;
      }

      const loggedInUser = res.user as any;

      setUserProfile(loggedInUser);

      if (loggedInUser.role === 'MEMBER' && !loggedInUser.track) {
        router.push('/onboarding');
        return;
      }

      const userEmail = loggedInUser.email || '';
      const userName = loggedInUser.name || 'Member';

      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          first_name,
          last_name,
          email,
          stage,
          industry,
          created_at,
          businesses (
            business_name,
            business_type
          )
        `)
        .eq('email', userEmail)
        .maybeSingle();

      if (error) {
        console.error('Member/business lookup error:', error.message);
      }

      if (data) {
        const businessData = Array.isArray(data.businesses)
          ? data.businesses[0]
          : data.businesses;

        const fullName = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || userName;
        const industry = data.industry ?? businessData?.business_type ?? 'Member';

        setMember({
          name: fullName,
          business: businessData?.business_name ?? 'Founders Edge Member',
          industry,
          stage: data.stage ?? '',
          joined: data.created_at
            ? new Date(data.created_at).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })
            : 'May 2026',
          profileCompletion: computeProfileCompletion({
            name: fullName,
            email: userEmail,
            industry,
            stage: data.stage,
            avatarUrl: loggedInUser.avatarUrl,
          }).percent,
        });

        await loadSubmissions(data.id);
        return;
      }

      setMember(prev => ({
        ...prev,
        name: userName,
        business: 'Founders Edge Member',
        industry: 'Member',
        profileCompletion: computeProfileCompletion({
          name: userName,
          email: userEmail,
          avatarUrl: loggedInUser.avatarUrl,
        }).percent,
      }));

      await loadSubmissions();
    };

    const handleDismissWidgetStep = (stepId: string) => {
      if (completingStepId) return;

      setDismissedStepIds(prev =>
        prev.includes(stepId) ? prev : [...prev, stepId]
      );
    };

    // Check auth status on every tab/section transition within the dashboard
    useEffect(() => {
      const verifyAuth = async () => {
        const res = await getProfile();
        if (!res.success || !res.user) {
          router.push('/login');
          return;
        }
        if (res.user.role === 'MEMBER' && !res.user.track) {
          router.push('/onboarding');
        }
      };
      verifyAuth();
    }, [activeSection, router]);

    const loadSubmissions = async (memberId?: string) => {
      if (!memberId) {
        const raw = localStorage.getItem('fe_my_submissions');
        if (raw) {
          try {
            setMySubmissions(JSON.parse(raw));
          } catch { }
        }
        return;
      }

      try {
        const res = await fetch('/api/events?mySubmissions=true');

        if (res.ok) {
          const allEvents = await res.json();
          const mine = allEvents.filter((e: any) => e.member_id === memberId);

          const mapped: Submission[] = mine.map((e: any) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            submittedAt: e.created_At || e.created_at || new Date().toISOString(),
            status: e.status?.toLowerCase() || 'pending',
          }));

          setMySubmissions(mapped);
        }
      } catch (err) {
        console.error('Failed to load submissions from API:', err);
      }
    };

    const loadOffers = async () => {
      try {
        const res = await fetch('/api/offers?mySubmissions=true');
        if (res.ok) {
          const dbData = await res.json();
          const mapped: MyOffer[] = dbData.map((o: any) => ({
            id: o.id,
            title: o.title,
            discount: o.type === 'percentage' ? `${o.discount_value}% off` : o.type === 'fixed' ? `$${o.discount_value} off` : o.type === 'bogo' ? 'Buy 1 Get 1 Free' : o.discount_value || o.fe_discount || 'Special Offer',
            category: o.category,
            type: o.type,
            template: o.passport_type || o.type || 'Standard Offer',
            expiryDate: o.expiry_date,
            submittedAt: o.created_at || o.created_At || new Date().toISOString(),
            status: o.status.toLowerCase() as any,
          }));
          setMyOffers(mapped);
        }
      } catch (err) {
        console.error('Failed to load offers from API:', err);
      }
    };

    const loadNominations = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: nomPage.toString(),
          limit: itemPerPage.toString(),
        });

        const res = await fetch(`/api/nominations?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();

          const dbNoms = Array.isArray(data) ? data : (data.nominations || []);
          if (data.pagination) {
            setNomTotalPages(data.pagination.totalPages);
          } else {
            setNomTotalPages(1);
          }

          const mapped: Nomination[] = dbNoms.map((n: any) => ({
            id: n.id,
            awardId: n.award_id,
            awardName: n.award?.name || 'Unknown Award',
            awardOrg: n.award?.org || '',
            businessName: n.business_name,
            category: n.award?.category || '',
            contactName: n.contact_name,
            contactEmail: n.contact_email,
            website: n.website || '',
            achievement: n.achievement,
            statement: n.statement,
            status: n.status.toLowerCase() as any,
            submittedAt: n.created_at,
          }));
          setMyNominations(mapped);
        }
      } catch (err) {
        console.error('Failed to load nominations from API:', err);
      }
    };

    useEffect(() => {
      loadProfile();
      loadOffers();
      loadRoadmap();

      // Parse tab parameter from query string if present
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['dashboard', 'feed', 'events', 'offers', 'awards', 'business', 'owners', 'roadmap', 'matches'].includes(tab)) {
          setActiveSection(tab as Section);
        }
      }
    }, []);

    useEffect(() => {
      loadNominations();
    }, [nomPage]);

    // Recompute profile completion when switching sections (picks up business/owner
    // profile edits made in the Business/Owners tabs without needing a reload).
    useEffect(() => {
      setMember(prev => ({
        ...prev,
        profileCompletion: computeProfileCompletion({
          name: prev.name,
          email: userProfile?.email,
          industry: prev.industry,
          stage: prev.stage,
          avatarUrl: userProfile?.avatarUrl,
        }).percent,
      }));
    }, [activeSection, userProfile]);

    async function deleteSubmission(id: string) {
      try {
        const res = await fetch(`/api/events/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const updated = mySubmissions.filter(s => s.id !== id);
          setMySubmissions(updated);
          const raw = localStorage.getItem('fe_my_submissions');
          if (raw) {
            try {
              const list = JSON.parse(raw).filter((s: any) => s.id !== id);
              localStorage.setItem('fe_my_submissions', JSON.stringify(list));
            } catch { }
          }
        } else {
          const data = await res.json();
          alert(`Error deleting event: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error("Failed to delete event:", err);
        alert("Failed to delete event due to network error.");
      }
    }

    async function deleteOffer(id: string) {
      try {
        const res = await fetch(`/api/offers/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setMyOffers(prev => prev.filter(o => o.id !== id));
        } else {
          const data = await res.json();
          alert(`Error deleting offer: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error("Failed to delete offer:", err);
        alert("Failed to delete offer due to network error.");
      }
    }

    async function deleteNomination(id: string) {
      try {
        const res = await fetch(`/api/nominations/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setMyNominations(prev => prev.filter(n => n.id !== id));
        } else {
          const data = await res.json();
          alert(`Error deleting nomination: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error("Failed to delete nomination:", err);
        alert("Failed to delete nomination due to network error.");
      }
    }

    // ── Sidebar nav item renderer ──────────────────────────────────
    function NavItem({ item }: { item: typeof navItems[0] }) {
      const isActive = item.section === activeSection;
      const sharedStyle: React.CSSProperties = {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 24px',
        background: isActive ? 'rgba(231,182,5,0.1)' : 'transparent',
        borderLeft: isActive ? '3px solid #e7b605' : '3px solid transparent',
        color: isActive ? '#e7b605' : '#888',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '14px',
        letterSpacing: '0.03em', transition: 'all 0.2s', width: '100%',
        textDecoration: 'none',
      };

      if (item.section) {
        return (
          <button
            onClick={() => { setActiveSection(item.section!); setSidebarOpen(false); }}
            style={{ ...sharedStyle, background: isActive ? 'rgba(231,182,5,0.1)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        );
      }

      return (
        <Link href={item.href!} style={sharedStyle}>
          <item.icon size={16} />
          {item.label}
          <ExternalLink size={11} style={{ marginLeft: 'auto', opacity: 0.4 }} />
        </Link>
      );
    }

    // ── Section: Events ────────────────────────────────────────────
    function EventsSection() {
      return (
        <div style={{ padding: '40px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 4 }}>My Event Submissions</h2>
                <div style={{ fontSize: '13px', color: '#9a9585' }}>{mySubmissions.length} submission{mySubmissions.length !== 1 ? 's' : ''}</div>
              </div>
              <Link href="/events/submit" className="btn-primary" style={{ fontSize: '12px', padding: '10px 18px' }}>
                <Plus size={14} /> Submit New Event
              </Link>
            </div>

            {mySubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', borderTop: '1px solid #f0efe9' }}>
                <Calendar size={40} style={{ color: '#e2e0d8', marginBottom: 16 }} />
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#9a9585', marginBottom: 8 }}>No event submissions yet</div>
                <div style={{ fontSize: '14px', color: '#b8b4ae', fontFamily: 'Noto Serif, serif', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  Have an event for the Founders Edge community? Submit it for review and it'll appear here once approved.
                </div>
                <Link href="/events/submit" className="btn-primary" style={{ justifyContent: 'center', display: 'inline-flex' }}>
                  Submit an Event
                </Link>
              </div>
            ) : (
              <div>
                {mySubmissions.map(sub => {
                  const s = statusStyles[sub.status];
                  const canEdit = sub.status !== 'approved';
                  return (
                    <div key={sub.id} style={{ padding: '20px 0', borderTop: '1px solid #f0efe9', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#2a2820', marginBottom: 6 }}>{sub.title}</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span className="tag" style={{ fontSize: '10px', padding: '2px 8px' }}>{sub.category}</span>
                          <span style={{ fontSize: '12px', color: '#9a9585' }}>
                            Submitted {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {sub.updatedAt && (
                            <span style={{ fontSize: '12px', color: '#9a9585' }}>
                              · Updated {new Date(sub.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {s.label}
                        </span>
                        {canEdit && (
                          <Link
                            href={`/events/submit?edit=${sub.id}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: '1px solid #e2e0d8', color: '#555', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e7b605'; e.currentTarget.style.color = '#9b7011'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#555'; }}
                          >
                            <Pencil size={12} /> Edit
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Delete Submission',
                              message: 'Are you sure you want to permanently delete this event submission?',
                              onConfirm: () => deleteSubmission(sub.id),
                            });
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'transparent', border: '1px solid #e2e0d8', color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#9a9585'; }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Browse events link */}
          <div style={{ marginTop: 2, background: '#000', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ color: '#888', fontFamily: 'Noto Serif, serif', fontSize: '14px' }}>Browse all upcoming Founders Edge events</div>
            <Link href="/events" className="btn-primary" style={{ fontSize: '12px', padding: '10px 18px' }}>
              View All Events <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      );
    }

    // ── Section: Offers ────────────────────────────────────────────
    function OffersSection() {
      const activeCount = myOffers.filter(o => o.status !== 'rejected').length;
      return (
        <div style={{ padding: '40px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 4 }}>My Offer Submissions</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: '13px', color: '#9a9585' }}>{activeCount}/3 active offers</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} style={{ width: 20, height: 5, background: i < activeCount ? '#e7b605' : '#e2e0d8', borderRadius: 2 }} />
                    ))}
                  </div>
                </div>
              </div>
              {activeCount < 3 && (
                <Link href="/offers/submit" className="btn-primary" style={{ fontSize: '12px', padding: '10px 18px' }}>
                  <Plus size={14} /> Add Offer
                </Link>
              )}
            </div>

            {myOffers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', borderTop: '1px solid #f0efe9' }}>
                <Tag size={40} style={{ color: '#e2e0d8', marginBottom: 16 }} />
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#9a9585', marginBottom: 8 }}>No offers yet</div>
                <div style={{ fontSize: '14px', color: '#b8b4ae', fontFamily: 'Noto Serif, serif', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  Share exclusive deals with the Founders Edge community. Members can list up to 3 active offers.
                </div>
                <Link href="/offers/submit" className="btn-primary" style={{ justifyContent: 'center', display: 'inline-flex' }}>
                  Share an Offer
                </Link>
              </div>
            ) : (
              <div>
                {myOffers.map(offer => {
                  const s = statusStyles[offer.status];
                  const canEdit = offer.status !== 'approved';
                  const isExpired = offer.expiryDate && new Date(offer.expiryDate) < new Date();
                  return (
                    <div key={offer.id} style={{ padding: '20px 0', borderTop: '1px solid #f0efe9', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 900, fontSize: '20px', color: '#e7b605', fontFamily: 'DM Sans, sans-serif' }}>{offer.discount}</span>
                          {isExpired && <span style={{ fontSize: '10px', fontWeight: 700, color: '#c0392b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Expired</span>}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#2a2820', marginBottom: 4 }}>{offer.title}</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span className="tag" style={{ fontSize: '10px', padding: '2px 8px' }}>{offer.category}</span>
                          <span style={{ fontSize: '12px', color: '#9a9585' }}>
                            Submitted {new Date(offer.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {offer.expiryDate && (
                            <span style={{ fontSize: '12px', color: isExpired ? '#c0392b' : '#9a9585' }}>
                              · Expires {new Date(offer.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flexShrink: 0,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            background: '#f0efe9',
                            color: '#5a5650',
                            padding: '4px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Template:{' '}
                          {offerTemplateLabels[offer.template ?? ''] ??
                            formatOfferTemplate(offer.template)}
                        </span>

                        <span
                          style={{
                            background: s.bg,
                            color: s.color,
                            padding: '4px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.label}
                        </span>
                        {canEdit && (
                          <Link
                            href={`/offers/submit?edit=${offer.id}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: '1px solid #e2e0d8', color: '#555', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e7b605'; e.currentTarget.style.color = '#9b7011'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#555'; }}
                          >
                            <Pencil size={12} /> Edit
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Delete Offer',
                              message: 'Are you sure you want to delete this offer submission?',
                              onConfirm: () => deleteOffer(offer.id),
                            });
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'transparent', border: '1px solid #e2e0d8', color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#9a9585'; }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Browse offers link */}
          <div style={{ marginTop: 2, background: '#000', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ color: '#888', fontFamily: 'Noto Serif, serif', fontSize: '14px' }}>Browse all member offers in the directory</div>
            <Link href="/offers" className="btn-primary" style={{ fontSize: '12px', padding: '10px 18px' }}>
              View All Offers <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      );
    }

    // ── Section: Awards ───────────────────────────────────────────
    function AwardsSection() {
      const nomStatusStyles: Record<Nomination['status'], { bg: string; color: string; label: string }> = {
        pending: { bg: 'rgba(230,126,34,0.1)', color: '#e67e22', label: 'Pending Review' },
        approved: { bg: 'rgba(39,174,96,0.1)', color: '#27ae60', label: 'Approved' },
        rejected: { bg: 'rgba(192,57,43,0.1)', color: '#c0392b', label: 'Rejected' },
        winner: { bg: 'rgba(231,182,5,0.12)', color: '#9b7011', label: '🏆 Winner!' },
      };
      return (
        <div style={{ padding: '40px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px', marginBottom: 4 }}>My Award Nominations</h2>
                <div style={{ fontSize: '13px', color: '#9a9585' }}>{myNominations.length} nomination{myNominations.length !== 1 ? 's' : ''} submitted</div>
              </div>
              <Link href="/awards" className="btn-primary" style={{ fontSize: '12px', padding: '10px 18px' }}>
                <Trophy size={14} /> Browse Awards
              </Link>
            </div>

            {myNominations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', borderTop: '1px solid #f0efe9' }}>
                <Trophy size={40} style={{ color: '#e2e0d8', marginBottom: 16 }} />
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#9a9585', marginBottom: 8 }}>No nominations yet</div>
                <div style={{ fontSize: '14px', color: '#b8b4ae', fontFamily: 'Noto Serif, serif', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  Browse available awards and submit a nomination to get your business recognized.
                </div>
                <Link href="/awards" className="btn-primary" style={{ justifyContent: 'center', display: 'inline-flex' }}>
                  View Awards
                </Link>
              </div>
            ) : (
              <div>
                {myNominations.map(nom => {
                  const s = nomStatusStyles[nom.status];
                  const isWinner = nom.status === 'winner';
                  return (
                    <div key={nom.id} style={{ padding: '20px 0', borderTop: '1px solid #f0efe9', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ width: 40, height: 40, background: isWinner ? '#e7b605' : '#f0efe9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trophy size={18} style={{ color: isWinner ? '#000' : '#9b7011' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#2a2820', marginBottom: 4 }}>{nom.awardName}</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', color: '#9b7011', fontWeight: 600 }}>{nom.awardOrg}</span>
                          <span className="tag" style={{ fontSize: '10px', padding: '2px 8px' }}>{nom.category}</span>
                          <span style={{ fontSize: '12px', color: '#9a9585' }}>
                            Submitted {new Date(nom.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {s.label}
                        </span>
                        {nom.status === 'pending' && (
                          <Link
                            href={`/awards/nominate?awardId=${nom.awardId}&edit=${nom.id}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: '1px solid #e2e0d8', color: '#555', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e7b605'; e.currentTarget.style.color = '#9b7011'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#555'; }}
                          >
                            <Pencil size={12} /> Edit
                          </Link>
                        )}
                        {nom.status !== 'winner' && (
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Withdraw Nomination',
                                message: 'Are you sure you want to withdraw this nomination? This action cannot be undone.',
                                onConfirm: () => deleteNomination(nom.id),
                              });
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'transparent', border: '1px solid #e2e0d8', color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#9a9585'; }}
                          >
                            <Trash2 size={12} /> Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {nomTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24, fontFamily: 'DM Sans, sans-serif' }}>
              <button
                disabled={nomPage === 1}
                onClick={() => setNomPage(prev => Math.max(prev - 1, 1))}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px',
                  border: '1px solid #e2e0d8', background: '#fff', color: nomPage === 1 ? '#ccc' : '#2a2820',
                  cursor: nomPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '12px'
                }}
              >
                Prev
              </button>

              {Array.from({ length: nomTotalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setNomPage(pageNum)}
                  style={{
                    padding: '8px 14px', border: '1px solid',
                    borderColor: nomPage === pageNum ? '#e7b605' : '#e2e0d8',
                    background: nomPage === pageNum ? '#e7b605' : '#fff',
                    color: nomPage === pageNum ? '#fff' : '#2a2820',
                    cursor: 'pointer', fontWeight: 700, fontSize: '12px'
                  }}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={nomPage === nomTotalPages}
                onClick={() => setNomPage(prev => Math.min(prev + 1, nomTotalPages))}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px',
                  border: '1px solid #e2e0d8', background: '#fff', color: nomPage === nomTotalPages ? '#ccc' : '#2a2820',
                  cursor: nomPage === nomTotalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '12px'
                }}
              >
                Next
              </button>
            </div>
          )}


          <div style={{ marginTop: 2, background: '#000', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ color: '#888', fontFamily: 'Noto Serif, serif', fontSize: '14px' }}>Discover all available awards and recognition opportunities</div>
            <Link href="/awards" className="btn-primary" style={{ fontSize: '12px', padding: '10px 18px' }}>
              Browse All Awards <ExternalLink size={13} />
            </Link>
          </div>
        </div >
      );
    }

    // ── Section: Main Dashboard ────────────────────────────────────
    function DashboardSection() {
      const combinedItems = [
        ...mySubmissions.slice(0, 3).map(item => ({
          id: item.id,
          type: 'event',
          title: item.title,
          subtitle: item.category,
          date: item.submittedAt,
          status: item.status,
        })),
        ...myOffers.slice(0, 3).map(item => ({
          id: item.id,
          type: 'offer',
          title: item.title,
          subtitle: item.category,
          date: item.submittedAt,
          status: item.status,
        })),
        ...dashboardPosts.slice(0, 3).map(item => ({
          id: item.id,
          type: 'post',
          title: item.content,
          subtitle: item.author_business || item.author_name || 'Community Post',
          date: item.created_at,
          status: 'active',
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const nextWidgetStep = roadmapSteps.find(
        step =>
          !completedStepIds.includes(step.id) &&
          !dismissedStepIds.includes(step.id)
      );

      return (
        <div style={{ padding: '40px' }}>
          <div className="grid-4" style={{ gap: 2, marginBottom: 32 }}>
            {[
              { label: 'My Events', value: String(mySubmissions.length), change: 'Submitted events', icon: Calendar },
              { label: 'My Offers', value: String(myOffers.length), change: 'Submitted offers', icon: Tag },
              { label: 'Feed Posts', value: String(dashboardPosts.length), change: 'Recent community posts', icon: Rss },
              { label: 'Awards', value: String(myNominations.length), change: 'My nominations', icon: Trophy },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: '12px', color: '#9a9585', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                  <stat.icon size={16} style={{ color: '#e7b605' }} />
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '32px', lineHeight: 1, marginBottom: 6 }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#9a9585' }}>{stat.change}</div>
              </div>
            ))}
          </div>

          {/* Roadmap Widget: Your Next Step This Week */}
          {!roadmapLoading && nextWidgetStep && (
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderLeft: '4px solid #e7b605', padding: '24px 28px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sparkles size={16} style={{ color: '#e7b605' }} />
                <span style={{ fontSize: '12px', color: '#9a9585', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Next Step This Week
                </span>
              </div>
              {showStepCongratulations &&
                completingStepId === nextWidgetStep.id ? (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    minHeight: 160,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '24px',
                    background: 'rgba(39,174,96,0.06)',
                    border: '1px solid rgba(39,174,96,0.25)',
                    borderRadius: 6,
                  }}
                >
                  <CheckCircle
                    size={38}
                    style={{
                      color: '#27ae60',
                      marginBottom: 12,
                    }}
                  />

                  <div
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 900,
                      fontSize: '20px',
                      color: '#2a2820',
                      marginBottom: 6,
                    }}
                  >
                    Great work!
                  </div>

                  <div
                    style={{
                      fontFamily: 'Noto Serif, serif',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#5a5650',
                    }}
                  >
                    You completed this recommendation. Your next step is loading…
                  </div>
                </div>
              ) : (
                <StepCard
                  weekNumber={nextWidgetStep.weekNumber}
                  title={nextWidgetStep.title}
                  description={nextWidgetStep.description}
                  actionText={nextWidgetStep.actionText}
                  actionHref={nextWidgetStep.actionHref}
                  completed={completedStepIds.includes(nextWidgetStep.id)}
                  onToggleComplete={() =>
                    handleToggleWidgetStep(nextWidgetStep.id)
                  }
                  onDismiss={() =>
                    handleDismissWidgetStep(nextWidgetStep.id)
                  }
                  updating={completingStepId === nextWidgetStep.id}
                />
              )}

              {/* Roadmap Widget: Congratulate if 100% complete */}
              {!roadmapLoading && roadmapSteps.length > 0 && !nextWidgetStep && (
                <div style={{ background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', border: '1px solid #fde047', padding: '24px 28px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderRadius: '4px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Sparkles size={16} style={{ color: '#a16207' }} />
                      <span style={{ fontSize: '12px', color: '#854d0e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Roadmap Complete! 🏆
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#713f12', fontWeight: 600 }}>
                      You've completed all items on your current track! Ready to keep growing?
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('roadmap')}
                    style={{
                      background: '#000',
                      border: '1px solid #000',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif',
                      cursor: 'pointer'
                    }}
                  >
                    Switch Track
                  </button>
                </div>
              )}

              <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px', marginBottom: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: 4 }}>
                      Unified Home Dashboard
                    </h2>
                    <div style={{ fontSize: '13px', color: '#9a9585' }}>
                      Recent events, offers, and community posts in one place
                    </div>
                  </div>
                </div>

                {combinedItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', borderTop: '1px solid #f0efe9' }}>
                    <Rss size={40} style={{ color: '#e2e0d8', marginBottom: 16 }} />
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: '#9a9585', marginBottom: 8 }}>
                      No recent activity yet
                    </div>
                    <div style={{ fontSize: '14px', color: '#b8b4ae', fontFamily: 'Noto Serif, serif' }}>
                      Events, offers, and community posts will appear here once available.
                    </div>
                  </div>
                ) : (
                  <div>
                    {combinedItems.map(item => (
                      <div key={`${item.type}-${item.id}`} style={{ padding: '18px 0', borderTop: '1px solid #f0efe9', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                            <span className="tag" style={{ fontSize: '10px', padding: '2px 8px', textTransform: 'uppercase' }}>
                              {item.type}
                            </span>
                            <span style={{ fontSize: '12px', color: '#9a9585' }}>
                              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#2a2820', marginBottom: 4 }}>
                            {item.title?.length > 90 ? item.title.slice(0, 90) + '…' : item.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9a9585' }}>{item.subtitle}</div>
                        </div>

                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#9b7011', textTransform: 'uppercase', flexShrink: 0 }}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 2, background: '#fff', border: '1px solid #e2e0d8', padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>Quick Access</span>

                <button onClick={() => setActiveSection('feed')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', color: '#5a5650', cursor: 'pointer' }}>
                  <Rss size={13} /> Feed
                </button>

                <button onClick={() => setActiveSection('events')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', color: '#5a5650', cursor: 'pointer' }}>
                  <Calendar size={13} /> My Events ({mySubmissions.length})
                </button>

                <button onClick={() => setActiveSection('offers')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', color: '#5a5650', cursor: 'pointer' }}>
                  <Tag size={13} /> My Offers ({myOffers.length})
                </button>

                <button onClick={() => setActiveSection('awards')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', color: '#5a5650', cursor: 'pointer' }}>
                  <Trophy size={13} /> My Awards ({myNominations.length})
                </button>
              </div>
            </div>
          );
  }

          // ── Render ─────────────────────────────────────────────────────
          return (
          <div style={{ display: 'flex', minHeight: '100vh', background: '#f9f9f7' }}>

            {/* Mobile overlay */}
            {isMobile && sidebarOpen && (
              <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 55 }} />
            )}

            {/* Sidebar */}
            <aside style={{ width: 260, background: '#000', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 60, transform: (!isMobile || sidebarOpen) ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', boxShadow: isMobile && sidebarOpen ? '0 0 40px rgba(0,0,0,0.5)' : 'none' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <Logo size="sm" />
                </Link>
                {isMobile && (
                  <button onClick={() => setSidebarOpen(false)} aria-label="Close menu" style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    <CloseIcon size={20} />
                  </button>
                )}
              </div>

              {/* Member card */}
              <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt={member.name} style={{ width: 44, height: 44, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, background: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '18px', color: '#000', flexShrink: 0 }}>
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff' }}>{member.name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{member.business}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '3px 10px', background: '#1a1a1a', color: '#888', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>{member.industry}</span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>Profile completion</span>
                    <span style={{ fontSize: '11px', color: '#e7b605', fontWeight: 700 }}>{member.profileCompletion}%</span>
                  </div>
                  <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${member.profileCompletion}%`, background: 'linear-gradient(90deg, #9b7011, #e7b605)', borderRadius: 2, transition: 'width 1s ease' }} />
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
                {visibleNavItems.map(item => <NavItem key={item.label} item={item} />)}
              </nav>

              <div style={{ padding: '16px 0', borderTop: '1px solid #1a1a1a' }}>
                <Link href="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', textDecoration: 'none', color: '#666', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '14px' }}>
                  <Settings size={16} /> Settings
                </Link>
                <button
                  onClick={async () => {
                    localStorage.removeItem('fe_my_submissions');
                    await logout();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', color: '#666', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </aside>

            {/* Main */}
            <main style={{ marginLeft: isMobile ? 0 : 260, flex: 1, minWidth: 0 }}>
              {/* Top bar */}
              <div style={{ background: '#fff', borderBottom: '1px solid #e2e0d8', padding: isMobile ? '0 16px' : '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {isMobile && (
                    <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" style={{ background: 'none', border: '1px solid #e2e0d8', color: '#2a2820', cursor: 'pointer', padding: 8, display: 'flex', flexShrink: 0 }}>
                      <Menu size={20} />
                    </button>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: isMobile ? '17px' : '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(activeSection === 'dashboard' || activeSection === 'feed') ? `Good morning, ${member.name.split(' ')[0]} 👋` : sectionTitles[activeSection]}
                    </h1>
                    <div style={{ fontSize: '13px', color: '#9a9585' }}>Member since {member.joined}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <NotificationBell />
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt={member.name} style={{ width: 40, height: 40, objectFit: 'cover', border: '1px solid #e2e0d8', cursor: 'pointer' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e7b605', fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}>
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Section content */}
              {activeSection === 'dashboard' && <DashboardSection />}
              {activeSection === 'feed' && <FeedSection memberName={member.name} memberBusiness={member.business} basics={{ email: userProfile?.email, industry: member.industry, stage: member.stage, avatarUrl: userProfile?.avatarUrl }} />}
              {activeSection === 'roadmap' && userProfile && (
                <RoadmapSection userProfile={userProfile} onProfileUpdate={(updatedUser) => setUserProfile(updatedUser)} />
              )}
              {activeSection === 'events' && <EventsSection />}
              {activeSection === 'offers' && <OffersSection />}
              {activeSection === 'awards' && <AwardsSection />}
              {activeSection === 'directoryProfile' && <BusinessSection memberBusiness={member.business} />}
              {activeSection === 'business' && <BusinessSection memberBusiness={member.business} />}
              {activeSection === 'owners' && <OwnersSection memberName={member.name} memberBusiness={member.business} setConfirmModal={setConfirmModal} />}
              {activeSection === 'matches' && <MatchesSection setConfirmModal={setConfirmModal} />}
            </main>

            {/* Custom Confirmation Modal */}
            {confirmModal.isOpen && (
              <div
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                }}>
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-label={confirmModal.title}
                  onClick={e => e.stopPropagation()}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e0d8',
                    padding: '32px',
                    maxWidth: '440px',
                    width: '90%',
                    textAlign: 'center',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  }}>
                  <h3 style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 800,
                    fontSize: '20px',
                    color: '#2a2820',
                    marginBottom: '12px'
                  }}>
                    {confirmModal.title}
                  </h3>
                  <p style={{
                    fontFamily: 'Noto Serif, serif',
                    color: '#5a5650',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    marginBottom: '24px'
                  }}>
                    {confirmModal.message}
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                      style={{
                        padding: '10px 20px',
                        border: '1px solid #e2e0d8',
                        background: 'transparent',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        color: '#5a5650'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        confirmModal.onConfirm();
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                      }}
                      className="btn-primary"
                      style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        background: '#c0392b',
                        borderColor: '#c0392b',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
}
