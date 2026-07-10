'use client';
import React from 'react';
import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;      // e.g. a <Link>/<button> CTA
  compact?: boolean;
};

// Consistent "nothing here yet" state for lists, tables, and grids.
export function EmptyState({ icon, title, message, action, compact }: EmptyStateProps) {
  return (
    <div
      role="status"
      style={{ textAlign: 'center', padding: compact ? '48px 24px' : '80px 40px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: '#d8d4c8' }} aria-hidden="true">
        {icon ?? <Inbox size={compact ? 32 : 40} />}
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: compact ? '16px' : '18px', color: '#2a2820', marginBottom: 8 }}>
        {title}
      </div>
      {message && (
        <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif', fontSize: '14px', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
          {message}
        </div>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
