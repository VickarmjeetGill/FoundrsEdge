'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  category: string;
  featured?: boolean;
  partner?: {
    name: string;
    logo_url?: string | null;
  };
}

interface ResourceCardProps {
  resource: Resource;
  showPartner?: boolean;
}

export default function ResourceCard({ resource, showPartner = true }: ResourceCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fe_saved_resources');
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids) && ids.includes(resource.id)) {
          setIsBookmarked(true);
        }
      }
    } catch (e) {
      // localStorage read error fallback
    }
  }, [resource.id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved = localStorage.getItem('fe_saved_resources');
      let ids: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(ids)) ids = [];

      if (isBookmarked) {
        ids = ids.filter((id) => id !== resource.id);
        setIsBookmarked(false);
      } else {
        ids.push(resource.id);
        setIsBookmarked(true);
      }
      localStorage.setItem('fe_saved_resources', JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to update bookmarks:', e);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: resource.featured ? '4px solid var(--gold)' : '4px solid transparent', position: 'relative' }}>
      
      {/* Optional Partner Header Row */}
      {showPartner && resource.partner && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--gray-200)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {resource.partner.logo_url ? (
              <div style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--gray-200)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 2 }}>
                <img src={resource.partner.logo_url} alt={resource.partner.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            ) : (
              <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontWeight: 800, fontSize: '12px' }}>
                {resource.partner.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--gray-600)' }}>
              {resource.partner.name}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleBookmark}
            title={isBookmarked ? 'Remove Bookmark' : 'Save Resource'}
            style={{
              background: isBookmarked ? 'rgba(231,182,5,0.12)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              padding: '6px',
              cursor: 'pointer',
              color: isBookmarked ? 'var(--gold)' : 'var(--gray-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            {isBookmarked ? <BookmarkCheck size={16} fill="var(--gold)" /> : <Bookmark size={16} />}
          </button>
        </div>
      )}

      {/* Type & Category Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="tag" style={{ fontSize: '10px', padding: '3px 8px' }}>{resource.type}</span>
          <span className="tag gold" style={{ fontSize: '10px', padding: '3px 8px' }}>{resource.category}</span>
          {resource.featured && <span className="tag gold" style={{ fontSize: '10px', padding: '3px 8px', background: 'var(--black)', color: 'var(--gold)' }}>Editor's Pick</span>}
        </div>

        {!showPartner && (
          <button
            type="button"
            onClick={toggleBookmark}
            title={isBookmarked ? 'Remove Bookmark' : 'Save Resource'}
            style={{
              background: isBookmarked ? 'rgba(231,182,5,0.12)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              padding: '6px',
              cursor: 'pointer',
              color: isBookmarked ? 'var(--gold)' : 'var(--gray-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            {isBookmarked ? <BookmarkCheck size={16} fill="var(--gold)" /> : <Bookmark size={16} />}
          </button>
        )}
      </div>
      
      {/* Title */}
      <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '18px', color: 'var(--gray-800)', marginBottom: 8 }}>
        {resource.title}
      </h3>
      
      {/* Description */}
      <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-600)', fontSize: '14px', lineHeight: 1.6, flexGrow: 1, marginBottom: 24 }}>
        {resource.description}
      </p>

      {/* Action Button */}
      <a 
        href={resource.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="btn-primary" 
        style={{ padding: '10px 20px', fontSize: '12px', width: 'fit-content', marginTop: 'auto' }}
      >
        Visit Resource <ExternalLink size={12} />
      </a>
    </div>
  );
}
