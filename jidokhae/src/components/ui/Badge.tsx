import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand' | 'urgent' | 'closed'
  children: ReactNode
  className?: string
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  // Design System v3.3 - Mood-Switchable Reading Club
  const variants = {
    default: 'bg-[var(--bg-base)] text-text-muted',
    success: 'bg-green-50 text-success',
    warning: 'bg-amber-50 text-warning',        // 마감임박 (일반 경고)
    urgent: 'bg-accent text-accent-readable',   // 마감임박 (강조, 테마 대응)
    error: 'bg-red-50 text-error',
    info: 'bg-blue-50 text-info',
    brand: 'bg-primary/10 text-primary',
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
