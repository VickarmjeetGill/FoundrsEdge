'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setupPassword } from '@/app/actions/auth';
import { ShieldCheck, Eye, EyeOff, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SetupPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    const reqs = [
      { ok: password.length >= 8, label: 'At least 8 characters' },
      { ok: /[A-Z]/.test(password), label: 'One uppercase letter (A-Z)' },
      { ok: /[a-z]/.test(password), label: 'One lowercase letter (a-z)' },
      { ok: /[0-9]/.test(password), label: 'One number (0-9)' },
      { ok: /[^A-Za-z0-9]/.test(password), label: 'One special character (!@#$%^&*)' },
    ];
    const isPasswordValid = reqs.every(r => r.ok);

    if (!isPasswordValid) {
      setError('Please satisfy all password security requirements below.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('email', email.trim());
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);

    const res = await setupPassword(formData);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        if (res.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }, 1200);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0c',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'DM Sans, sans-serif'
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: '40px 36px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52,
            height: 52,
            background: 'linear-gradient(135deg, #e7b605 0%, #b88e00 100%)',
            borderRadius: 14,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(231, 182, 5, 0.25)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '24px', letterSpacing: '-0.02em', marginBottom: 8, color: '#fff' }}>
            Set Up Your Password
          </h1>
          <p style={{ color: '#9a9585', fontSize: '14px', lineHeight: 1.5 }}>
            Welcome to Founders Edge! Complete your account setup to access your member dashboard.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            background: 'rgba(192, 57, 43, 0.15)',
            border: '1px solid rgba(192, 57, 43, 0.4)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: 20,
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        {/* Success Notification */}
        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={48} style={{ color: '#27ae60', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Password Saved!</h3>
            <p style={{ color: '#9a9585', fontSize: '14px' }}>Logging you into your dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>
                Approved Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    padding: '12px 42px 12px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { ok: password.length >= 8, label: 'At least 8 characters' },
                  { ok: /[A-Z]/.test(password), label: 'One uppercase letter (A-Z)' },
                  { ok: /[a-z]/.test(password), label: 'One lowercase letter (a-z)' },
                  { ok: /[0-9]/.test(password), label: 'One number (0-9)' },
                  { ok: /[^A-Za-z0-9]/.test(password), label: 'One special character (!@#$%^&*)' },
                ].map((req, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: req.ok ? '#4ade80' : '#888', transition: 'color 0.2s' }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: req.ok ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${req.ok ? '#4ade80' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 800
                    }}>
                      {req.ok ? '✓' : ''}
                    </div>
                    {req.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>
                Confirm Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #e7b605 0%, #b88e00 100%)',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginTop: 8
              }}
            >
              {loading ? 'Activating Account…' : <>Activate Account & Log In <ArrowRight size={16} /></>}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/login" style={{ fontSize: '13px', color: '#9a9585', textDecoration: 'none' }}>
            Already set up? <span style={{ color: '#e7b605', fontWeight: 600 }}>Log In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
