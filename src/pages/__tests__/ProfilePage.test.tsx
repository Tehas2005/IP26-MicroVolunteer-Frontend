import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { backend } from "@/lib/backend"
import { ProfilePage } from "@/pages/ProfilePage"
import { useAuthStore } from "@/store/authStore"
import { useVolunteerProfileStore } from "@/store/volunteerProfileStore"

const profileResponse = {
  success: true,
  data: { hiddenIdentity: false },
  message: "",
  status: 200,
  isClientError: false,
  isServerError: false,
  isNotFound: false,
  isUnauthorized: false,
  isForbidden: false,
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

function resetStores() {
  useAuthStore.setState({
    user: null,
    isGuest: true,
    sessionStatus: "ready",
  })
  useVolunteerProfileStore.setState({
    profilesByUserId: {},
  })
}

async function waitForSaveButton() {
  const saveButton = screen.getByRole("button", { name: "Salveaza Profilul" })

  await waitFor(() => {
    expect(saveButton).not.toBeDisabled()
  })

  return saveButton
}

describe("ProfilePage volunteer opt-in / opt-out", () => {
  beforeEach(() => {
    vi.spyOn(backend.profile, "getByUserId").mockResolvedValue(profileResponse)
    vi.spyOn(backend.profile, "updateMe").mockResolvedValue(profileResponse)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStores()
    localStorage.clear()
    document.body.style.overflow = ""
    cleanup()
  })

  it("afiseaza onboardingul si deschide formularul de voluntar", async () => {
    const user = userEvent.setup()

    setAuthenticatedSession()
    render(<ProfilePage />)

    expect(screen.getByRole("heading", { name: "Devino voluntar" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Incepe acum" }))

    expect(screen.getByRole("button", { name: "Locatie voluntar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salveaza Profilul" })).toBeInTheDocument()
  })

  it("creeaza profilul local de voluntar dupa completarea locatiei si abilitatilor", async () => {
    const user = userEvent.setup()

    setAuthenticatedSession()
    render(<ProfilePage />)

    await user.click(screen.getByRole("button", { name: "Incepe acum" }))
    await user.click(screen.getByRole("button", { name: "Locatie voluntar" }))
    expect(screen.getByRole("option", { name: "Cluj-Napoca" })).toBeInTheDocument()
    await user.click(screen.getByRole("option", { name: "Cluj-Napoca" }))
    await user.click(screen.getByRole("button", { name: "+ transport" }))
    await user.click(await waitForSaveButton())

    await waitFor(() => {
      expect(useVolunteerProfileStore.getState().profilesByUserId["user-1"]).toMatchObject({
        userId: "user-1",
        location: "Cluj-Napoca",
        locationCoordinates: { x: 23.5899542, y: 46.769379 },
        skills: ["transport"],
        hiddenIdentity: false,
      })
    }, { timeout: 2500 })
    expect(await screen.findByText("Profilul de voluntar a fost creat.")).toBeInTheDocument()
  })

  it("cere selectarea unui oras din lista", async () => {
    const user = userEvent.setup()

    setAuthenticatedSession()
    render(<ProfilePage />)

    await user.click(screen.getByRole("button", { name: "Incepe acum" }))
    await user.click(screen.getByRole("button", { name: "+ transport" }))
    await user.click(await waitForSaveButton())

    expect(await screen.findByText("adauga locatia in care poti ajuta")).toBeInTheDocument()
    expect(useVolunteerProfileStore.getState().profilesByUserId["user-1"]).toBeUndefined()
  })

  it("sterge profilul local doar dupa confirmarea renuntarii", async () => {
    const user = userEvent.setup()

    setAuthenticatedSession()
    useVolunteerProfileStore.setState({
      profilesByUserId: {
        "user-1": {
          userId: "user-1",
          location: "Cluj-Napoca",
          locationCoordinates: { x: 23.5899542, y: 46.769379 },
          skills: ["transport"],
          hiddenIdentity: false,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      },
    })

    render(<ProfilePage />)

    await user.click(screen.getByRole("button", { name: "Renunta la statutul de voluntar" }))

    expect(
      screen.getByText("Esti sigur ca vrei sa stergi profilul tau de voluntar?"),
    ).toBeInTheDocument()
    expect(document.body.style.overflow).toBe("hidden")

    await user.click(screen.getByRole("button", { name: "Anuleaza" }))

    expect(useVolunteerProfileStore.getState().profilesByUserId["user-1"]).toBeDefined()
    expect(document.body.style.overflow).toBe("")

    await user.click(screen.getByRole("button", { name: "Renunta la statutul de voluntar" }))
    await user.click(screen.getByRole("button", { name: "Da, renunt" }))

    await waitFor(() => {
      expect(useVolunteerProfileStore.getState().profilesByUserId["user-1"]).toBeUndefined()
    })
    expect(document.body.style.overflow).toBe("")
    expect(screen.getByRole("button", { name: "Incepe acum" })).toBeInTheDocument()
  })
})
