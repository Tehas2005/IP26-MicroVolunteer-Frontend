import { useEffect, useState, type FormEvent } from 'react'

import AdditionalInfoSection, {
  type AdditionalInfoData,
} from '@/components/ask-for-help/AdditionalInfoSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

type RequestType = 'Online' | 'Fizic'
type UrgencyLevel = 'Verde' | 'Galben' | 'Roșu'

interface ToggleOption<TValue extends string> {
  value: TValue
  label: string
  activeClassName: string
}

const requestTypeOptions: ToggleOption<RequestType>[] = [
  {
    value: 'Online',
    label: 'Online',
    activeClassName: 'border-brand-purple bg-brand-purple-light text-brand-purple-dark',
  },
  {
    value: 'Fizic',
    label: 'Fizic',
    activeClassName: 'border-brand-purple bg-brand-purple-light text-brand-purple-dark',
  },
]

const urgencyOptions: ToggleOption<UrgencyLevel>[] = [
  {
    value: 'Verde',
    label: 'Verde',
    activeClassName: 'border-brand-green bg-brand-green/10 text-brand-green',
  },
  {
    value: 'Galben',
    label: 'Galben',
    activeClassName: 'border-brand-yellow bg-brand-yellow/10 text-[#A06A00]',
  },
  {
    value: 'Roșu',
    label: 'Roșu',
    activeClassName: 'border-brand-red bg-brand-red/10 text-brand-red',
  },
]

const initialAdditionalInfo: AdditionalInfoData = {
  description: '',
  location: '',
  attachment: null,
}

function ToggleGroup<TValue extends string>({
  activeValue,
  columnsClassName = 'sm:grid-cols-2',
  disabledValues = [],
  onChange,
  options,
}: {
  activeValue: TValue
  columnsClassName?: string
  disabledValues?: TValue[]
  onChange: (value: TValue) => void
  options: ToggleOption<TValue>[]
}) {
  return (
    <div className={cn('grid gap-3', columnsClassName)}>
      {options.map((option) => {
        const isActive = option.value === activeValue
        const isDisabled = disabledValues.includes(option.value)

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              'rounded-[16px] border border-brand-gray bg-white px-4 py-3 text-sm font-semibold text-brand-black transition hover:border-brand-purple hover:bg-brand-purple-light/40 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
              isActive && option.activeClassName,
            )}
            aria-pressed={isActive}
            disabled={isDisabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {isDisabled && <span className="ml-2 text-xs font-semibold">Doar pentru cont</span>}
          </button>
        )
      })}
    </div>
  )
}

export function AskForHelpPage() {
  const isGuest = useAuthStore((state) => state.isGuest)
  const [title, setTitle] = useState('')
  const [requestType, setRequestType] = useState<RequestType>('Online')
  const [urgency, setUrgency] = useState<UrgencyLevel>('Verde')
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfoData>(initialAdditionalInfo)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAdditionalInfoErrors, setShowAdditionalInfoErrors] = useState(false)

  useEffect(() => {
    if (!isGuest) {
      return
    }

    setRequestType('Online')

    if (urgency === 'Roșu') {
      setUrgency('Galben')
    }
  }, [isGuest, urgency])

  const isPhysicalRequest = requestType === 'Fizic'
  const isLocationMissing = isPhysicalRequest && additionalInfo.location.trim().length === 0

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setFormError('Titlul cererii este obligatoriu.')
      return
    }

    if (isGuest && requestType === 'Fizic') {
      setFormError('Vizitatorii pot face doar cereri online. Autentifică-te pentru acces complet.')
      return
    }

    if (isLocationMissing) {
      setShowAdditionalInfoErrors(true)
      return
    }

    setShowAdditionalInfoErrors(false)
    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))

      setSuccessMessage('Cererea ta a fost trimisă voluntarilor.')
      setTitle('')
      setRequestType('Online')
      setUrgency('Verde')
      setAdditionalInfo(initialAdditionalInfo)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="bg-brand-cream">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-3xl rounded-[36px] border border-brand-gray bg-white p-6 shadow-sm sm:p-8 md:p-10">
          <div className="border-b border-brand-gray pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-purple">
              Cere ajutor
            </p>
            <h1 className="mt-3 text-3xl font-bold text-brand-black sm:text-4xl">
              Spune-ne rapid de ce ai nevoie
            </h1>
            <p className="mt-3 text-sm leading-6 text-brand-gray-text sm:text-base">
              Completează formularul de mai jos, iar voluntarii vor primi un context mai clar
              despre situația ta.
            </p>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-black" htmlFor="titlu-cerere">
                Titlul cererii <span className="text-brand-red">*</span>
              </label>
              <Input
                id="titlu-cerere"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: Ridicare medicamente de la farmacie"
                required
                value={title}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-brand-black">
                  Tipul cererii <span className="text-brand-red">*</span>
                </label>
                {isGuest && (
                  <span className="text-xs font-medium text-brand-gray-text">
                    Vizitatorii pot trimite doar cereri online.
                  </span>
                )}
              </div>

              <ToggleGroup
                activeValue={requestType}
                columnsClassName="sm:grid-cols-2"
                disabledValues={isGuest ? ['Fizic'] : []}
                onChange={setRequestType}
                options={requestTypeOptions}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-brand-black">
                  Nivel de urgență <span className="text-brand-red">*</span>
                </label>
                {isGuest && (
                  <span className="text-xs font-medium text-brand-gray-text">
                    Urgența roșie este rezervată utilizatorilor autentificați.
                  </span>
                )}
              </div>

              <ToggleGroup
                activeValue={urgency}
                columnsClassName="sm:grid-cols-3"
                disabledValues={isGuest ? ['Roșu'] : []}
                onChange={setUrgency}
                options={urgencyOptions}
              />
            </div>

            <AdditionalInfoSection
              onChange={setAdditionalInfo}
              requestType={requestType}
              showErrors={showAdditionalInfoErrors}
              value={additionalInfo}
            />

            {formError && (
              <div className="rounded-[16px] border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm font-medium text-brand-red">
                {formError}
              </div>
            )}

            {successMessage && (
              <div className="rounded-[16px] border border-brand-green/30 bg-brand-green/10 px-4 py-3 text-sm font-medium text-brand-green">
                {successMessage}
              </div>
            )}

            <Button
              className="w-full text-base"
              disabled={isSubmitting}
              size="lg"
              type="submit"
              variant="primary"
            >
              {isSubmitting ? 'Se trimite...' : 'Trimite cererea'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default AskForHelpPage
