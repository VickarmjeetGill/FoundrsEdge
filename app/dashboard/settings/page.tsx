'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, Settings, Calendar, Building2, Users, BookOpen, Trophy, Star, ChevronRight, TrendingUp, MessageSquare, Zap, LogOut, User, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { logout } from '@/app/actions/auth';
import { getProfile, updateProfile } from '@/app/actions/profile';
import { computeProfileCompletion } from '../profile-completion';

const defaultMember = {
  name: '',
  business: '',
  stage: '',
  industry: '',
  joined: '',
  profileCompletion: 0,
};

const navItems = [
  { icon: TrendingUp, label: 'Dashboard', href: '/dashboard' },
  { icon: Calendar, label: 'Events', href: '/events' },
  { icon: Building2, label: 'Directory', href: '/directory' },
  { icon: Users, label: 'My Matches', href: '/dashboard?tab=matches' },
  { icon: BookOpen, label: 'Resources', href: '/resources' },
  { icon: Trophy, label: 'Awards', href: '/awards' },
  { icon: Star, label: 'Supper Club', href: '/supper-club' },
];

export default function SettingsPage() {
  const [member, setMember] = useState(defaultMember);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // UI States
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Member & User DB data
  useEffect(() => {
    const loadData = async () => {
      // 1. Fetch Prisma User Profile first
      const profileRes = await getProfile();
      let userEmail = '';
      let userName = 'Member';

      if (profileRes.success && profileRes.user) {
        setUserProfile(profileRes.user);
        setName(profileRes.user.name || '');
        setEmail(profileRes.user.email || '');
        userEmail = profileRes.user.email || '';
        userName = profileRes.user.name || 'Member';
      }

      // 2. Fetch Supabase Member Data matching user email (to keep Sidebar consistent)
      if (userEmail) {
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

        if (!error && data) {
          const businessData = Array.isArray(data.businesses)
            ? data.businesses[0]
            : data.businesses;

          const fullName = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || userName;
          const industry = data.industry ?? businessData?.business_type ?? 'Member';

          setMember({
            name: fullName,
            business: businessData?.business_name ?? 'Founders Edge Member',
            stage: data.stage ?? 'N/A',
            industry,
            joined: data.created_at
              ? new Date(data.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })
              : 'N/A',
            profileCompletion: computeProfileCompletion({
              name: fullName,
              email: userEmail,
              industry,
              stage: data.stage,
              avatarUrl: profileRes.user?.avatarUrl,
            }).percent,
          });
        } else {
          setMember(prev => ({
            ...prev,
            name: userName,
            business: 'Founders Edge Member',
            stage: 'N/A',
            industry: 'Member',
          }));
        }
      }
    };

    loadData();
  }, []);

  // Handle Form Submit
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('name', name);

    const res = await updateProfile(formData);
    setIsSaving(false);

    if (res.success && res.user) {
      setUserProfile(res.user);
      setMember(prev => ({
        ...prev,
        name: res.user.name || name,
        profileCompletion: computeProfileCompletion({
          name: res.user.name || name, email, industry: prev.industry, stage: prev.stage, avatarUrl: res.user.avatarUrl ?? userProfile?.avatarUrl,
        }).percent,
      }));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  // Trigger File Input Click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Upload File handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size exceeds 5MB limit.' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Only image files are allowed.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUserProfile((prev: any) => ({ ...prev, avatarUrl: data.url }));
        setMember(prev => ({
          ...prev,
          profileCompletion: computeProfileCompletion({
            name: prev.name, email, industry: prev.industry, stage: prev.stage, avatarUrl: data.url,
          }).percent,
        }));
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to upload image.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: err.message || 'Image upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Sidebar Avatar rendering helper
  const renderSidebarAvatar = () => {
    if (userProfile?.avatarUrl) {
      return (
        <img
          src={userProfile.avatarUrl}
          alt={member.name}
          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }}
        />
      );
    }
    return (
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '18px', color: '#000', flexShrink: 0 }}>
        {member.name.charAt(0)}
      </div>
    );
  };

  // Topbar Avatar rendering helper
  const renderTopbarAvatar = () => {
    if (userProfile?.avatarUrl) {
      return (
        <img
          src={userProfile.avatarUrl}
          alt={member.name}
          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', border: '1px solid #e2e0d8', cursor: 'pointer' }}
        />
      );
    }
    return (
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e7b605', fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}>
        {member.name.charAt(0)}
      </div>
    );
  };

  // Settings Panel Avatar rendering helper (the big one)
  const renderSettingsAvatar = () => {
    if (userProfile?.avatarUrl) {
      return (
        <img
          src={userProfile.avatarUrl}
          alt="Avatar Preview"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    return (
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#111', color: '#e7b605', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <User size={36} />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#666' }}>NO PHOTO</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9f9f7' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#000', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="sm" />
          </Link>
        </div>

        {/* Member Profile */}
        <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {renderSidebarAvatar()}
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff' }}>{member.name}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>{member.business}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: '56px' }}>
            <span style={{ padding: '3px 10px', background: '#9b7011', color: '#fff', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{member.stage}</span>
            <span style={{ padding: '3px 10px', background: '#1a1a1a', color: '#888', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>{member.industry}</span>
          </div>
          {/* Profile completion */}
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
          {navItems.map(item => (
            <Link key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 24px', textDecoration: 'none',
              background: 'transparent',
              borderLeft: '3px solid transparent',
              color: '#888',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '14px',
              letterSpacing: '0.03em', transition: 'all 0.2s',
            }}>
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '16px 0', borderTop: '1px solid #1a1a1a' }}>
          <Link href="/dashboard/settings" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 24px', textDecoration: 'none',
            background: 'rgba(231,182,5,0.1)',
            borderLeft: '3px solid #e7b605',
            color: '#e7b605',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '14px'
          }}>
            <Settings size={16} /> Settings
          </Link>
          <button
            onClick={async () => {
              localStorage.removeItem('fe_my_submissions');
              await logout();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 24px',
              textDecoration: 'none',
              color: '#666',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: 260, flex: 1, padding: '0' }}>
        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e0d8', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '22px' }}>Account Settings</h1>
            <div style={{ fontSize: '13px', color: '#9a9585' }}>Configure your profile preferences</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ width: 40, height: 40, background: '#f9f9f7', border: '1px solid #e2e0d8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={18} style={{ color: '#5a5650' }} />
              <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#e7b605', borderRadius: '50%' }} />
            </button>
            {renderTopbarAvatar()}
          </div>
        </div>

        {/* Settings Area */}
        <div style={{ padding: '40px', maxWidth: '800px' }}>
          {/* Notification Banner */}
          {message && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: message.type === 'success' ? '#eefdf4' : '#fdf2f2',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              borderLeft: `4px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
              color: message.type === 'success' ? '#166534' : '#991b1b',
              marginBottom: 24,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.3s'
            }}>
              {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '32px' }}>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: 6 }}>Profile Settings</h2>
            <p style={{ fontSize: '13px', color: '#9a9585', marginBottom: 32 }}>Update your personal representation across the Founders Edge platform.</p>

            {/* Quick Links for Directory Profiles */}
            <div style={{
              background: '#fafaf9',
              border: '1px solid #e2e0d8',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '15px', margin: 0, color: '#2a2820' }}>
                Complete Your Directory Profiles
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: 1.5 }}>
                Founders Edge features separate directories for members (Owners) and their companies (Business). Ensure both are filled out to get matches!
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <Link 
                  href="/dashboard?tab=owners"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#000',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'DM Sans, sans-serif',
                    borderRadius: '4px'
                  }}
                >
                  <Users size={12} /> Edit Owner Profile
                </Link>
                <Link 
                  href="/dashboard?tab=business"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#fff',
                    border: '1px solid #e2e0d8',
                    color: '#2a2820',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'DM Sans, sans-serif',
                    borderRadius: '4px'
                  }}
                >
                  <Building2 size={12} /> Edit Business Profile
                </Link>
              </div>
            </div>

            {/* Avatar Uploader UI */}
            <div style={{ display: 'flex', gap: 32, alignItems: 'center', borderBottom: '1px solid #f0efe9', paddingBottom: 32, marginBottom: 32 }}>
              <div
                className="avatar-container"
                style={{
                  position: 'relative',
                  width: 120,
                  height: 120,
                  border: `2px dashed ${dragActive ? '#e7b605' : '#e2e0d8'}`,
                  background: dragActive ? 'rgba(231, 182, 5, 0.05)' : '#fff',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  overflow: 'hidden',
                  borderRadius: '50%',
                  transition: 'all 0.2s',
                }}
                onClick={!isUploading ? handleAvatarClick : undefined}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {renderSettingsAvatar()}

                {/* Hover Mask */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.65)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  color: '#fff',
                  opacity: dragActive ? 1 : 0,
                  transition: 'opacity 0.2s',
                  pointerEvents: 'none'
                }}
                  className="hover-mask"
                >
                  <Upload size={20} style={{ color: '#e7b605' }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em' }}>CHANGE</span>
                </div>

                {/* Loading overlay */}
                {isUploading && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: '#fff',
                  }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: '#e7b605', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>UPLOADING</span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    style={{
                      background: '#000',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e7b605'}
                    onMouseLeave={e => e.currentTarget.style.background = '#000'}
                  >
                    Upload New Image
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#9a9585', lineHeight: 1.5 }}>
                  Drag & drop your photo or click to browse.<br />
                  Supports JPG, PNG, or GIF. Max size 5MB.
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Profile Info Form */}
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#f9f9f7',
                      border: '1px solid #e2e0d8',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      color: '#000',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#e7b605'}
                    onBlur={e => e.target.style.borderColor = '#e2e0d8'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                    Email Address <span style={{ fontSize: '9px', color: '#9a9585', textTransform: 'none' }}>(Locked)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#f4f3ed',
                      border: '1px solid #e2e0d8',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      color: '#666',
                      cursor: 'not-allowed',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                  Membership Role
                </label>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: '#f4f3ed',
                  border: '1px solid #e2e0d8',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#9b7011',
                  letterSpacing: '0.05em'
                }}>
                  <Star size={12} /> {userProfile?.role ?? 'MEMBER'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  style={{
                    background: '#e7b605',
                    color: '#000',
                    border: 'none',
                    padding: '14px 28px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: (isSaving || isUploading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: (isSaving || isUploading) ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!isSaving && !isUploading) {
                      e.currentTarget.style.background = '#000';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSaving && !isUploading) {
                      e.currentTarget.style.background = '#e7b605';
                      e.currentTarget.style.color = '#000';
                    }
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      Saving Changes...
                    </>
                  ) : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Global CSS for Tailwind-like keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Show hover-mask on hover */
        .avatar-container:hover .hover-mask {
          opacity: 1 !important;
        }
      `}} />
    </div>
  );
}
