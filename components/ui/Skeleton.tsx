'use client';
import React from 'react';

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
};

// A single shimmering placeholder block. Composed into rows/cards below.
export function Skeleton({ width = '100%', height = 16, radius = 6, style }: SkeletonProps) {
  return (
    <div
      className="fe-skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

// Repeated text lines (last line shortened, like real copy).
export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

// A card-shaped skeleton for grids of cards (directory, resources, webinars…).
export function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderRadius: 12, padding: 20 }} aria-hidden="true">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <Skeleton width={70} height={20} radius={4} />
        <Skeleton width={50} height={20} radius={4} />
      </div>
      <Skeleton width="70%" height={20} style={{ marginBottom: 12 }} />
      <SkeletonText lines={3} />
      <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
        <Skeleton width={100} height={34} radius={4} />
        <Skeleton width={80} height={34} radius={4} />
      </div>
    </div>
  );
}

// A table-row skeleton for list/table views (users, activity, offers…).
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div
      style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f0efe9' }}
      aria-hidden="true"
    >
      <Skeleton width={38} height={38} radius={19} />
      <div style={{ flex: 1 }}>
        <Skeleton width="40%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={11} />
      </div>
      {Array.from({ length: Math.max(0, cols - 1) }).map((_, i) => (
        <Skeleton key={i} width={80} height={14} />
      ))}
    </div>
  );
}
