'use client';
import Link from 'next/link';
import Logo from './Logo';
import { MapPin, Mail, Globe, Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#000', color: '#fff', borderTop: '3px solid transparent', borderImage: 'linear-gradient(90deg,#000,#9b7011,#e7b605) 1' }}>
      <div className="container" style={{ paddingTop: 72, paddingBottom: 48 }}>
        <div className="grid-footer" style={{ marginBottom: 64 }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ textDecoration: 'none' }}><Logo /></Link>
            <p style={{ marginTop: 20, color: '#888', fontSize: '14px', lineHeight: 1.7, maxWidth: 280 }}>
              Calgary's curated membership platform for entrepreneurs. Connecting you to people, opportunities, and resources at every stage.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              {[Globe, Share2, Share2].map((Icon, i) => (
                <a key={i} href="#" style={{ width: 36, height: 36, background: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', transition: 'all 0.2s', textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e7b605'; (e.currentTarget as HTMLAnchorElement).style.color = '#e7b605'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#222'; (e.currentTarget as HTMLAnchorElement).style.color = '#888'; }}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e7b605', marginBottom: 20 }}>Platform</div>
            {[['About Us', '/about'], ['Events', '/events'], ['Directory', '/directory'], ['Resources', '/resources'], ['Awards', '/awards'], ['Webinars', '/webinars'], ['Supper Club', '/supper-club']].map(([label, href]) => (
              <Link key={href} href={href} style={{ display: 'block', color: '#888', fontSize: '14px', textDecoration: 'none', marginBottom: 12, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e7b605')}
                onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
                {label}
              </Link>
            ))}
          </div>

          {/* Membership */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e7b605', marginBottom: 20 }}>Membership</div>
            {[['Membership', '/membership'], ['Apply Now', '/apply'], ['Login', '/login'], ['Dashboard', '/dashboard']].map(([label, href]) => (
              <Link key={href} href={href} style={{ display: 'block', color: '#888', fontSize: '14px', textDecoration: 'none', marginBottom: 12, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e7b605')}
                onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
                {label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e7b605', marginBottom: 20 }}>Contact</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
              <MapPin size={15} style={{ color: '#e7b605', marginTop: 2, flexShrink: 0 }} />
              <span style={{ color: '#888', fontSize: '14px', lineHeight: 1.6 }}>Calgary, Alberta, Canada</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Mail size={15} style={{ color: '#e7b605', flexShrink: 0 }} />
              <a href="mailto:hello@foundrsedge.com" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>hello@foundrsedge.com</a>
            </div>
            <div style={{ marginTop: 24 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#aba7a5', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Annual Membership</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#e7b605', marginTop: 6 }}>TBD</div>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: '#1a1a1a', marginBottom: 32 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: '#aba7a5', fontSize: '13px' }}>© 2025 Founders Edge Inc. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['Privacy Policy', '#'], ['Terms of Use', '#'], ['Cookie Policy', '#']].map(([label, href]) => (
              <a key={label} href={href} style={{ color: '#aba7a5', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e7b605')}
                onMouseLeave={e => (e.currentTarget.style.color = '#aba7a5')}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
