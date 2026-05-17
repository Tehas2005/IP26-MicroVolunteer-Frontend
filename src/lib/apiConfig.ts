const DEFAULT_BACKEND_ORIGIN = 'https://micro-volunteer-crisis-router.up.railway.app'

function normalizeOrigin(url: string) {
  return url.replace(/\/+$/, '').replace(/\/api(?:\/auth)?$/, '')
}

function readEnvValue(value: string | undefined) {
  return value && value.trim() ? value.trim() : ''
}

const backendOriginEnv =
  readEnvValue(import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
  readEnvValue(import.meta.env.VITE_API_URL as string | undefined) ||
  readEnvValue(import.meta.env.VITE_SERVER_URL as string | undefined) ||
  readEnvValue(import.meta.env.VITE_TASKS_API_URL as string | undefined)

export const backendOrigin = backendOriginEnv
  ? normalizeOrigin(backendOriginEnv)
  : DEFAULT_BACKEND_ORIGIN

export const backendRealtimeOrigin = backendOrigin
export const backendWebSocketOrigin = backendOrigin.replace(/^http/i, 'ws')
