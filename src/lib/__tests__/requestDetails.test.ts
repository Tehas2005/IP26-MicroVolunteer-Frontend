import { describe, expect, it } from 'vitest'

import type { TaskResponseType } from '@/sdk/types'

import {
  extractTaskResponseData,
  UNSPECIFIED_REQUEST_DETAIL,
  readRequestDetails,
  readTaskAudioUrl,
  readTaskCategoryLabel,
  readTaskTextDescription,
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

  it('normalizes category labels for face to face requests', () => {
    expect(readTaskCategoryLabel('FACE_TO_FACE')).toBe('FACETOFACE')
  })
})
