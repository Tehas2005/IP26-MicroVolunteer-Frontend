import { isValidElement, type ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/layout/RootLayout", () => ({ default: () => null }))
vi.mock("@/pages/AboutPage", () => ({ default: () => null }))
vi.mock("@/pages/AskForHelpPage", () => ({ default: () => null }))
vi.mock("@/pages/AuthPage", () => ({ default: () => null }))
vi.mock("@/pages/ChatPage", () => ({ default: () => null }))
vi.mock("@/pages/HomePage", () => ({ default: () => null }))
vi.mock("@/pages/InteractionHistoryPage", () => ({ default: () => null }))
vi.mock("@/pages/ProfilePage", () => ({ default: () => null }))
vi.mock("@/pages/ResetPasswordPage", () => ({ default: () => null }))

import { router } from "@/router"

describe("router", () => {
  it("protejeaza ruta de istoric interactiuni pentru utilizatori autentificati", () => {
    const rootRoute = router.routes.find((route) => route.path === "/")
    const historyRoute = rootRoute?.children?.find(
      (route) => route.path === "istoric-interactiuni",
    )

    expect(historyRoute).toBeDefined()
    expect(isValidElement(historyRoute?.element)).toBe(true)
    expect((historyRoute?.element as ReactElement).type).toHaveProperty(
      "name",
      "RequireAuthenticatedUser",
    )
  })
})
