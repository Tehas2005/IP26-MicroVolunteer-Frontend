import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value?: number | null
  className?: string
  showValue?: boolean
}

const MAX_STARS = 5

function normalizeRating(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  return Math.max(0, Math.min(MAX_STARS, Math.round(value)))
}

export function RatingStars({ value, className, showValue = true }: RatingStarsProps) {
  const normalizedRating = normalizeRating(value)

  if (normalizedRating === null) {
    return (
      <span className={cn('text-sm font-medium leading-none text-brand-gray-text', className)}>
        Fără rating
      </span>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-2 align-middle', className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: MAX_STARS }, (_, index) => {
          const isFilled = index < normalizedRating

          return (
            <Star
              key={index}
              className={cn(
                'h-4 w-4',
                isFilled ? 'fill-amber-400 text-amber-400' : 'text-brand-gray/70',
              )}
            />
          )
        })}
      </div>

      {showValue ? (
        <span className="text-sm font-medium leading-none text-brand-gray-text">
          {normalizedRating}/5
        </span>
      ) : null}
    </div>
  )
}

export default RatingStars
