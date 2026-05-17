const DEFAULT_BACKEND_ORIGIN = 'https://micro-volunteer-crisis-router.up.railway.app'
const DEFAULT_LOCAL_BACKEND_ORIGIN = 'http://localhost:3000'

function normalizeOrigin(url: string) {
  return url.replace(/\/+$/, '').replace(/\/api(?:\/auth)?$/, '')
}

function readEnvValue(value: string | undefined) {
  return value && value.trim() ? value.trim() : ''
}

const backendOriginEnv =
  readEnvValue(import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
  readEnvValue(import.meta.env.VITE_API_URL as string | undefined) ||
  readEnvValue(import.meta.env.VITE_SERVER_URL as string | undefined)

export const backendOrigin = backendOriginEnv
  ? normalizeOrigin(backendOriginEnv)
  : DEFAULT_BACKEND_ORIGIN

export const backendRealtimeOrigin = import.meta.env.DEV
  ? typeof window !== 'undefined'
    ? window.location.origin
    : backendOriginEnv
      ? normalizeOrigin(backendOriginEnv)
      : DEFAULT_LOCAL_BACKEND_ORIGIN
  : backendOrigin
