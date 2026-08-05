'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import Logo from './Logo';
import { getProfile } from '@/app/actions/profile';

// Events is a dropdown grouping all event-type experiences.
const eventsNavLinks = [
  { label: 'All Events', href: '/events' },
  { label: 'Supper Club', href: '/supper-club' },
  { label: 'Webinars', href: '/webinars' },
];

const primaryNavLinks = [
  { label: 'Opportunities', href: '/opportunities' },
  { label: 'Passport', href: '/passport' },
  { label: 'Directory', href: '/directory' },
  { label: 'Resources', href: '/resources' },
  { label: 'AI Coach', href: '/coach' },
];

const moreNavLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Membership', href: '/membership' },
  { label: 'Awards', href: '/awards' },
];

// Flat list used for the mobile menu.
const allNavLinks = [...eventsNavLinks, ...primaryNavLinks, ...moreNavLinks];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getProfile();
        if (res.success && res.user) {
          setUser(res.user);
          setIsImpersonating(!!res.isImpersonating);
        } else {
          setUser(null);
          setIsImpersonating(false);

          const protectedPrefixes = ['/dashboard', '/admin'];
          if (protectedPrefixes.some(prefix => pathname.startsWith(prefix))) {
            window.location.href = '/login';
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    }
    checkAuth();

    const interval = setInterval(checkAuth, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  const isHome = pathname === '/';

  return (
    <nav style={{
      position: 'fixed', top: isImpersonating ? 40 : 0, left: 0, right: 0, zIndex: 100,
      background: scrolled || !isHome ? 'rgba(0,0,0,0.97)' : 'transparent',
      borderBottom: scrolled ? '1px solid #1a1a1a' : '1px solid transparent',
      transition: 'all 0.3s ease, top 0.15s ease',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72, maxWidth: '1440px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden-mobile">
          {/* Events + Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setEventsOpen(true)}
            onMouseLeave={() => setEventsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setEventsOpen(!eventsOpen)}
              style={{
                padding: '8px 14px',
                color: eventsNavLinks.some(l => pathname === l.href) ? 'var(--gold)' : '#ccc',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderBottom: eventsNavLinks.some(l => pathname === l.href) ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              <span>Events</span>
              <ChevronDown size={14} style={{ transform: eventsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {eventsOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: '#0d0d0d',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '8px 0',
                minWidth: '160px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                zIndex: 200,
              }}>
                {eventsNavLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setEventsOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      color: pathname === link.href ? 'var(--gold)' : '#ccc',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: '12px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {primaryNavLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              padding: '8px 14px', color: pathname === link.href ? 'var(--gold)' : '#ccc',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px',
              letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none',
              transition: 'color 0.2s',
              borderBottom: pathname === link.href ? '2px solid var(--gold)' : '2px solid transparent',
            }}>
              {link.label}
            </Link>
          ))}

          {/* More + Dropdown */}
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => setMoreOpen(true)}
            onMouseLeave={() => setMoreOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMoreOpen(!moreOpen)}
              style={{
                padding: '8px 14px',
                color: moreNavLinks.some(l => pathname === l.href) ? 'var(--gold)' : '#ccc',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderBottom: moreNavLinks.some(l => pathname === l.href) ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              <span>More</span>
              <ChevronDown size={14} style={{ transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {moreOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: '#0d0d0d',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '8px 0',
                minWidth: '160px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                zIndex: 200,
              }}>
                {moreNavLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      color: pathname === link.href ? 'var(--gold)' : '#ccc',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: '12px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="hidden-mobile">
          {user ? (
            <>
              <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hi, {user.name?.split(' ')[0] || 'Member'}
              </span>
              <Link href={user.role === 'ADMIN' ? '/admin/events' : '/dashboard'} className="btn-primary" style={{ padding: '10px 24px', fontSize: '12px' }}>
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                color: '#ccc', fontFamily: 'var(--font-sans)', fontWeight: 600,
                fontSize: '13px', textDecoration: 'none', letterSpacing: '0.05em',
                textTransform: 'uppercase', padding: '8px 0', transition: 'color 0.2s',
              }}>
                Login
              </Link>
              <Link href="/apply" className="btn-primary" style={{ padding: '10px 24px', fontSize: '12px' }}>
                Apply Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setOpen(!open)} style={{
          background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
          display: 'none',
        }} className="show-mobile">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div style={{
          background: '#000', borderTop: '1px solid #1a1a1a',
          padding: '24px 20px',
        }}>
          {allNavLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '14px 0', color: pathname === link.href ? 'var(--gold)' : '#ccc',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '15px',
              letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none',
              borderBottom: '1px solid #1a1a1a',
            }}>
              {link.label}
            </Link>
          ))}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {user ? (
              <>
                <div style={{ color: 'var(--gold)', textAlign: 'center', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Hi, {user.name?.split(' ')[0] || 'Member'}
                </div>
                <Link href={user.role === 'ADMIN' ? '/admin/events' : '/dashboard'} className="btn-primary" onClick={() => setOpen(false)} style={{ textAlign: 'center', justifyContent: 'center' }}>
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} style={{ color: '#ccc', textAlign: 'center', padding: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Login</Link>
                <Link href="/apply" className="btn-primary" onClick={() => setOpen(false)} style={{ textAlign: 'center', justifyContent: 'center' }}>Apply Now</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
