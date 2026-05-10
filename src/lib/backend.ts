import { Backend } from '@/sdk/backend'
import { Fetcher } from '@/sdk/Fetcher'
import type { FetcherConfigType } from '@/sdk/types'
import { backendOrigin } from './apiConfig'

const fetcher = new Fetcher({
  baseURL: import.meta.env.DEV ? window.location.origin : backendOrigin,
  headers: { 'Content-Type': 'application/json' },
  beforeSend: (config: FetcherConfigType) => ({
    ...config,
    headers: {
      ...config.headers,
    },
  }),
})

export const backend = new Backend(fetcher)
