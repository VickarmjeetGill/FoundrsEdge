'use client';
import React from 'react';
import { AlertTriangle, RefreshCw, Lock, SearchX } from 'lucide-react';

type ErrorKind = 'generic' | 'network' | 'notFound' | 'unauthorized';

type ErrorStateProps = {
  kind?: ErrorKind;
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
};

const presets: Record<ErrorKind, { icon: React.ReactNode; title: string; message: string }> = {
  generic: {
    icon: <AlertTriangle size={40} />,
    title: 'Something went wrong',
    message: 'We hit an unexpected error loading this. Please try again in a moment.',
  },
  network: {
    icon: <AlertTriangle size={40} />,
    title: "Can't reach the server",
    message: 'The service looks unavailable right now. Check your connection and try again.',
  },
  notFound: {
    icon: <SearchX size={40} />,
    title: 'Not found',
    message: "We couldn't find what you were looking for. It may have been moved or removed.",
  },
  unauthorized: {
    icon: <Lock size={40} />,
    title: 'Access denied',
    message: "You don't have permission to view this. Try signing in with the right account.",
  },
};

// Consistent error surface for API failures (down / 404 / 401-403 / generic).
export function ErrorState({ kind = 'generic', title, message, onRetry, compact }: ErrorStateProps) {
  const p = presets[kind];
  return (
    <div role="alert" style={{ textAlign: 'center', padding: compact ? '48px 24px' : '72px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: '#c0392b' }} aria-hidden="true">
        {p.icon}
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: compact ? '16px' : '18px', color: '#2a2820', marginBottom: 8 }}>
        {title ?? p.title}
      </div>
      <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif', fontSize: '14px', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
        {message ?? p.message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid #e2e0d8', background: '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#5a5650', cursor: 'pointer', borderRadius: 6, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#e7b605'; e.currentTarget.style.color = '#9b7011'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#5a5650'; }}
        >
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}
