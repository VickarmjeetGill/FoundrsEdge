'use client';
import { Calendar, ExternalLink, FileText, Megaphone, Award, Briefcase, HelpCircle, CheckCircle, Star } from 'lucide-react';

export type Opportunity = {
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

const typeStyles: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  Grants: { bg: 'rgba(39,174,96,0.1)', color: '#27ae60', icon: <FileText size={12} /> },
  Events: { bg: 'rgba(231,182,5,0.1)', color: '#e7b605', icon: <Calendar size={12} /> },
  Speaking: { bg: 'rgba(155,89,182,0.1)', color: '#9b59b6', icon: <Megaphone size={12} /> },
  Funding: { bg: 'rgba(26,188,156,0.1)', color: '#1abc9c', icon: <Award size={12} /> },
  Pitch: { bg: 'rgba(230,126,34,0.1)', color: '#e67e22', icon: <Briefcase size={12} /> },
  Media: { bg: 'rgba(52,152,219,0.1)', color: '#3498db', icon: <HelpCircle size={12} /> },
  Procurement: { bg: 'rgba(149,165,166,0.1)', color: '#7f8c8d', icon: <CheckCircle size={12} /> },
};

interface OpportunityCardProps {
  opp: Opportunity;
}

export default function OpportunityCard({ opp }: OpportunityCardProps) {
  const style = typeStyles[opp.type] || { bg: 'rgba(0,0,0,0.05)', color: '#555', icon: null };
  
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e0d8',
        borderLeft: opp.featured ? '4px solid #e7b605' : '1px solid #e2e0d8',
        padding: '24px',
        position: 'relative',
        transition: 'all 0.2s',
        boxShadow: opp.featured ? '0 4px 20px rgba(231,182,5,0.04)' : 'none'
      }}
    >

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            {opp.featured && (
              <span className="tag gold" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                background: 'rgba(231,182,5,0.12)',
                color: '#9b7011',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <Star size={10} fill="#9b7011" style={{ marginRight: 3 }} /> Featured
              </span>
            )}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: style.bg,
              color: style.color,
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {style.icon} {opp.type}
            </span>
            {opp.deadline && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#9a9585' }}>
                <Calendar size={12} /> Deadline: {opp.deadline}
              </span>
            )}
          </div>

          <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '20px', color: '#2a2820', marginBottom: 8 }}>
            {opp.title}
          </h3>
          <p style={{ fontFamily: 'Noto Serif, serif', color: '#5a5650', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
            {opp.description}
          </p>
        </div>

        <div style={{ flexShrink: 0, marginTop: 12 }}>
          <a
            href={opp.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
              padding: '10px 20px',
              fontSize: '13px'
            }}
          >
            Source Link <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
