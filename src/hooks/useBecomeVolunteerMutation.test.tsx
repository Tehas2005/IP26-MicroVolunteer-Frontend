import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useBecomeVolunteerMutation } from './useBecomeVolunteerMutation'
import { backend } from '@/lib/backend'
import { AUTH_SESSION_QUERY_KEY } from '@/lib/authSessionQuery'

vi.mock('@/lib/backend', () => ({
  backend: {
    users: {
      becomeVolunteer: vi.fn(),
    },
  },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useBecomeVolunteerMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalideaza query-ul sesiunii dupa activarea rolului de voluntar', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(backend.users.becomeVolunteer).mockResolvedValue({
      success: true,
      data: {
        volunteerId: 1,
        message: 'User successfully became a volunteer',
      },
      message: 'User successfully became a volunteer',
      status: 201,
      isClientError: false,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })

    const { result } = renderHook(() => useBecomeVolunteerMutation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(backend.users.becomeVolunteer).toHaveBeenCalled()
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: AUTH_SESSION_QUERY_KEY })
  })

  it('invalideaza query-ul sesiunii cand backend-ul spune ca userul este deja voluntar', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(backend.users.becomeVolunteer).mockResolvedValue({
      success: false,
      data: null,
      message: 'User already a volunteer',
      status: 409,
      isClientError: true,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })

    const { result } = renderHook(() => useBecomeVolunteerMutation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(backend.users.becomeVolunteer).toHaveBeenCalled()
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: AUTH_SESSION_QUERY_KEY })
  })
})
