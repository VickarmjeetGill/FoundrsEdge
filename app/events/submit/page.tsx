'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, AlertCircle, X, ShieldCheck } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { getProfile } from '@/app/actions/profile';
import { supabase } from '@/lib/supabase';

type FormData = {
  title: string;
  category: string;
  price: string;
  date: string;
  time: string;
  duration: string;
  capacity: string;
  location: string;
  isOnline: boolean;
  description: string;
  hostName: string;
  contactEmail: string;
  tags: string;
  agreeGuidelines: boolean;
  guestName: string;
  guestEmail: string;
  guestBusiness: string;
  memberPromoCode: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialForm: FormData = {
  title: '',
  category: 'Networking',
  price: '',
  date: '',
  time: '',
  duration: '',
  capacity: '',
  location: '',
  isOnline: false,
  description: '',
  hostName: '',
  contactEmail: '',
  tags: '',
  agreeGuidelines: false,
  guestName: '',
  guestEmail: '',
  guestBusiness: '',
  memberPromoCode: '',
};

const categories = ['Networking', 'Workshop', 'Webinar', 'Supper Club', 'Other'];

function validateForm(form: FormData, isLoggedIn: boolean): FormErrors {
  const errors: FormErrors = {};

  // 1. Core fields required for everyone
  if (!form.title.trim()) errors.title = 'Please enter a valid title.';
  if (!form.date) errors.date = 'Please enter a valid date.';
  if (!form.time) errors.time = 'Please enter a valid time.';

  if (!form.duration.trim() || isNaN(Number(form.duration)) || Number(form.duration) <= 0) {
    errors.duration = 'Please enter a valid duration.';
  }

  if (!form.capacity.trim() || isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) {
    errors.capacity = 'Please enter a valid capacity.';
  }

  if (!form.isOnline && !form.location.trim()) {
    errors.location = 'Please enter a valid location.';
  }

  if (!form.description.trim() || form.description.trim().length < 30) {
    errors.description = 'Please enter a valid description (minimum 30 characters).';
  }

  if (form.price.trim()) {
    const trimmedPrice = form.price.trim();
    const isKnownText = ['free', 'members only', 'members-only', 'invite only', 'invite-only', 'tbd'].includes(trimmedPrice.toLowerCase());
    const isNumericPrice = /^\$?\d+(?:\.\d{2})?$/.test(trimmedPrice);
    if (!isKnownText && !isNumericPrice) {
      errors.price = 'Please enter "Free", "Members Only", or a valid dollar amount (e.g. "$45" or "45").';
    }
  }

  // Paid events require a member discount code
  const isPaidEvent = form.price.trim() && form.price.trim().toLowerCase() !== 'free';
  if (isPaidEvent && !form.memberPromoCode.trim()) {
    errors.memberPromoCode = 'Paid events require a 15%+ member discount code or member rate.';
  }

  // 2. Fork in the road: Validate identity fields based on auth state
  if (!isLoggedIn) {
    // Requirements for public guest submissions
    if (!form.guestName.trim()) {
      errors.guestName = 'Your name is required for public submissions.';
    }
    if (!form.guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail)) {
      errors.guestEmail = 'A valid email is required to receive status updates.';
    }
  } else {
    // Requirements for logged-in member submissions
    if (!form.hostName.trim()) {
      errors.hostName = 'Please enter a valid host name.';
    }
    if (!form.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      errors.contactEmail = 'Please enter a valid contact email.';
    }
  }

  // 3. Final global check
  if (!form.agreeGuidelines) {
    errors.agreeGuidelines = 'You must agree to the event guidelines.';
  }

  return errors;
}

function EventSubmitContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('edit');

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showEventGuidelinesModal, setShowEventGuidelinesModal] = useState(false);

  // Verify that the user is logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getProfile();

        if (res.success && res.user) {
          const loggedInUser = res.user as any;
          setUserEmail(loggedInUser.email || '');
          setUserName(loggedInUser.name || '');

          let bizName = '';
          if (loggedInUser.email) {
            const { data } = await supabase
              .from('members')
              .select('id, first_name, last_name, businesses(business_name)')
              .eq('email', loggedInUser.email)
              .maybeSingle();

            bizName = (data as any)?.businesses?.[0]?.business_name || '';
          }

          if (!editId) {
            setForm(prev => ({
              ...prev,
              hostName: prev.hostName || bizName || loggedInUser.name || '',
              contactEmail: prev.contactEmail || loggedInUser.email || '',
            }));
          }
        }
      } catch (err) {
        console.error("Optional auth check failed:", err);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, [editId]);

  // Pre-fill form when editing an existing submission
  useEffect(() => {
    if (!authChecked || !editId) return;
    async function fetchEventToEdit() {
      try {
        const res = await fetch(`/api/events/${editId}`);
        if (res.ok) {
          const dbEvent = await res.json();
          setForm({
            title: dbEvent.title || '',
            category: dbEvent.category || 'Networking',
            price: dbEvent.price || '',
            date: dbEvent.date || '',
            time: dbEvent.time || '',
            duration: dbEvent.duration ? String(parseFloat(dbEvent.duration) || 2) : '2',
            capacity: dbEvent.capacity ? String(dbEvent.capacity) : '50',
            location: dbEvent.location || '',
            isOnline: dbEvent.location ? (
              dbEvent.location.toLowerCase().includes('online') ||
              dbEvent.location.toLowerCase().includes('zoom') ||
              dbEvent.location.toLowerCase().includes('meeting link') ||
              dbEvent.location.toLowerCase().includes('provided upon registration')
            ) : false,
            description: dbEvent.description || '',
            hostName: dbEvent.host || '',
            contactEmail: userEmail || 'member@foundersedge.com',
            tags: Array.isArray(dbEvent.tags) ? dbEvent.tags.join(', ') : dbEvent.category || '',
            agreeGuidelines: true,
            guestName: dbEvent.guestName || '',
            guestEmail: dbEvent.guestEmail || '',
            guestBusiness: dbEvent.guestBusiness || '',
            memberPromoCode: dbEvent.member_promo_code || dbEvent.memberPromoCode || '',
          });
          setIsEditing(true);
        } else {
          // Fallback to localStorage just in case
          const raw = localStorage.getItem('fe_my_submissions');
          if (raw) {
            const submissions = JSON.parse(raw);
            const match = submissions.find((s: any) => s.id === editId);
            if (match) {
              const { id, submittedAt, updatedAt, status, ...formData } = match;
              setForm(formData as FormData);
              setIsEditing(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch event for edit:", err);
      }
    }
    fetchEventToEdit();
  }, [editId, authChecked, userEmail]);

  function handleChange(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function handleOnlineToggle() {
    setForm(prev => ({
      ...prev,
      isOnline: !prev.isOnline,
      location: !prev.isOnline ? 'Meeting link provided upon registration' : '',
    }));
  }

  const [errorMsg, setErrorMsg] = useState('');

  function saveToLocalStorage(formData: FormData) {
    const raw = localStorage.getItem('fe_my_submissions') || '[]';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submissions: any[] = JSON.parse(raw);
    const now = new Date().toISOString();

    if (isEditing && editId) {
      const updated = submissions.map(s =>
        s.id === editId
          ? { ...formData, id: editId, submittedAt: s.submittedAt, updatedAt: now, status: 'pending' }
          : s
      );
      localStorage.setItem('fe_my_submissions', JSON.stringify(updated));
    } else {
      const newSub = { ...formData, id: `sub_${Date.now()}`, submittedAt: now, status: 'pending' };
      localStorage.setItem('fe_my_submissions', JSON.stringify([...submissions, newSub]));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    // Guest Device-Level Submission Limit check
    if (!userEmail && localStorage.getItem('fe_has_submitted_free_event') === 'true') {
      setErrorMsg("You have already submitted a free event listing from this browser. Additional listings require a Founders Edge membership.");
      return;
    }

    const errs = validateForm(form, !!userEmail);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstErrKey = Object.keys(errs)[0];
      const el = document.getElementById(`field-${firstErrKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Format the price string dynamically (auto-format numeric amounts like "45" to "$45")
    let finalPrice = form.price.trim();
    if (finalPrice) {
      if (finalPrice.toLowerCase() === 'free') {
        finalPrice = 'Free';
      } else if (/^\d+(?:\.\d{2})?$/.test(finalPrice)) {
        finalPrice = `$${finalPrice}`;
      }
    } else {
      finalPrice = 'Free';
    }

    const formattedDuration = form.duration ? `${form.duration} Hours` : '2 Hours';
    const updatedForm = { ...form, price: finalPrice, duration: formattedDuration };

    // Editing an existing submission — perform backend PUT request to update the database record
    if (isEditing && editId) {
      try {
        const res = await fetch(`/api/events/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            date: form.date,
            time: form.time,
            location: form.location,
            category: form.category,
            price: finalPrice,
            host: form.hostName,
            tags: form.tags,
            capacity: form.capacity,
            duration: formattedDuration,
            memberPromoCode: form.memberPromoCode,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Failed to update event.');
          return;
        }

        saveToLocalStorage(updatedForm);
        setSubmitted(true);
        return;
      } catch (err: any) {
        console.error(err);
        setErrorMsg('An error occurred during update.');
        return;
      }
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          date: form.date,
          time: form.time,
          location: form.location,
          category: form.category,
          price: finalPrice,
          host: form.hostName || form.guestName || "Public Submission",
          tags: form.tags,
          capacity: form.capacity,
          duration: formattedDuration,
          memberPromoCode: form.memberPromoCode,
          guestName: userEmail ? undefined : form.guestName,
          guestEmail: userEmail ? undefined : form.guestEmail,
          guestBusiness: userEmail ? undefined : form.guestBusiness,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to submit event.'));
        return;
      }

      saveToLocalStorage(updatedForm);
      if (!userEmail) {
        localStorage.setItem('fe_has_submitted_free_event', 'true');
      }
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('An error occurred during submission.');
    }
  }

  const fieldStyle = (field: keyof FormData) => ({
    margin: 0,
    borderColor: errors[field] ? '#e7b605' : undefined,
  });

  if (!authChecked) {
    return (
      <PageLayout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#e7b605' }}>
            Checking access...
          </div>
        </div>
      </PageLayout>
    );
  }

  if (submitted) {
    return (
      <PageLayout>
        <div className="page-hero">
          <div className="container">
            <div className="section-label">{isEditing ? 'Edit Submission' : 'Submit an Event'}</div>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 5vw, 64px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 16 }}>
              {isEditing ? 'SUBMISSION\n' : 'SUBMIT AN\n'}<span style={{ color: '#e7b605' }}>{isEditing ? 'UPDATED' : 'EVENT'}</span>
            </h1>
          </div>
        </div>
        <div style={{ background: '#f9f9f7', padding: '100px 0' }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderTop: '4px solid #e7b605', padding: '60px 48px', textAlign: 'center' }}>
              <CheckCircle size={56} style={{ color: '#e7b605', marginBottom: 24 }} />
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '28px', color: '#2a2820', marginBottom: 16 }}>
                {isEditing ? 'Your submission has been updated!' : 'Your event has been submitted!'}
              </h2>
              <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', lineHeight: 1.8, fontSize: '16px', marginBottom: 32 }}>
                {isEditing
                  ? <>Your updates to <strong>{form.title}</strong> have been saved and sent back for review. Our team will assess the changes within 48 hours.</>
                  : <>Thank you for submitting <strong>{form.title}</strong>. Our team reviews all submitted events within 48 hours. If approved, your event will be promoted to all Founders Edge members and featured on the events page.</>
                }
              </p>
              <p style={{ fontFamily: 'Noto Serif, serif', color: '#9a9585', fontSize: '14px', marginBottom: 40 }}>
                You'll receive a confirmation email at <strong>{userEmail ? form.contactEmail : form.guestEmail}</strong> once a decision has been made.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {userEmail ? (
                  <>
                    <Link href="/dashboard" className="btn-primary" style={{ justifyContent: 'center' }}>
                      Back to Dashboard
                    </Link>
                    <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', border: '1px solid #e2e0d8', color: '#5a5650', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                      <ArrowLeft size={16} /> All Events
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/events" className="btn-primary" style={{ justifyContent: 'center' }}>
                      View All Events
                    </Link>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', border: '1px solid #e2e0d8', color: '#5a5650', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                      <ArrowLeft size={16} /> Go to Homepage
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <Link
            href={isEditing ? '/dashboard' : '/events'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            <ArrowLeft size={14} /> {isEditing ? 'Back to Dashboard' : 'All Events'}
          </Link>
          <div className="section-label">{isEditing ? 'Edit Submission' : 'Submit an Event'}</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 5vw, 64px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 16 }}>
            {isEditing ? <>EDIT YOUR<br /><span style={{ color: '#e7b605' }}>SUBMISSION</span></> : <>SUBMIT AN<br /><span style={{ color: '#e7b605' }}>EVENT</span></>}
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#999', fontSize: '17px', maxWidth: 480, lineHeight: 1.7 }}>
            {isEditing
              ? 'Update your submission below. Re-submitting will send it back to our team for review.'
              : "Share your event with Calgary's entrepreneurial community. We review every submission personally."
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ background: '#f9f9f7', padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          {/* Notice */}
          <div style={{ borderLeft: '4px solid #e7b605', background: 'rgba(231,182,5,0.06)', padding: '20px 24px', marginBottom: 40 }}>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '15px', lineHeight: 1.7 }}>
              <strong style={{ fontFamily: 'DM Sans, sans-serif', color: '#2a2820' }}>Listing Policy:</strong> Your first event listing is 100% free! Additional listings require a Founders Edge membership. All submissions are reviewed by our team within 2–3 business days.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Event Title */}
            <div id="field-title" style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5a5650', marginBottom: 8 }}>
                Event Title <span style={{ color: '#e7b605' }}>*</span>
              </label>
              <input
                className="input-field"
                placeholder="e.g. YYC Founders Networking Mixer"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                style={fieldStyle('title')}
              />
              {errors.title && <ErrorMsg msg={errors.title} />}
            </div>

            {/* Category + Price */}
            <div className="grid-form" style={{ marginBottom: 16 }}>
              <div id="field-category">
                <label style={labelStyle}>Category <span style={{ color: '#e7b605' }}>*</span></label>
                <select className="select-field" value={form.category} onChange={e => handleChange('category', e.target.value)} style={{ margin: 0 }}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div id="field-price">
                <label style={labelStyle}>Price / Ticket Cost</label>
                <input
                  className="input-field"
                  placeholder="e.g. Free, $49, Members Only"
                  value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  style={{ margin: 0 }}
                />
                {/* Member Ticket Discount Policy Text Bubble */}
                <div style={{
                  marginTop: 10,
                  padding: '12px 14px',
                  background: 'rgba(231,182,5,0.08)',
                  border: '1px solid rgba(231,182,5,0.3)',
                  borderLeft: '3px solid #e7b605',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  <div style={{ fontSize: '16px', lineHeight: 1 }}>💬</div>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '11px', color: '#2a2820', marginBottom: 2, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                      Community Ticket Discount Policy
                    </div>
                    <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '12px', color: '#5a5650', lineHeight: 1.5 }}>
                      Companies can list events in the calendar without a public offer, but <strong>MUST offer a minimum 15% discount or more</strong> for paid tickets shared with our Foundrs Edge internal community.
                    </div>
                  </div>
                </div>

                <div id="field-memberPromoCode" style={{ marginTop: 12 }}>
                  <label style={labelStyle}>
                    Member Promo Code / Discount Code{' '}
                    {form.price.trim() && form.price.trim().toLowerCase() !== 'free' ? (
                      <span style={{ color: '#e7b605' }}>* (Required for Paid Events)</span>
                    ) : (
                      <span style={{ color: '#9a9585', fontWeight: 400 }}>(Optional for Free Events)</span>
                    )}
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. FOUNDRS15 for 15% off"
                    value={form.memberPromoCode}
                    onChange={e => handleChange('memberPromoCode', e.target.value)}
                    style={fieldStyle('memberPromoCode')}
                  />
                  {errors.memberPromoCode && <ErrorMsg msg={errors.memberPromoCode} />}
                </div>
              </div>
            </div>

            {/* Date + Time */}
            <div className="grid-form" style={{ marginBottom: 20 }}>
              <div id="field-date">
                <label style={labelStyle}>Date <span style={{ color: '#e7b605' }}>*</span></label>
                <input
                  className="input-field"
                  type="date"
                  value={form.date}
                  onChange={e => handleChange('date', e.target.value)}
                  style={fieldStyle('date')}
                />
                {errors.date && <ErrorMsg msg={errors.date} />}
              </div>
              <div id="field-time">
                <label style={labelStyle}>Time <span style={{ color: '#e7b605' }}>*</span></label>
                <input
                  className="input-field"
                  type="time"
                  value={form.time}
                  onChange={e => handleChange('time', e.target.value)}
                  style={fieldStyle('time')}
                />
                {errors.time && <ErrorMsg msg={errors.time} />}
              </div>
            </div>

            {/* Duration + Capacity */}
            <div className="grid-form" style={{ marginBottom: 20 }}>
              <div id="field-duration">
                <label style={labelStyle}>Duration (Hours) <span style={{ color: '#e7b605' }}>*</span></label>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  step="0.5"
                  placeholder="e.g. 2"
                  value={form.duration}
                  onChange={e => handleChange('duration', e.target.value)}
                  style={fieldStyle('duration')}
                />
                {errors.duration && <ErrorMsg msg={errors.duration} />}
              </div>
              <div id="field-capacity">
                <label style={labelStyle}>Capacity <span style={{ color: '#e7b605' }}>*</span></label>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={form.capacity}
                  onChange={e => handleChange('capacity', e.target.value)}
                  style={fieldStyle('capacity')}
                />
                {errors.capacity && <ErrorMsg msg={errors.capacity} />}
              </div>
            </div>

            {/* Location + Online toggle */}
            <div style={{ marginBottom: 20 }}>
              <div id="field-location" style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Location / Venue {!form.isOnline && <span style={{ color: '#e7b605' }}>*</span>}</label>
                <input
                  className="input-field"
                  placeholder={form.isOnline ? 'Meeting link provided upon registration' : 'e.g. Platform Calgary, 422 11 Ave SW'}
                  value={form.location}
                  onChange={e => handleChange('location', e.target.value)}
                  disabled={form.isOnline}
                  style={{ ...fieldStyle('location'), opacity: form.isOnline ? 0.6 : 1 }}
                />
                {errors.location && <ErrorMsg msg={errors.location} />}
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, color: '#5a5650' }}>
                <input
                  type="checkbox"
                  checked={form.isOnline}
                  onChange={handleOnlineToggle}
                  style={{ width: 16, height: 16, accentColor: '#e7b605', cursor: 'pointer' }}
                />
                This is an online event
              </label>
            </div>

            {/* Description */}
            <div id="field-description" style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Description <span style={{ color: '#e7b605' }}>*</span></label>
              <textarea
                className="input-field"
                placeholder="Describe your event — what attendees will learn, experience, or take away. Be specific and compelling."
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                style={{ ...fieldStyle('description'), height: 120, resize: 'vertical', lineHeight: 1.6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {errors.description ? <ErrorMsg msg={errors.description} /> : <span />}
                <span style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
                  {form.description.length} chars
                </span>
              </div>
            </div>

            {/* Host Name + Contact Email */}
            {userEmail ? (
              <div className="grid-form" style={{ marginBottom: 20 }}>
                <div id="field-hostName">
                  <label style={labelStyle}>Host / Organizer Name <span style={{ color: '#e7b605' }}>*</span></label>
                  <input className="input-field" placeholder="Your name or organization" value={form.hostName} onChange={e => handleChange('hostName', e.target.value)} style={fieldStyle('hostName')} />
                  {errors.hostName && <ErrorMsg msg={errors.hostName} />}
                </div>
                <div id="field-contactEmail">
                  <label style={labelStyle}>Contact Email <span style={{ color: '#e7b605' }}>*</span></label>
                  <input className="input-field" type="email" placeholder="you@example.com" value={form.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} style={fieldStyle('contactEmail')} />
                  {errors.contactEmail && <ErrorMsg msg={errors.contactEmail} />}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <div className="grid-form" style={{ marginBottom: 20 }}>
                  <div id="field-guestName">
                    <label style={labelStyle}>Your Name <span style={{ color: '#e7b605' }}>*</span></label>
                    <input className="input-field" placeholder="First and Last Name" value={form.guestName} onChange={e => handleChange('guestName', e.target.value)} style={fieldStyle('guestName')} />
                    {errors.guestName && <ErrorMsg msg={errors.guestName} />}
                  </div>
                  <div id="field-guestEmail">
                    <label style={labelStyle}>Your Contact Email <span style={{ color: '#e7b605' }}>*</span></label>
                    <input className="input-field" type="email" placeholder="john@example.com" value={form.guestEmail} onChange={e => handleChange('guestEmail', e.target.value)} style={fieldStyle('guestEmail')} />
                    {errors.guestEmail && <ErrorMsg msg={errors.guestEmail} />}
                  </div>
                </div>
                <div id="field-guestBusiness">
                  <label style={labelStyle}>Company / Organization Name (Optional)</label>
                  <input className="input-field" placeholder="Acme Corp" value={form.guestBusiness} onChange={e => handleChange('guestBusiness', e.target.value)} style={{ margin: 0 }} />
                </div>
              </div>
            )}
            {/* Tags */}
            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input
                className="input-field"
                placeholder="e.g. Networking, Calgary, Tech, Startups"
                value={form.tags}
                onChange={e => handleChange('tags', e.target.value)}
                style={{ margin: 0 }}
              />
              <div style={{ marginTop: 6, fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
                Tags help members find your event.
              </div>
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid #e2e0d8', marginBottom: 28 }} />

            {/* Guidelines checkbox */}
            <div id="field-agreeGuidelines" style={{ marginBottom: 32 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.agreeGuidelines}
                  onChange={e => handleChange('agreeGuidelines', e.target.checked)}
                  style={{ width: 16, height: 16, marginTop: 2, accentColor: '#e7b605', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#5a5650', lineHeight: 1.6 }}>
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowEventGuidelinesModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#9b7011',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                    }}
                  >
                    Founders Edge Event Guidelines
                  </button>.
                  I confirm this event is relevant to Calgary's entrepreneurial community and I have authority to submit it.
                  <span style={{ color: '#e7b605' }}> *</span>
                </span>
              </label>
              {errors.agreeGuidelines && <ErrorMsg msg={errors.agreeGuidelines} />}
            </div>

            {errorMsg && (
              <div style={{ marginBottom: 20, padding: 12, background: 'rgba(231,182,5,0.1)', border: '1px solid #e7b605', color: '#9b7011', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '18px' }}>
              {isEditing ? 'Save & Resubmit for Review' : 'Submit for Review'}
            </button>
          </form>
        </div>
      </div>

      {/* Event Guidelines Modal Overlay */}
      {showEventGuidelinesModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #e2e0d8',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={() => setShowEventGuidelinesModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#888',
              }}
            >
              <X size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(231,182,5,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} style={{ color: '#9b7011' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', color: '#000', margin: 0 }}>
                  Founders Edge Event Guidelines
                </h3>
                <div style={{ fontSize: '12px', color: '#888', fontFamily: 'DM Sans, sans-serif' }}>Member Event Submission Standards</div>
              </div>
            </div>

            <hr style={{ borderColor: '#f0efe9', marginBottom: 20 }} />

            <div style={{ fontFamily: 'Noto Serif, serif', color: '#4a4640', fontSize: '14px', lineHeight: 1.85 }}>
              <p style={{ marginBottom: 16 }}>
                All community events listed on Founders Edge must align with our mission of connecting and empowering Calgary entrepreneurs:
              </p>

              <ol style={{ paddingLeft: 20, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li>
                  <strong style={{ fontFamily: 'DM Sans, sans-serif', color: '#000' }}>15% Minimum Member Discount:</strong> For paid ticketed events shared with internal community members, a minimum required discount of 15% (or equivalent free access) must be provided to Founders Edge members.
                </li>
                <li>
                  <strong style={{ fontFamily: 'DM Sans, sans-serif', color: '#000' }}>Community Relevance:</strong> Events must be relevant to founders, business operators, tech leaders, or Calgary professionals.
                </li>
                <li>
                  <strong style={{ fontFamily: 'DM Sans, sans-serif', color: '#000' }}>Accurate Information:</strong> Event date, time, venue address (or virtual meeting link), and host contact details must be accurate and kept up to date.
                </li>
                <li>
                  <strong style={{ fontFamily: 'DM Sans, sans-serif', color: '#000' }}>Safe & Professional Conduct:</strong> Event hosts are responsible for maintaining a professional, respectful, and safe environment for all attendees.
                </li>
                <li>
                  <strong style={{ fontFamily: 'DM Sans, sans-serif', color: '#000' }}>Moderation & Approval:</strong> Submissions are reviewed by the Founders Edge team within 1–2 business days before being published to the calendar.
                </li>
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => {
                  setForm(prev => ({ ...prev, agreeGuidelines: true }));
                  setShowEventGuidelinesModal(false);
                }}
                className="btn-primary"
                style={{ padding: '12px 24px', fontSize: '13px' }}
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'DM Sans, sans-serif',
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#5a5650',
  marginBottom: 8,
};

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#9b7011', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 600 }}>
      <AlertCircle size={12} />
      {msg}
    </div>
  );
}

export default function EventSubmitPage() {
  return (
    <Suspense fallback={null}>
      <EventSubmitContent />
    </Suspense>
  );
}
