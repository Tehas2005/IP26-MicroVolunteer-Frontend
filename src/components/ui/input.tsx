import * as React from 'react'

import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-brand-gray bg-white px-3 py-2 text-sm text-brand-black transition placeholder:text-brand-gray-text focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:cursor-not-allowed disabled:bg-brand-cream',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'

export default Input
