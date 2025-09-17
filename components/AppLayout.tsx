'use client';

import Navigation from './Navigation';
import { useEffect } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export default function AppLayout({ children, noPadding = false }: AppLayoutProps) {
  useEffect(() => {
    // Set viewport height for mobile browsers
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Main Content with improved mobile spacing */}
      <main className="md:ml-64 min-h-screen">
        {/* Spacer for mobile header */}
        <div className="h-14 md:hidden" />
        
        {/* Content with responsive padding */}
        <div className={noPadding ? "" : "p-3 sm:p-4 md:p-6 pb-20 md:pb-6"}>
          {children}
        </div>
        
        {/* Spacer for mobile bottom nav with safe area */}
        <div className="h-16 md:hidden safe-area-inset-bottom" />
      </main>
    </div>
  );
}
