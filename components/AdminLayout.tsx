'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Tag,
  Trophy,
  Flag,
  Users,
  Milestone,
  Activity,
  Briefcase,
  FileText,
  LogOut,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import Logo from '@/components/Logo';
import { getProfile } from '@/app/actions/profile';
import { logout } from '@/app/actions/auth';

type AdminTab =
  | 'dashboard'
  | 'applications'
  | 'events'
  | 'offers'
  | 'awards'
  | 'opportunities'
  | 'flagged'
  | 'users'
  | 'roadmap'
  | 'activity';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
}

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Content Manager', tab: 'dashboard' },
  { href: '/admin/applications', icon: FileText, label: 'Applications', tab: 'applications' },
  { href: '/admin/events', icon: ClipboardList, label: 'Review Events', tab: 'events' },
  { href: '/admin/offers', icon: Tag, label: 'Review Offers', tab: 'offers' },
  { href: '/admin/opportunities', icon: Briefcase, label: 'Opportunities & Grants', tab: 'opportunities' },
  { href: '/admin/awards', icon: Trophy, label: 'Review Awards', tab: 'awards' },
  { href: '/admin/flagged', icon: Flag, label: 'Flagged Content', tab: 'flagged' },
  { href: '/admin/users', icon: Users, label: 'Users', tab: 'users' },
  { href: '/admin/roadmap', icon: Milestone, label: 'Roadmap Editor', tab: 'roadmap' },
  { href: '/admin/activity', icon: Activity, label: 'Activity Log', tab: 'activity' },
];

export default function AdminLayout({ children, activeTab }: AdminLayoutProps) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Responsiveness listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Access check
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const res = await getProfile();
        if (!res.success || !res.user) {
          router.push('/login');
          return;
        }
        if ((res.user as any).role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }
        setAdminUser({ name: res.user.name || 'Admin', email: res.user.email });
        setAuthChecked(true);
      } catch (err) {
        console.error('Admin layout access check failed:', err);
        router.push('/login');
      }
    };
    checkAdminAccess();
  }, [router]);

  async function handleLogout() {
    localStorage.removeItem('fe_admin');
    localStorage.removeItem('fe_my_submissions');
    await logout();
    router.push('/');
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e7b605', fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px' }}>
          Checking admin access...
        </div>
      </div>
    );
  }

  const activeItem = navItems.find((item) => item.tab === activeTab);
  const pageTitle = activeItem ? activeItem.label : 'Admin Panel';

  // Navigation link renderer
  const renderNavLinks = () => {
    return navItems.map((item) => {
      const isActive = item.tab === activeTab;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 24px',
            background: isActive ? 'rgba(231,182,5,0.1)' : 'transparent',
            borderLeft: isActive ? '3px solid #e7b605' : '3px solid transparent',
            color: isActive ? '#e7b605' : '#888',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.color = '#ccc';
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.color = '#888';
          }}
        >
          <item.icon size={16} />
          {item.label}
        </Link>
      );
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', display: 'flex', flexDirection: 'column' }}>
      
      {/* Mobile Top Header */}
      {isMobile && (
        <header style={{
          background: '#000',
          borderBottom: '1px solid #1a1a1a',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{ background: 'none', border: '1px solid #2a2a2a', color: '#888', cursor: 'pointer', padding: 8, display: 'flex' }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '15px', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {pageTitle}
          </span>
          <div style={{ width: 36 }} /> {/* spacer to center title */}
        </header>
      )}

      {/* Responsive Sidebar */}
      <aside style={{
        width: 260,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 60,
        transform: (!isMobile || sidebarOpen) ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        boxShadow: isMobile && sidebarOpen ? '0 0 40px rgba(0,0,0,0.55)' : 'none',
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="sm" />
          </Link>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4, display: 'flex' }}
            >
              <CloseIcon size={20} />
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              background: '#e7b605',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 900,
              fontSize: '16px',
              color: '#000',
            }}>
              {adminUser?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px', color: '#fff' }}>
                {adminUser?.name}
              </div>
              <div style={{ fontSize: '11px', color: '#e7b605', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Nav links */}
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {renderNavLinks()}
        </nav>

        {/* Logout at bottom */}
        <div style={{ padding: '16px 0', borderTop: '1px solid #1a1a1a' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 24px',
              color: '#888',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        marginLeft: isMobile ? 0 : 260,
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </main>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 55,
          }}
        />
      )}
    </div>
  );
}
