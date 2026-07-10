'use client';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PageLayout({ children, mainStyle }: { children: React.ReactNode; mainStyle?: React.CSSProperties }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content" style={{ minHeight: '100vh', ...mainStyle }}>{children}</main>
      <Footer />
    </>
  );
}
