import { describe, expect, it } from 'vitest'

import type { TaskResponseType } from '@/sdk/types'

import {
  extractTaskResponseData,
  mapOfferSubmitErrorMessage,
  readRequestSummary,
  readRequestDetails,
  readTaskAudioUrl,
  readTaskCategoryLabel,
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

  it('removes audio markers from the visible text description', () => {
    const task = {
      description:
        'Am nevoie de sprijin la traducere. AUDIOCONTENT: https://cdn.example.com/audio/request.mp3',
    } as TaskResponseType

    expect(readTaskTextDescription(task)).toBe('Am nevoie de sprijin la traducere.')
  })

  it('extrage sumarul cererii din descrierea compusă', () => {
    const task = {
      description:
        'Arde\n\nLimba necesara: Romana\n\nSiguranta: Nu este niciun risc, calm.\n\nLocatie declarata: Iasi\n\nSkills needed: Transport local, Sprijin emotional',
    } as TaskResponseType

    expect(readRequestDetails(task)).toEqual({
      notes: 'Arde',
      languageNeeded: 'Romana',
      safetyNotes: 'Nu este niciun risc, calm.',
    })
    expect(readRequestSummary(task)).toEqual({
      location: 'Iasi',
      skills: ['Transport local', 'Sprijin emotional'],
    })
  })

  it('normalizeaza eticheta categoriei pentru cererile fizice', () => {
    expect(readTaskCategoryLabel('FACE_TO_FACE')).toBe('Față în față')
  })

  it('traduce mesajele backend pentru submit-ul ofertei', () => {
    expect(mapOfferSubmitErrorMessage('HelpRequest is not OPEN')).toBe(
      'Această cerere de ajutor a fost deja preluată de alt voluntar.',
    )
    expect(
      mapOfferSubmitErrorMessage('A pending offer already exists for this volunteer and task'),
    ).toBe('Ai deja o ofertă în așteptare pentru această cerere.')
  })
})
