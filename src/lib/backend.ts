import { Backend } from '@/sdk/backend'
import { Fetcher } from '@/sdk/Fetcher'
import type { FetcherConfigType } from '@/sdk/types'

const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin)

const fetcher = new Fetcher({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  beforeSend: (config: FetcherConfigType) => ({
    ...config,
    headers: {
      ...config.headers,
    },
  }),
})

export const backend = new Backend(fetcher)
