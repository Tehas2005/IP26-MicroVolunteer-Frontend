import type { NotificationListResponseType, NotificationRecordType } from '@/sdk/types'

type ResponseEnvelope<T> = {
  data?: T | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readEnvelopeData<T>(payload: unknown): T | null {
  if (!isRecord(payload) || !('data' in payload)) {
    return null
  }

  return (payload as ResponseEnvelope<T>).data ?? null
}

export function extractNotificationsList(payload: unknown): NotificationRecordType[] {
  if (!isRecord(payload)) {
    return []
  }

  const directPayload = payload as NotificationListResponseType

  if (Array.isArray(directPayload.data)) {
    return directPayload.data.filter(isRecord) as NotificationRecordType[]
  }

  const nestedPayload = readEnvelopeData<unknown>(payload)

  if (
    !isRecord(nestedPayload) ||
    !Array.isArray((nestedPayload as NotificationListResponseType).data)
  ) {
    return []
  }

  return ((nestedPayload as NotificationListResponseType).data ?? []).filter(
    isRecord,
  ) as NotificationRecordType[]
}

export function parseNotificationSocketFrame(payload: string): NotificationRecordType | null {
  try {
    const parsed = JSON.parse(payload)

    if (!isRecord(parsed) || parsed.type !== 'NOTIFICATION' || !isRecord(parsed.data)) {
      return null
    }

    return parsed.data as NotificationRecordType
  } catch {
    return null
  }
}
