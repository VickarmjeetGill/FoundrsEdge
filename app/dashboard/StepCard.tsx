'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface StepCardProps {
  weekNumber: number;
  type?: string;
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  completed: boolean;
  onToggleComplete: () => void;
  onDismiss: () => void;
  updating?: boolean;
}

export default function StepCard({
  weekNumber,
  type = 'Recommended for you',
  title,
  description,
  actionText,
  actionHref,
  completed,
  onToggleComplete,
  onDismiss,
  updating = false,
}: StepCardProps) {
  const [hovered, setHovered] = useState(false);
  const [actionHovered, setActionHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#fff',
        border: hovered
          ? '1px solid #e7b605'
          : '1px solid #e2e0d8',
        borderRadius: '14px',
        padding: '32px',
        width: '100%',
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '28px',
        transition: 'all 0.25s ease',
        boxShadow: hovered
          ? '0 14px 34px rgba(42, 40, 32, 0.08)'
          : '0 6px 20px rgba(42, 40, 32, 0.04)',
        opacity: updating ? 0.7 : 1,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-70px',
          right: '-70px',
          width: '190px',
          height: '190px',
          borderRadius: '50%',
          background: 'rgba(231, 182, 5, 0.08)',
          pointerEvents: 'none',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-95px',
          left: '-95px',
          width: '210px',
          height: '210px',
          borderRadius: '50%',
          background: 'rgba(231, 182, 5, 0.04)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '760px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            marginBottom: '18px',
            background: 'rgba(231, 182, 5, 0.1)',
            border: '1px solid rgba(231, 182, 5, 0.25)',
            borderRadius: '999px',
          }}
        >
          <Sparkles
            size={14}
            style={{
              color: '#9b7011',
              flexShrink: 0,
            }}
          />

          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 800,
              fontSize: '11px',
              color: '#9b7011',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {type}
          </span>
        </div>

        <h3
          style={{
            margin: '0 0 12px 0',
            maxWidth: '680px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(24px, 3vw, 34px)',
            lineHeight: 1.15,
            color: completed ? '#9a9585' : '#2a2820',
            textDecoration: completed ? 'line-through' : 'none',
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: 0,
            maxWidth: '660px',
            fontFamily: 'Noto Serif, serif',
            fontSize: '15px',
            lineHeight: 1.7,
            color: completed ? '#b8b4ae' : '#5a5650',
            textDecoration: completed ? 'line-through' : 'none',
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        <a
          href={actionHref}
          onMouseEnter={() => setActionHovered(true)}
          onMouseLeave={() => setActionHovered(false)}
          style={{
            width: '100%',
            maxWidth: '360px',
            minHeight: '52px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 22px',
            background: actionHovered ? '#e7b605' : '#000',
            border: actionHovered
              ? '1px solid #e7b605'
              : '1px solid #000',
            borderRadius: '8px',
            color: actionHovered ? '#000' : '#fff',
            textDecoration: 'none',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 800,
            transition: 'all 0.2s ease',
            pointerEvents: updating ? 'none' : 'auto',
            boxShadow: actionHovered
              ? '0 8px 18px rgba(231, 182, 5, 0.22)'
              : 'none',
          }}
        >
          {actionText}

          <ArrowRight
            size={16}
            style={{
              transition: 'transform 0.2s ease',
              transform: actionHovered
                ? 'translateX(3px)'
                : 'translateX(0)',
            }}
          />
        </a>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          <button
            type="button"
            onClick={onDismiss}
            disabled={updating || completed}
            style={{
              padding: '7px 10px',
              background: 'transparent',
              border: 'none',
              color: '#7b776f',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              fontWeight: 700,
              cursor:
                updating || completed
                  ? 'not-allowed'
                  : 'pointer',
              opacity: updating || completed ? 0.5 : 1,
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Not for me
          </button>

          <span
            aria-hidden="true"
            style={{
              color: '#c8c4bc',
              fontSize: '12px',
            }}
          >
            ·
          </span>

          <button
            type="button"
            onClick={onToggleComplete}
            disabled={updating || completed}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 10px',
              background: 'transparent',
              border: 'none',
              color: completed ? '#27ae60' : '#7b776f',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              fontWeight: 700,
              cursor:
                updating || completed
                  ? 'not-allowed'
                  : 'pointer',
              opacity: updating ? 0.6 : 1,
            }}
          >
            {updating ? (
              <>
                <Loader2
                  size={13}
                  className="animate-spin"
                />
                Saving
              </>
            ) : completed ? (
              <>
                <CheckCircle2 size={13} />
                Completed
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                Mark as done
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}