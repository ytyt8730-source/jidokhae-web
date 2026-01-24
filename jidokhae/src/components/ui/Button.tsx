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
    // Design System v2.1 - Deep Forest Green
    const variants = {
      primary: [
        'bg-brand-600 text-white',
        'shadow-button',
        'hover:bg-brand-700 hover:shadow-button-hover hover:-translate-y-[1px]',
        'active:scale-[0.98] active:translate-y-0',
        'focus:ring-brand-600',
      ].join(' '),
      secondary: [
        'bg-white text-brand-700',
        'border border-brand-200',
        'hover:bg-brand-50 hover:border-brand-300',
        'active:scale-[0.98]',
        'focus:ring-brand-200',
      ].join(' '),
      ghost: [
        'bg-transparent text-gray-600',
        'hover:bg-gray-100 hover:text-gray-900',
        'focus:ring-gray-300',
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
