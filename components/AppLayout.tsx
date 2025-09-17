'use client';

import Navigation from './Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Main Content */}
      <main className="md:ml-64">
        {/* Spacer for mobile header */}
        <div className="h-16 md:hidden" />
        
        {/* Content */}
        <div className="p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </div>
        
        {/* Spacer for mobile bottom nav */}
        <div className="h-16 md:hidden" />
      </main>
    </div>
  );
}