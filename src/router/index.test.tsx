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
vi.mock("@/pages/UserProfilePage", () => ({ default: () => null }))

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

  it("separa ruta de profil de ruta pentru setarile de voluntar", () => {
    const rootRoute = router.routes.find((route) => route.path === "/")
    const profileRoute = rootRoute?.children?.find((route) => route.path === "profil")
    const volunteerRoute = rootRoute?.children?.find((route) => route.path === "devino-voluntar")

    expect(profileRoute).toBeDefined()
    expect(volunteerRoute).toBeDefined()
    expect(isValidElement(profileRoute?.element)).toBe(true)
    expect(isValidElement(volunteerRoute?.element)).toBe(true)

    const profileElement = profileRoute?.element as ReactElement<{ children: ReactElement }>
    const volunteerElement = volunteerRoute?.element as ReactElement<{ children: ReactElement }>

    const profileChildren = profileElement.props.children
    const volunteerChildren = volunteerElement.props.children

    expect(profileChildren.type).not.toBe(volunteerChildren.type)
  })
})
