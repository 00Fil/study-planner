'use client';

import { ReactNode, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
  fullScreen?: boolean;
  actions?: ReactNode;
}

export default function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  showBackButton = false,
  onBack,
  className,
  fullScreen = true,
  actions,
}: MobileModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for desktop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:block hidden animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "fixed z-50 bg-white",
        fullScreen 
          ? "inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:h-auto md:max-h-[90vh] md:rounded-xl md:shadow-xl"
          : "bottom-0 left-0 right-0 rounded-t-2xl shadow-xl md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:rounded-xl",
        "animate-slideUp md:animate-fadeIn",
        className
      )}>
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            {showBackButton && onBack ? (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Back"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
            ) : (
              <div className="w-10" />
            )}
            
            <h2 className="text-lg font-semibold text-gray-900 text-center flex-1">
              {title}
            </h2>
            
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          "overflow-y-auto",
          fullScreen ? "flex-1 p-4" : "max-h-[70vh] p-4"
        )}>
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 safe-area-inset-bottom">
            {actions}
          </div>
        )}
      </div>
    </>
  );
}

// Add animations to global CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}