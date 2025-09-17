'use client';

import { ReactNode, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABProps {
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
  label?: string;
  mini?: boolean;
  actions?: Array<{
    icon: ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
  }>;
}

export default function FloatingActionButton({
  onClick,
  icon = <Plus className="w-6 h-6" />,
  className,
  label,
  mini = false,
  actions,
}: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMainClick = () => {
    if (actions && actions.length > 0) {
      setIsOpen(!isOpen);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <>
      {/* Backdrop when menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed Dial Actions */}
      {isOpen && actions && (
        <div className="fixed bottom-24 right-4 z-40 md:hidden">
          <div className="flex flex-col items-end gap-3">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-3 animate-slideUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {action.label && (
                  <span className="bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
                    {action.label}
                  </span>
                )}
                <button
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95",
                    action.color || "bg-white text-gray-700"
                  )}
                >
                  {action.icon}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={handleMainClick}
        className={cn(
          "fixed z-40 rounded-full shadow-lg transition-all active:scale-95 md:hidden",
          "flex items-center justify-center gap-2",
          mini ? "w-14 h-14" : "h-14 px-6",
          "bottom-20 right-4",
          isOpen ? "bg-gray-900 text-white rotate-45" : "bg-blue-600 text-white",
          className
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform" />
        ) : (
          <>
            {icon}
            {label && !mini && <span className="font-medium">{label}</span>}
          </>
        )}
      </button>
    </>
  );
}