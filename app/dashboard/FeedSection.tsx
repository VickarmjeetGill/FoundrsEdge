'use client';
import { useState, useEffect, useMemo } from 'react';
import { Rss, Users, Calendar, TrendingUp, Plus } from 'lucide-react';
import type { Post } from './feed-types';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import { computeProfileCompletion, type CompletionBasics } from './profile-completion';

type Props = {
  memberName: string;
  memberBusiness: string;
  basics?: CompletionBasics;
};

type FeedFilter = 'all' | 'following' | 'popular' | 'mine';

const FILTERS: { val: FeedFilter; label: string }[] = [
  { val: 'all', label: 'For you' },
  { val: 'following', label: 'Following' },
  { val: 'popular', label: 'Popular' },
  { val: 'mine', label: 'My posts' },
];

// Placeholder right-rail data (swap for real sources later)
const suggestedConnections = [
  { name: 'Mike T.', business: 'Northgate Ventures', mutual: 3 },
  { name: 'Rita P.', business: 'Bow River Co.', mutual: 2 },
  { name: 'Devon L.', business: 'Summit Legal', mutual: 1 },
];

const upcomingEvents = [
  { title: 'YYC Founders Mixer', date: 'Jun 12', type: 'Networking' },
  { title: 'Scale-Up Workshop', date: 'Jun 18', type: 'Workshop' },
];

const placeholderTags = ['funding', 'hiring', 'yyc', 'saas', 'partnerships'];

export default function FeedSection({ memberName, memberBusiness, basics }: Props) {
  const [posts, setPosts]   = useState<Post[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Recompute when member basics change (name/industry/stage/avatar load in async)
  const completion = useMemo(
    () => computeProfileCompletion({ name: memberName, ...basics }),
    [memberName, basics?.email, basics?.industry, basics?.stage, basics?.avatarUrl]
  );

  useEffect(() => {
    const raw = localStorage.getItem('fe_feed_posts');
    if (raw) { try { setPosts(JSON.parse(raw)); } catch {} }
  }, []);

  function persist(updated: Post[]) {
    try {
      localStorage.setItem('fe_feed_posts', JSON.stringify(updated));
    } catch {
      alert('Could not save — storage is full. Try a smaller image or remove an older post.');
    }
    setPosts(updated);
  }

  function addPost(post: Post) { persist([post, ...posts]); }
  function updatePost(updated: Post) { persist(posts.map(p => p.id === updated.id ? updated : p)); }

  const live = posts.filter(p => !p.removed);
  const myCount = live.filter(p => p.authorName === memberName).length;

  let visible = live;
  if (filter === 'mine') visible = live.filter(p => p.authorName === memberName);
  else if (filter === 'popular') visible = [...live].sort((a, b) => b.likes.length - a.likes.length);
  else if (filter === 'following') visible = []; // no follow graph yet — placeholder state

  // Trending: derive hashtags from post content, fall back to placeholders
  const tagCounts = new Map<string, number>();
  live.forEach(p => (p.content.match(/#(\w+)/g) || []).forEach(t => {
    const k = t.slice(1).toLowerCase();
    tagCounts.set(k, (tagCounts.get(k) || 0) + 1);
  }));
  const trending = tagCounts.size > 0
    ? [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t)
    : placeholderTags;

  const railLabel: React.CSSProperties = { fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9b7011', marginBottom: 12 };
  const railCard: React.CSSProperties = { background: '#fff', border: '1px solid #e2e0d8', borderRadius: 12, padding: '16px' };

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '32px 40px' }}>
     <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 24, alignItems: 'flex-start' }}>

      {/* ── Center column ─────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const active = filter === f.val;
            return (
              <button
                key={f.val}
                onClick={() => setFilter(f.val)}
                style={{
                  padding: '8px 18px', borderRadius: 20,
                  border: active ? '1px solid #000' : '1px solid #e2e0d8',
                  background: active ? '#000' : '#fff',
                  color: active ? '#fff' : '#5a5650',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {f.label}{f.val === 'mine' && myCount > 0 ? ` (${myCount})` : ''}
              </button>
            );
          })}
        </div>

        {/* Composer */}
        <div style={{ marginBottom: 16 }}>
          <PostComposer currentUserName={memberName} currentUserBusiness={memberBusiness} onPost={addPost} />
        </div>

        {/* Posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 40px', background: '#fff', border: '1px solid #e2e0d8', borderRadius: 12 }}>
              <Rss size={40} style={{ color: '#e2e0d8', marginBottom: 16 }} />
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: 8, color: '#2a2820' }}>
                {filter === 'mine' ? 'No posts from you yet'
                  : filter === 'following' ? 'You’re not following anyone yet'
                  : 'Feed is empty'}
              </div>
              <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif', fontSize: '15px' }}>
                {filter === 'mine' ? 'Write something above to share with the network.'
                  : filter === 'following' ? 'Follow members and their posts will show up here.'
                  : 'Be the first to post something for the Founders Edge community.'}
              </div>
            </div>
          ) : (
            visible.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserName={memberName}
                currentUserBusiness={memberBusiness}
                onUpdate={updatePost}
              />
            ))
          )}

          {visible.length > 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9a9585', fontFamily: 'Noto Serif, serif', fontSize: '13px' }}>
              {visible.length} post{visible.length !== 1 ? 's' : ''} · You’re all caught up
            </div>
          )}
        </div>
      </div>

      {/* ── Right rail ────────────────────────────────── */}
      <aside style={{ width: isMobile ? '100%' : 280, flexShrink: 0, position: isMobile ? 'static' : 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Profile card */}
        <div style={railCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', color: '#000', flexShrink: 0 }}>
              {memberName.charAt(0)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2a2820', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memberName}</div>
              <div style={{ fontSize: '12px', color: '#9a9585', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memberBusiness}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 6 }}>
            <span style={{ color: '#9a9585' }}>Profile completion</span>
            <span style={{ color: '#9b7011', fontWeight: 700 }}>{completion.percent}%</span>
          </div>
          <div style={{ height: 4, background: '#f0efe9', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${completion.percent}%`, background: 'linear-gradient(90deg, #9b7011, #e7b605)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
          {completion.remaining > 0 && (
            <div style={{ marginTop: 10, fontSize: '11px', color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>
              {completion.remaining} step{completion.remaining !== 1 ? 's' : ''} to a complete profile — next:{' '}
              <span style={{ color: '#9b7011', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
                {completion.items.find(i => !i.done)?.label}
              </span>
            </div>
          )}
        </div>

        {/* Connect with */}
        <div style={railCard}>
          <div style={railLabel}><Users size={11} style={{ verticalAlign: -1, marginRight: 5 }} />Connect with</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {suggestedConnections.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#000', color: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>{c.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#2a2820', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: '10px', color: '#9a9585' }}>{c.mutual} mutual</div>
                </div>
                <button aria-label={`Connect with ${c.name}`} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #e2e0d8', background: '#fff', color: '#9b7011', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div style={railCard}>
          <div style={railLabel}><Calendar size={11} style={{ verticalAlign: -1, marginRight: 5 }} />Upcoming events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingEvents.map(e => (
              <div key={e.title}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2a2820' }}>{e.title}</div>
                <div style={{ fontSize: '11px', color: '#9a9585' }}>{e.date} · {e.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div style={railCard}>
          <div style={railLabel}><TrendingUp size={11} style={{ verticalAlign: -1, marginRight: 5 }} />Trending</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {trending.map(t => (
              <span key={t} style={{ background: '#f0efe9', color: '#5a5650', fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: 20 }}>#{t}</span>
            ))}
          </div>
        </div>
      </aside>
     </div>
    </div>
  );
}
