export type NotificationType = 'like' | 'comment' | 'reply' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  targetUrl?: string;
}

const STORAGE_KEY = 'fe_notifications';

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading notifications from localStorage:', err);
    return [];
  }
}

export function addNotification(
  type: NotificationType,
  message: string,
  targetUrl?: string,
  userEmail?: string
): AppNotification[] {
  if (typeof window === 'undefined') return [];

  // Check Communication Preferences from Settings (account-specific or fallback)
  try {
    const key = userEmail ? `fe_comm_prefs_${userEmail.toLowerCase()}` : 'fe_comm_prefs';
    const prefsRaw = localStorage.getItem(key) || localStorage.getItem('fe_comm_prefs');
    if (prefsRaw) {
      const prefs = JSON.parse(prefsRaw);
      if (prefs.inPortalAlerts === false) {
        return getNotifications();
      }
    }
  } catch (err) {
    console.error('Error reading fe_comm_prefs in notifications:', err);
  }

  const current = getNotifications();

  // Deduplicate identical recent notifications
  const exists = current.some(
    n => n.message === message && Date.now() - new Date(n.createdAt).getTime() < 86400000 * 7
  );
  if (exists) return current;

  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    targetUrl,
  };

  const updated = [newNotif, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving notification to localStorage:', err);
  }
  return updated;
}

export function notifyExpiredOffer(title: string) {
  addNotification(
    'system',
    `Your offer "${title}" has expired and been removed from live listings. Share a new offer to stay visible to founders!`,
    '/offers/submit'
  );
}

export function notifyEndedEvent(title: string) {
  addNotification(
    'system',
    `Your event "${title}" has concluded. Share your next upcoming event with the community!`,
    '/events/submit'
  );
}

export function notifyNewEvent(title: string, host: string, eventId?: string | number) {
  addNotification(
    'system',
    `🎉 New Member Event: "${title}" by ${host || 'Community Member'}. View event details!`,
    eventId ? `/events/${eventId}` : '/events'
  );
}

export function notifyNewOffer(title: string, businessName: string, offerId?: string) {
  addNotification(
    'system',
    `🎁 New Exclusive Offer: "${title}" from ${businessName || 'Member'}. Claim your discount!`,
    offerId ? `/offers/${offerId}` : '/offers'
  );
}
