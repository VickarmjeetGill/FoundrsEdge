'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Star, Link as LinkIcon, Calendar, Check, X, ShieldAlert } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: string;
  deadline?: string | null;
  source_url: string;
  featured: boolean;
  status: string;
  created_at: string;
};

const opportunityTypes = [
  'Grants',
  'Events',
  'Speaking',
  'Funding',
  'Pitch',
  'Media',
  'Procurement'
];

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'Grants',
    deadline: '',
    source_url: '',
    featured: false,
    status: 'ACTIVE'
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opportunities?status=ACTIVE');
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      showToast('Error loading opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const openAddModal = () => {
    setEditingOpp(null);
    setForm({
      title: '',
      description: '',
      type: 'Grants',
      deadline: '',
      source_url: '',
      featured: false,
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (opp: Opportunity) => {
    setEditingOpp(opp);
    setForm({
      title: opp.title,
      description: opp.description,
      type: opp.type,
      deadline: opp.deadline || '',
      source_url: opp.source_url,
      featured: opp.featured,
      status: opp.status
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.source_url) {
      showToast('Please fill out all required fields');
      return;
    }

    try {
      const url = editingOpp ? `/api/opportunities/${editingOpp.id}` : '/api/opportunities';
      const method = editingOpp ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(editingOpp ? 'Opportunity updated successfully ✓' : 'Opportunity created successfully ✓');
        setIsModalOpen(false);
        loadOpportunities();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save opportunity');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving opportunity');
    }
  };

  const toggleFeatured = async (opp: Opportunity) => {
    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !opp.featured }),
      });

      if (res.ok) {
        showToast(opp.featured ? 'Removed from featured' : 'Marked as featured');
        setOpportunities(prev => prev.map(o => o.id === opp.id ? { ...o, featured: !o.featured } : o));
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating featured status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Opportunity deleted');
        setOpportunities(prev => prev.filter(o => o.id !== id));
      } else {
        showToast('Failed to delete opportunity');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting opportunity');
    }
  };

  const filtered = opportunities.filter(opp => {
    const q = search.toLowerCase();
    return (
      opp.title.toLowerCase().includes(q) ||
      opp.description.toLowerCase().includes(q) ||
      opp.type.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout activeTab="opportunities">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px', width: '100%', boxSizing: 'border-box' }}>

        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '28px', color: '#2a2820', margin: 0, marginBottom: 6 }}>
              Opportunities
            </h1>
            <p style={{ margin: 0, color: '#9a9585', fontSize: '14px', fontFamily: 'Noto Serif, serif' }}>
              Create and edit grants, events, speaker and more for member to view.
            </p>
          </div>
          <button onClick={openAddModal} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
            <Plus size={16} /> Add Opportunity
          </button>
        </div>

        {/* Search & Stats */}
        <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 2 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#9a9585', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Total Opportunities: {opportunities.length}
          </div>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9585' }} />
            <input
              className="input-field"
              placeholder="Search opportunities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, margin: 0, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Table List */}
        {loading ? (
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '80px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#9a9585' }}>
            Loading opportunities list...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '80px', textAlign: 'center' }}>
            <ShieldAlert size={36} style={{ color: '#e2e0d8', marginBottom: 16 }} />
            <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
              No opportunities found
            </div>
            <div style={{ color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>
              Try searching for something else or add a new opportunity to get started.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(opp => (
              <div
                key={opp.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e0d8',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 20,
                  flexWrap: 'wrap',
                  borderLeft: opp.featured ? '4px solid #e7b605' : '1px solid #e2e0d8'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      padding: '2px 8px',
                      background: 'rgba(0,0,0,0.05)',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#5a5650'
                    }}>
                      {opp.type}
                    </span>
                    {opp.deadline && (
                      <span style={{ fontSize: '12px', color: '#9a9585', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {opp.deadline}
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '17px', color: '#2a2820', marginBottom: 4 }}>
                    {opp.title}
                  </h3>
                  <p style={{ margin: 0, color: '#5a5650', fontSize: '13px', lineHeight: 1.5, fontFamily: 'Noto Serif, serif' }}>
                    {opp.description}
                  </p>
                  <a
                    href={opp.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px', color: '#9b7011', textDecoration: 'none', marginTop: 8, fontWeight: 700 }}
                  >
                    <LinkIcon size={11} /> {opp.source_url}
                  </a>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => toggleFeatured(opp)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #e2e0d8',
                      padding: 8,
                      cursor: 'pointer',
                      color: opp.featured ? '#e7b605' : '#9a9585',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title={opp.featured ? "Unfeature" : "Feature"}
                  >
                    <Star size={16} fill={opp.featured ? '#e7b605' : 'transparent'} />
                  </button>
                  <button
                    onClick={() => openEditModal(opp)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #e2e0d8',
                      padding: 8,
                      cursor: 'pointer',
                      color: '#5a5650',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(opp.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #e2e0d8',
                      padding: 8,
                      cursor: 'pointer',
                      color: '#c0392b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation / Edit Form Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '32px', maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '20px' }}>
                {editingOpp ? 'Edit Opportunity' : 'Add New Opportunity'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9585' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#2a2820', textTransform: 'uppercase', marginBottom: 6 }}>Title *</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Alberta Innovates CASBE Grant"
                  required
                  style={{ margin: 0 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#2a2820', textTransform: 'uppercase', marginBottom: 6 }}>Type</label>
                  <select
                    className="select-field"
                    value={form.type}
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                    style={{ margin: 0 }}
                  >
                    {opportunityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#2a2820', textTransform: 'uppercase', marginBottom: 6 }}>Deadline</label>
                  <input
                    className="input-field"
                    value={form.deadline}
                    onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))}
                    placeholder="e.g. July 31, 2026"
                    style={{ margin: 0 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#2a2820', textTransform: 'uppercase', marginBottom: 6 }}>Source URL *</label>
                <input
                  className="input-field"
                  type="url"
                  value={form.source_url}
                  onChange={e => setForm(prev => ({ ...prev, source_url: e.target.value }))}
                  placeholder="https://example.com/apply"
                  required
                  style={{ margin: 0 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#2a2820', textTransform: 'uppercase', marginBottom: 6 }}>Description *</label>
                <textarea
                  className="input-field"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detail the opportunity requirements and details..."
                  required
                  rows={4}
                  style={{ resize: 'vertical', fontFamily: 'Noto Serif, serif' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                />
                <label htmlFor="featured" style={{ fontSize: '13px', fontWeight: 600, color: '#5a5650', cursor: 'pointer' }}>
                  Mark as Featured
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '12px 24px',
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
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '12px 24px', fontSize: '13px' }}
                >
                  {editingOpp ? 'Update Opportunity' : 'Create Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#000', color: '#fff', padding: '14px 24px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
