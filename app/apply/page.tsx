'use client';
import { useState, useEffect } from 'react';
import { Check, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

const steps = ['Your Business', 'Priorities', 'Ideal Client', 'Referrals & Reach', 'Contact'];

const industries = ['Technology', 'Marketing & Advertising', 'Finance & Accounting', 'Legal Services', 'HR & People', 'Design & Creative', 'Health & Wellness', 'Construction & Real Estate', 'Retail & E-commerce', 'Professional Services', 'Manufacturing', 'Other'];

const priorities = ['Finding new clients', 'Building referral partnerships', 'Raising funding', 'Hiring & team building', 'Scaling operations', 'Learning from peers', 'Increasing brand visibility', 'Finding mentors'];

const clientSizes = ['Solo / Freelancer', 'SMB (2–50)', 'Mid-market (51–500)', 'Enterprise (500+)'];
const geographicFocus = ['Calgary', 'Alberta', 'National', 'International'];
const businessTypes = ['B2B', 'B2C', 'Both'];

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    businessName: '', businessDesc: '', industry: '', website: '', revenue: '', employees: '',
    priorities: [] as string[], idealClients: '', idealClientIndustries: [] as string[], idealClientSize: '', businessType: '',
    referralPartners: '', referralPartnerIndustries: [] as string[],
    geographicFocus: [] as string[], openToMatching: 'true',
    firstName: '', lastName: '', email: '', phone: '', linkedin: '', hearAbout: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [alreadyApproved, setAlreadyApproved] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (!emailParam) return;

    fetch(`/api/apply?email=${encodeURIComponent(emailParam)}`)
      .then(res => res.json())
      .then(res => {
        if (res.alreadyApproved) {
          setAlreadyApproved(true);
        }
        if (res.found && res.data) {
          setForm(prev => ({
            ...prev,
            ...res.data,
          }));
          setPrefilled(true);
        }
      })
      .catch(() => {});
  }, []);

  const errStyle: React.CSSProperties = { color: '#c0392b', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 };

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.businessName.trim()) e.businessName = 'Business name is required.';
      if (!form.businessDesc.trim()) e.businessDesc = 'Please describe what your business does.';
      if (!form.industry) e.industry = 'Please select an industry.';
    }
    if (s === 4) {
      if (!form.firstName.trim()) e.firstName = 'First name is required.';
      if (!form.email.trim()) e.email = 'Email address is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstErrKey = Object.keys(e)[0];
      const el = document.getElementById(`field-${firstErrKey}`) ||
                 document.getElementById(firstErrKey) ||
                 document.querySelector(`[name="${firstErrKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (el as HTMLElement).focus?.();
      }
    }
    return Object.keys(e).length === 0;
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitting(false);
        if (data.alreadyApproved) {
          setAlreadyApproved(true);
          return;
        }
        alert(data.error || 'Failed to submit application');
        return;
      }

      setSubmitting(false);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitting(false);
      alert(err.message || 'An unexpected error occurred.');
    }
  };

  const update = (field: string, val: string | string[]) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(prev => { if (!prev[field]) return prev; const n = { ...prev }; delete n[field]; return n; });
  };

  const togglePriority = (p: string) => {
    const curr = form.priorities;
    update('priorities', curr.includes(p) ? curr.filter(x => x !== p) : [...curr, p]);
  };

  const toggleMulti = (field: string, val: string) => {
    const curr = form[field as keyof typeof form] as string[];
    update(field, curr.includes(val) ? curr.filter(x => x !== val) : [...curr, val]);
  };

  if (submitted) {
    return (
      <PageLayout>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px' }}>
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <div style={{ width: 80, height: 80, background: '#e7b605', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}>
              <Check size={36} style={{ color: '#000' }} />
            </div>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '48px', letterSpacing: '-0.02em', marginBottom: 16 }}>Application Submitted</h1>
            <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '18px', lineHeight: 1.8, marginBottom: 32 }}>
              Thank you, {form.firstName}! We've received your application for <strong>{form.businessName}</strong>. Our team reviews every application personally. Expect to hear from us within 5–7 business days.
            </p>
            <div style={{ background: '#f9f9f7', border: '1px solid #e2e0d8', padding: '24px', textAlign: 'left', marginBottom: 32 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>What happens next?</div>
              {['Our team reviews your application', 'We may reach out for a brief call', 'Approved members receive onboarding instructions', 'Set up your profile and start connecting'].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8, color: '#5a5650', fontSize: '14px', fontFamily: 'Noto Serif, serif' }}>
                  <span style={{ color: '#e7b605', fontWeight: 800, flexShrink: 0 }}>0{i + 1}</span> {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ background: '#000', paddingTop: 72 }}>
        <div className="container" style={{ paddingTop: 60, paddingBottom: 40 }}>
          <div className="section-label" style={{ color: '#e7b605' }}>Membership Application</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 5vw, 64px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: 16 }}>
            APPLY FOR<br /><span style={{ color: '#e7b605' }}>MEMBERSHIP</span>
          </h1>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#888', fontSize: '16px', maxWidth: 480 }}>
            $495 + GST annually. Every application is reviewed by our team. We curate for quality.
          </p>

          {/* Progress */}
          <div style={{ display: 'flex', gap: 0, marginTop: 40 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: i < step ? '#e7b605' : i === step ? '#fff' : '#333',
                    border: `2px solid ${i <= step ? '#e7b605' : '#333'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: i < step ? '#000' : i === step ? '#000' : '#666',
                    fontWeight: 800, fontSize: '13px',
                    transition: 'all 0.3s',
                  }}>
                    {i < step ? <Check size={14} /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < step ? '#e7b605' : '#333', transition: 'background 0.3s' }} />
                  )}
                </div>
                <div style={{ fontSize: '11px', color: i <= step ? '#e7b605' : '#aba7a5', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '60px 0', background: '#f9f9f7' }}>
        <div className="container">
          <div style={{ maxWidth: 680, margin: '0 auto', background: '#fff', border: '1px solid #e2e0d8', padding: '48px' }}>
            {alreadyApproved ? (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%', color: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '2px solid #bbf7d0' }}>
                  <Check size={32} />
                </div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '26px', color: '#111', marginBottom: 12 }}>
                  Application Already Approved!
                </h2>
                <p style={{ fontFamily: 'Noto Serif, serif', color: '#666', fontSize: '15px', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 28px' }}>
                  Your membership application for <strong>{form.email || 'your email'}</strong> has already been reviewed and approved. You are an active member!
                </p>
                <a href="/login" style={{ display: 'inline-block', background: '#e7b605', color: '#000', padding: '14px 32px', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>
                  Log In to Your Account →
                </a>
              </div>
            ) : (
              <>
                {prefilled && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fef08a', color: '#92400e', padding: '12px 16px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, marginBottom: 24, borderRadius: 4 }}>
                    ✨ Your previous application answers have been loaded. Review and make your changes before submitting!
                  </div>
                )}

            {/* Step 0: Business */}
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', marginBottom: 32 }}>Tell us about your business</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Business Name *</label>
                    <input id="field-businessName" className="input-field" value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder="e.g. NorthTech Solutions Inc." style={errors.businessName ? { borderColor: '#c0392b' } : undefined} />
                    {errors.businessName && <p style={errStyle}>{errors.businessName}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>What does your business do? *</label>
                    <textarea id="field-businessDesc" className="input-field" value={form.businessDesc} onChange={e => update('businessDesc', e.target.value)} placeholder="Describe your product/service, target customers, and what makes you unique..." style={{ height: 100, resize: 'vertical', ...(errors.businessDesc ? { borderColor: '#c0392b' } : {}) }} />
                    {errors.businessDesc && <p style={errStyle}>{errors.businessDesc}</p>}
                  </div>
                  <div className="grid-form">
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Industry *</label>
                      <div style={{ position: 'relative' }}>
                        <select id="field-industry" className="select-field" value={form.industry} onChange={e => update('industry', e.target.value)} style={errors.industry ? { borderColor: '#c0392b' } : undefined}>
                          <option value="">Select industry...</option>
                          {industries.map(i => <option key={i}>{i}</option>)}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9a9585', pointerEvents: 'none' }} />
                      </div>
                      {errors.industry && <p style={errStyle}>{errors.industry}</p>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Annual Revenue</label>
                      <div style={{ position: 'relative' }}>
                        <select className="select-field" value={form.revenue} onChange={e => update('revenue', e.target.value)}>
                          <option value="">Select range...</option>
                          {['Pre-revenue', 'Under $100K', '$100K–$500K', '$500K–$1M', '$1M–$5M', '$5M+'].map(r => <option key={r}>{r}</option>)}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9a9585', pointerEvents: 'none' }} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Website</label>
                    <input className="input-field" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://yourwebsite.com" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Goals */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', marginBottom: 8 }}>What are your priorities?</h2>
                <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', marginBottom: 24 }}>Select all that apply. This drives your personalized recommendations and matches.</p>

                <div className="grid-form" style={{ gap: 8, marginBottom: 32 }}>
                  {priorities.map(p => (
                    <button key={p} onClick={() => togglePriority(p)} style={{
                      padding: '12px 16px', background: form.priorities.includes(p) ? '#000' : '#f9f9f7',
                      border: `2px solid ${form.priorities.includes(p) ? '#e7b605' : '#e2e0d8'}`,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 600, fontSize: '14px', color: form.priorities.includes(p) ? '#e7b605' : '#000',
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      {form.priorities.includes(p) && <Check size={14} style={{ flexShrink: 0 }} />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Ideal Client */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', marginBottom: 8 }}>Your ideal client</h2>
                <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', marginBottom: 24 }}>Help us match you with the right people.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Client Industries <span style={{ color: '#9a9585', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {industries.map(ind => (
                          <button key={ind} onClick={() => toggleMulti('idealClientIndustries', ind)} style={{
                            padding: '8px 14px', background: form.idealClientIndustries.includes(ind) ? '#000' : '#f9f9f7',
                            border: `2px solid ${form.idealClientIndustries.includes(ind) ? '#e7b605' : '#e2e0d8'}`,
                            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '13px',
                            color: form.idealClientIndustries.includes(ind) ? '#e7b605' : '#5a5650', transition: 'all 0.2s',
                          }}>
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid-form">
                      <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Client Size</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {clientSizes.map(s => (
                            <button key={s} onClick={() => update('idealClientSize', s)} style={{
                              padding: '10px 14px', background: form.idealClientSize === s ? '#000' : '#f9f9f7',
                              border: `2px solid ${form.idealClientSize === s ? '#e7b605' : '#e2e0d8'}`,
                              cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif',
                              fontWeight: 600, fontSize: '13px', color: form.idealClientSize === s ? '#e7b605' : '#5a5650',
                              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                              {s}
                              {form.idealClientSize === s && <Check size={13} />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Business Type</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {businessTypes.map(t => (
                            <button key={t} onClick={() => update('businessType', t)} style={{
                              padding: '10px 14px', background: form.businessType === t ? '#000' : '#f9f9f7',
                              border: `2px solid ${form.businessType === t ? '#e7b605' : '#e2e0d8'}`,
                              cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif',
                              fontWeight: 600, fontSize: '13px', color: form.businessType === t ? '#e7b605' : '#5a5650',
                              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                              {t}
                              {form.businessType === t && <Check size={13} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Anything else about your ideal client?</label>
                      <textarea className="input-field" value={form.idealClients} onChange={e => update('idealClients', e.target.value)} placeholder="Role, specific needs, or anything else..." style={{ height: 72, resize: 'vertical' }} />
                    </div>
                  </div>
                </div>
            )}

            {/* Step 3: Referrals & Reach */}
            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', marginBottom: 8 }}>Referrals &amp; reach</h2>
                <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', marginBottom: 24 }}>Who sends you referrals, and where you do business. All optional.</p>

                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', marginBottom: 4 }}>Referral Partners</div>
                  <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', marginBottom: 20 }}>Who would send great referrals your way — and vice versa?</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Partner Industries <span style={{ color: '#9a9585', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {industries.map(ind => (
                          <button key={ind} onClick={() => toggleMulti('referralPartnerIndustries', ind)} style={{
                            padding: '8px 14px', background: form.referralPartnerIndustries.includes(ind) ? '#000' : '#f9f9f7',
                            border: `2px solid ${form.referralPartnerIndustries.includes(ind) ? '#e7b605' : '#e2e0d8'}`,
                            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '13px',
                            color: form.referralPartnerIndustries.includes(ind) ? '#e7b605' : '#5a5650', transition: 'all 0.2s',
                          }}>
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Anything else about your ideal referral partner?</label>
                      <textarea className="input-field" value={form.referralPartners} onChange={e => update('referralPartners', e.target.value)} placeholder="What types of businesses would make great referral partners for you?" style={{ height: 72, resize: 'vertical' }} />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e0d8', paddingTop: 28 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', marginBottom: 16 }}>Geographic Focus & Matching</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Where do you do business? <span style={{ color: '#9a9585', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span></label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {geographicFocus.map(g => (
                          <button key={g} onClick={() => toggleMulti('geographicFocus', g)} style={{
                            padding: '10px 20px', background: form.geographicFocus.includes(g) ? '#000' : '#f9f9f7',
                            border: `2px solid ${form.geographicFocus.includes(g) ? '#e7b605' : '#e2e0d8'}`,
                            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '13px',
                            color: form.geographicFocus.includes(g) ? '#e7b605' : '#5a5650', transition: 'all 0.2s',
                          }}>
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => update('openToMatching', form.openToMatching === 'true' ? 'false' : 'true')} style={{
                      padding: '16px 20px', background: form.openToMatching === 'true' ? '#000' : '#f9f9f7',
                      border: `2px solid ${form.openToMatching === 'true' ? '#e7b605' : '#e2e0d8'}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}>
                      <div style={{
                        width: 20, height: 20, border: `2px solid ${form.openToMatching === 'true' ? '#e7b605' : '#ccc'}`,
                        background: form.openToMatching === 'true' ? '#e7b605' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
                      }}>
                        {form.openToMatching === 'true' && <Check size={12} style={{ color: '#000' }} />}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: form.openToMatching === 'true' ? '#e7b605' : '#000' }}>I&apos;m open to smart matching</div>
                        <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '13px', color: form.openToMatching === 'true' ? '#888' : '#9a9585', marginTop: 2 }}>Allow Founders Edge to introduce you to relevant members based on your profile</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Contact & Submit */}
            {step === 4 && (
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', marginBottom: 32 }}>Your contact details</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="grid-form">
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>First Name *</label>
                      <input id="field-firstName" className="input-field" value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Jordan" style={errors.firstName ? { borderColor: '#c0392b' } : undefined} />
                      {errors.firstName && <p style={errStyle}>{errors.firstName}</p>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Last Name *</label>
                      <input id="field-lastName" className="input-field" value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Smith" style={errors.lastName ? { borderColor: '#c0392b' } : undefined} />
                      {errors.lastName && <p style={errStyle}>{errors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Email Address *</label>
                    <input id="field-email" className="input-field" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="jordan@yourcompany.com" style={errors.email ? { borderColor: '#c0392b' } : undefined} />
                    {errors.email && <p style={errStyle}>{errors.email}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Phone Number</label>
                    <input className="input-field" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (403) 000-0000" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>LinkedIn Profile</label>
                    <input className="input-field" value={form.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="linkedin.com/in/yourprofile" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>How did you hear about us?</label>
                    <div style={{ position: 'relative' }}>
                      <select className="select-field" value={form.hearAbout} onChange={e => update('hearAbout', e.target.value)}>
                        <option value="">Select...</option>
                        {['Member referral', 'LinkedIn', 'Google search', 'Event', 'Media coverage', 'Other'].map(h => <option key={h}>{h}</option>)}
                      </select>
                      <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9a9585', pointerEvents: 'none' }} />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div style={{ background: '#f9f9f7', border: '2px solid #e7b605', padding: '24px', marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px' }}>Annual Membership</div>
                        <div style={{ color: '#9a9585', fontSize: '13px', marginTop: 4 }}>Full platform access · All events · Smart matching</div>
                      </div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '28px', color: '#e7b605' }}>
                        $495<span style={{ fontSize: '16px', color: '#9a9585', fontWeight: 400 }}> + GST</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#9a9585' }}>Payment is collected only after your application is approved.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingTop: 32, borderTop: '1px solid #e2e0d8' }}>
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn-outline" style={{ opacity: step === 0 ? 0.3 : 1, pointerEvents: step === 0 ? 'none' : 'auto' }}>
                <ArrowLeft size={16} /> Back
              </button>
              {step < steps.length - 1 ? (
                <button onClick={() => { if (validateStep(step)) setStep(s => s + 1); }} className="btn-primary">
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ background: '#e7b605', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting…' : <>Submit Application <Check size={16} /></>}
                </button>
              )}
            </div>
            </>
          )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
