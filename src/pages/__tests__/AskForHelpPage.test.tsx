import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { backend } from "@/lib/backend"
import { AskForHelpPage } from "@/pages/AskForHelpPage"
import { useAuthStore } from "@/store/authStore"

const successResponse = {
  success: true,
  data: {
    id: "task-1",
    title: "Ridicare medicamente de la farmacie",
  },
  message: "",
  status: 201,
  isClientError: false,
  isServerError: false,
  isNotFound: false,
  isUnauthorized: false,
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
      name: "Ion Socol",
      email: "ion@example.com",
    },
    isGuest: false,
    sessionStatus: "ready",
  })
}

describe("AskForHelpPage", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    setGuestSession()
    cleanup()
  })

  it("pastreaza restrictiile de guest si nu trimite cererea catre backend", async () => {
    const user = userEvent.setup()
    const createTaskMock = vi.spyOn(backend.tasks, "create")

    setGuestSession()
    render(<AskForHelpPage />)

    expect(screen.getByRole("button", { name: "Fizic (doar user logat)" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Rosu (doar user logat)" })).toBeDisabled()

    await user.type(
      screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"),
      "Am nevoie de ajutor online",
    )
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createTaskMock).not.toHaveBeenCalled()
    })
  })

  it("cere locatia pentru cererile fizice", async () => {
    const user = userEvent.setup()
    const createTaskMock = vi.spyOn(backend.tasks, "create")

    setAuthenticatedSession()
    render(<AskForHelpPage />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Fizic" })).toBeEnabled()
    })

    await user.type(
      screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"),
      "Ridicare pachet",
    )
    await user.click(screen.getByRole("button", { name: "Fizic" }))
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    expect(await screen.findAllByText("Completeaza locatia pentru cererile fizice.")).not.toHaveLength(0)
    expect(createTaskMock).not.toHaveBeenCalled()
  })

  it("trimite payload-ul corect catre backend si afiseaza mesajul de succes", async () => {
    const user = userEvent.setup()
    const createTaskMock = vi.spyOn(backend.tasks, "create").mockResolvedValue(successResponse)

    setAuthenticatedSession()
    render(<AskForHelpPage />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Fizic" })).toBeEnabled()
    })

    await user.type(
      screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"),
      "Ridicare medicamente de la farmacie",
    )
    await user.click(screen.getByRole("button", { name: "Fizic" }))
    await user.click(screen.getByRole("button", { name: "Galben" }))
    await user.type(
      screen.getByPlaceholderText("Scrie orasul sau alege din lista"),
      "Cluj-Napoca",
    )
    await user.type(
      screen.getByPlaceholderText("Adauga informatii suplimentare pentru cererea ta..."),
      "Am nevoie de ajutor pana la ora 18:00.",
    )
    await user.click(screen.getByRole("button", { name: "Transport local" }))
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createTaskMock).toHaveBeenCalledTimes(1)
    })

    expect(createTaskMock).toHaveBeenCalledWith({
      title: "Ridicare medicamente de la farmacie",
      description:
        "Am nevoie de ajutor pana la ora 18:00.\n\nLocatie declarata: Cluj-Napoca\n\nSkills needed: Transport local",
      status: "OPEN",
      urgency: "MEDIUM",
      category: "FACE_TO_FACE",
      location: {
        x: 23.5899542,
        y: 46.769379,
      },
      anonymousMode: false,
      city: "Cluj-Napoca",
      skillsNeeded: ["Transport local"],
    })

    expect(
      await screen.findByText("Cererea ta a fost trimisa voluntarilor!"),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie")).toHaveValue("")
  })
})
