import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    // Design System v3.3 - Mood-Switchable Reading Club
    const variants = {
      primary: [
        'bg-primary text-white',
        'shadow-[0_2px_8px_rgba(0,71,255,0.25)]',
        'hover:shadow-[0_4px_14px_rgba(0,71,255,0.35)] hover:-translate-y-[1px]',
        'active:scale-[0.98] active:translate-y-0',
        'focus:ring-primary',
      ].join(' '),
      secondary: [
        'bg-bg-surface text-text',
        'border border-[var(--border)]',
        'hover:bg-[var(--bg-base)]',
        'active:scale-[0.98]',
        'focus:ring-[var(--border)]',
      ].join(' '),
      ghost: [
        'bg-transparent text-text-muted',
        'hover:bg-[var(--bg-base)] hover:text-text',
        'focus:ring-[var(--border)]',
      ].join(' '),
      danger: [
        'bg-error text-white',
        'hover:bg-red-700',
        'focus:ring-error',
      ].join(' '),
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
