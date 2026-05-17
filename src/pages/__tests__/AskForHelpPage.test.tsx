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

const guestSessionResponse = {
  ...successResponse,
  data: {
    sessionId: "550e8400-e29b-41d4-a716-446655440000",
  },
}

function guestTasksResponse(openTasksCount = 0) {
  return {
    ...successResponse,
    data: {
      data: {
        data: Array.from({ length: openTasksCount }, (_, index) => ({
          id: `guest-task-${index + 1}`,
          status: "OPEN",
        })),
        meta: {
          page: 1,
          pageSize: 3,
          total: openTasksCount,
          totalPages: 1,
        },
      },
    },
  }
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

describe("AskForHelpPage", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {})
    vi.spyOn(backend.guest, "createSession").mockResolvedValue(guestSessionResponse)
    vi.spyOn(backend.guest, "listTasks").mockResolvedValue(guestTasksResponse())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    setGuestSession()
    cleanup()
  })

  it("pastreaza restrictiile de guest pentru optiunile rezervate userilor autentificati", () => {
    setGuestSession()
    render(<AskForHelpPage />)

    expect(screen.getByRole("button", { name: "Fizic (doar user logat)" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Rosu (doar user logat)" })).toBeDisabled()
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

    expect(
      await screen.findAllByText("Completeaza locatia pentru cererile fizice."),
    ).not.toHaveLength(0)
    expect(createTaskMock).not.toHaveBeenCalled()
  })

  it("trimite payload-ul corect catre backend si afiseaza mesajul de succes", async () => {
    const user = userEvent.setup()
    const createTaskMock = vi.spyOn(backend.tasks, "create").mockResolvedValue(successResponse)
    const updateDetailsMock = vi.spyOn(backend.tasks, "updateDetails").mockResolvedValue(successResponse)

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
      screen.getByPlaceholderText("Context suplimentar pentru voluntar"),
      "Am nevoie de ajutor pana la ora 18:00.",
    )
    await user.type(screen.getByPlaceholderText("Ex: romana, engleza, ucraineana"), "romana")
    await user.type(
      screen.getByPlaceholderText("Riscuri, acces in zona sau alte lucruri importante"),
      "intrare prin curte",
    )
    await user.click(screen.getByRole("button", { name: "Transport local" }))
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createTaskMock).toHaveBeenCalledTimes(1)
      expect(updateDetailsMock).toHaveBeenCalledWith("task-1", {
        notes: "Am nevoie de ajutor pana la ora 18:00.",
        languageNeeded: "romana",
        safetyNotes: "intrare prin curte",
      })
    })

    expect(createTaskMock).toHaveBeenCalledWith({
      title: "Ridicare medicamente de la farmacie",
      description:
        "Am nevoie de ajutor pana la ora 18:00.\n\nLimba necesara: romana\n\nSiguranta: intrare prin curte\n\nLocatie declarata: Cluj-Napoca\n\nSkills needed: Transport local",
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

describe("AskForHelpPage guest details", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {})
    vi.spyOn(backend.guest, "createSession").mockResolvedValue(guestSessionResponse)
    vi.spyOn(backend.guest, "listTasks").mockResolvedValue(guestTasksResponse())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    setGuestSession()
    localStorage.clear()
    cleanup()
  })

  it("afiseaza detaliile aditionale si creeaza cererea guest prin endpointul dedicat", async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(backend.guest, "createTask").mockResolvedValue(successResponse)
    const authCreateSpy = vi.spyOn(backend.tasks, "create").mockResolvedValue(successResponse)

    setGuestSession()
    render(<AskForHelpPage />)

    expect(await screen.findByText("Cereri ramase: 3")).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"),
      "Ajutor online",
    )
    await user.type(
      screen.getByPlaceholderText("Context suplimentar pentru voluntar"),
      "Am nevoie de context",
    )
    await user.type(screen.getByPlaceholderText("Ex: romana, engleza, ucraineana"), "engleza")
    await user.type(
      screen.getByPlaceholderText("Riscuri, acces in zona sau alte lucruri importante"),
      "bloc fara lift",
    )
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    expect(authCreateSpy).not.toHaveBeenCalled()
    expect(createSpy).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000", {
      title: "Ajutor online",
      description:
        "Am nevoie de context\n\nLimba necesara: engleza\n\nSiguranta: bloc fara lift",
      urgency: "LOW",
      location: {
        x: 24.96676,
        y: 45.943161,
      },
      city: undefined,
      skillsNeeded: undefined,
      notes: "Am nevoie de context",
      languageNeeded: "engleza",
      safetyNotes: "bloc fara lift",
    })
  })

  it("blocheaza submit-ul pentru guest cand limita este zero", async () => {
    const user = userEvent.setup()
    vi.mocked(backend.guest.listTasks).mockResolvedValue(guestTasksResponse(3))
    const createSpy = vi.spyOn(backend.guest, "createTask").mockResolvedValue(successResponse)

    setGuestSession()
    render(<AskForHelpPage />)

    expect(await screen.findByText("Cereri ramase: 0")).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"),
      "Ajutor online",
    )
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
    const createSpy = vi.spyOn(backend.guest, "createTask").mockResolvedValue(unauthorizedResponse)

    setGuestSession()
    render(<AskForHelpPage />)

    await user.type(
      screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"),
      "Ajutor online",
    )
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(2)
    })

    expect(
      await screen.findByText(
        "Nu am putut trimite cererea ca vizitator momentan. Te rugam sa te autentifici sau incearca din nou mai tarziu.",
      ),
    ).toBeInTheDocument()
    expect(backend.guest.createSession).toHaveBeenCalledTimes(2)
    expect(screen.queryByText("Unauthorized")).not.toBeInTheDocument()
    expect(screen.getByText("Cereri ramase: 3")).toBeInTheDocument()
  })

  it("regenereaza sesiunea guest expirata si retrimite cererea o singura data", async () => {
    const user = userEvent.setup()
    const createSpy = vi
      .spyOn(backend.guest, "createTask")
      .mockResolvedValueOnce(unauthorizedResponse)
      .mockResolvedValueOnce(successResponse)

    localStorage.setItem("mvcr-guest-session-id", "11111111-1111-4111-8111-111111111111")
    setGuestSession()
    render(<AskForHelpPage />)

    expect(await screen.findByText("Cereri ramase: 3")).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("Ex: Ridicare medicamente de la farmacie"),
      "Ajutor online",
    )
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(2)
    })

    expect(createSpy).toHaveBeenNthCalledWith(
      1,
      "11111111-1111-4111-8111-111111111111",
      expect.objectContaining({
        title: "Ajutor online",
      }),
    )
    expect(createSpy).toHaveBeenNthCalledWith(
      2,
      "550e8400-e29b-41d4-a716-446655440000",
      expect.objectContaining({
        title: "Ajutor online",
      }),
    )
    expect(backend.guest.createSession).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByText("Cererea ta a fost trimisa voluntarilor!"),
    ).toBeInTheDocument()
  })

  it("blocheaza detaliile aditionale partiale pentru utilizator autentificat", async () => {
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

    expect(
      await screen.findByText(
        "Completeaza toate campurile de detalii aditionale sau lasa-le pe toate goale.",
      ),
    ).toBeInTheDocument()
    expect(createSpy).not.toHaveBeenCalled()
    expect(updateDetailsSpy).not.toHaveBeenCalled()
  })

  it("trimite detaliile complete pentru utilizator autentificat", async () => {
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
    await user.type(screen.getByPlaceholderText("Ex: romana, engleza, ucraineana"), "romana")
    await user.type(
      screen.getByPlaceholderText("Riscuri, acces in zona sau alte lucruri importante"),
      "bloc fara lift",
    )
    await user.click(screen.getByRole("button", { name: "Trimite Cererea" }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(updateDetailsSpy).toHaveBeenCalledWith("task-1", {
        notes: "Am nevoie de context",
        languageNeeded: "romana",
        safetyNotes: "bloc fara lift",
      })
    })
  })
})
