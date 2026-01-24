import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand' | 'urgent' | 'closed'
  children: ReactNode
  className?: string
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  // Design System v2.1 - Deep Forest Green
  const variants = {
    default: 'bg-brand-50 text-brand-700',
    success: 'bg-green-50 text-success',
    warning: 'bg-accent-100 text-accent-700',   // 마감임박 (일반 경고)
    urgent: 'bg-accent-50 text-accent-500',     // 마감임박 (강조)
    error: 'bg-red-50 text-error',
    info: 'bg-blue-50 text-info',
    brand: 'bg-brand-100 text-brand-800',
    closed: 'bg-gray-100 text-gray-400',        // 마감
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
