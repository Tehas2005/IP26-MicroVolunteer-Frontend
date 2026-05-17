import type { KeyboardEvent, ReactNode } from 'react'

export type LiveRequestUrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type LiveRequestCategory = 'FACETOFACE' | 'MESSAGES_ONLY'

export interface LiveRequestCardData {
  id: string
  title?: string | null
  description?: string | null
  category?: LiveRequestCategory | null
  urgencyLevel?: LiveRequestUrgencyLevel | null
  status?: 'open' | 'closed'
  anonymousMode?: boolean | null
  username?: string | null
  name?: string | null
  city?: string | null
  skillsNeeded?: string[] | null
  requesterKey?: string | null
  requesterKind?: 'guest' | 'user'
  requesterLabel?: string | null
  supportingText?: string | null
}

export interface LiveRequestCardProps {
  request: LiveRequestCardData
  onClick?: () => void
  footerActions?: ReactNode
}

interface UrgencyConfig {
  accentClassName: string
  label: string
}

const FALLBACK_TEXT = 'Informație indisponibilă'

const urgencyConfig: Record<LiveRequestUrgencyLevel, UrgencyConfig> = {
  LOW: {
    accentClassName: 'bg-brand-green',
    label: 'Urgenta scazuta',
  },
  MEDIUM: {
    accentClassName: 'bg-brand-orange',
    label: 'Urgenta medie',
  },
  HIGH: {
    accentClassName: 'bg-brand-red/85',
    label: 'Urgenta ridicata',
  },
  CRITICAL: {
    accentClassName: 'bg-brand-red',
    label: 'Urgenta critica',
  },
}

function getDisplayName(request: LiveRequestCardData) {
  const preferredName = request.anonymousMode ? request.username : request.name

  return preferredName?.trim() || FALLBACK_TEXT
}

function getCategoryLabel(category?: LiveRequestCategory | null) {
  if (!category) {
    return FALLBACK_TEXT
  }

  return category
}

function getUrgencyMeta(urgencyLevel?: LiveRequestUrgencyLevel | null): UrgencyConfig {
  if (!urgencyLevel) {
    return {
      accentClassName: 'bg-brand-gray',
      label: FALLBACK_TEXT,
    }
  }

  return urgencyConfig[urgencyLevel]
}

export function LiveRequestCard({ request, onClick, footerActions }: LiveRequestCardProps) {
  const urgency = getUrgencyMeta(request.urgencyLevel)
  const categoryLabel = getCategoryLabel(request.category)
  const displayName = getDisplayName(request)
  const isInteractive = typeof onClick === 'function'
  const contentClassName = [
    'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
    isInteractive ? 'cursor-pointer' : '',
  ].join(' ')
  const handleKeyDown =
    isInteractive
      ? (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onClick?.()
          }
        }
      : undefined

  return (
    <article className="group rounded-[24px] border border-brand-gray/90 bg-[#F8FAFD] px-5 py-4 shadow-sm transition-[background-color,border-color,box-shadow] duration-200 hover:border-brand-purple/35 hover:bg-white hover:shadow-[0_0_0_1px_rgba(123,47,190,0.08),0_2px_5px_rgba(26,26,26,0.08)]">
      <div
        className={contentClassName}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-brand-black transition-colors duration-200 group-hover:text-brand-purple-dark sm:text-[1.05rem]">
            {request.title?.trim() || FALLBACK_TEXT}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand-gray bg-white px-3 py-1 text-xs font-semibold text-brand-black">
              {displayName}
            </span>
            <span className="rounded-full bg-brand-purple-light px-3 py-1 text-xs font-semibold text-brand-purple-dark">
              {categoryLabel}
            </span>
          </div>

          <p className="mt-3 text-sm text-brand-gray-text transition-colors duration-200 group-hover:text-brand-black/75">
            {urgency.label}
          </p>

          {request.supportingText?.trim() ? (
            <p className="mt-2 text-sm font-medium text-brand-purple-dark/90">
              {request.supportingText}
            </p>
          ) : null}
        </div>

        <span
          aria-hidden="true"
          className={`h-3 w-16 shrink-0 rounded-full transition-opacity duration-200 group-hover:opacity-85 ${urgency.accentClassName}`}
        />
      </div>

      {footerActions ? (
        <div
          className="mt-4 border-t border-brand-gray/70 pt-3"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {footerActions}
        </div>
      ) : null}
    </article>
  )
}

export default LiveRequestCard
