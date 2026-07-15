'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, AlertCircle, Percent, Gift, Tag, Zap } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import type { Offer } from '../page';

type OfferType = 'percentage' | 'bogo' | 'fixed' | 'custom';

type FormData = {
  businessName: string;
  title: string;
  type: OfferType;
  discountValue: string;
  discountUnit: string;
  customDiscount: string;
  description: string;
  category: string;
  location: string;
  expiryDate: string;
  foundersEdgeDiscount: string;
  eventsPageUrl: string;
  howToRedeem: string;
  promoCode: string;
  agreeGuidelines: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialForm: FormData = {
  businessName: '',
  title: '',
  type: 'percentage',
  discountValue: '',
  discountUnit: '% off',
  customDiscount: '',
  description: '',
  category: 'Professional Services',
  location: '',
  expiryDate: '',
  foundersEdgeDiscount: '',
  eventsPageUrl: '',
  howToRedeem: '',
  promoCode: '',
  agreeGuidelines: false,
};

const offerCategories = [
  'Professional Services',
  'Marketing & Design',
  'Technology',
  'Finance & Legal',
  'Health & Wellness',
  'Events & Venues',
  'Retail & Products',
  'Food & Beverage',
  'Other',
];

const typeOptions: { value: OfferType; label: string; icon: React.ReactNode; hint: string; example: string }[] = [
  { value: 'percentage', icon: <Percent size={18} />, label: 'Percentage Off', hint: 'e.g. 10% off your first consultation', example: '10% off' },
  { value: 'bogo', icon: <Gift size={18} />, label: 'Buy One Get One', hint: 'e.g. Buy one session, get one free', example: 'Buy 1 Get 1' },
  { value: 'fixed', icon: <Tag size={18} />, label: 'Fixed Amount Off', hint: 'e.g. $50 off your first order', example: '$50 off' },
  { value: 'custom', icon: <Zap size={18} />, label: 'Custom Offer', hint: 'Write your own offer headline', example: 'Free audit' },
];

function buildDiscount(form: FormData): string {
  if (form.type === 'percentage') return `${form.discountValue}% off`;
  if (form.type === 'bogo') return 'Buy 1 Get 1 Free';
  if (form.type === 'fixed') return `$${form.discountValue} off`;
  return form.customDiscount;
}

function validateForm(form: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.businessName.trim()) errors.businessName = 'Business name is required.';
  if (!form.title.trim()) errors.title = 'Offer title is required.';
  if ((form.type === 'percentage' || form.type === 'fixed') && (!form.discountValue.trim() || isNaN(Number(form.discountValue)) || Number(form.discountValue) <= 0))
    errors.discountValue = 'Please enter a valid amount.';
  if (form.type === 'custom' && !form.customDiscount.trim())
    errors.customDiscount = 'Please describe your offer headline.';
  if (!form.description.trim() || form.description.trim().length < 20)
    errors.description = 'Description must be at least 20 characters.';
  if (!form.expiryDate) errors.expiryDate = 'Expiry date is required.';
  if (!form.howToRedeem.trim() || form.howToRedeem.trim().length < 10)
    errors.howToRedeem = 'Please explain how to redeem this offer (min 10 characters).';
  if (!form.agreeGuidelines) errors.agreeGuidelines = 'You must agree to the offer guidelines.';
  return errors;
}

function OfferSubmitContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [offerCount, setOfferCount] = useState(0);

  // Pre-fill form when editing and load offer count
  useEffect(() => {
    async function loadFormContext() {
      try {
        const countRes = await fetch('/api/offers?mySubmissions=true');
        if (countRes.ok) {
          const list = await countRes.json();
          setOfferCount(list.filter((o: any) => o.status !== 'rejected').length);
        }

        if (!editId) return;

        const editRes = await fetch(`/api/offers/${editId}`);
        if (editRes.ok) {
          const found = await editRes.json();
          setIsEditing(true);

          let type: OfferType = found.type;
          let discountValue = '';
          let customDiscount = '';

          const discountStr = found.type === 'percentage' ? `${found.discount_value}% off` : found.type === 'fixed' ? `$${found.discount_value} off` : found.type === 'bogo' ? 'Buy 1 Get 1 Free' : found.discount_value || found.fe_discount || 'Special Offer';

          if (type === 'percentage') discountValue = discountStr.replace('% off', '').trim();
          else if (type === 'fixed') discountValue = discountStr.replace('$', '').replace(' off', '').trim();
          else if (type === 'custom') customDiscount = discountStr;

          setForm({
            businessName: found.business_name,
            title: found.title,
            type,
            discountValue,
            discountUnit: '% off',
            customDiscount,
            description: found.description,
            category: found.category,
            location: found.location || '',
            expiryDate: found.expiry_date ? found.expiry_date.split('T')[0] : '',
            foundersEdgeDiscount: found.fe_discount || '',
            eventsPageUrl: found.events_page_url || '',
            howToRedeem: found.how_to_redeem || '',
            promoCode: found.promo_code || '',
            agreeGuidelines: true,
          });
        }
      } catch (err) {
        console.error("Failed to load edit context:", err);
      }
    }
    loadFormContext();
  }, [editId]);

  function handleChange(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function useRecommendedDefault() {
    setForm(prev => ({
      ...prev,
      type: 'percentage',
      discountValue: '10',
      discountUnit: '% off',
      customDiscount: '',
    }));

    setErrors(prev => ({
      ...prev,
      discountValue: undefined,
      customDiscount: undefined,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const url = isEditing ? `/api/offers/${editId}` : '/api/offers';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      setSubmitted(true);
    } else {
      const result = await response.json().catch(() => ({}));
      alert(result.error || `Failed to ${isEditing ? 'update' : 'create'} offer`);
    }
  }

  // ── Success screen ──────────────────────────────────────────────
  if (submitted) {
    return (
      <PageLayout>
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f7', padding: '80px 20px' }}>
          <div style={{ textAlign: 'center', maxWidth: 520 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(39,174,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={36} style={{ color: '#27ae60' }} />
            </div>
            <div className="section-label" style={{ marginBottom: 12 }}>Offer {isEditing ? 'Updated' : 'Submitted'}</div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '32px', marginBottom: 16, color: '#2a2820' }}>
              {isEditing ? 'Your offer has been updated!' : 'Your offer is under review!'}
            </h2>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '16px', lineHeight: 1.7, marginBottom: 32 }}>
              {isEditing
                ? 'Your changes have been saved and your offer has been resubmitted for admin review. You\'ll see it in your dashboard.'
                : 'Our team will review your offer before it goes live on the offers directory. You can track the status from your dashboard.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
              <Link href="/offers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', border: '1px solid #e2e0d8', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', textDecoration: 'none', color: '#5a5650', letterSpacing: '0.05em' }}>
                Browse Offers
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const MAX_OFFERS = 3;
  const atLimit = !isEditing && offerCount >= MAX_OFFERS;

  // ── Form ────────────────────────────────────────────────────────
  return (
    <PageLayout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <Link
            href={isEditing ? '/dashboard' : '/offers'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            <ArrowLeft size={14} />{isEditing ? 'Back to Dashboard' : 'Member Offers'}
          </Link>
          <div className="section-label">Member Offers</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 5vw, 60px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
            {isEditing ? 'EDIT YOUR' : 'SHARE YOUR'}<br /><span style={{ color: '#e7b605' }}>OFFER</span>
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#999', fontSize: '17px', maxWidth: 480, lineHeight: 1.7 }}>
            {isEditing
              ? 'Update your offer details below. It will be resubmitted for review.'
              : 'Members can list up to 3 exclusive offers. Your offer will be reviewed before going live.'}
          </p>
        </div>
      </div>

      {/* Form Body */}
      <div style={{ background: '#f9f9f7', padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: 760 }}>

          {atLimit && (
            <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', padding: '20px 24px', marginBottom: 32, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertCircle size={20} style={{ color: '#c0392b', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#c0392b', marginBottom: 4 }}>Offer limit reached</div>
                <div style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px' }}>
                  You already have {MAX_OFFERS} active offers. Delete or edit an existing offer from your <Link href="/dashboard" style={{ color: '#9b7011' }}>dashboard</Link> before adding a new one.
                </div>
              </div>
            </div>
          )}

          {/* Offer count indicator */}
          {!isEditing && (
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '16px 24px', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#5a5650' }}>Your active offers</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: MAX_OFFERS }).map((_, i) => (
                  <div key={i} style={{ width: 32, height: 8, background: i < offerCount ? '#e7b605' : '#e2e0d8', borderRadius: 4, transition: 'background 0.2s' }} />
                ))}
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: offerCount >= MAX_OFFERS ? '#c0392b' : '#9a9585', marginLeft: 8 }}>
                  {offerCount}/{MAX_OFFERS}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* ── Section 1: Business ── */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '36px', marginBottom: 2 }}>
              <div className="section-label" style={{ marginBottom: 24 }}>1. Your Business</div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                  Business Name *
                </label>
                <input
                  className="input-field"
                  value={form.businessName}
                  onChange={e => handleChange('businessName', e.target.value)}
                  placeholder="Your business or company name"
                  disabled={atLimit}
                />
                {errors.businessName && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.businessName}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                  Category *
                </label>
                <select className="select-field" value={form.category} onChange={e => handleChange('category', e.target.value)} disabled={atLimit}>
                  {offerCategories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* ── Section 2: Offer Type ── */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '36px', marginBottom: 2 }}>
              <div className="section-label" style={{ marginBottom: 24 }}>2. Offer Type</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={atLimit}
                    onClick={() => handleChange('type', opt.value)}
                    style={{
                      padding: '20px',
                      border: '2px solid',
                      borderColor: form.type === opt.value ? '#e7b605' : '#e2e0d8',
                      background: form.type === opt.value ? 'rgba(231,182,5,0.06)' : '#fff',
                      textAlign: 'left',
                      cursor: atLimit ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ color: form.type === opt.value ? '#9b7011' : '#9a9585', marginBottom: 8 }}>{opt.icon}</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '14px', color: '#2a2820', marginBottom: 4 }}>{opt.label}</div>
                    <div style={{ fontFamily: 'Noto Serif, serif', color: '#9a9585', fontSize: '12px', lineHeight: 1.5 }}>{opt.hint}</div>
                  </button>
                ))}
              </div>

              {/* Discount value input */}

              {/* Recommended default fallback */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  padding: '16px 18px',
                  marginBottom: 24,
                  background: 'rgba(231,182,5,0.06)',
                  border: '1px solid rgba(231,182,5,0.3)',
                  borderLeft: '4px solid #e7b605',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: '#2a2820',
                      marginBottom: 4,
                    }}
                  >
                    Not sure which offer type to choose?
                  </div>

                  <div
                    style={{
                      fontFamily: 'Noto Serif, serif',
                      color: '#5a5650',
                      fontSize: '13px',
                      lineHeight: 1.6,
                    }}
                  >
                    Use our recommended default: a simple 10% member discount.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={useRecommendedDefault}
                  disabled={atLimit}
                  style={{
                    flexShrink: 0,
                    padding: '9px 16px',
                    border: '1px solid #e7b605',
                    background: '#fff',
                    color: '#9b7011',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: atLimit ? 'not-allowed' : 'pointer',
                    opacity: atLimit ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!atLimit) {
                      e.currentTarget.style.background = '#e7b605';
                      e.currentTarget.style.color = '#000';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#9b7011';
                  }}
                >
                  Use Recommended Default
                </button>
              </div>

              {(form.type === 'percentage' || form.type === 'fixed') && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                    {form.type === 'percentage' ? 'Percentage Amount *' : 'Dollar Amount Off *'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {form.type === 'fixed' && (
                      <span style={{ padding: '0 14px', background: '#f0efe9', border: '1px solid #e2e0d8', borderRight: 'none', height: 48, display: 'flex', alignItems: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#5a5650' }}>$</span>
                    )}
                    <input
                      className="input-field"
                      type="number"
                      min="1"
                      value={form.discountValue}
                      onChange={e => handleChange('discountValue', e.target.value)}
                      placeholder={form.type === 'percentage' ? 'e.g. 10' : 'e.g. 50'}
                      style={{ margin: 0, flex: 1, borderRadius: 0 }}
                      disabled={atLimit}
                    />
                    {form.type === 'percentage' && (
                      <span style={{ padding: '0 14px', background: '#f0efe9', border: '1px solid #e2e0d8', borderLeft: 'none', height: 48, display: 'flex', alignItems: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#5a5650' }}>%</span>
                    )}
                  </div>
                  {errors.discountValue && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.discountValue}</div>}
                </div>
              )}

              {form.type === 'custom' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                    Offer Headline *
                  </label>
                  <input
                    className="input-field"
                    value={form.customDiscount}
                    onChange={e => handleChange('customDiscount', e.target.value)}
                    placeholder="e.g. Free website audit, Complimentary consultation"
                    disabled={atLimit}
                  />
                  {errors.customDiscount && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.customDiscount}</div>}
                </div>
              )}

              {/* Preview */}
              {(form.discountValue || form.customDiscount || form.type === 'bogo') && (
                <div style={{ background: '#f9f9f7', border: '1px dashed #e2e0d8', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#9a9585', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Preview:</span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '22px', color: '#e7b605' }}>{buildDiscount(form)}</span>
                </div>
              )}
            </div>

            {/* ── Section 3: Offer Details ── */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '36px', marginBottom: 2 }}>
              <div className="section-label" style={{ marginBottom: 24 }}>3. Offer Details</div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                  Offer Title *
                </label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="e.g. 10% off your first marketing consultation"
                  disabled={atLimit}
                />
                {errors.title && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.title}</div>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                  Description *
                </label>
                <textarea
                  className="input-field"
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Describe the offer in detail — what's included, any conditions, how to redeem it..."
                  rows={5}
                  style={{ resize: 'vertical', fontFamily: 'Noto Serif, serif' }}
                  disabled={atLimit}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: form.description.length < 20 ? '#c0392b' : '#9a9585', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>
                  {form.description.length} chars (min 20)
                </div>
                {errors.description && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.description}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                    Location
                  </label>
                  <input
                    className="input-field"
                    value={form.location}
                    onChange={e => handleChange('location', e.target.value)}
                    placeholder="e.g. Calgary, Online"
                    style={{ margin: 0 }}
                    disabled={atLimit}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                    Expiry Date *
                  </label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.expiryDate}
                    onChange={e => handleChange('expiryDate', e.target.value)}
                    style={{ margin: 0 }}
                    disabled={atLimit}
                  />
                  {errors.expiryDate && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.expiryDate}</div>}
                </div>
              </div>

              {/* Founders Edge Recommended Discount */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                  Founders Edge Recommended Discount
                </label>
                <input
                  className="input-field"
                  value={form.foundersEdgeDiscount}
                  onChange={e => handleChange('foundersEdgeDiscount', e.target.value)}
                  placeholder="e.g. 15% exclusively for Founders Edge members"
                  style={{ margin: 0 }}
                  disabled={atLimit}
                />
                <div style={{ fontSize: '12px', color: '#9a9585', marginTop: 6, fontFamily: 'Noto Serif, serif' }}>
                  Optional — add a specific discount exclusive to Founders Edge members beyond your standard offer.
                </div>
              </div>

              {/* Redemption / Booking Link */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                  Redemption / Booking Link
                </label>
                <input
                  className="input-field"
                  type="url"
                  value={form.eventsPageUrl}
                  onChange={e => handleChange('eventsPageUrl', e.target.value)}
                  placeholder="https://yourbusiness.com/redeem"
                  style={{ margin: 0 }}
                  disabled={atLimit}
                />
                <div style={{ fontSize: '12px', color: '#9a9585', marginTop: 6, fontFamily: 'Noto Serif, serif' }}>
                  Optional — link members directly to your events, booking page, or website checkout.
                </div>
              </div>

              {/* Promo Code */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                  Promo Code
                </label>
                <input
                  className="input-field"
                  value={form.promoCode}
                  onChange={e => handleChange('promoCode', e.target.value)}
                  placeholder="e.g. FE-50OFF"
                  style={{ margin: 0 }}
                  disabled={atLimit}
                />
                <div style={{ fontSize: '12px', color: '#9a9585', marginTop: 6, fontFamily: 'Noto Serif, serif' }}>
                  Optional — if you have a discount code set up for Founders Edge members, enter it here.
                </div>
              </div>

              {/* How to Redeem */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>
                  How to Redeem *
                </label>
                <textarea
                  className="input-field"
                  value={form.howToRedeem}
                  onChange={e => handleChange('howToRedeem', e.target.value)}
                  placeholder="e.g. Mention Founders Edge when booking. Email hello@yourbusiness.com with subject 'FE Offer'. Use promo code FE2026 at checkout."
                  rows={3}
                  style={{ resize: 'vertical', fontFamily: 'Noto Serif, serif' }}
                  disabled={atLimit}
                />
                {errors.howToRedeem && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.howToRedeem}</div>}
              </div>
            </div>

            {/* ── Section 4: Guidelines ── */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '36px', marginBottom: 2 }}>
              <div className="section-label" style={{ marginBottom: 20 }}>4. Guidelines</div>
              <div style={{ background: '#f9f9f7', border: '1px solid #e2e0d8', padding: '20px 24px', marginBottom: 24 }}>
                <ul style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                  <li>Offers must be genuine and honoured when members inquire</li>
                  <li>Offers are limited to 3 active listings per member</li>
                  <li>No services prohibited under Canadian law or Founders Edge terms</li>
                  <li>Admin review may take 24–48 hours before your offer goes live</li>
                  <li>Offers must not duplicate events or event discounts — use the events page for that</li>
                </ul>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.agreeGuidelines}
                  onChange={e => handleChange('agreeGuidelines', e.target.checked)}
                  style={{ marginTop: 3, accentColor: '#e7b605', width: 16, height: 16, flexShrink: 0 }}
                  disabled={atLimit}
                />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#2a2820', lineHeight: 1.5 }}>
                  I confirm this offer is genuine, I will honour it, and I agree to the Founders Edge offer guidelines.
                </span>
              </label>
              {errors.agreeGuidelines && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 8, fontFamily: 'DM Sans, sans-serif' }}>{errors.agreeGuidelines}</div>}
            </div>

            {/* Submit */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'Noto Serif, serif', color: '#9a9585', fontSize: '13px', maxWidth: 360 }}>
                {isEditing
                  ? 'Saving will resubmit your offer for admin review.'
                  : 'Submitting will send your offer for admin review. It will go live once approved.'}
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={atLimit}
                style={{ opacity: atLimit ? 0.5 : 1, cursor: atLimit ? 'not-allowed' : 'pointer' }}
              >
                {isEditing ? 'Save & Resubmit for Review' : 'Submit Offer for Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

export default function OfferSubmitPage() {
  return (
    <Suspense fallback={null}>
      <OfferSubmitContent />
    </Suspense>
  );
}
