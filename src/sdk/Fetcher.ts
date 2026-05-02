import type { ApiResponse, FetcherConfigType, FetcherRequestOptionsType } from './types'

export class Fetcher {
  private abortController: AbortController

  constructor(public config: FetcherConfigType) {
    this.config = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    }
    this.config.baseURL = this.normalizeBaseURL(config.baseURL)
    this.abortController = new AbortController()
  }

  public configure(config: Partial<FetcherConfigType>): void {
    this.config = {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    }
  }

  public getHeaders(): Record<string, string> {
    return this.config.headers
  }

  public setAuthToken(token: string, type: 'Bearer' | 'Basic' = 'Bearer'): void {
    this.config.headers.Authorization = `${type} ${token}`
  }

  public clearAuthToken(): void {
    delete this.config.headers.Authorization
  }

  public clearContentType(): void {
    delete this.config.headers['Content-Type']
  }

  public setContentType(): void {
    this.config.headers['Content-Type'] = 'application/json'
  }

  public abort(): void {
    this.abortController.abort()
    this.abortController = new AbortController()
  }

  public clone(): Fetcher {
    return new Fetcher({ ...this.config, headers: { ...this.config.headers } })
  }

  public async get<T = unknown>(
    path: string,
    options?: FetcherRequestOptionsType,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options)
  }

  public async post<T = unknown>(
    path: string,
    data?: unknown,
    options?: FetcherRequestOptionsType,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, options)
  }

  public async put<T = unknown>(
    path: string,
    data?: unknown,
    options?: FetcherRequestOptionsType,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, options)
  }

  public async patch<T = unknown>(
    path: string,
    data?: unknown,
    options?: FetcherRequestOptionsType,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, options)
  }

  public async delete<T = unknown>(
    path: string,
    data?: unknown,
    options?: FetcherRequestOptionsType,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, data, options)
  }

  public async request<T = unknown>(
    method: string,
    path: string,
    data?: unknown,
    options?: FetcherRequestOptionsType,
  ): Promise<ApiResponse<T>> {
    const fullURL = this.buildURL(path, options?.query)
    const requestOptions = this.buildRequestOptions(method, data, options)

    try {
      const response = await fetch(fullURL, requestOptions)

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }

      const text = await response.text()
      const parsed = text ? this.tryParseJSON(text) : null
      const message = this.extractMessage(parsed)

      const result: ApiResponse<T> = {
        data: response.ok ? (parsed as T | null) : null,
        message,
        success: response.ok,
        status: response.status,
        isClientError: response.status >= 400 && response.status < 500,
        isServerError: response.status >= 500,
        isNotFound: response.status === 404,
        isUnauthorized: response.status === 401,
        isForbidden: response.status === 403,
      }

      if (result.isServerError && message) {
        this.config.onServerError?.(message)
      }

      return result
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Request failed unexpectedly.'

      return {
        data: null,
        message,
        success: false,
        status: 0,
        isClientError: false,
        isServerError: false,
        isNotFound: false,
        isUnauthorized: false,
        isForbidden: false,
      }
    }
  }

  private normalizeBaseURL(baseURL: string): string {
    return baseURL.replace(/\/+$/, '')
  }

  private buildURL(url: string, query?: FetcherRequestOptionsType['query']): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return this.appendQueryParams(url, query)
    }

    const path = url.startsWith('/') ? url : `/${url}`
    return this.appendQueryParams(`${this.config.baseURL}${path}`, query)
  }

  private buildRequestOptions(
    method: string,
    data?: unknown,
    options?: FetcherRequestOptionsType,
  ): RequestInit {
    const headers = {
      ...this.config.headers,
      ...options?.headers,
      ...(this.config.beforeSend?.(this.config).headers || {}),
    }

    let body: BodyInit | undefined

    if (data !== undefined && method !== 'GET' && method !== 'HEAD') {
      if (data instanceof FormData) {
        body = data
        delete headers['Content-Type']
      } else if (typeof data === 'string' || data instanceof Blob || data instanceof ArrayBuffer) {
        body = data
      } else {
        body = JSON.stringify(data)
      }
    }

    const combinedController = new AbortController()

    this.abortController.signal.addEventListener('abort', () => {
      combinedController.abort()
    })

    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        combinedController.abort()
      })
    }

    return {
      method,
      headers,
      body,
      signal: combinedController.signal,
      credentials: 'include',
    }
  }

  private tryParseJSON(text: string): unknown {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  private extractMessage(payload: unknown): string | null {
    if (!payload) return null
    if (typeof payload === 'string') return payload
    if (typeof payload === 'object' && payload !== null) {
      const message = 'message' in payload ? payload.message : null
      return typeof message === 'string' ? message : null
    }
    return null
  }

  private appendQueryParams(url: string, query?: FetcherRequestOptionsType['query']) {
    if (!query) return url

    const searchParams = new URLSearchParams()

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }

      searchParams.append(key, String(value))
    })

    const queryString = searchParams.toString()
    if (!queryString) return url

    return `${url}${url.includes('?') ? '&' : '?'}${queryString}`
  }
}
