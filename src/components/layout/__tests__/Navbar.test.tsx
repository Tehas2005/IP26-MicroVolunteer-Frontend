import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Navbar } from "@/components/layout/Navbar"
import { backend } from "@/lib/backend"
import { useAuthStore } from "@/store/authStore"

const navigateMock = vi.fn()
let signOutSpy: ReturnType<typeof vi.spyOn>
let clearAuthTokenSpy: ReturnType<typeof vi.spyOn>
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
    signOutSpy = vi.spyOn(backend.auth, "signOut").mockResolvedValue(successResponse)
    clearAuthTokenSpy = vi.spyOn(backend.auth, "clearAuthToken").mockImplementation(() => {})
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

    const desktopNav = screen.getByRole("navigation", { name: "Navigare principală" })
    const mobileNav = screen.getByRole("navigation", { name: "Navigare principală mobilă" })

    expect(within(desktopNav).getByRole("button", { name: "Cere Ajutor" })).toBeInTheDocument()
    expect(within(desktopNav).getByRole("button", { name: "Despre Noi" })).toBeInTheDocument()
    expect(within(desktopNav).getByRole("button", { name: "Log In" })).toBeInTheDocument()
    expect(within(desktopNav).getByRole("button", { name: "Sign Up" })).toBeInTheDocument()
    expect(within(desktopNav).queryByRole("button", { name: "Profil" })).not.toBeInTheDocument()

    expect(within(mobileNav).getByRole("button", { name: "Cere Ajutor" })).toBeInTheDocument()
    expect(within(mobileNav).getByRole("button", { name: "Despre Noi" })).toBeInTheDocument()
    expect(within(mobileNav).getByRole("button", { name: "Log In" })).toBeInTheDocument()
    expect(within(mobileNav).getByRole("button", { name: "Sign Up" })).toBeInTheDocument()
    expect(within(mobileNav).queryByRole("button", { name: "Profil" })).not.toBeInTheDocument()
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

    const desktopNav = screen.getByRole("navigation", { name: "Navigare principală" })
    const mobileNav = screen.getByRole("navigation", { name: "Navigare principală mobilă" })

    expect(within(desktopNav).getByRole("button", { name: "Cere Ajutor" })).toBeInTheDocument()
    expect(within(desktopNav).getByRole("button", { name: "Despre Noi" })).toBeInTheDocument()
    expect(within(desktopNav).getByRole("button", { name: "Profil" })).toBeInTheDocument()
    expect(within(desktopNav).getByRole("button", { name: "Ieși din cont" })).toBeInTheDocument()
    expect(within(desktopNav).queryByRole("button", { name: "Log In" })).not.toBeInTheDocument()
    expect(within(desktopNav).queryByRole("button", { name: "Sign Up" })).not.toBeInTheDocument()

    expect(within(mobileNav).getByRole("button", { name: "Cere Ajutor" })).toBeInTheDocument()
    expect(within(mobileNav).getByRole("button", { name: "Despre Noi" })).toBeInTheDocument()
    expect(within(mobileNav).getByRole("button", { name: "Profil" })).toBeInTheDocument()
    expect(within(mobileNav).getByRole("button", { name: "Ieși din cont" })).toBeInTheDocument()
    expect(within(mobileNav).queryByRole("button", { name: "Log In" })).not.toBeInTheDocument()
    expect(within(mobileNav).queryByRole("button", { name: "Sign Up" })).not.toBeInTheDocument()
  })

  it("deschide si inchide meniul mobil dupa navigare", async () => {
    const user = userEvent.setup()

    render(<Navbar />)

    const menuToggle = screen.getByRole("button", { name: "Deschide meniul de navigare" })
    const mobileNav = screen.getByRole("navigation", { name: "Navigare principală mobilă" })

    expect(menuToggle).toHaveAttribute("aria-expanded", "false")

    await user.click(menuToggle)

    expect(screen.getByRole("button", { name: "Închide meniul de navigare" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )

    await user.click(within(mobileNav).getByRole("button", { name: "Cere Ajutor" }))

    expect(navigateMock).toHaveBeenCalledWith("/cere-ajutor")
    expect(screen.getByRole("button", { name: "Deschide meniul de navigare" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("apeleaza logout-ul real din meniul mobil si revine la home", async () => {
    const user = userEvent.setup()

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

    await user.click(screen.getByRole("button", { name: "Deschide meniul de navigare" }))

    const mobileNav = screen.getByRole("navigation", { name: "Navigare principală mobilă" })

    await user.click(within(mobileNav).getByRole("button", { name: "Ieși din cont" }))

    await waitFor(() => {
      expect(signOutSpy).toHaveBeenCalledTimes(1)
      expect(clearAuthTokenSpy).toHaveBeenCalledTimes(1)
      expect(useAuthStore.getState().isGuest).toBe(true)
      expect(navigateMock).toHaveBeenCalledWith("/")
    })

    expect(screen.getByRole("button", { name: "Deschide meniul de navigare" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })
})
