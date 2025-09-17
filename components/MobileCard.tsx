'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, MoreVertical } from 'lucide-react';

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  onOptionsClick?: () => void;
  className?: string;
  showArrow?: boolean;
  showOptions?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  active?: boolean;
  danger?: boolean;
  success?: boolean;
}

export function MobileCard({
  children,
  onClick,
  onOptionsClick,
  className,
  showArrow = false,
  showOptions = false,
  header,
  footer,
  active = false,
  danger = false,
  success = false,
}: MobileCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border transition-all",
        onClick && "cursor-pointer active:scale-[0.98]",
        active && "border-blue-500 bg-blue-50/50",
        danger && "border-red-200 bg-red-50/50",
        success && "border-green-200 bg-green-50/50",
        !active && !danger && !success && "border-gray-200",
        className
      )}
      onClick={onClick}
    >
      {header && (
        <div className="px-4 py-3 border-b border-gray-100">
          {header}
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {children}
          </div>
          
          {showArrow && (
            <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
          )}
          
          {showOptions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOptionsClick?.();
              }}
              className="p-2 -mr-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>
      
      {footer && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}

// List Item variant for better mobile UX
interface MobileListItemProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string | number;
  badgeColor?: 'blue' | 'green' | 'red' | 'orange' | 'gray';
  onClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  actions?: ReactNode;
  selected?: boolean;
}

export function MobileListItem({
  title,
  subtitle,
  icon,
  badge,
  badgeColor = 'gray',
  onClick,
  actions,
  selected = false,
}: MobileListItemProps) {
  const badgeColors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer",
        selected && "bg-blue-50 hover:bg-blue-100"
      )}
    >
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      
      {badge && (
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          badgeColors[badgeColor]
        )}>
          {badge}
        </span>
      )}
      
      {actions && (
        <div onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

// Empty State component for mobile
interface MobileEmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function MobileEmptyState({
  icon,
  title,
  description,
  action,
}: MobileEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-medium text-gray-900 text-center mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 text-center mb-4 max-w-xs">
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
}