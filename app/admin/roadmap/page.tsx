'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ClipboardList, Tag, Trophy, Flag, Users, LogOut, 
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, RefreshCw, Milestone, ExternalLink, Activity
} from 'lucide-react';
import Logo from '@/components/Logo';
import { getProfile } from '@/app/actions/profile';
import { logout } from '@/app/actions/auth';
import AdminLayout from '@/components/AdminLayout';
import { 
  getAdminRoadmapSteps, 
  createRoadmapStep, 
  updateRoadmapStep, 
  deleteRoadmapStep, 
  reorderRoadmapSteps 
} from '@/app/actions/admin-roadmap';

type Track = 'START' | 'GROW' | 'SCALE';

export default function AdminRoadmapPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTrack, setActiveTrack] = useState<Track>('START');
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<any | null>(null);

  // Form Fields
  const [formFields, setFormFields] = useState({
    title: '',
    description: '',
    actionText: '',
    actionHref: ''
  });

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

      setAuthChecked(true);
    };

    checkAdminAccess();
  }, [router]);

  const loadSteps = async () => {
    setLoading(true);
    const res = await getAdminRoadmapSteps(activeTrack);
    if (res.success && res.steps) {
      setSteps(res.steps);
    } else {
      alert(res.error || 'Failed to load steps');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authChecked) {
      loadSteps();
    }
  }, [authChecked, activeTrack]);

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.title || !formFields.description || !formFields.actionText || !formFields.actionHref) {
      alert('Please fill out all fields');
      return;
    }

    setActionLoading(true);
    const res = await createRoadmapStep({
      track: activeTrack,
      ...formFields
    });
    setActionLoading(false);

    if (res.success) {
      setShowAddModal(false);
      setFormFields({ title: '', description: '', actionText: '', actionHref: '' });
      loadSteps();
    } else {
      alert(res.error || 'Failed to create step');
    }
  };

  const handleEditStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.title || !formFields.description || !formFields.actionText || !formFields.actionHref) {
      alert('Please fill out all fields');
      return;
    }

    setActionLoading(true);
    const res = await updateRoadmapStep(showEditModal.id, formFields);
    setActionLoading(false);

    if (res.success) {
      setShowEditModal(null);
      setFormFields({ title: '', description: '', actionText: '', actionHref: '' });
      loadSteps();
    } else {
      alert(res.error || 'Failed to update step');
    }
  };

  const handleDeleteStep = async () => {
    if (!showDeleteModal) return;

    setActionLoading(true);
    const res = await deleteRoadmapStep(showDeleteModal.id);
    setActionLoading(false);

    if (res.success) {
      setShowDeleteModal(null);
      loadSteps();
    } else {
      alert(res.error || 'Failed to delete step');
    }
  };

  const handleMoveStep = async (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === steps.length - 1) return;

    const newSteps = [...steps];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    
    // Swap steps
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    // Optimistic Update
    setSteps(newSteps);

    const orderedIds = newSteps.map(s => s.id);
    const res = await reorderRoadmapSteps(orderedIds);
    if (!res.success) {
      alert(res.error || 'Failed to save new order');
      loadSteps();
    }
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e7b605', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>Checking access...</div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab="roadmap">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px', width: '100%', boxSizing: 'border-box' }}>
        {/* Track Selection and Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '28px', color: '#2a2820', margin: '0 0 6px 0' }}>
              Roadmap Step Manager
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>
              Manage weekly checklists for Calgary founders dynamically.
            </p>
          </div>
          <button 
            onClick={() => {
              setFormFields({ title: '', description: '', actionText: '', actionHref: '' });
              setShowAddModal(true);
            }} 
            style={{ 
              background: '#000', 
              color: '#fff', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '4px', 
              fontFamily: 'DM Sans, sans-serif', 
              fontWeight: 700, 
              fontSize: '13px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Plus size={16} /> Add New Step
          </button>
        </div>

        {/* Track Filter Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e0d8', marginBottom: 32 }}>
          {(['START', 'GROW', 'SCALE'] as Track[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTrack(t)}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 24px',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                color: activeTrack === t ? '#9b7011' : '#9a9585',
                borderBottom: activeTrack === t ? '3px solid #e7b605' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {t} Track
            </button>
          ))}
        </div>

        {/* Table representation */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9a9585' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#e7b605' }} />
            <div>Loading roadmap steps...</div>
          </div>
        ) : steps.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderRadius: '8px', padding: '64px', textAlign: 'center' }}>
            <Milestone size={32} style={{ color: '#ccc', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#5a5650', marginBottom: 4 }}>No steps defined for this track</div>
            <div style={{ fontSize: '13px', color: '#9a9585' }}>Click the "Add New Step" button to define your first weekly checklist item.</div>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#fafaf9', borderBottom: '1px solid #e2e0d8' }}>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: '#9a9585', fontWeight: 800, textTransform: 'uppercase', width: '80px' }}>Week</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: '#9a9585', fontWeight: 800, textTransform: 'uppercase' }}>Milestone Title</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: '#9a9585', fontWeight: 800, textTransform: 'uppercase', maxWidth: '300px' }}>Description</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: '#9a9585', fontWeight: 800, textTransform: 'uppercase' }}>Action Button</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: '#9a9585', fontWeight: 800, textTransform: 'uppercase', width: '120px' }}>Order</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: '#9a9585', fontWeight: 800, textTransform: 'uppercase', width: '150px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step, index) => (
                  <tr key={step.id} style={{ borderBottom: index === steps.length - 1 ? 'none' : '1px solid #f0efe9', verticalAlign: 'middle' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#e7b605', fontSize: '15px' }}>
                      W{step.weekNumber}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#2a2820', fontSize: '14px' }}>{step.title}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#5a5650', lineHeight: 1.4, maxWidth: '300px' }}>
                      {step.description}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <a 
                        href={step.actionHref}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#f5f5f4',
                          border: '1px solid #e2e0d8',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#5a5650',
                          textDecoration: 'none'
                        }}
                      >
                        {step.actionText} <ExternalLink size={11} />
                      </a>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveStep(index, 'UP')}
                          style={{
                            background: '#fff',
                            border: '1px solid #e2e0d8',
                            color: index === 0 ? '#ccc' : '#5a5650',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          disabled={index === steps.length - 1}
                          onClick={() => handleMoveStep(index, 'DOWN')}
                          style={{
                            background: '#fff',
                            border: '1px solid #e2e0d8',
                            color: index === steps.length - 1 ? '#ccc' : '#5a5650',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: index === steps.length - 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setFormFields({
                              title: step.title,
                              description: step.description,
                              actionText: step.actionText,
                              actionHref: step.actionHref
                            });
                            setShowEditModal(step);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 14px',
                            background: 'transparent',
                            border: '1px solid #e2e0d8',
                            color: '#555',
                            fontFamily: 'DM Sans, sans-serif',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#e7b605'; e.currentTarget.style.color = '#e7b605'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#555'; }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(step)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 14px',
                            background: 'transparent',
                            border: '1px solid #e2e0d8',
                            color: '#9a9585',
                            fontFamily: 'DM Sans, sans-serif',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e0d8'; e.currentTarget.style.color = '#9a9585'; }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Step Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleAddStep} style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px' }}>
              Add Step to {activeTrack} Track
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5a5650', marginBottom: '6px' }}>Step Title</label>
              <input 
                type="text" 
                value={formFields.title}
                onChange={e => setFormFields(f => ({ ...f, title: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e0d8', borderRadius: '4px', outline: 'none' }}
                placeholder="e.g. Join Local Event"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5a5650', marginBottom: '6px' }}>Step Description</label>
              <textarea 
                value={formFields.description}
                onChange={e => setFormFields(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e0d8', borderRadius: '4px', outline: 'none', height: '80px', resize: 'none' }}
                placeholder="Keep it short and actionable..."
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5a5650', marginBottom: '6px' }}>Button Text</label>
              <input 
                type="text" 
                value={formFields.actionText}
                onChange={e => setFormFields(f => ({ ...f, actionText: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e0d8', borderRadius: '4px', outline: 'none' }}
                placeholder="e.g. Browse Events"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5a5650', marginBottom: '6px' }}>Action Href Link</label>
              <input 
                type="text" 
                value={formFields.actionHref}
                onChange={e => setFormFields(f => ({ ...f, actionHref: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e0d8', borderRadius: '4px', outline: 'none' }}
                placeholder="e.g. /events"
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                style={{ background: '#f5f5f4', border: '1px solid #e2e0d8', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={actionLoading}
                style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
              >
                {actionLoading ? 'Creating...' : 'Create Step'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Step Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleEditStep} style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px' }}>
              Edit Step in {activeTrack} Track
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5a5650', marginBottom: '6px' }}>Step Title</label>
              <input 
                type="text" 
                value={formFields.title}
                onChange={e => setFormFields(f => ({ ...f, title: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e0d8', borderRadius: '4px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5a5650', marginBottom: '6px' }}>Step Description</label>
              <textarea 
                value={formFields.description}
                onChange={e => setFormFields(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e0d8', borderRadius: '4px', outline: 'none', height: '80px', resize: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5a5650', marginBottom: '6px' }}>Button Text</label>
              <input 
                type="text" 
                value={formFields.actionText}
                onChange={e => setFormFields(f => ({ ...f, actionText: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e0d8', borderRadius: '4px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5a5650', marginBottom: '6px' }}>Action Href Link</label>
              <input 
                type="text" 
                value={formFields.actionHref}
                onChange={e => setFormFields(f => ({ ...f, actionHref: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e0d8', borderRadius: '4px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowEditModal(null)}
                style={{ background: '#f5f5f4', border: '1px solid #e2e0d8', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={actionLoading}
                style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Step Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px' }}>
              Delete Milestone Step
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5a5650', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{showDeleteModal.title}"</strong>? Remaining steps in this track will automatically be re-numbered.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDeleteModal(null)}
                style={{ background: '#f5f5f4', border: '1px solid #e2e0d8', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteStep}
                disabled={actionLoading}
                style={{ background: '#ff3333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
