'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, Tag, X, ChevronDown, Image as ImageIcon, Link2 } from 'lucide-react';
import type { Post } from './feed-types';

type Props = {
  currentUserName: string;
  currentUserBusiness: string;
  onPost: (post: Post) => void;
};

type LinkedContent = {
  type: 'event' | 'offer';
  title: string;
  subtitle?: string;
  url?: string;
};

const MAX_CHARS = 500;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB guard for localStorage

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

export default function PostComposer({ currentUserName, currentUserBusiness, onPost }: Props) {
  const [content, setContent]         = useState('');
  const [linked, setLinked]           = useState<LinkedContent | null>(null);
  const [pickerType, setPickerType]   = useState<'event' | 'offer' | null>(null);
  const [events, setEvents]           = useState<any[]>([]);
  const [offers, setOffers]           = useState<any[]>([]);
  const [imageUrl, setImageUrl]       = useState('');
  const [showImageRow, setShowImageRow] = useState(false);
  const [imageError, setImageError]   = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [showLinkRow, setShowLinkRow] = useState(false);
  const pickerRef                     = useRef<HTMLDivElement>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);

 useEffect(() => {
  async function loadLinkedContent() {
    try {
    const eventsRes = await fetch('/api/events?adminView=true');
if (eventsRes.ok) {
  const rawEvents = await eventsRes.json();
  const eventsData = Array.isArray(rawEvents) ? rawEvents : (rawEvents.events || []);

  const approvedEvents = eventsData
    .filter((event: any) => event.status?.toLowerCase() === 'approved')
    .map((event: any) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      date: event.date,
      location: event.location,
    }));

  setEvents(approvedEvents);
}
    } catch (err) {
      console.error('Failed to load events for composer:', err);
    }

    try {
      const offersRes = await fetch('/api/offers');
      if (offersRes.ok) {
        const rawOffers = await offersRes.json();
        const offersData = Array.isArray(rawOffers) ? rawOffers : (rawOffers.offers || []);

        const approvedOffers = offersData
          .filter((offer: any) => offer.status?.toLowerCase() === 'approved')
          .map((offer: any) => ({
            id: offer.id,
            title: offer.title,
            businessName: offer.business_name,
            discount:
              offer.type === 'percentage'
                ? `${offer.discount_value}% off`
                : offer.type === 'fixed'
                  ? `$${offer.discount_value} off`
                  : offer.type === 'bogo'
                    ? 'Buy 1 Get 1 Free'
                    : offer.discount_value || offer.fe_discount || 'Special Offer',
            category: offer.category,
          }));

        setOffers(approvedOffers);
      }
    } catch (err) {
      console.error('Failed to load offers for composer:', err);
    }
  }

  loadLinkedContent();
}, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerType(null);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setImageError('');
    if (!file.type.startsWith('image/')) { setImageError('Please choose an image file.'); return; }
    if (file.size > MAX_IMAGE_BYTES) { setImageError('Image is too large (max 2MB). Try a smaller file or paste an image URL.'); return; }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() { setImageUrl(''); setImageError(''); if (fileRef.current) fileRef.current.value = ''; }

  const canPost = content.trim().length > 0 || imageUrl.length > 0;

  function submit() {
    if (!canPost) return;
    const post: Post = {
      id:              `post_${Date.now()}`,
      authorName:      currentUserName,
      authorBusiness:  currentUserBusiness,
      content:         content.trim(),
      imageUrl:        imageUrl || undefined,
      externalUrl:     externalUrl.trim() || undefined,
      externalTitle:   externalUrl.trim() ? domainOf(externalUrl.trim()) : undefined,
      linkedType:      linked?.type,
      linkedTitle:     linked?.title,
      linkedSubtitle:  linked?.subtitle,
      linkedUrl:       linked?.url,
      likes:           [],
      commentCount:    0,
      flagCount:       0,
      createdAt:       new Date().toISOString(),
    };
    onPost(post);
    setContent('');
    setLinked(null);
    setPickerType(null);
    clearImage();
    setShowImageRow(false);
    setExternalUrl('');
    setShowLinkRow(false);
  }

  const overLimit = content.length >= MAX_CHARS;

  const toolBtn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    border: `1px solid ${active ? '#e7b605' : '#e2e0d8'}`,
    background: active ? 'rgba(231,182,5,0.08)' : '#fff',
    fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px',
    color: active ? '#9b7011' : '#5a5650', cursor: 'pointer',
    transition: 'all 0.15s', letterSpacing: '0.03em', borderRadius: 8,
  });

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderRadius: 12, padding: '20px' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '16px', color: '#000', flexShrink: 0 }}>
          {currentUserName.charAt(0)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Text input */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Share an update, a win, or what you're looking for…"
            rows={3}
            style={{ width: '100%', border: '1px solid #e2e0d8', borderRadius: 10, padding: '14px 16px', fontFamily: 'Noto Serif, serif', fontSize: '15px', lineHeight: 1.7, resize: 'none', outline: 'none', boxSizing: 'border-box', background: '#f9f9f7', transition: 'border-color 0.15s' }}
            onFocus={e => { e.target.style.borderColor = '#e7b605'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e0d8'; }}
          />
          <div style={{ textAlign: 'right', marginTop: 4 }}>
            <span style={{ fontSize: '11px', color: overLimit ? '#c0392b' : '#b8b4ae', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
              {content.length}/{MAX_CHARS}
            </span>
          </div>

          {/* Image attach row */}
          {showImageRow && !imageUrl && (
            <div style={{ marginTop: 8, marginBottom: 12, border: '1px solid #e2e0d8', borderRadius: 10, padding: '14px', background: '#f9f9f7' }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} style={{ fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginBottom: 10, display: 'block' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>or paste URL:</span>
                <input
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://…/photo.jpg"
                  style={{ flex: 1, minWidth: 0, border: '1px solid #e2e0d8', borderRadius: 8, padding: '7px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', outline: 'none' }}
                />
              </div>
              {imageError && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: 8, fontFamily: 'DM Sans, sans-serif' }}>{imageError}</div>}
            </div>
          )}

          {/* Image preview */}
          {imageUrl && (
            <div style={{ marginTop: 8, marginBottom: 12, position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e0d8' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Post attachment preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} onError={() => setImageError('Could not load that image URL.')} />
              <button onClick={clearImage} aria-label="Remove image" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* External link row */}
          {showLinkRow && (
            <div style={{ marginTop: 8, marginBottom: 12, border: '1px solid #e2e0d8', borderRadius: 10, padding: '12px 14px', background: '#f9f9f7', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link2 size={15} style={{ color: '#9b7011', flexShrink: 0 }} />
              <input
                value={externalUrl}
                onChange={e => setExternalUrl(e.target.value)}
                placeholder="https://… (article, website, resource)"
                style={{ flex: 1, minWidth: 0, border: '1px solid #e2e0d8', borderRadius: 8, padding: '7px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', outline: 'none' }}
              />
              <button onClick={() => { setExternalUrl(''); setShowLinkRow(false); }} aria-label="Remove link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9585', flexShrink: 0 }}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* Linked event/offer preview */}
          {linked && (
            <div style={{ marginTop: 8, marginBottom: 12, border: '1px solid #e2e0d8', borderLeft: '4px solid #e7b605', borderRadius: 10, padding: '12px 16px', background: '#f9f9f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#9b7011', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {linked.type === 'event' ? 'Linked Event' : 'Linked Offer'}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2a2820' }}>{linked.title}</div>
                {linked.subtitle && <div style={{ fontSize: '12px', color: '#9a9585', marginTop: 2 }}>{linked.subtitle}</div>}
              </div>
              <button onClick={() => setLinked(null)} aria-label="Remove linked content" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9585', padding: '2px 4px', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', position: 'relative', marginTop: 4 }} ref={pickerRef}>
            <button onClick={() => { setShowImageRow(!showImageRow); setImageError(''); }} style={toolBtn(showImageRow || !!imageUrl)}>
              <ImageIcon size={13} /> Image
            </button>
            <button onClick={() => setShowLinkRow(!showLinkRow)} style={toolBtn(showLinkRow || !!externalUrl)}>
              <Link2 size={13} /> Link
            </button>
            {!linked && (
              <>
                <button onClick={() => setPickerType(pickerType === 'event' ? null : 'event')} style={toolBtn(pickerType === 'event')}>
                  <Calendar size={13} /> Event <ChevronDown size={12} />
                </button>
                <button onClick={() => setPickerType(pickerType === 'offer' ? null : 'offer')} style={toolBtn(pickerType === 'offer')}>
                  <Tag size={13} /> Offer <ChevronDown size={12} />
                </button>
              </>
            )}

            <button
              onClick={submit}
              disabled={!canPost}
              className="btn-primary"
              style={{ marginLeft: 'auto', padding: '10px 28px', fontSize: '13px', borderRadius: 8, opacity: canPost ? 1 : 0.45, cursor: canPost ? 'pointer' : 'not-allowed' }}
            >
              Post
            </button>

            {/* Picker dropdown */}
            {pickerType && (
              <div style={{ position: 'absolute', left: 0, top: '100%', marginTop: 4, background: '#fff', border: '1px solid #e2e0d8', borderRadius: 10, minWidth: 300, maxWidth: 400, maxHeight: 240, overflowY: 'auto', zIndex: 150, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0efe9', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '11px', color: '#9a9585', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {pickerType === 'event' ? 'My Event Submissions' : 'Approved Offers'}
                </div>
                {pickerType === 'event' ? (
                  events.length === 0 ? (
                    <div style={{ padding: '20px 16px', color: '#9a9585', fontFamily: 'Noto Serif, serif', fontSize: '13px', textAlign: 'center' }}>
                      No submitted events yet. <br />Submit an event first.
                    </div>
                  ) : (
                    events.map(ev => (
                      <button key={ev.id} onClick={() => { setLinked({
  type: 'event',
  title: ev.title,
  subtitle: `${ev.category}${ev.date ? ` · ${ev.date}` : ''}`,
  url: `/events/${ev.id}`,
}); setPickerType(null); }} style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid #f0efe9', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9f9f7'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#2a2820', marginBottom: 2 }}>{ev.title}</div>
                        <div style={{ fontSize: '11px', color: '#9a9585' }}>{ev.category}</div>
                      </button>
                    ))
                  )
                ) : (
                  offers.length === 0 ? (
                    <div style={{ padding: '20px 16px', color: '#9a9585', fontFamily: 'Noto Serif, serif', fontSize: '13px', textAlign: 'center' }}>
                      No approved offers available.
                    </div>
                  ) : (
                    offers.map(off => (
                      <button key={off.id} onClick={() => { setLinked({ type: 'offer', title: off.title, subtitle: `${off.discount} · ${off.businessName}`, url: `/offers/${off.id}`}); setPickerType(null); }} style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid #f0efe9', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9f9f7'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#2a2820', marginBottom: 2 }}>{off.title}</div>
                        <div style={{ fontSize: '11px', color: '#9a9585' }}>{off.discount} · {off.businessName}</div>
                      </button>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
