import type { LiveRequestCardData } from '@/components/shared/LiveRequestCard'

const STORAGE_KEY = 'mvcr-help-offers-store'

export type HelpOfferStatus = 'pending' | 'accepted' | 'rejected'

export interface HelpOfferData {
  id: string
  requestId: string
  volunteerKey: string
  volunteerName: string
  averageRating: number
  createdAt: string
  message: string
  status: HelpOfferStatus
}

type OfferTemplate = {
  suffix: string
  volunteerKey: string
  volunteerName: string
  averageRating: number
  createdAtOffsetMinutes: number
  remoteMessage: string
  localMessage: string
}

type StoredOfferRecord = {
  createdAt: string
  status: HelpOfferStatus
}

type StoredOfferStatuses = Record<string, Record<string, StoredOfferRecord>>

const OFFER_TEMPLATES: OfferTemplate[] = [
  {
    suffix: 'fast-response',
    volunteerKey: 'user:offer-volunteer-ilinca',
    volunteerName: 'Ilinca Pop',
    averageRating: 4.9,
    createdAtOffsetMinutes: 5,
    remoteMessage:
      'Pot răspunde imediat prin mesaje și te ajut pas cu pas până rezolvăm cererea.',
    localMessage:
      'Sunt aproape de zona ta și pot pleca acum, apoi rămân disponibilă până confirmi că e totul în regulă.',
  },
  {
    suffix: 'careful-support',
    volunteerKey: 'user:offer-volunteer-radu',
    volunteerName: 'Radu Pavel',
    averageRating: 4.7,
    createdAtOffsetMinutes: 11,
    remoteMessage:
      'Te pot ajuta calm și clar, inclusiv cu explicații dacă ai nevoie să completezi ceva dificil.',
    localMessage:
      'Pot ajunge în aproximativ 20 de minute și am mai ajutat cu cereri similare în cartier.',
  },
  {
    suffix: 'backup-helper',
    volunteerKey: 'user:offer-volunteer-mara',
    volunteerName: 'Mara Ionescu',
    averageRating: 5,
    createdAtOffsetMinutes: 18,
    remoteMessage:
      'Dacă vrei, rămân cu tine în chat până terminăm complet cererea și verificăm toate detaliile.',
    localMessage:
      'Pot prelua rapid cererea și te țin la curent din teren, ca să știi exact când am rezolvat.',
  },
]

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isValidHelpOfferStatus(value: unknown): value is HelpOfferStatus {
  return value === 'pending' || value === 'accepted' || value === 'rejected'
}

function readStoredStatuses(): StoredOfferStatuses {
  if (!canUseStorage()) {
    return {}
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)

  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (typeof parsed !== 'object' || parsed === null) {
      return {}
    }

    return Object.entries(parsed).reduce<StoredOfferStatuses>((accumulator, [requestId, value]) => {
      if (typeof requestId !== 'string' || typeof value !== 'object' || value === null) {
        return accumulator
      }

      accumulator[requestId] = Object.entries(value).reduce<Record<string, StoredOfferRecord>>(
        (requestAccumulator, [offerId, storedValue]) => {
          if (typeof offerId !== 'string') {
            return requestAccumulator
          }

          if (isValidHelpOfferStatus(storedValue)) {
            requestAccumulator[offerId] = {
              createdAt: '',
              status: storedValue,
            }
            return requestAccumulator
          }

          if (
            typeof storedValue === 'object' &&
            storedValue !== null
          ) {
            const candidate = storedValue as Partial<StoredOfferRecord>

            if (
              !isValidHelpOfferStatus(candidate.status) ||
              typeof candidate.createdAt !== 'string'
            ) {
              return requestAccumulator
            }

            requestAccumulator[offerId] = {
              createdAt: candidate.createdAt,
              status: candidate.status,
            }
          }

          return requestAccumulator
        },
        {},
      )

      return accumulator
    }, {})
  } catch {
    return {}
  }
}

function writeStoredStatuses(nextState: StoredOfferStatuses) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
}

function buildOfferMessage(request: LiveRequestCardData, template: OfferTemplate) {
  const isRemoteRequest = request.category === 'MESSAGES_ONLY'
  const baseMessage = isRemoteRequest ? template.remoteMessage : template.localMessage
  const trimmedTitle = request.title?.trim()

  if (!trimmedTitle) {
    return baseMessage
  }

  return `${baseMessage} Cererea "${trimmedTitle}" pare clară și mă pot implica rapid.`
}

function createBaseOffers(request: LiveRequestCardData): HelpOfferData[] {
  return OFFER_TEMPLATES.map((template) => ({
    id: `${request.id}-${template.suffix}`,
    requestId: request.id,
    volunteerKey: template.volunteerKey,
    volunteerName: template.volunteerName,
    averageRating: template.averageRating,
    createdAt: new Date(Date.now() - template.createdAtOffsetMinutes * 60_000).toISOString(),
    message: buildOfferMessage(request, template),
    status: 'pending',
  }))
}

export function formatHelpOfferRelativeTime(
  createdAt: Date | string,
  now = new Date(),
): string {
  const offerDate = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const diffMs = now.getTime() - offerDate.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000))

  if (diffMinutes < 1) {
    return 'acum câteva secunde'
  }

  if (diffMinutes === 1) {
    return 'acum 1 minut'
  }

  if (diffMinutes < 60) {
    return `acum ${diffMinutes} minute`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours === 1) {
    return 'acum 1 oră'
  }

  if (diffHours < 24) {
    return `acum ${diffHours} ore`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays === 1) {
    return 'acum 1 zi'
  }

  return `acum ${diffDays} zile`
}

export function listMockHelpOffers(request: LiveRequestCardData): HelpOfferData[] {
  const currentState = readStoredStatuses()
  const storedStatuses = currentState[request.id] ?? {}
  const nextStoredStatuses: Record<string, StoredOfferRecord> = {
    ...storedStatuses,
  }
  let shouldPersist = false

  const offers = createBaseOffers(request).map((offer) => {
    const storedOffer = storedStatuses[offer.id]

    if (!storedOffer) {
      nextStoredStatuses[offer.id] = {
        createdAt: offer.createdAt,
        status: 'pending',
      }
      shouldPersist = true
      return offer
    }

    const createdAt = storedOffer.createdAt || offer.createdAt

    if (!storedOffer.createdAt) {
      nextStoredStatuses[offer.id] = {
        createdAt,
        status: storedOffer.status,
      }
      shouldPersist = true
    }

    return {
      ...offer,
      createdAt,
      status: storedOffer.status,
    }
  })

  if (shouldPersist) {
    writeStoredStatuses({
      ...currentState,
      [request.id]: nextStoredStatuses,
    })
  }

  return offers
}

export function getReceivedOffersSummary(request: LiveRequestCardData) {
  const offers = listMockHelpOffers(request)
  const acceptedOffer = offers.find((offer) => offer.status === 'accepted')
  const pendingCount = offers.filter((offer) => offer.status === 'pending').length
  const rejectedCount = offers.filter((offer) => offer.status === 'rejected').length

  if (acceptedOffer) {
    return `Ajutor acceptat de la ${acceptedOffer.volunteerName}`
  }

  if (offers.length > 0 && rejectedCount === offers.length) {
    return `Toate cele ${offers.length} oferte au fost refuzate.`
  }

  if (pendingCount === 1) {
    return '1 ofertă primită. Apasă pentru a decide.'
  }

  return `${pendingCount} oferte primite. Apasă pentru a decide.`
}

export function updateMockHelpOfferStatus(
  requestId: string,
  offerId: string,
  status: HelpOfferStatus,
) {
  const currentState = readStoredStatuses()
  const currentRequestState = currentState[requestId] ?? {}
  const currentOfferState = currentRequestState[offerId]

  writeStoredStatuses({
    ...currentState,
    [requestId]: {
      ...currentRequestState,
      [offerId]: {
        createdAt: currentOfferState?.createdAt || new Date().toISOString(),
        status,
      },
    },
  })
}
