'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Trophy, AlertCircle } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { seedAwards, type Award } from '../page';
import { getProfile } from '@/app/actions/profile';

export type Nomination = {
  id: string;
  awardId: string;
  awardName: string;
  awardOrg: string;
  businessName: string;
  category: string;
  contactName: string;
  contactEmail: string;
  website: string;
  achievement: string;
  statement: string;
  status: 'pending' | 'approved' | 'rejected' | 'winner';
  submittedAt: string;
  updatedAt?: string;
};

type FormData = {
  businessName: string;
  contactName: string;
  contactEmail: string;
  website: string;
  achievement: string;
  statement: string;
  agreeGuidelines: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialForm: FormData = {
  businessName: '',
  contactName: '',
  contactEmail: '',
  website: '',
  achievement: '',
  statement: '',
  agreeGuidelines: false,
};

function validateForm(f: FormData): FormErrors {
  const e: FormErrors = {};
  if (!f.businessName.trim()) e.businessName = 'Business name is required.';
  if (!f.contactName.trim()) e.contactName = 'Contact name is required.';
  if (!f.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contactEmail)) e.contactEmail = 'Valid email is required.';
  if (!f.achievement.trim() || f.achievement.trim().length < 20) e.achievement = 'Please describe your key achievement (min 20 chars).';
  if (!f.statement.trim() || f.statement.trim().length < 50) e.statement = 'Your nomination statement must be at least 50 characters.';
  if (!f.agreeGuidelines) e.agreeGuidelines = 'You must agree to the nomination guidelines.';
  return e;
}

function NominateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const awardId = searchParams.get('awardId') || '';
  const editId = searchParams.get('edit') || '';

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [award, setAward] = useState<Award | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alreadyNominated, setAlreadyNominated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await getProfile();
      if (!res.success || !res.user) {
        // Enforce login and redirect back to this page with the awardId preserved
        const dest = `/login?redirectTo=${encodeURIComponent(`/awards/nominate?awardId=${awardId}`)}`;
        router.push(dest);
        return;
      }

      // Pre-fill user profile info if available
      const u = res.user;
      const mp = (u as any).memberProfile;
      const bizName = mp?.businesses?.[0]?.business_name || u.name || '';
      const bizWeb = mp?.businesses?.[0]?.website || '';
      const fullName = (mp?.first_name || mp?.last_name) ? `${mp.first_name || ''} ${mp.last_name || ''}`.trim() : u.name || '';

      setForm(prev => ({
        ...prev,
        contactName: prev.contactName || fullName,
        contactEmail: prev.contactEmail || u.email || '',
        businessName: prev.businessName || bizName,
        website: prev.website || bizWeb,
      }));

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router, awardId]);

  useEffect(() => {
    if (checkingAuth) return;

    // Load award info from API
    async function loadAward() {
      if (!awardId) return;
      try {
        const res = await fetch(`/api/awards/${awardId}`);
        if (res.ok) {
          const data = await res.json();
          setAward({
            ...data,
            awardDate: data.award_date || data.awardDate || '',
          });
        }
      } catch (err) {
        console.error('Error loading award details:', err);
      }
    }

    async function checkExistingNomination() {
      try {
        const res = await fetch('/api/nominations');
        if (!res.ok) return;

        const dbNoms = await res.json();
        const noms: Nomination[] = dbNoms.map((n: any) => ({
          id: n.id,
          awardId: n.award_id,
          awardName: n.award?.name || '',
          awardOrg: n.award?.org || '',
          businessName: n.business_name,
          category: n.award?.category || '',
          contactName: n.contact_name,
          contactEmail: n.contact_email,
          website: n.website || '',
          achievement: n.achievement,
          statement: n.statement,
          status: n.status.toLowerCase() as any,
          submittedAt: n.created_at,
        }));

        if (editId) {
          const existing = noms.find(n => n.id === editId);
          if (existing) {
            setIsEditing(true);
            setForm({
              businessName: existing.businessName,
              contactName: existing.contactName,
              contactEmail: existing.contactEmail,
              website: existing.website || '',
              achievement: existing.achievement,
              statement: existing.statement,
              agreeGuidelines: true,
            });
          }
        } else if (awardId) {
          setAlreadyNominated(noms.some(n => n.awardId === awardId));
        }
      } catch (err) {
        console.error('Error fetching database nominations:', err);
      }
    }

    loadAward();
    checkExistingNomination();
  }, [awardId, editId, checkingAuth]);

  function handleChange(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstErrKey = Object.keys(errs)[0];
      const el = document.getElementById(`field-${firstErrKey}`) ||
                 document.getElementById(firstErrKey) ||
                 document.querySelector(`[name="${firstErrKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (el as HTMLElement).focus?.();
      }
      return;
    }

    try {
      let response;

      if (isEditing && editId) {
        response = await fetch(`/api/nominations/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_name: form.businessName,
            contact_name: form.contactName,
            contact_email: form.contactEmail,
            website: form.website,
            achievement: form.achievement,
            statement: form.statement,
          }),
        });
      } else {
        response = await fetch('/api/nominations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            award_id: awardId,
            business_name: form.businessName,
            contact_name: form.contactName,
            contact_email: form.contactEmail,
            website: form.website,
            achievement: form.achievement,
            statement: form.statement,
          }),
        });
      }
      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Something went wrong with the request.');
        return;
      }

      setSubmitted(true);

    } catch (err) {
      console.error('Network transaction error', err);
      alert('Failed to connect to the server. Please try again');
    }
  }

if (checkingAuth) {
  return (
    <PageLayout>
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f7' }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#e7b605' }}>Checking membership access...</div>
      </div>
    </PageLayout>
  );
}

if (submitted) {
  return (
    <PageLayout>
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f7', padding: '80px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(231,182,5,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={36} style={{ color: '#e7b605' }} />
          </div>
          <div className="section-label" style={{ marginBottom: 12 }}>Nomination {isEditing ? 'Updated' : 'Submitted'}</div>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '32px', marginBottom: 16, color: '#2a2820' }}>
            {isEditing ? 'Your nomination has been updated!' : 'Your nomination is in!'}
          </h2>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '16px', lineHeight: 1.7, marginBottom: 32 }}>
            {isEditing
              ? 'Your changes have been saved and resubmitted for review.'
              : `Your nomination for "${award?.name}" has been submitted. Our team will review it and you'll be notified of the outcome.`}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
            <Link href="/awards" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', border: '1px solid #e2e0d8', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', textDecoration: 'none', color: '#5a5650', letterSpacing: '0.05em' }}>
              Browse More Awards
            </Link>
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
        <Link href={awardId ? `/awards/${awardId}` : '/awards'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          <ArrowLeft size={14} />{awardId ? 'Back to Award' : 'All Awards'}
        </Link>
        <div className="section-label">Award Nomination</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(32px, 5vw, 56px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
          {isEditing ? 'EDIT YOUR' : 'SUBMIT YOUR'}<br /><span style={{ color: '#e7b605' }}>NOMINATION</span>
        </h1>
        {award && (
          <div style={{ background: 'rgba(231,182,5,0.1)', border: '1px solid rgba(231,182,5,0.2)', padding: '14px 20px', display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Trophy size={16} style={{ color: '#e7b605', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#e7b605' }}>{award.name}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>{award.org}</div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Form */}
    <div style={{ background: '#f9f9f7', padding: '80px 0' }}>
      <div className="container" style={{ maxWidth: 760 }}>

        {alreadyNominated && !isEditing && (
          <div style={{ background: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.2)', padding: '20px 24px', marginBottom: 32, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircle size={20} style={{ color: '#e67e22', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#e67e22', marginBottom: 4 }}>Already nominated</div>
              <div style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px' }}>
                You&apos;ve already submitted a nomination for this award. You can edit it from your <Link href="/dashboard" style={{ color: '#9b7011' }}>dashboard</Link>.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Section 1: About You */}
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '36px', marginBottom: 2 }}>
            <div className="section-label" style={{ marginBottom: 24 }}>1. Your Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>Business Name *</label>
                <input id="field-businessName" className="input-field" value={form.businessName} onChange={e => handleChange('businessName', e.target.value)} placeholder="Your business or company name" style={{ margin: 0 }} />
                {errors.businessName && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 5, fontFamily: 'DM Sans, sans-serif' }}>{errors.businessName}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>Contact Name *</label>
                <input id="field-contactName" className="input-field" value={form.contactName} onChange={e => handleChange('contactName', e.target.value)} placeholder="Your full name" style={{ margin: 0 }} />
                {errors.contactName && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 5, fontFamily: 'DM Sans, sans-serif' }}>{errors.contactName}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>Email *</label>
                <input id="field-contactEmail" className="input-field" type="email" value={form.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} placeholder="you@yourbusiness.com" style={{ margin: 0 }} />
                {errors.contactEmail && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 5, fontFamily: 'DM Sans, sans-serif' }}>{errors.contactEmail}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>Website</label>
                <input id="field-website" className="input-field" value={form.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://yourbusiness.com" style={{ margin: 0 }} />
              </div>
            </div>
          </div>

          {/* Section 2: Your Case */}
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '36px', marginBottom: 2 }}>
            <div className="section-label" style={{ marginBottom: 24 }}>2. Your Nomination Case</div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>Key Achievement *</label>
              <input id="field-achievement" className="input-field" value={form.achievement} onChange={e => handleChange('achievement', e.target.value)} placeholder="e.g. Grew revenue 3x in 12 months, launched in 3 new markets..." />
              <div style={{ fontSize: '12px', color: '#9a9585', marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>One standout achievement that makes your nomination compelling</div>
              {errors.achievement && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 5, fontFamily: 'DM Sans, sans-serif' }}>{errors.achievement}</div>}
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, color: '#2a2820' }}>Nomination Statement *</label>
              <textarea
                id="field-statement"
                className="input-field"
                value={form.statement}
                onChange={e => handleChange('statement', e.target.value)}
                placeholder="Tell us why you or your business deserves this award. Include your story, impact, achievements, and what sets you apart..."
                rows={7}
                style={{ resize: 'vertical', fontFamily: 'Noto Serif, serif' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <div style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>Be specific and compelling — this is your case to the judges</div>
                <div style={{ fontSize: '12px', color: form.statement.length < 50 ? '#c0392b' : '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>{form.statement.length} chars (min 50)</div>
              </div>
              {errors.statement && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 5, fontFamily: 'DM Sans, sans-serif' }}>{errors.statement}</div>}
            </div>
          </div>

          {/* Section 3: Guidelines */}
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '36px', marginBottom: 2 }}>
            <div className="section-label" style={{ marginBottom: 20 }}>3. Confirmation</div>
            <div style={{ background: '#f9f9f7', border: '1px solid #e2e0d8', padding: '20px 24px', marginBottom: 24 }}>
              <ul style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li>All information provided is accurate and truthful</li>
                <li>You consent to your business name and nomination details being reviewed by the award committee</li>
                <li>You are a current Founders Edge member in good standing</li>
                <li>You understand the award committee&apos;s decision is final</li>
              </ul>
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input id="field-agreeGuidelines" type="checkbox" checked={form.agreeGuidelines} onChange={e => handleChange('agreeGuidelines', e.target.checked)} style={{ marginTop: 3, accentColor: '#e7b605', width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#2a2820', lineHeight: 1.5 }}>
                I confirm all information is accurate and I agree to the nomination guidelines.
              </span>
            </label>
            {errors.agreeGuidelines && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: 8, fontFamily: 'DM Sans, sans-serif' }}>{errors.agreeGuidelines}</div>}
          </div>

          {/* Submit */}
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Noto Serif, serif', color: '#9a9585', fontSize: '13px' }}>
              {isEditing ? 'Saving will resubmit your nomination for review.' : 'Your nomination will be reviewed by the award committee.'}
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={alreadyNominated && !isEditing}
              style={(alreadyNominated && !isEditing) ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
            >
              <Trophy size={15} />
              {isEditing ? 'Save & Resubmit' : 'Submit Nomination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </PageLayout>
);
}

export default function NominatePage() {
  return (
    <Suspense fallback={null}>
      <NominateContent />
    </Suspense>
  );
}
