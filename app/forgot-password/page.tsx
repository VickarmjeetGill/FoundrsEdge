'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import Logo from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      const el = document.getElementById('forgot-email');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); (el as HTMLElement).focus?.(); }
      return;
    }

    setLoading(true);
    setError('');

    // Simulate sending password reset email
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex' }}>
      {/* Left Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', maxWidth: 520, margin: '0 auto' }}>
        <Link href="/" style={{ textDecoration: 'none', marginBottom: 60 }}>
          <Logo />
        </Link>

        {!submitted ? (
          <>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '38px', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 12 }}>
              Reset your password
            </h1>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#888', fontSize: '15px', marginBottom: 36, lineHeight: 1.6 }}>
              Enter the email address associated with your account and we&apos;ll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label htmlFor="forgot-email" style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@yourcompany.com"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: '#111',
                    border: `1px solid ${error ? '#ff4444' : '#2a2a2a'}`,
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '15px',
                    color: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    borderRadius: '4px'
                  }}
                />
                {error && (
                  <p style={{ color: '#ff4444', fontSize: '12px', marginTop: '8px', fontFamily: 'DM Sans, sans-serif' }}>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  marginTop: 8,
                  justifyContent: 'center',
                  fontSize: '15px',
                  padding: '16px',
                  border: 'none',
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#e7b605',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: '4px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Sending Request...' : 'Send Reset Link'} <ArrowRight size={18} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'left' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(39,174,96,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: '#27ae60' }}>
              <CheckCircle2 size={24} />
            </div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '32px', color: '#fff', marginBottom: 12 }}>
              Check your inbox
            </h2>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#aaa', fontSize: '15px', lineHeight: 1.7, marginBottom: 32 }}>
              If an account exists for <strong style={{ color: '#fff' }}>{email}</strong>, you will receive a password reset link shortly.
            </p>
          </div>
        )}

        <div style={{ marginTop: 40, borderTop: '1px solid #1a1a1a', paddingTop: 24 }}>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e7b605', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
