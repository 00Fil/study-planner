'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  BookOpen, 
  Timer, 
  BarChart3, 
  Settings,
  Menu,
  X,
  GraduationCap,
  Target,
  Brain,
  Clock,
  Sparkles,
  Cloud,
  MoreVertical,
  ClipboardList,
  User
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', mobileLabel: 'Home', icon: Home, showInBottom: true, priority: 1 },
  { href: '/homework', label: 'Compiti', mobileLabel: 'Compiti', icon: ClipboardList, showInBottom: true, priority: 2 },
  { href: '/exams', label: 'Verifiche', mobileLabel: 'Verifiche', icon: GraduationCap, showInBottom: true, priority: 3 },
  { href: '/pomodoro', label: 'Timer Studio', mobileLabel: 'Studio', icon: Timer, showInBottom: true, priority: 4 },
  { href: '/schedule', label: 'Orario', mobileLabel: 'Orario', icon: Clock, showInBottom: false },
  { href: '/smart-plan', label: 'Piano Smart', mobileLabel: 'Smart', icon: Sparkles, showInBottom: false },
  { href: '/agenda', label: 'Agenda', mobileLabel: 'Agenda', icon: Calendar, showInBottom: false },
  { href: '/subjects', label: 'Materie', mobileLabel: 'Materie', icon: BookOpen, showInBottom: false },
  { href: '/sync', label: 'Sincronizza', mobileLabel: 'Sync', icon: Cloud, showInBottom: false },
  { href: '/methods', label: 'Metodi di Studio', mobileLabel: 'Metodi', icon: Brain, showInBottom: false },
  { href: '/stats', label: 'Statistiche', mobileLabel: 'Stats', icon: BarChart3, showInBottom: false },
  { href: '/goals', label: 'Obiettivi', mobileLabel: 'Goals', icon: Target, showInBottom: false },
];

const bottomNavItems = navItems.filter(item => item.showInBottom).sort((a, b) => a.priority - b.priority);

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Study Planner</h1>
              <p className="text-xs text-gray-500">Organizza il tuo studio</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 border-t border-gray-200">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Impostazioni</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header with improved styling */}
        <header className={cn(
          "fixed top-0 left-0 right-0 h-14 bg-white z-50 transition-all duration-200",
          scrolled ? "shadow-md border-b border-gray-100" : "border-b border-gray-200"
        )}>
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-900 leading-tight">Study Planner</span>
                <span className="text-xs text-gray-500 leading-tight">Il tuo assistente studio</span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <nav className="fixed right-0 top-16 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
              <ul className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
                <li className="pt-4 mt-4 border-t border-gray-200">
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Impostazioni</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Enhanced Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all relative flex-1 max-w-[80px]",
                    isActive
                      ? "text-blue-600"
                      : "text-gray-500 active:bg-gray-50"
                  )}
                >
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
                  )}
                  <Icon className={cn(
                    "transition-all",
                    isActive ? "w-6 h-6" : "w-5 h-5"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    isActive && "text-blue-600"
                  )}>
                    {item.mobileLabel}
                  </span>
                </Link>
              );
            })}
            
            {/* More button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg text-gray-500 active:bg-gray-50 flex-1 max-w-[80px]"
            >
              <MoreVertical className="w-5 h-5" />
              <span className="text-xs font-medium">Altro</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}