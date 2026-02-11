import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Design System v2.1
            'w-full px-4 py-3.5 text-[15px] text-gray-900',
            'bg-gray-50 border rounded-xl',
            'placeholder:text-gray-400',
            'transition-all duration-200',
            'focus:outline-none focus:bg-white focus:ring-2', // bg-white-allowed: focus state
            error
              ? 'border-error focus:ring-red-100 focus:border-error'
              : 'border-transparent focus:ring-brand-100 focus:border-brand-600',
            'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
