import "@testing-library/jest-dom/vitest"

class MockWebSocket {
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onopen: ((event: Event) => void) | null = null
  public onclose: ((event: CloseEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null

  close() {}

  send() {}
}

Object.defineProperty(globalThis, 'WebSocket', {
  configurable: true,
  writable: true,
  value: MockWebSocket,
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'WebSocket', {
    configurable: true,
    writable: true,
    value: MockWebSocket,
  })
}
