import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backend } from '@/lib/backend'
import { AUTH_SESSION_QUERY_KEY } from '@/lib/authSessionQuery'

export function indicatesExistingVolunteer(message: string | null | undefined) {
  if (!message) {
    return false
  }

  return /already exists|already a volunteer|volunteer already exists|user already exists/i.test(
    message,
  )
}

export function useBecomeVolunteerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => backend.users.becomeVolunteer(),
    onSuccess: (response) => {
      if (response.success || indicatesExistingVolunteer(response.message)) {
        void queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
      }
    },
  })
}
