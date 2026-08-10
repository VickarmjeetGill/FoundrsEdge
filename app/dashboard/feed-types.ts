// Shared types and utilities for the Feed feature

export type Post = {
  id: string;
  authorName: string;
  authorBusiness: string;
  content: string;
  imageUrl?: string;        // pasted URL or base64 data URL
  externalUrl?: string;     // generic outbound link
  externalTitle?: string;   // link title / domain
  linkedType?: 'event' | 'offer';
  linkedTitle?: string;
  linkedSubtitle?: string;
  linkedUrl?: string;
  likes: string[];
  commentCount: number;
  flagCount: number;
  removed?: boolean;
  createdAt: string;
};

export type Comment = {
  id: string;
  postId: string;
  parentId?: string;
  authorName: string;
  authorBusiness: string;
  content: string;
  likes: string[];
  createdAt: string;
  removed?: boolean;
};

export type FeedNotification = {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'system';
  message: string;
  postId?: string;
  targetUrl?: string;
  read: boolean;
  createdAt: string;
};

export type FlagReport = {
  id: string;
  contentType: 'post' | 'comment';
  contentId: string;
  contentPreview: string;
  authorName: string;
  reportedBy: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reportedAt: string;
};

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('fe_session_id');
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('fe_session_id', id);
  }
  return id;
}

export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function pushNotification(notif: Omit<FeedNotification, 'id' | 'createdAt'>) {
  if (typeof window === 'undefined') return;
  const full: FeedNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
  };
  const existing: FeedNotification[] = JSON.parse(localStorage.getItem('fe_notifications') || '[]');
  localStorage.setItem('fe_notifications', JSON.stringify([full, ...existing].slice(0, 50)));
}
