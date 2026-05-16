import { describe, expect, it } from 'vitest'

import { readUploadedAssetUrl } from '@/lib/uploads'

describe('readUploadedAssetUrl', () => {
  it('returns the direct string payload returned by the fetcher', () => {
    expect(readUploadedAssetUrl('https://cdn.example.com/audio.webm')).toBe(
      'https://cdn.example.com/audio.webm',
    )
  })

  it('falls back to nested object data when needed', () => {
    expect(
      readUploadedAssetUrl({
        data: 'https://cdn.example.com/audio.webm',
      }),
    ).toBe('https://cdn.example.com/audio.webm')
  })

  it('returns an empty string for invalid payloads', () => {
    expect(readUploadedAssetUrl(null)).toBe('')
    expect(readUploadedAssetUrl({})).toBe('')
  })
})
