'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Heart, MessageCircle, CornerDownRight, Zap } from 'lucide-react';
import type { FeedNotification } from './feed-types';

const typeConfig: Record<FeedNotification['type'], { icon: React.ReactNode; color: string }> = {
  like:    { icon: <Heart size={13} fill="#e7b605" stroke="none" />, color: '#9b7011' },
  comment: { icon: <MessageCircle size={13} style={{ color: '#5a5650' }} />, color: '#5a5650' },
  reply:   { icon: <CornerDownRight size={13} style={{ color: '#5a5650' }} />, color: '#5a5650' },
  system:  { icon: <Zap size={13} style={{ color: '#e7b605' }} />, color: '#9b7011' },
};

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<FeedNotification[]>([]);
  const [open, setOpen]     = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);

  function load() {
    const raw = localStorage.getItem('fe_notifications');
    if (raw) { try { setNotifs(JSON.parse(raw)); } catch {} }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleOpen() {
    if (!open) {
      // mark all read when opening
      const updated = notifs.map(n => ({ ...n, read: true }));
      localStorage.setItem('fe_notifications', JSON.stringify(updated));
      setNotifs(updated);
    }
    setOpen(!open);
  }

  function dismiss(id: string) {
    const updated = notifs.filter(n => n.id !== id);
    localStorage.setItem('fe_notifications', JSON.stringify(updated));
    setNotifs(updated);
  }

  function clearAll() {
    localStorage.setItem('fe_notifications', '[]');
    setNotifs([]);
  }

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 100 }}>
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        style={{ width: 40, height: 40, background: open ? '#f0efe9' : '#f9f9f7', border: '1px solid #e2e0d8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'background 0.15s' }}
        title="Notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={18} style={{ color: '#5a5650' }} />
        {unread > 0 && (
          <div style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, background: '#e7b605', borderRadius: '50%', border: '1.5px solid #fff' }} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 360, background: '#fff', border: '1px solid #e2e0d8', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 200 }}>

          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e0d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '15px', color: '#2a2820' }}>
              Notifications
              {unread > 0 && (
                <span style={{ marginLeft: 8, background: '#e7b605', color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 7px' }}>{unread}</span>
              )}
            </div>
            {notifs.length > 0 && (
              <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', color: '#9a9585', display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <Check size={11} /> Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <Bell size={28} style={{ color: '#e2e0d8', marginBottom: 12 }} />
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#9a9585', marginBottom: 4 }}>You're all caught up</div>
                <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '12px', color: '#b8b4ae' }}>Notifications appear here when members interact with your posts.</div>
              </div>
            ) : (
              notifs.slice(0, 30).map((n, i) => {
                const cfg = typeConfig[n.type] ?? typeConfig.system;
                return (
                  <div key={n.id} style={{ padding: '14px 20px', borderBottom: i < notifs.length - 1 ? '1px solid #f0efe9' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start', background: n.read ? '#fff' : 'rgba(231,182,5,0.04)', transition: 'background 0.2s' }}>
                    <div style={{ width: 28, height: 28, background: n.read ? '#f0efe9' : 'rgba(231,182,5,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '13px', color: '#2a2820', lineHeight: 1.5, marginBottom: 3 }}>{n.message}</div>
                      <div style={{ fontSize: '11px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{relativeTime(n.createdAt)}</div>
                    </div>
                    <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8c4bc', padding: '2px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
