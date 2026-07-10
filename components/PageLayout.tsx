'use client';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PageLayout({ children, mainStyle }: { children: React.ReactNode; mainStyle?: React.CSSProperties }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', ...mainStyle }}>{children}</main>
      <Footer />
    </>
  );
}
