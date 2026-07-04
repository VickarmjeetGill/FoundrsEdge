'use client';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content" style={{ minHeight: '100vh' }}>{children}</main>
      <Footer />
    </>
  );
}
