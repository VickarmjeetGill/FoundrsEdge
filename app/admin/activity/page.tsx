'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity, LayoutDashboard, ClipboardList, Tag, Trophy, Flag, Users,
  LogOut, Calendar, Award, Milestone,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { getProfile } from '@/app/actions/profile';
import AdminLayout from '@/components/AdminLayout';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

type ActivityType = 'offer' | 'event' | 'nomination';
type ActivityItem = { id: string; type: ActivityType; message: string; timestamp: string };
type LoadState = 'loading' | 'error' | 'ready';

const typeMeta: Record<ActivityType, { label: string; icon: React.ReactNode; bg: string; color: string }> = {
  offer:      { label: 'Offer',      icon: <Tag size={13} />,      bg: 'rgba(231,182,5,0.12)', color: '#9b7011' },
  event:      { label: 'Event',      icon: <Calendar size={13} />, bg: 'rgba(39,174,96,0.10)', color: '#27ae60' },
  nomination: { label: 'Nomination', icon: <Award size={13} />,    bg: '#f0efe9',              color: '#5a5650' },
};

type TabFilter = 'All' | 'Offers' | 'Events' | 'Nominations';
const tabs: TabFilter[] = ['All', 'Offers', 'Events', 'Nominations'];

const navLinkBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '14px 20px', fontFamily: 'DM Sans, sans-serif',
  fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em',
  textTransform: 'uppercase', textDecoration: 'none',
  color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s',
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (Number.isNaN(diff)) return '';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminActivityPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems]   = useState<ActivityItem[]>([]);
  const [state, setState]   = useState<LoadState>('loading');
  const [errKind, setErrKind] = useState<'network' | 'unauthorized' | 'generic'>('generic');
  const [tab, setTab]       = useState<TabFilter>('All');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/api/admin/activity');
      if (res.status === 401 || res.status === 403) { setErrKind('unauthorized'); setState('error'); return; }
      if (!res.ok) { setErrKind('generic'); setState('error'); return; }
      const data = await res.json();
      setItems(Array.isArray(data.activities) ? data.activities : []);
      setState('ready');
    } catch {
      setErrKind('network');
      setState('error');
    }
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      const res = await getProfile();
      if (!res.success || !res.user) { router.push('/login'); return; }
      if ((res.user as any).role !== 'ADMIN') { router.push('/dashboard'); return; }
      setAuthChecked(true);
      load();
    };
    checkAccess();
  }, [router, load]);

  const filtered = items.filter(i =>
    tab === 'All' ||
    (tab === 'Offers' && i.type === 'offer') ||
    (tab === 'Events' && i.type === 'event') ||
    (tab === 'Nominations' && i.type === 'nomination')
  );

  const stats = {
    total:       items.length,
    offers:      items.filter(i => i.type === 'offer').length,
    events:      items.filter(i => i.type === 'event').length,
    nominations: items.filter(i => i.type === 'nomination').length,
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e7b605', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>Checking access...</div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab="activity">

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px', width: '100%', boxSizing: 'border-box' }}>

        {/* Stats */}
        <div className="grid-4" style={{ gap: 2, marginBottom: 32 }}>
          {[
            { label: 'Total Activity', value: state === 'ready' ? stats.total : '—',       color: '#2a2820' },
            { label: 'Offers',         value: state === 'ready' ? stats.offers : '—',      color: '#9b7011' },
            { label: 'Events',         value: state === 'ready' ? stats.events : '—',      color: '#27ae60' },
            { label: 'Nominations',    value: state === 'ready' ? stats.nominations : '—', color: '#5a5650' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '24px 28px' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #e2e0d8' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e0d8', padding: '0 24px' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} disabled={state !== 'ready'} style={{ padding: '14px 18px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #e7b605' : '2px solid transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: tab === t ? '#2a2820' : '#9a9585', cursor: state === 'ready' ? 'pointer' : 'default', marginBottom: -1, transition: 'all 0.15s', opacity: state === 'ready' ? 1 : 0.6 }}>
                {t}
              </button>
            ))}
          </div>

          {/* States */}
          {state === 'loading' && (
            <div aria-busy="true" aria-label="Loading activity">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={2} />)}
            </div>
          )}

          {state === 'error' && (
            <ErrorState kind={errKind} onRetry={load} />
          )}

          {state === 'ready' && filtered.length === 0 && (
            <EmptyState
              icon={<Activity size={40} />}
              title="No activity yet"
              message="New offers, events, and nominations from members will appear here as they come in."
            />
          )}

          {state === 'ready' && filtered.length > 0 && (
            <div>
              {filtered.map(item => {
                const m = typeMeta[item.type] ?? typeMeta.offer;
                return (
                  <div key={`${item.type}-${item.id}`} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f0efe9' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
                      {m.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '14px', color: '#2a2820', lineHeight: 1.5 }}>{item.message}</div>
                    </div>
                    <span style={{ padding: '3px 10px', background: m.bg, color: m.color, fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                      {m.label}
                    </span>
                    <div style={{ fontSize: '12px', color: '#9a9585', width: 90, textAlign: 'right', flexShrink: 0 }}>
                      {timeAgo(item.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
