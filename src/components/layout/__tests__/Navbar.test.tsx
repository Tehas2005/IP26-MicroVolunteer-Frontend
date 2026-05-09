import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Navbar } from "@/components/layout/Navbar"
import { backend } from "@/lib/backend"
import { useAuthStore } from "@/store/authStore"

const navigateMock = vi.fn()
const successResponse = {
  success: true,
  data: { success: true },
  message: "",
  status: 200,
  isClientError: false,
  isServerError: false,
  isNotFound: false,
  isUnauthorized: false,
  isForbidden: false,
}

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe("Navbar", () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.spyOn(backend.auth, "signOut").mockResolvedValue(successResponse)
    vi.spyOn(backend.auth, "clearAuthToken").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: "ready",
    })
    localStorage.clear()
    cleanup()
  })

  it("afiseaza actiunile pentru guest", () => {
    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: "ready",
    })

    render(<Navbar />)

    expect(screen.getAllByRole("button", { name: "Cere Ajutor" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Despre Noi" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Log In" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Sign Up" }).length).toBeGreaterThan(0)
    expect(screen.queryAllByRole("button", { name: "Profil" })).toHaveLength(0)
  })

  it("afiseaza actiunile pentru utilizator autentificat", () => {
    useAuthStore.setState({
      user: {
        id: "user-1",
        name: "Ion Socol",
        email: "ion@example.com",
      },
      isGuest: false,
      sessionStatus: "ready",
    })

    render(<Navbar />)

    expect(screen.getAllByRole("button", { name: "Cere Ajutor" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Despre Noi" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Profil" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Ieși din cont" }).length).toBeGreaterThan(0)
    expect(screen.queryAllByRole("button", { name: "Log In" })).toHaveLength(0)
    expect(screen.queryAllByRole("button", { name: "Sign Up" })).toHaveLength(0)
  })

  it("apeleaza logout-ul real si revine la home", async () => {
    const user = userEvent.setup()
    const signOutMock = vi.spyOn(backend.auth, "signOut").mockResolvedValue(successResponse)
    const clearAuthTokenMock = vi.spyOn(backend.auth, "clearAuthToken").mockImplementation(() => {})

    useAuthStore.setState({
      user: {
        id: "user-1",
        name: "Ion Socol",
        email: "ion@example.com",
      },
      isGuest: false,
      sessionStatus: "ready",
    })

    render(<Navbar />)

    await user.click(screen.getAllByRole("button", { name: "Ieși din cont" })[0])

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1)
      expect(clearAuthTokenMock).toHaveBeenCalledTimes(1)
      expect(useAuthStore.getState().isGuest).toBe(true)
      expect(navigateMock).toHaveBeenCalledWith("/")
    })
  })
})
