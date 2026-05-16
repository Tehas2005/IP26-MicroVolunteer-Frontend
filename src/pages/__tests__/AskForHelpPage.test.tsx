import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { backend } from "@/lib/backend"
import { setGuestRequestLimit } from "@/lib/guestRequestLimit"
import { AskForHelpPage } from "@/pages/AskForHelpPage"
import { useAuthStore } from "@/store/authStore"

const successResponse = {
  success: true,
  data: { data: { id: "task-1" } },
  message: "",
  status: 201,
  isClientError: false,
  isServerError: false,
  isNotFound: false,
  isUnauthorized: false,
  isForbidden: false,
}

const unauthorizedResponse = {
  success: false,
  data: null,
  message: "Unauthorized",
  status: 401,
  isClientError: true,
  isServerError: false,
  isNotFound: false,
  isUnauthorized: true,
  isForbidden: false,
}

function setGuestSession() {
  useAuthStore.setState({
    user: null,
    isGuest: true,
    sessionStatus: "ready",
  })
}

function setAuthenticatedSession() {
  useAuthStore.setState({
    user: {
      id: "user-1",
      name: "Ion Popescu",
      email: "ion@example.com",
    },
    isGuest: false,
    sessionStatus: "ready",
  })
}

describe("AskForHelpPage guest details", () => {
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

  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {})
  })

  it("afiseaza detaliile aditionale si trimite guestSessionId cu descrierea compusa", async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(backend.tasks, "create").mockResolvedValue(successResponse)

    setGuestSession()
    setGuestRequestLimit(3)
    render(<AskForHelpPage />)

    expect(await screen.findByText("Cereri ramase: 3")).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"),
      "Ajutor online",
    )
    await user.type(screen.getByPlaceholderText("Context suplimentar pentru voluntar"), "Am nevoie de context")
    await user.type(screen.getByPlaceholderText("Ex: romana, engleza, ucraineana"), "engleza")
    await user.type(
      screen.getByPlaceholderText("Riscuri, acces in zona sau alte lucruri importante"),
      "bloc fara lift",
    )
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    const payload = createSpy.mock.calls[0][0]
    expect(payload).toMatchObject({
      title: "Ajutor online",
      guestSessionId: expect.any(String),
    })
    expect(payload.description).toContain("Am nevoie de context")
    expect(payload.description).toContain("Limba necesara: engleza")
    expect(payload.description).toContain("Siguranta: bloc fara lift")
    expect(await screen.findByText("Cereri ramase: 2")).toBeInTheDocument()
  })

  it("blocheaza submit-ul pentru guest cand limita este zero", async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(backend.tasks, "create").mockResolvedValue(successResponse)

    setGuestSession()
    setGuestRequestLimit(0)
    render(<AskForHelpPage />)

    expect(await screen.findByText("Cereri ramase: 0")).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"), "Ajutor online")
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    expect(
      await screen.findByText(
        "ai atins limita de cereri pentru un cont de vizitator. te rugam sa creezi un cont gratuit!",
      ),
    ).toBeInTheDocument()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it("afiseaza mesaj prietenos pentru 401 si pastreaza limita guest", async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(backend.tasks, "create").mockResolvedValue(unauthorizedResponse)

    setGuestSession()
    setGuestRequestLimit(3)
    render(<AskForHelpPage />)

    await user.type(screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"), "Ajutor online")
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    expect(
      await screen.findByText(
        "Nu am putut trimite cererea ca vizitator momentan. Te rugam sa te autentifici sau incearca din nou mai tarziu.",
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText("Unauthorized")).not.toBeInTheDocument()
    expect(screen.getByText("Cereri ramase: 3")).toBeInTheDocument()
  })

  it("trimite detaliile partiale ca payload complet pentru utilizator autentificat", async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(backend.tasks, "create").mockResolvedValue(successResponse)
    const updateDetailsSpy = vi.spyOn(backend.tasks, "updateDetails").mockResolvedValue(successResponse)

    setAuthenticatedSession()
    render(<AskForHelpPage />)

    await user.type(
      screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"),
      "Ajutor online",
    )
    await user.type(
      screen.getByPlaceholderText("Context suplimentar pentru voluntar"),
      "Am nevoie de context",
    )
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(updateDetailsSpy).toHaveBeenCalledWith("task-1", {
        notes: "Am nevoie de context",
        languageNeeded: "",
        safetyNotes: "",
      })
    })
  })
})
