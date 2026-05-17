import { describe, expect, it } from 'vitest'

import type { TaskResponseType } from '@/sdk/types'

import {
  extractTaskResponseData,
  mapOfferSubmitErrorMessage,
  readRequestDetails,
  readTaskAudioUrl,
  readTaskCategoryLabel,
  readTaskDeclaredLocation,
  readTaskNeededSkills,
  readTaskTextDescription,
  UNSPECIFIED_REQUEST_DETAIL,
} from '../requestDetails'

describe('requestDetails helpers', () => {
  it('extracts task payloads from response envelopes', () => {
    expect(
      extractTaskResponseData({
        data: {
          id: '12',
          title: 'Ridicare medicamente',
        },
      }),
    ).toMatchObject({
      id: '12',
      title: 'Ridicare medicamente',
    })
  })

  it('returns fallback text for missing request details fields', () => {
    const task = { details: {} } as TaskResponseType

    expect(readRequestDetails(task)).toEqual({
      notes: UNSPECIFIED_REQUEST_DETAIL,
      languageNeeded: UNSPECIFIED_REQUEST_DETAIL,
      safetyNotes: UNSPECIFIED_REQUEST_DETAIL,
    })
  })

  it('prefers the backend audioUrl when present', () => {
    const task = {
      audioUrl: 'https://cdn.example.com/audio/request.webm',
      description: 'Textul cererii',
    } as TaskResponseType

    expect(readTaskAudioUrl(task)).toBe('https://cdn.example.com/audio/request.webm')
  })

  it('extracts audio urls from AUDIOCONTENT descriptions', () => {
    const task = {
      description: 'AUDIOCONTENT: https://cdn.example.com/audio/request.mp3',
    } as TaskResponseType

    expect(readTaskAudioUrl(task)).toBe('https://cdn.example.com/audio/request.mp3')
  })

  it('separates free text from metadata saved in the task description', () => {
    const task = {
      description:
        'MERGEȚI REPEDE\n\nLimbă necesară: Română\n\nSiguranță: Nu este niciun risc, calm.\n\nLocație declarată: Iași\n\nAbilități necesare: Ridicare medicamente, Traducere',
    } as TaskResponseType

    expect(readTaskTextDescription(task)).toBe('MERGEȚI REPEDE')
    expect(readRequestDetails(task)).toEqual({
      notes: 'MERGEȚI REPEDE',
      languageNeeded: 'Română',
      safetyNotes: 'Nu este niciun risc, calm.',
    })
    expect(readTaskDeclaredLocation(task)).toBe('Iași')
    expect(readTaskNeededSkills(task)).toEqual(['Ridicare medicamente', 'Traducere'])
  })

  it('normalizes category labels for request details', () => {
    expect(readTaskCategoryLabel('FACE_TO_FACE')).toBe('Față în față')
    expect(readTaskCategoryLabel('MESSAGES_ONLY')).toBe('Doar mesaje')
  })

  it('translates backend errors for help offer submission', () => {
    expect(mapOfferSubmitErrorMessage('A pending offer already exists for this volunteer and task')).toBe(
      'Ai deja o ofertă în așteptare pentru această cerere.',
    )
    expect(mapOfferSubmitErrorMessage('Volunteer already has a pending offer for this task')).toBe(
      'Ai deja o ofertă în așteptare pentru această cerere.',
    )
    expect(mapOfferSubmitErrorMessage('HelpRequest is not OPEN')).toBe(
      'Această cerere de ajutor a fost deja preluată de alt voluntar.',
    )
    expect(mapOfferSubmitErrorMessage('Only volunteers can create offers')).toBe(
      'Doar voluntarii pot trimite oferte pentru cereri.',
    )
  })
})
