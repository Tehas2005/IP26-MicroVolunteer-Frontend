import { createAuthClient } from 'better-auth/react'
import { authBaseUrl } from './apiConfig'

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
})

export default authClient
