'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Building2, BookOpen, Trophy, Video, Users, Star, LogOut, Plus, CheckCircle, X, Pencil, Trash2, ChevronDown, ChevronUp, LayoutDashboard, ClipboardList, Tag, Flag, Upload, Milestone } from 'lucide-react';
import Logo from '@/components/Logo';
import { getProfile } from '@/app/actions/profile';
import { logout } from '@/app/actions/auth';

type Tab = 'events' | 'directory' | 'resources' | 'awards' | 'webinars' | 'supperclub';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'directory', label: 'Directory', icon: Building2 },
  { id: 'resources', label: 'Resources', icon: BookOpen },
  { id: 'awards', label: 'Awards', icon: Trophy },
  { id: 'webinars', label: 'Webinars', icon: Video },
  { id: 'supperclub', label: 'Supper Club', icon: Star },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────
type EventItem = { id: string | number; title: string; date: string; time: string; location: string; category: string; price: string; host: string; desc: string; featured: boolean; fromSubmission?: boolean; capacity?: number; duration?: string; tags?: string[]; status?: string };
type DirectoryItem = { id: string | number; name: string; industry: string; location: string; desc: string; website: string; tags: string; featured: boolean; boosted: boolean };
type ResourceItem = { id: string | number; title: string; category: string; url: string; tags: string; desc: string; featured: boolean };
type AwardItem = { id: string | number; name: string; category: string; desc: string; nominationsOpen: boolean; awardDate: string; sponsor: string };
type WebinarItem = { id: string | number; title: string; speaker: string; speakerRole: string; date: string; time: string; duration: string; category: string; desc: string };
type SupperClubItem = { id: string | number; title: string; date: string; time: string; location: string; capacity: string; desc: string; inviteOnly: boolean };

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function SuccessBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{ background: '#f0faf2', border: '1px solid #b2dfbd', padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CheckCircle size={16} style={{ color: '#27ae60', flexShrink: 0 }} />
        <span style={{ color: '#1e7e34', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '14px' }}>{message}</span>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#27ae60', cursor: 'pointer', padding: 0 }}><X size={16} /></button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', color: '#9a9585', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: '#fafafa', border: '1px solid #e0e0e0',
  color: '#111', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box',
};
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 90, resize: 'vertical' };
const checkboxRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#444', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' };

function ActionBtns({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid #e2e0d8', color: '#555', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#e7b605'; e.currentTarget.style.color = '#e7b605'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#555'; }}>
        <Pencil size={12} /> Edit
      </button>
      <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid #e2e0d8', color: '#9a9585', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#9a9585'; }}>
        <Trash2 size={12} /> Delete
      </button>
    </div>
  );
}

function SubmitRow({ editing, onCancel, addLabel }: { editing: boolean; onCancel: () => void; addLabel: string }) {
  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
      <button type="submit" style={{ padding: '14px 32px', background: '#e7b605', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', color: '#000', display: 'flex', alignItems: 'center', gap: 8 }}>
        {editing ? <><Pencil size={15} /> Save Changes</> : <><Plus size={15} /> {addLabel}</>}
      </button>
      {editing && (
        <button type="button" onClick={onCancel} style={{ padding: '14px 24px', background: 'transparent', border: '1px solid #2a2a2a', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', color: '#888' }}>
          Cancel
        </button>
      )}
    </div>
  );
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
const blankEvent = { title: '', date: '', time: '', location: '', category: '', price: '', host: '', desc: '', featured: false, capacity: '', isOnline: false, duration: '', tags: '' };

function EventsSection({ onSuccess, setConfirmModal }: { onSuccess: (msg: string) => void; setConfirmModal: any }) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [form, setForm] = useState(blankEvent);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof blankEvent, string>>>({});
  const [editId, setEditId] = useState<string | number | null>(null);

  const set = (key: string, value: string | boolean) => {
    setForm(prevForm => ({ ...prevForm, [key]: value }));
    if (errors[key as keyof typeof blankEvent]) {
      setErrors(prevErrors => ({ ...prevErrors, [key]: undefined }));
    }
  };

  const getFieldStyle = (key: keyof typeof blankEvent) => ({
    ...inputStyle,
    border: errors[key] ? '1px solid #c0392b' : '1px solid #e0e0e0',
  });

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events?adminView=true');
        if (res.ok) {
          const dbData = await res.json();
          const mapped: EventItem[] = dbData.map((e: any) => ({
            id: e.id,
            title: e.title,
            date: e.date,
            time: e.time,
            location: e.location,
            category: e.category,
            price: e.price || '',
            host: e.host || '',
            desc: e.description || '',
            featured: e.featured || false,
            fromSubmission: true,
            capacity: e.capacity || 50,
            duration: e.duration || '2 Hours',
            tags: e.tags || [],
            status: e.status || 'PENDING',
          }));
          setItems(mapped);
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      }
    }
    loadEvents();
  }, []);

  function handleOnlineToggle() {
    setForm(prev => ({
      ...prev,
      isOnline: !prev.isOnline,
      location: !prev.isOnline ? 'Meeting link provided upon registration' : '',
    }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tempErrors: Partial<Record<keyof typeof blankEvent, string>> = {};

    if (!form.title.trim()) tempErrors.title = 'Please enter a valid title.';
    if (!form.category.trim()) tempErrors.category = 'Please select a valid category.';
    if (!form.date) tempErrors.date = 'Please enter a valid date.';
    if (!form.time) tempErrors.time = 'Please enter a valid time.';
    if (!form.isOnline && !form.location.trim()) tempErrors.location = 'Please enter a valid location.';

    // Capacity validation
    if (!form.capacity.trim() || isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) {
      tempErrors.capacity = 'Please enter a valid capacity.';
    }

    // Description validation
    if (!form.desc || !form.desc.trim()) {
      tempErrors.desc = 'Please enter a valid description.';
    }

    // Duration validation
    const durationTrimmed = String(form.duration).trim();
    if (!durationTrimmed || isNaN(Number(durationTrimmed)) || Number(durationTrimmed) <= 0) {
      tempErrors.duration = 'Please enter a valid duration.';
    }

    // Price validation and auto-formatting
    let finalPrice = form.price.trim();
    if (finalPrice) {
      const isKnownText = ['free', 'members only', 'members-only', 'invite only', 'invite-only', 'tbd'].includes(finalPrice.toLowerCase());
      const isNumericPrice = /^\$?\d+(?:\.\d{2})?$/.test(finalPrice);
      if (!isKnownText && !isNumericPrice) {
        tempErrors.price = 'Please enter "Free", "Members Only", or a valid dollar amount (e.g. "$45" or "45").';
      } else if (/^\d+(?:\.\d{2})?$/.test(finalPrice)) {
        finalPrice = `$${finalPrice}`;
      }
    } else {
      finalPrice = 'Free';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      // Scroll to the first error input field
      const firstErrKey = Object.keys(tempErrors)[0];
      const el = document.getElementsByName(firstErrKey)[0];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});

    const formattedDuration = `${durationTrimmed} Hours`;

    // Parse tags to array
    const tagsArray = form.tags
      ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    try {
      if (editId !== null) {
        const res = await fetch(`/api/events/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.desc,
            date: form.date,
            time: form.time,
            location: form.location,
            category: form.category,
            price: finalPrice,
            host: form.host,
            featured: form.featured,
            capacity: Number(form.capacity),
            duration: formattedDuration,
            tags: tagsArray,
          })
        });
        if (res.ok) {
          const updatedItem: EventItem = {
            ...form,
            price: finalPrice,
            id: editId,
            fromSubmission: items.find(i => i.id === editId)?.fromSubmission || false,
            capacity: Number(form.capacity),
            duration: formattedDuration,
            tags: tagsArray
          };
          setItems(items.map(i => i.id === editId ? updatedItem : i));
          onSuccess('Event updated successfully in database.');
          setEditId(null);
          setForm(blankEvent);
        } else {
          const data = await res.json();
          alert(`Error updating event: ${data.error || 'Unknown error'}`);
        }
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.desc,
            date: form.date,
            time: form.time,
            location: form.location,
            category: form.category,
            price: finalPrice,
            host: form.host,
            featured: form.featured,
            capacity: Number(form.capacity),
            duration: formattedDuration,
            tags: tagsArray,
          })
        });
        if (res.ok) {
          const data = await res.json();
          const created = data.event;
          setItems([...items, {
            id: created.id,
            title: created.title,
            date: created.date,
            time: created.time,
            location: created.location,
            category: created.category,
            price: created.price || '',
            host: created.host || '',
            desc: created.description || '',
            featured: created.featured || false,
            fromSubmission: false,
            capacity: created.capacity || 50,
            duration: created.duration || '2 Hours',
            tags: created.tags || [],
          }]);
          onSuccess('Event added successfully to database.');
          setForm(blankEvent);
        } else {
          const data = await res.json();
          alert(`Error adding event: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Network or server error occurred.');
    }
  }

  function handleEdit(item: EventItem) {
    const isOnline = item.location ? (
      item.location.toLowerCase().includes('online') ||
      item.location.toLowerCase().includes('zoom') ||
      item.location.toLowerCase().includes('meeting link') ||
      item.location.toLowerCase().includes('provided upon registration')
    ) : false;

    setForm({
      title: item.title,
      date: item.date,
      time: item.time,
      location: item.location,
      category: item.category,
      price: item.price,
      host: item.host,
      desc: item.desc,
      featured: item.featured,
      capacity: item.capacity ? String(item.capacity) : '50',
      isOnline: isOnline,
      duration: item.duration ? String(parseFloat(item.duration) || 2) : '2',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    });
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string | number) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Event',
      message: 'Are you sure you want to permanently delete this event from the database?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/events/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setItems(items.filter(i => i.id !== id));
            onSuccess('Event deleted from database.');
          } else {
            const data = await res.json();
            alert(`Error deleting event: ${data.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error(err);
          alert('Network error occurred while trying to delete event.');
        }
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid-form" style={{ gap: 20 }}>
        <Field label="Event Title">
          <input
            name="title"
            required
            style={getFieldStyle('title')}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Founders Networking Night"
          />
          <FormError msg={errors.title} />
        </Field>

        <Field label="Category">
          <select
            name="category"
            style={getFieldStyle('category')}
            value={form.category}
            onChange={e => set('category', e.target.value)}
          >
            <option value="">Select Category</option>
            {['Networking', 'Workshop', 'Webinar', 'Supper Club', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
          <FormError msg={errors.category} />
        </Field>

        <Field label="Date">
          <input
            name="date"
            required
            style={getFieldStyle('date')}
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
          <FormError msg={errors.date} />
        </Field>

        <Field label="Time">
          <input
            name="time"
            required
            style={getFieldStyle('time')}
            type="time"
            value={form.time}
            onChange={e => set('time', e.target.value)}
          />
          <FormError msg={errors.time} />
        </Field>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Field label="Location">
            <input
              name="location"
              required={!form.isOnline}
              style={{ ...getFieldStyle('location'), opacity: form.isOnline ? 0.6 : 1 }}
              disabled={form.isOnline}
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder={form.isOnline ? 'Meeting link provided upon registration' : 'e.g. The Commons, Calgary'}
            />
            <FormError msg={errors.location} />
          </Field>
          <label style={checkboxRowStyle}>
            <input
              type="checkbox"
              checked={form.isOnline}
              onChange={handleOnlineToggle}
              style={{ width: 16, height: 16, accentColor: '#e7b605', cursor: 'pointer' }}
            />
            This is an online event
          </label>
        </div>

        <Field label="Price">
          <input
            name="price"
            style={getFieldStyle('price')}
            value={form.price}
            onChange={e => set('price', e.target.value)}
            placeholder="e.g. Free / $50 / Members Only"
          />
          <FormError msg={errors.price} />
        </Field>

        <Field label="Host / Organizer">
          <input
            name="host"
            style={getFieldStyle('host')}
            value={form.host}
            onChange={e => set('host', e.target.value)}
            placeholder="e.g. Founders Edge"
          />
          <FormError msg={errors.host} />
        </Field>

        <Field label="Capacity">
          <input
            name="capacity"
            style={getFieldStyle('capacity')}
            type="number"
            min="1"
            value={form.capacity}
            onChange={e => set('capacity', e.target.value)}
            placeholder="e.g. 50"
          />
          <FormError msg={errors.capacity} />
        </Field>

        <Field label="Duration (Hours)">
          <input
            name="duration"
            type="number"
            min="1"
            step="0.5"
            required
            style={getFieldStyle('duration')}
            value={form.duration}
            onChange={e => set('duration', e.target.value)}
            placeholder="e.g. 2"
          />
          <FormError msg={errors.duration} />
        </Field>

        <Field label="Tags (comma-separated)">
          <input
            name="tags"
            style={getFieldStyle('tags')}
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="e.g. YYC, Tech, Networking"
          />
          <FormError msg={errors.tags} />
        </Field>

        <Field label="Featured">
          <label style={checkboxRowStyle}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={e => set('featured', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#e7b605' }}
            />
            Mark as featured event
          </label>
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Description">
            <textarea
              name="desc"
              required
              style={{
                ...textareaStyle,
                border: errors.desc ? '1px solid #c0392b' : '1px solid #e0e0e0',
              }}
              value={form.desc}
              onChange={e => set('desc', e.target.value)}
              placeholder="Describe the event..."
            />
            <FormError msg={errors.desc} />
          </Field>
        </div>

        <SubmitRow editing={editId !== null} onCancel={() => { setEditId(null); setForm(blankEvent); setErrors({}); }} addLabel="Add Event" />
      </form>
      <ItemTable items={items} columns={['Title', 'Date', 'Category', 'Source', 'Status', 'Featured']} getRow={i => [i.title, i.date || '—', i.category, i.fromSubmission ? '📋 Submission' : '✏️ Manual', i.status || 'PENDING', i.featured ? 'Yes' : 'No']} onEdit={handleEdit} onDelete={handleDelete} />
    </>
  );
}

function FormError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div style={{ color: '#c0392b', fontSize: '12px', fontWeight: 600, marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>
      {msg}
    </div>
  );
}

// ─── DIRECTORY ────────────────────────────────────────────────────────────────
const blankDir = { name: '', industry: 'Technology', location: 'Calgary', desc: '', website: '', tags: '', featured: false, boosted: false };

function DirectorySection({ onSuccess, setConfirmModal }: { onSuccess: (msg: string) => void; setConfirmModal: any }) {
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [form, setForm] = useState(blankDir);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [nextId, setNextId] = useState(1);
  const set = (key: string, value: string | boolean) => setForm(prevForm => ({ ...prevForm, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId !== null) {
      setItems(items.map(i => i.id === editId ? { ...form, id: editId } : i));
      onSuccess('Business listing updated.');
      setEditId(null);
    } else {
      setItems([...items, { ...form, id: nextId }]);
      setNextId(n => n + 1);
      onSuccess('Business listing added.');
    }
    setForm(blankDir);
  }

  function handleEdit(item: DirectoryItem) {
    setForm({ name: item.name, industry: item.industry, location: item.location, desc: item.desc, website: item.website, tags: item.tags, featured: item.featured, boosted: item.boosted });
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: string | number) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Listing',
      message: 'Are you sure you want to delete this listing?',
      onConfirm: () => {
        setItems(items.filter(i => i.id !== id));
        onSuccess('Listing deleted.');
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid-form" style={{ gap: 20 }}>
        <Field label="Business Name"><input required style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. NorthTech Solutions" /></Field>
        <Field label="Industry"><select style={inputStyle} value={form.industry} onChange={e => set('industry', e.target.value)}>{['Technology', 'Marketing', 'Finance', 'Legal', 'HR & People', 'Design', 'Health & Wellness', 'Construction', 'Other'].map(i => <option key={i}>{i}</option>)}</select></Field>
        <Field label="Location"><input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Calgary, AB" /></Field>
        <Field label="Website"><input style={inputStyle} type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." /></Field>
        <Field label="Tags (comma-separated)"><input style={inputStyle} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. SaaS, B2B, AI" /></Field>
        <Field label="Listing Options">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#e7b605' }} /> Featured listing</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.boosted} onChange={e => set('boosted', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#e7b605' }} /> Boosted (top placement)</label>
          </div>
        </Field>
        <div style={{ gridColumn: '1 / -1' }}><Field label="Description"><textarea style={textareaStyle} value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="Describe the business..." /></Field></div>
        <SubmitRow editing={editId !== null} onCancel={() => { setEditId(null); setForm(blankDir); }} addLabel="Add Business" />
      </form>
      <ItemTable items={items} columns={['Business', 'Industry', 'Location', 'Featured']} getRow={i => [i.name, i.industry, i.location, i.featured ? 'Yes' : 'No']} onEdit={handleEdit} onDelete={handleDelete} />
    </>
  );
}

// ─── RESOURCES ────────────────────────────────────────────────────────────────
const blankPartner = { name: '', logo_url: '', short_desc: '', long_desc: '', website: '' };
const blankRes = { partner_id: '', title: '', description: '', url: '', type: 'Grant', category: 'Funding', featured: false };

function ResourcesSection({ onSuccess, setConfirmModal }: { onSuccess: (msg: string) => void; setConfirmModal: any }) {
  const [subTab, setSubTab] = useState<'partners' | 'resources'>('partners');

  // Partners state
  const [partners, setPartners] = useState<any[]>([]);
  const [partnerForm, setPartnerForm] = useState(blankPartner);
  const [editPartnerId, setEditPartnerId] = useState<string | null>(null);

  // Resources state
  const [resourcesList, setResourcesList] = useState<any[]>([]);
  const [resForm, setResForm] = useState(blankRes);
  const [editResId, setEditResId] = useState<string | null>(null);

  const setPartnerField = (key: string, value: string) => setPartnerForm(p => ({ ...p, [key]: value }));
  const setResField = (key: string, value: string | boolean) => setResForm(p => ({ ...p, [key]: value }));

  useEffect(() => {
    loadPartners();
    loadResources();
  }, []);

  async function loadPartners() {
    try {
      const res = await fetch('/api/partners');
      if (res.ok) setPartners(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function loadResources() {
    try {
      const res = await fetch('/api/resources');
      if (res.ok) setResourcesList(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  // Partner Handlers
  async function handlePartnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editPartnerId ? `/api/partners/${editPartnerId}` : '/api/partners';
      const method = editPartnerId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerForm)
      });
      if (res.ok) {
        onSuccess(editPartnerId ? 'Partner updated.' : 'Partner added.');
        setEditPartnerId(null);
        setPartnerForm(blankPartner);
        loadPartners();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPartnerField('logo_url', data.url);
        onSuccess('Logo uploaded successfully.');
      } else {
        alert(data.error || 'Failed to upload image.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }
  }

  function handleEditPartner(partner: any) {
    setPartnerForm({
      name: partner.name || '',
      logo_url: partner.logo_url || '',
      short_desc: partner.short_desc || '',
      long_desc: partner.long_desc || '',
      website: partner.website || '',
    });
    setEditPartnerId(partner.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDeletePartner(id: string | number) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Partner',
      message: 'Are you sure you want to delete this partner? This will delete all their resources too.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
          if (res.ok) {
            onSuccess('Partner deleted.');
            loadPartners();
            loadResources();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  }

  // Resource Handlers
  async function handleResSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editResId ? `/api/resources/${editResId}` : '/api/resources';
      const method = editResId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resForm)
      });
      if (res.ok) {
        onSuccess(editResId ? 'Resource updated.' : 'Resource added.');
        setEditResId(null);
        setResForm(blankRes);
        loadResources();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleEditRes(resource: any) {
    setResForm({
      partner_id: resource.partner_id || '',
      title: resource.title || '',
      description: resource.description || '',
      url: resource.url || '',
      type: resource.type || 'Grant',
      category: resource.category || 'Funding',
      featured: resource.featured || false,
    });
    setEditResId(resource.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDeleteRes(id: string | number) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Resource',
      message: 'Are you sure you want to delete this resource?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
          if (res.ok) {
            onSuccess('Resource deleted.');
            loadResources();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, borderBottom: '2px solid var(--gray-100)', paddingBottom: 16 }}>
        <button
          type="button"
          onClick={() => setSubTab('partners')}
          style={{
            padding: '8px 16px', background: subTab === 'partners' ? 'var(--gold)' : 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px',
            color: subTab === 'partners' ? 'var(--black)' : 'var(--gray-600)',
          }}
        >
          Manage Partners
        </button>
        <button
          type="button"
          onClick={() => setSubTab('resources')}
          style={{
            padding: '8px 16px', background: subTab === 'resources' ? 'var(--gold)' : 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px',
            color: subTab === 'resources' ? 'var(--black)' : 'var(--gray-600)',
          }}
        >
          Manage Resources
        </button>
      </div>

      {subTab === 'partners' ? (
        <>
          <form onSubmit={handlePartnerSubmit} className="grid-form" style={{ gap: 20, marginBottom: 40 }}>
            <Field label="Partner Name">
              <input required style={inputStyle} value={partnerForm.name} onChange={e => setPartnerField('name', e.target.value)} placeholder="e.g. Platform Calgary" />
            </Field>
            <Field label="Logo URL">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input style={{ ...inputStyle, flex: 1 }} value={partnerForm.logo_url} onChange={e => setPartnerField('logo_url', e.target.value)} placeholder="e.g. https://website.com/logo.png" />
                <label style={{
                  padding: '12px 16px', background: 'var(--black)', color: 'var(--gold)',
                  borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: '42px', width: '45px'
                }} title="Upload local image">
                  <Upload size={18} />
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px', display: 'block', fontFamily: 'var(--font-sans)' }}>
                Tip: Paste an image URL from the web or click the upload button to select a local file.
              </span>
            </Field>
            <Field label="Website URL">
              <input style={inputStyle} value={partnerForm.website} onChange={e => setPartnerField('website', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Short Description">
              <input style={inputStyle} value={partnerForm.short_desc} onChange={e => setPartnerField('short_desc', e.target.value)} placeholder="Brief summary for partner grid card..." />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Long Description / Bio">
                <textarea style={textareaStyle} value={partnerForm.long_desc} onChange={e => setPartnerField('long_desc', e.target.value)} placeholder="Full overview shown on partner profile page..." />
              </Field>
            </div>
            <SubmitRow editing={editPartnerId !== null} onCancel={() => { setEditPartnerId(null); setPartnerForm(blankPartner); }} addLabel="Add Partner" />
          </form>
          <ItemTable
            items={partners}
            columns={['Name', 'Website', 'Short Desc']}
            getRow={p => [p.name, p.website || 'N/A', p.short_desc || 'N/A']}
            onEdit={handleEditPartner}
            onDelete={handleDeletePartner}
          />
        </>
      ) : (
        <>
          <form onSubmit={handleResSubmit} className="grid-form" style={{ gap: 20, marginBottom: 40 }}>
            <Field label="Associated Partner">
              <select required style={inputStyle} value={resForm.partner_id} onChange={e => setResField('partner_id', e.target.value)}>
                <option value="">-- Select Partner --</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Resource Title">
              <input required style={inputStyle} value={resForm.title} onChange={e => setResField('title', e.target.value)} placeholder="e.g. Voucher Program" />
            </Field>
            <Field label="Resource Type">
              <select style={inputStyle} value={resForm.type} onChange={e => setResField('type', e.target.value)}>
                {['Grant', 'Program', 'Discount', 'Tool', 'Advisory', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select style={inputStyle} value={resForm.category} onChange={e => setResField('category', e.target.value)}>
                {['Funding', 'Business Services', 'Tax & Grants', 'Innovation & IP', 'Banking & Finance', 'Ecosystem', 'Export & Trade'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="URL">
              <input required style={inputStyle} type="url" value={resForm.url} onChange={e => setResField('url', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Editor's Pick">
              <label style={checkboxRowStyle}>
                <input type="checkbox" checked={resForm.featured} onChange={e => setResField('featured', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#e7b605' }} />
                Mark as Editor's Pick
              </label>
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Description">
                <textarea style={textareaStyle} value={resForm.description} onChange={e => setResField('description', e.target.value)} placeholder="Describe this resource..." />
              </Field>
            </div>
            <SubmitRow editing={editResId !== null} onCancel={() => { setEditResId(null); setResForm(blankRes); }} addLabel="Add Resource" />
          </form>
          <ItemTable
            items={resourcesList}
            columns={['Title', 'Partner', 'Type', 'Category']}
            getRow={r => [r.title, r.partner?.name || 'Unknown', r.type, r.category]}
            onEdit={handleEditRes}
            onDelete={handleDeleteRes}
          />
        </>
      )}
    </>
  );
}

// ─── AWARDS ───────────────────────────────────────────────────────────────────
export type Award = {
  id: string;
  name: string;
  org: string;
  category: string;
  region: string;
  deadline: string;
  awardDate: string;
  value: string;
  cycle: string;
  desc: string;
  featured: boolean;
  nominationsOpen: boolean;
  sponsor?: string;
};

const blankAward: Omit<Award, 'id'> = {
  name: '',
  org: '',
  category: '',
  region: '',
  deadline: '',
  awardDate: '',
  value: '',
  cycle: '',
  desc: '',
  featured: false,
  nominationsOpen: true,
  sponsor: '',
};

function AwardsSection({ onSuccess, setConfirmModal }: { onSuccess: (msg: string) => void; setConfirmModal: any }) {
  const [items, setItems] = useState<Award[]>([]);
  const [form, setForm] = useState(blankAward);
  const [editId, setEditId] = useState<string | null>(null);
  const set = (key: string, value: string | boolean) => setForm(prevForm => ({ ...prevForm, [key]: value }));


  useEffect(() => {
    async function loadAwards() {
      try {
        const res = await fetch('/api/awards');
        if (res.ok) {
          const dbData = await res.json();
          const mapped: Award[] = dbData.map((a: any) => ({
            ...a,
            awardDate: a.award_date || a.awardDate || '',
          }));
          setItems(mapped);
        } else {
          console.error('Failed to load awards from database')
        }
      } catch (error) {
        console.error('Error loading awards:', error);
      }
    }

    loadAwards();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId !== null) {
      try {
        const res = await fetch(`/api/awards/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            org: form.org,
            category: form.category,
            region: form.region,
            deadline: form.deadline,
            awardDate: form.awardDate,
            value: form.value,
            cycle: form.cycle,
            desc: form.desc,
            featured: form.featured,
            nominationsOpen: form.nominationsOpen,
            sponsor: form.sponsor,
          }),
        });

        if (res.ok) {
          const updatedAward = await res.json();
          const mapped: Award = {
            ...updatedAward,
            awardDate: updatedAward.award_date || updatedAward.awardDate || '',
          };
          setItems(items.map(i => i.id === editId ? mapped : i));
          onSuccess('Award updated.');
          setEditId(null);
          setForm(blankAward);
        } else {
          alert('Error updating award');
        }
      } catch (err) {
        console.error('Network error updating award:', err);
      }
    } else {
      try {
        const res = await fetch('/api/awards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            org: form.org,
            category: form.category,
            region: form.region,
            deadline: form.deadline,
            awardDate: form.awardDate,
            value: form.value,
            cycle: form.cycle,
            desc: form.desc,
            featured: form.featured,
            nominationsOpen: form.nominationsOpen,
            sponsor: form.sponsor,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const createdAward = data.award || data;
          const mapped: Award = {
            ...createdAward,
            awardDate: createdAward.award_date || createdAward.awardDate || '',
          };
          setItems([...items, mapped]);
          onSuccess('Award added successfully to database.');
          setForm(blankAward);
        } else {
          alert('Error adding award to database');
        }
      } catch (err) {
        console.error('Network error creating award:', err);
      }
    }
  }

  function handleEdit(item: Award) {
    setForm({
      name: item.name,
      org: item.org,
      category: item.category,
      region: item.region,
      deadline: item.deadline,
      awardDate: item.awardDate,
      value: item.value,
      cycle: item.cycle,
      desc: item.desc,
      featured: item.featured,
      nominationsOpen: item.nominationsOpen,
      sponsor: item.sponsor ?? '',
    });
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string | number) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Award',
      message: 'Are you sure you want to permanently delete this award?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/awards/${id}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            setItems(items.filter(i => i.id !== id));
            onSuccess('Award deleted successfully.');
          } else {
            alert('Error deleting award from database');
          }
        } catch (err) {
          console.error('Network error deleting award:', err);
        }
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid-form" style={{ gap: 20 }}>
        <Field label="Award Name"><input required style={inputStyle} value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Entrepreneur of the Year" /></Field>
        <Field label="Category">
          <select
            required
            style={inputStyle}
            value={form.category || ''}
            onChange={e => set('category', e.target.value)}
          >
            <option value="">Select Category</option>
            {['General Business', 'Technology', 'Women in Business', 'Leadership', 'SMB', 'Media & Content', 'Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Award Date"><input required style={inputStyle} type="date" value={form.awardDate || ''} onChange={e => set('awardDate', e.target.value)} /></Field>
        <Field label="Sponsor / Partner"><input style={inputStyle} value={form.sponsor || ''} onChange={e => set('sponsor', e.target.value)} placeholder="e.g. ATB Financial" /></Field>
        <Field label="Organizer / Presenter"><input required style={inputStyle} value={form.org || ''} onChange={e => set('org', e.target.value)} placeholder="e.g. Founders Edge" /></Field>
        <Field label="Region">
          <select
            required
            style={inputStyle}
            value={form.region || ''}
            onChange={e => set('region', e.target.value)}
          >
            <option value="">Select Region</option>
            {['Calgary', 'Alberta', 'Western Canada', 'National'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Nomination Deadline"><input required style={inputStyle} type="date" value={form.deadline || ''} onChange={e => set('deadline', e.target.value)} /></Field>
        <Field label="Prize value"><input required style={inputStyle} value={form.value || ''} onChange={e => set('value', e.target.value)} placeholder="e.g. Prestige, $5,000 Grant, Trophy" /></Field>
        <Field label="Cycle / Frequency"><input required style={inputStyle} value={form.cycle || ''} onChange={e => set('cycle', e.target.value)} placeholder="e.g. Annual, Monthly, One-time" /></Field>

        <Field label="Award Options">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={!!form.nominationsOpen}
                onChange={e => set('nominationsOpen', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#e7b605' }}
              />
              Nominations currently open
            </label>
            <label style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={!!form.featured}
                onChange={e => set('featured', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#e7b605' }}
              />
              Featured award
            </label>
          </div>
        </Field>
        <div style={{ gridColumn: '1 / -1' }}><Field label="Description"><textarea style={textareaStyle} value={form.desc || ''} onChange={e => set('desc', e.target.value)} placeholder="Describe this award..." /></Field></div>
        <SubmitRow editing={editId !== null} onCancel={() => { setEditId(null); setForm(blankAward); }} addLabel="Add Award" />
      </form>
      <ItemTable items={items} columns={['Award', 'Category', 'Nominations', 'Sponsor']} getRow={i => [i.name, i.category, i.nominationsOpen ? 'Open' : 'Closed', i.sponsor || '—']} onEdit={handleEdit} onDelete={handleDelete} />
    </>
  );
}

// ─── WEBINARS ─────────────────────────────────────────────────────────────────
const blankWebinar = { title: '', speaker: '', speakerRole: '', date: '', time: '', duration: '', category: 'Sales', desc: '' };

function WebinarsSection({ onSuccess, setConfirmModal }: { onSuccess: (msg: string) => void; setConfirmModal: any }) {
  const [items, setItems] = useState<WebinarItem[]>([]);
  const [form, setForm] = useState(blankWebinar);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [nextId, setNextId] = useState(1);
  const set = (key: string, value: string) => setForm(prevForm => ({ ...prevForm, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId !== null) {
      setItems(items.map(i => i.id === editId ? { ...form, id: editId } : i));
      onSuccess('Webinar updated.');
      setEditId(null);
    } else {
      setItems([...items, { ...form, id: nextId }]);
      setNextId(n => n + 1);
      onSuccess('Webinar added.');
    }
    setForm(blankWebinar);
  }

  function handleEdit(item: WebinarItem) {
    setForm({ title: item.title, speaker: item.speaker, speakerRole: item.speakerRole, date: item.date, time: item.time, duration: item.duration, category: item.category, desc: item.desc });
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: string | number) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Webinar',
      message: 'Are you sure you want to delete this webinar?',
      onConfirm: () => {
        setItems(items.filter(i => i.id !== id));
        onSuccess('Webinar deleted.');
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid-form" style={{ gap: 20 }}>
        <Field label="Webinar Title"><input required style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Scaling Your Sales Team" /></Field>
        <Field label="Category"><select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>{['Sales', 'Finance', 'Funding', 'HR & People', 'Marketing', 'Operations', 'Legal', 'Technology'].map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Speaker Name"><input required style={inputStyle} value={form.speaker} onChange={e => set('speaker', e.target.value)} placeholder="e.g. Jane Smith" /></Field>
        <Field label="Speaker Title / Role"><input style={inputStyle} value={form.speakerRole} onChange={e => set('speakerRole', e.target.value)} placeholder="e.g. CEO, NorthTech" /></Field>
        <Field label="Date"><input required style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="Time"><input required style={inputStyle} type="time" value={form.time} onChange={e => set('time', e.target.value)} /></Field>
        <Field label="Duration"><input style={inputStyle} value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 60 min" /></Field>
        <div style={{ gridColumn: '1 / -1' }}><Field label="Description"><textarea style={textareaStyle} value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="What will attendees learn?" /></Field></div>
        <SubmitRow editing={editId !== null} onCancel={() => { setEditId(null); setForm(blankWebinar); }} addLabel="Add Webinar" />
      </form>
      <ItemTable items={items} columns={['Title', 'Speaker', 'Date', 'Category']} getRow={i => [i.title, i.speaker, i.date || '—', i.category]} onEdit={handleEdit} onDelete={handleDelete} />
    </>
  );
}

// ─── SUPPER CLUB ──────────────────────────────────────────────────────────────
const blankSC = { title: '', date: '', time: '', location: '', capacity: '', desc: '', inviteOnly: true };

function SupperClubSection({ onSuccess, setConfirmModal }: { onSuccess: (msg: string) => void; setConfirmModal: any }) {
  const [items, setItems] = useState<SupperClubItem[]>([]);
  const [form, setForm] = useState(blankSC);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [nextId, setNextId] = useState(1);
  const set = (key: string, value: string | boolean) => setForm(prevForm => ({ ...prevForm, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId !== null) {
      setItems(items.map(i => i.id === editId ? { ...form, id: editId } : i));
      onSuccess('Supper Club event updated.');
      setEditId(null);
    } else {
      setItems([...items, { ...form, id: nextId }]);
      setNextId(n => n + 1);
      onSuccess('Supper Club event added.');
    }
    setForm(blankSC);
  }

  function handleEdit(item: SupperClubItem) {
    setForm({ title: item.title, date: item.date, time: item.time, location: item.location, capacity: item.capacity, desc: item.desc, inviteOnly: item.inviteOnly });
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: string | number) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Supper Club Event',
      message: 'Are you sure you want to delete this supper club event?',
      onConfirm: () => {
        setItems(items.filter(i => i.id !== id));
        onSuccess('Event deleted.');
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid-form" style={{ gap: 20 }}>
        <Field label="Event Title"><input required style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Q1 Founders Dinner" /></Field>
        <Field label="Location"><input required style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Charcut Roast House, Calgary" /></Field>
        <Field label="Date"><input required style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="Time"><input required style={inputStyle} type="time" value={form.time} onChange={e => set('time', e.target.value)} /></Field>
        <Field label="Capacity (seats)"><input style={inputStyle} type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="e.g. 12" /></Field>
        <Field label="Access"><label style={checkboxRowStyle}><input type="checkbox" checked={form.inviteOnly} onChange={e => set('inviteOnly', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#e7b605' }} /> Invite only</label></Field>
        <div style={{ gridColumn: '1 / -1' }}><Field label="Description"><textarea style={textareaStyle} value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="Describe this supper club event..." /></Field></div>
        <SubmitRow editing={editId !== null} onCancel={() => { setEditId(null); setForm(blankSC); }} addLabel="Add Supper Club Event" />
      </form>
      <ItemTable items={items} columns={['Event', 'Date', 'Location', 'Capacity']} getRow={i => [i.title, i.date || '—', i.location, i.capacity || '—']} onEdit={handleEdit} onDelete={handleDelete} />
    </>
  );
}

// ─── ITEM TABLE ───────────────────────────────────────────────────────────────
function ItemTable<T extends { id: string | number }>({ items, columns, getRow, onEdit, onDelete }: {
  items: T[]; columns: string[]; getRow: (item: T) => string[]; onEdit: (item: T) => void; onDelete: (id: string | number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  // Reset selected checkboxes whenever the items dataset changes (e.g. changing tabs or deleting items)
  useEffect(() => {
    setSelectedIds([]);
  }, [items]);

  if (items.length === 0) return null;

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const toggleSelectRow = (id: string | number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to permanently delete the ${selectedIds.length} selected item(s)?`)) {
      // Loop through all selected IDs and run page-provided delete handler
      for (const id of selectedIds) {
        await onDelete(id);
      }
      setSelectedIds([]);
    }
  };

  return (
    <div style={{ marginTop: 40, borderTop: '1px solid #e2e0d8', paddingTop: 32 }}>
      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderBottom: 'none', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#5a5650', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleBulkDelete}
              style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '8px 16px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase', borderRadius: 2, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              style={{ background: 'none', border: '1px solid #e2e0d8', color: '#5a5650', padding: '8px 16px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase', borderRadius: 2, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      <button type="button" onClick={() => setCollapsed(!collapsed)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#444', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        {items.length} existing {items.length === 1 ? 'entry' : 'entries'}
      </button>
      {!collapsed && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e0d8', background: '#fafaf8' }}>
                <th style={{ padding: '10px 14px', width: 40, textAlign: 'left' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#e7b605' }}
                  />
                </th>
                {columns.map(col => (
                  <th key={col} style={{ padding: '10px 14px', textAlign: 'left', color: '#9a9585', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '11px', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
                <th style={{ padding: '10px 14px', textAlign: 'center', color: '#9a9585', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '11px', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const row = getRow(item);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e0d8', background: idx % 2 === 0 ? '#fff' : '#fafaf8' }}>
                    <td style={{ padding: '12px 14px', width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelectRow(item.id)}
                        style={{ cursor: 'pointer', accentColor: '#e7b605' }}
                      />
                    </td>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: '12px 14px', color: ci === 0 ? '#111' : '#9a9585', fontWeight: ci === 0 ? 600 : 400, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</td>
                    ))}
                    <td style={{ padding: '12px 14px', display: 'flex', justifyContent: 'center' }}>
                      <ActionBtns onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  useEffect(() => {
    const checkAdminAccess = async () => {
      const res = await getProfile();

      if (!res.success || !res.user) {
        router.push('/login');
        return;
      }

      if ((res.user as any).role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      setCheckingAccess(false);
    };

    checkAdminAccess();
  }, [router]);
  useEffect(() => {
    const checkAdminAccess = async () => {
      const res = await getProfile();

      if (!res.success || !res.user) {
        router.push('/login');
        return;
      }

      if ((res.user as any).role !== 'ADMIN') {
        router.push('/dashboard');
      }
    };

    checkAdminAccess();
  }, [router]);
  // Track which section (Events, Directory, Resources, etc.) is currently open
  const [activeTab, setActiveTab] = useState<Tab>('events');
  // Store toast/success messages to display banner feedback to the admin
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  // Handle administrator log out and clear admin sessions
  async function handleLogout() {
    localStorage.removeItem('fe_admin');
    localStorage.removeItem('fe_my_submissions');
    await logout();
  }

  // Display a success banner temporarily and auto-hide it after 5 seconds
  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  }

  const activeTabData = tabs.find(t => t.id === activeTab)!;

  if (checkingAccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        color: '#e7b605',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 800,
        fontSize: '18px'
      }}>
        Checking admin access...
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', color: '#111' }}>
      {/* Top Bar */}
      <div style={{ background: '#000', borderBottom: '1px solid #1a1a1a', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
          <div style={{ width: 1, height: 24, background: '#2a2a2a' }} />
          <span className="admin-panel-label" style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</span>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid #2a2a2a', color: '#888', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#e7b605'; e.currentTarget.style.color = '#e7b605'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888'; }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Secondary Nav */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', display: 'flex', gap: 0, overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none', color: '#e7b605', borderBottom: '2px solid #e7b605', transition: 'all 0.2s' }}>
            <LayoutDashboard size={14} /> Content Manager
          </Link>
          <Link href="/admin/events" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none', color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <ClipboardList size={14} /> Review Events
          </Link>
          <Link href="/admin/offers" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none', color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Tag size={14} /> Review Offers
          </Link>
          <Link href="/admin/awards" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none', color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Trophy size={14} /> Review Awards
          </Link>
          <Link href="/admin/flagged" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none', color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Flag size={14} /> Flagged Content
          </Link>
          <Link href="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none', color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Users size={14} /> Users
          </Link>
          <Link href="/admin/roadmap" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none', color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}>
            <Milestone size={14} /> Roadmap Editor
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '32px', letterSpacing: '-0.02em', marginBottom: 6, color: '#111' }}>Content Manager</h1>
          <p style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif', fontSize: '15px' }}>Add, edit, and remove content across the Founders Edge platform.</p>
        </div>

        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 32, flexWrap: 'wrap' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSuccessMsg(''); }} style={{ padding: '12px 20px', background: isActive ? '#000' : '#fff', border: `1px solid ${isActive ? '#000' : '#e2e0d8'}`, color: isActive ? '#e7b605' : '#9a9585', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                <Icon size={15} />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(231,182,5,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <activeTabData.icon size={18} style={{ color: '#e7b605' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', color: '#111' }}>{activeTabData.label}</div>
              <div style={{ color: '#9a9585', fontSize: '13px', marginTop: 2, fontFamily: 'Noto Serif, serif' }}>Add new entries or edit / delete existing ones below.</div>
            </div>
          </div>

          {successMsg && <SuccessBanner message={successMsg} onClose={() => setSuccessMsg('')} />}

          {activeTab === 'events' && <EventsSection onSuccess={showSuccess} setConfirmModal={setConfirmModal} />}
          {activeTab === 'directory' && <DirectorySection onSuccess={showSuccess} setConfirmModal={setConfirmModal} />}
          {activeTab === 'resources' && <ResourcesSection onSuccess={showSuccess} setConfirmModal={setConfirmModal} />}
          {activeTab === 'awards' && <AwardsSection onSuccess={showSuccess} setConfirmModal={setConfirmModal} />}
          {activeTab === 'webinars' && <WebinarsSection onSuccess={showSuccess} setConfirmModal={setConfirmModal} />}
          {activeTab === 'supperclub' && <SupperClubSection onSuccess={showSuccess} setConfirmModal={setConfirmModal} />}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #e2e0d8',
            padding: '32px',
            maxWidth: '440px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 800,
              fontSize: '20px',
              color: '#2a2820',
              marginBottom: '12px'
            }}>
              {confirmModal.title}
            </h3>
            <p style={{
              fontFamily: 'Noto Serif, serif',
              color: '#5a5650',
              fontSize: '14px',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e2e0d8',
                  background: 'transparent',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#5a5650'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #c0392b',
                  background: '#c0392b',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
