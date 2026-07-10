'use client';

import { useState } from 'react';
import { CheckCircle2, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';

interface StepCardProps {
  weekNumber: number;
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  completed: boolean;
  onToggleComplete: () => void;
  updating?: boolean;
}

export default function StepCard({
  weekNumber,
  title,
  description,
  actionText,
  actionHref,
  completed,
  onToggleComplete,
  updating = false
}: StepCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: completed ? '1px solid rgba(231, 182, 5, 0.4)' : hovered ? '1px solid #9b7011' : '1px solid #e2e0d8',
        borderRadius: '8px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: hovered 
          ? '0 6px 16px rgba(155, 112, 17, 0.05)' 
          : '0 2px 4px rgba(0, 0, 0, 0.01)',
        opacity: updating ? 0.7 : 1,
        pointerEvents: updating ? 'none' : 'auto',
      }}
    >
      {/* Left side: Checkbox & Week & Main Content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
        {/* Custom Premium Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          disabled={updating}
          style={{
            background: completed ? '#e7b605' : 'transparent',
            border: completed ? '2px solid #e7b605' : '2px solid #b8b4ae',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            color: completed ? '#000' : 'transparent',
            transition: 'all 0.2s',
            marginTop: '2px',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!completed) {
              e.currentTarget.style.borderColor = '#e7b605';
              e.currentTarget.style.background = 'rgba(231, 182, 5, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!completed) {
              e.currentTarget.style.borderColor = '#b8b4ae';
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {updating ? (
            <Loader2 size={12} className="animate-spin" style={{ color: completed ? '#000' : '#e7b605' }} />
          ) : (
            <CheckCircle2 size={14} style={{ strokeWidth: 3 }} />
          )}
        </button>

        {/* Content details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Week Badge */}
            <span
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 800,
                fontSize: '11px',
                background: completed ? '#000' : '#f0efe9',
                color: completed ? '#e7b605' : '#5a5650',
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                flexShrink: 0
              }}
            >
              Week {weekNumber}
            </span>
            
            {/* Step Title */}
            <h4
              style={{
                margin: 0,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: '15px',
                color: completed ? '#9a9585' : '#2a2820',
                textDecoration: completed ? 'line-through' : 'none',
                transition: 'color 0.2s',
              }}
            >
              {title}
            </h4>
          </div>

          {/* Step Description */}
          <p
            style={{
              margin: 0,
              fontFamily: 'Noto Serif, serif',
              fontSize: '13px',
              color: completed ? '#b8b4ae' : '#5a5650',
              lineHeight: 1.5,
              textDecoration: completed ? 'line-through' : 'none',
              transition: 'color 0.2s',
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Right side: Action Button */}
      <div style={{ flexShrink: 0 }}>
        <a
          href={actionHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: completed ? 'transparent' : hovered ? '#000' : 'transparent',
            border: completed ? '1px solid #e2e0d8' : hovered ? '1px solid #000' : '1px solid #e2e0d8',
            borderRadius: '6px',
            textDecoration: 'none',
            color: completed ? '#9a9585' : hovered ? '#fff' : '#2a2820',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: completed ? 'none' : 'auto',
          }}
        >
          {actionText}
          {completed ? (
            <CheckCircle2 size={13} style={{ color: '#27ae60' }} />
          ) : (
            <ArrowRight size={13} style={{ transition: 'transform 0.2s', transform: hovered ? 'translateX(2px)' : 'none' }} />
          )}
        </a>
      </div>
    </div>
  );
}
