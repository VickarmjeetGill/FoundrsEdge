'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface StepCardProps {
  weekNumber: number;
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

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: completed
          ? '1px solid rgba(231, 182, 5, 0.4)'
          : hovered
            ? '1px solid #9b7011'
            : '1px solid #e2e0d8',
        borderRadius: '8px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: hovered
          ? '0 6px 16px rgba(155, 112, 17, 0.05)'
          : '0 2px 4px rgba(0, 0, 0, 0.01)',
        opacity: updating ? 0.7 : 1,
      }}
    >
      {/* Left side: Week and recommendation details */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          flex: '1 1 280px',
          minWidth: 0,
        }}
      >
        {/* Recommendation status icon */}
        <div
          aria-hidden="true"
          style={{
            background: completed ? '#e7b605' : 'rgba(231, 182, 5, 0.08)',
            border: completed
              ? '2px solid #e7b605'
              : '2px solid rgba(231, 182, 5, 0.45)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: completed ? '#000' : '#9b7011',
            marginTop: '2px',
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={14} style={{ strokeWidth: 3 }} />
        </div>

        {/* Content details */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {/* Week badge */}
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
                flexShrink: 0,
              }}
            >
              Week {weekNumber}
            </span>

            {/* Step title */}
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

          {/* Step description */}
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

      {/* Right side: Action and Done buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <a
          href={actionHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 16px',
            background: hovered ? '#000' : 'transparent',
            border: hovered
              ? '1px solid #000'
              : '1px solid #e2e0d8',
            borderRadius: '6px',
            textDecoration: 'none',
            color: hovered ? '#fff' : '#2a2820',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: updating ? 'none' : 'auto',
          }}
        >
          {actionText}

          <ArrowRight
            size={13}
            style={{
              transition: 'transform 0.2s',
              transform: hovered ? 'translateX(2px)' : 'none',
            }}
          />
        </a>

        <button
          type="button"
          onClick={onToggleComplete}
          disabled={updating || completed}
          style={{
            minWidth: '84px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            padding: '9px 16px',
            background: completed ? '#27ae60' : '#e7b605',
            border: completed
              ? '1px solid #27ae60'
              : '1px solid #e7b605',
            borderRadius: '6px',
            color: completed ? '#fff' : '#000',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            fontWeight: 800,
            cursor:
              updating || completed
                ? 'not-allowed'
                : 'pointer',
            opacity: updating ? 0.7 : 1,
            transition: 'all 0.2s',
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
              Done
            </>
          ) : (
            <>
              <CheckCircle2 size={13} />
              Done
            </>
          )}
        </button>
      </div>
    </div>
  );
}