'use client';
import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Flag, ExternalLink, X } from 'lucide-react';
import { type Post, getSessionId, timeAgo, pushNotification } from './feed-types';
import CommentThread from './CommentThread';

type Props = {
  post: Post;
  currentUserName: string;
  currentUserBusiness: string;
  onUpdate: (p: Post) => void;
};

const flagReasons = ['Spam', 'Inappropriate content', 'Misleading information', 'Self-promotion', 'Other'];

export default function PostCard({ post, currentUserName, currentUserBusiness, onUpdate }: Props) {
  const [showComments, setShowComments]     = useState(false);
  const [showMenu, setShowMenu]             = useState(false);
  const [showFlagModal, setShowFlagModal]   = useState(false);
  const [flagReason, setFlagReason]         = useState(flagReasons[0]);
  const [flagDetails, setFlagDetails]       = useState('');
  const [flagged, setFlagged]               = useState(false);
  const [liked, setLiked]                   = useState(() => post.likes.includes(getSessionId()));

  if (post.removed) return null;

  function toggleLike() {
    const sid = getSessionId();
    const already = post.likes.includes(sid);
    const updatedLikes = already ? post.likes.filter(l => l !== sid) : [...post.likes, sid];
    onUpdate({ ...post, likes: updatedLikes });
    setLiked(!already);
    if (!already) {
      pushNotification({
        type: 'like',
        message: `Someone liked your post: "${post.content.slice(0, 50)}${post.content.length > 50 ? '…' : ''}"`,
        postId: post.id,
        read: false,
      });
    }
  }

  function submitFlag() {
    if (flagged) return;
    const report = {
      id: `flag_${Date.now()}`,
      contentType: 'post' as const,
      contentId: post.id,
      contentPreview: post.content.slice(0, 100),
      authorName: post.authorName,
      reportedBy: currentUserName || 'Member',
      reason: flagReason,
      details: flagDetails,
      status: 'pending' as const,
      reportedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('fe_flag_reports') || '[]');
    localStorage.setItem('fe_flag_reports', JSON.stringify([report, ...existing]));
    onUpdate({ ...post, flagCount: (post.flagCount || 0) + 1 });
    setFlagged(true);
    setShowFlagModal(false);
    setShowMenu(false);
    setFlagDetails('');
  }

  const likeCount = post.likes.length;

  return (
    <>
      <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderRadius: 12, padding: '20px 24px', position: 'relative' }}>

        {/* Author row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e7b605', fontWeight: 800, fontSize: '16px', flexShrink: 0, fontFamily: 'DM Sans, sans-serif' }}>
              {post.authorName.charAt(0)}
            </div>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '15px', color: '#2a2820' }}>{post.authorName}</div>
              <div style={{ fontSize: '12px', color: '#9a9585' }}>{post.authorBusiness} · {timeAgo(post.createdAt)}</div>
            </div>
          </div>

          {/* Three-dot menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Post options"
              aria-haspopup="menu"
              aria-expanded={showMenu}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#9a9585', display: 'flex', alignItems: 'center', borderRadius: 2 }}
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <>
                <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #e2e0d8', minWidth: 170, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                  <button
                    onClick={() => { setShowMenu(false); setShowFlagModal(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#c0392b', textAlign: 'left' }}
                  >
                    <Flag size={14} /> Report Post
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#2a2820', fontSize: '15px', lineHeight: 1.75, marginBottom: (post.imageUrl || post.externalUrl || post.linkedType) ? 14 : 0, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>
        )}

        {/* Image */}
        {post.imageUrl && (
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e0d8', marginBottom: (post.externalUrl || post.linkedType) ? 14 : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt="Post attachment" loading="lazy" decoding="async" style={{ width: '100%', maxHeight: 460, objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* External link card */}
        {post.externalUrl && (
          <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #e2e0d8', borderRadius: 10, padding: '12px 14px', background: '#f9f9f7', textDecoration: 'none', marginBottom: post.linkedType ? 14 : 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f0efe9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#9b7011' }}>
              <ExternalLink size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#9b7011', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Link</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#2a2820', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.externalTitle || post.externalUrl}</div>
            </div>
          </a>
        )}

        {/* Linked content card */}
        {post.linkedType && (
          <div style={{ border: '1px solid #e2e0d8', borderLeft: '4px solid #e7b605', borderRadius: 10, padding: '14px 18px', background: '#f9f9f7' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#9b7011', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {post.linkedType === 'event' ? 'Event' : 'Offer'}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '15px', color: '#2a2820', marginBottom: 4 }}>{post.linkedTitle}</div>
            {post.linkedSubtitle && (
              <div style={{ fontSize: '13px', color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>{post.linkedSubtitle}</div>
            )}
            {post.linkedUrl && (
              <a href={post.linkedUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: '12px', color: '#9b7011', fontWeight: 700, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
                View <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}

        {/* Action bar */}
        <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0efe9', alignItems: 'center' }}>
          <button
            onClick={toggleLike}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: liked ? '#e7b605' : '#9a9585', padding: 0, transition: 'color 0.15s' }}
          >
            <Heart size={16} fill={liked ? '#e7b605' : 'none'} strokeWidth={liked ? 0 : 2} style={{ transition: 'all 0.15s' }} />
            {likeCount > 0 ? likeCount : 'Like'}
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: showComments ? '#2a2820' : '#9a9585', padding: 0, transition: 'color 0.15s' }}
          >
            <MessageCircle size={16} />
            {post.commentCount > 0 ? post.commentCount : 'Comment'}
          </button>

          {flagged && (
            <span style={{ fontSize: '12px', color: '#27ae60', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, marginLeft: 'auto' }}>
              Reported ✓
            </span>
          )}
        </div>

        {/* Comment thread (inline expansion) */}
        {showComments && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0efe9' }}>
            <CommentThread
              postId={post.id}
              currentUserName={currentUserName}
              currentUserBusiness={currentUserBusiness}
              onCommentAdded={() => onUpdate({ ...post, commentCount: post.commentCount + 1 })}
            />
          </div>
        )}
      </div>

      {/* Flag modal — fixed overlay */}
      {showFlagModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div style={{ background: '#fff', padding: '36px', maxWidth: 460, width: '100%', position: 'relative' }}>
            <button
              onClick={() => { setShowFlagModal(false); setFlagDetails(''); }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9a9585' }}
            >
              <X size={18} />
            </button>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#c0392b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Report Content</div>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: 8, color: '#2a2820' }}>Report this post</h3>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.6, marginBottom: 24 }}>
              Let us know why this post violates Founders Edge community guidelines. Our admin team reviews all reports.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                Reason *
              </label>
              <select className="select-field" value={flagReason} onChange={e => setFlagReason(e.target.value)}>
                {flagReasons.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                Additional context (optional)
              </label>
              <textarea
                className="input-field"
                value={flagDetails}
                onChange={e => setFlagDetails(e.target.value)}
                placeholder="Any additional details for our review team..."
                rows={3}
                style={{ resize: 'none', fontFamily: 'Noto Serif, serif' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={submitFlag}
                style={{ padding: '12px 24px', background: '#c0392b', border: 'none', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Flag size={14} /> Submit Report
              </button>
              <button
                onClick={() => { setShowFlagModal(false); setFlagDetails(''); }}
                style={{ padding: '12px 20px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#5a5650' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
