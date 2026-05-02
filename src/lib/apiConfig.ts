const DEFAULT_BACKEND_ORIGIN = 'https://micro-volunteer-backend-service.up.railway.app'

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, '')
}

function stripApiSuffix(url: string) {
  return normalizeUrl(url).replace(/\/api(?:\/auth)?$/, '')
}

function readEnvValue(value: string | undefined) {
  return value && value.trim() ? value.trim() : ''
}

const backendOriginEnv =
  readEnvValue(import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
  readEnvValue(import.meta.env.VITE_API_URL as string | undefined)

const apiBaseUrlEnv = readEnvValue(import.meta.env.VITE_API_BASE_URL as string | undefined)
const authBaseUrlEnv = readEnvValue(import.meta.env.VITE_AUTH_BASE_URL as string | undefined)

export const backendOrigin = backendOriginEnv
  ? stripApiSuffix(backendOriginEnv)
  : DEFAULT_BACKEND_ORIGIN

export const apiBaseUrl = apiBaseUrlEnv
  ? normalizeUrl(apiBaseUrlEnv)
  : `${backendOrigin}/api`

export const authBaseUrl = authBaseUrlEnv
  ? normalizeUrl(authBaseUrlEnv)
  : `${apiBaseUrl}/auth`

export function buildBackendUrl(path: string) {
  if (!path) return backendOrigin
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${backendOrigin}${normalizedPath}`
}
