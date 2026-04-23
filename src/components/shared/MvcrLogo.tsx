import { cn } from '@/lib/utils'

export interface MvcrLogoProps {
  className?: string
  textClassName?: string
}

export function MvcrLogo({ className, textClassName }: MvcrLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        aria-hidden="true"
        className="h-11 w-11 shrink-0 text-brand-purple"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M32 4L54.5167 18V46L32 60L9.48334 46V18L32 4Z"
          fill="currentColor"
        />
        <circle cx="32" cy="32" r="11" fill="white" />
        <circle cx="32" cy="32" r="5" fill="currentColor" />
      </svg>
      <span
        className={cn(
          'max-w-[11rem] text-sm font-semibold leading-tight text-brand-black sm:max-w-none sm:text-base',
          textClassName,
        )}
      >
        Micro-Volunteer Crisis Router
      </span>
    </div>
  )
}

export default MvcrLogo

