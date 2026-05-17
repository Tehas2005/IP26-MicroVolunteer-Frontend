import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it } from "vitest"

import { SkillTagSelector } from "@/components/shared/SkillTagSelector"

const suggestions = ["Traducere", "Transport local", "Sprijin emotional"]

function SkillTagSelectorHarness({ initialSkills = [] }: { initialSkills?: string[] }) {
  const [skills, setSkills] = useState(initialSkills)

  return (
    <SkillTagSelector
      suggestions={suggestions}
      value={skills}
      onChange={setSkills}
      emptySelectionText="Nicio abilitate selectata"
    />
  )
}

describe("SkillTagSelector", () => {
  it("selecteaza si deselecteaza sugestiile ca tag-uri", async () => {
    const user = userEvent.setup()

    render(<SkillTagSelectorHarness />)

    const transportButton = screen.getByRole("button", { name: "Transport local" })

    await user.click(transportButton)

    expect(transportButton).toHaveAttribute("aria-pressed", "true")
    expect(screen.getAllByText("Transport local")).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: "Sterge abilitatea Transport local" }))

    expect(transportButton).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByText("Nicio abilitate selectata")).toBeInTheDocument()
  })

  it("adauga skill personalizat si ignora inputul gol", async () => {
    const user = userEvent.setup()

    render(<SkillTagSelectorHarness />)

    await user.click(screen.getByRole("button", { name: "Adauga" }))

    expect(screen.getByText("Nicio abilitate selectata")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Adauga abilitate"), "organizare")
    await user.click(screen.getByRole("button", { name: "Adauga" }))

    expect(screen.getByText("organizare")).toBeInTheDocument()
  })

  it("selecteaza sugestia existenta cand inputul are acelasi skill", async () => {
    const user = userEvent.setup()

    render(<SkillTagSelectorHarness />)

    await user.type(screen.getByLabelText("Adauga abilitate"), " transport local ")
    await user.click(screen.getByRole("button", { name: "Adauga" }))

    const selectedSkills = screen.getAllByText("Transport local")
    expect(selectedSkills).toHaveLength(2)
    expect(screen.getByRole("button", { name: "Transport local" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })

  it("nu creeaza duplicate vizuale pentru acelasi skill", async () => {
    const user = userEvent.setup()

    render(<SkillTagSelectorHarness initialSkills={["Traducere"]} />)

    await user.type(screen.getByLabelText("Adauga abilitate"), "traducere")
    await user.click(screen.getByRole("button", { name: "Adauga" }))

    const selectedTags = screen
      .getAllByText("Traducere")
      .filter((element) => element.tagName.toLowerCase() === "span")

    expect(selectedTags).toHaveLength(1)
    expect(
      within(selectedTags[0]).getByRole("button", { name: "Sterge abilitatea Traducere" }),
    ).toBeInTheDocument()
  })
})
