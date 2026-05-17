import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { InteractionHistoryList } from "@/components/shared/InteractionHistoryList"

describe("InteractionHistoryList", () => {
  it("afiseaza empty state cand lista este goala", () => {
    render(<InteractionHistoryList items={[]} />)

    expect(screen.getByText("Nu ai nicio interactiune trecuta.")).toBeInTheDocument()
  })

  it("randeaza cardurile primite", () => {
    render(
      <InteractionHistoryList
        items={[
          {
            id: "history-1",
            date: "2026-05-04T14:30:00.000Z",
            summary: "Ai oferit sprijin pentru completarea unui formular local.",
            rating: 5,
          },
        ]}
      />,
    )

    expect(
      screen.getByText("Ai oferit sprijin pentru completarea unui formular local."),
    ).toBeInTheDocument()
    expect(screen.getByText("5/5")).toBeInTheDocument()
  })

  it("afiseaza fallback pentru rezumat lipsa", () => {
    render(
      <InteractionHistoryList
        items={[
          {
            id: "history-2",
            date: "2026-04-29T18:45:00.000Z",
            summary: "",
            rating: 3,
          },
        ]}
      />,
    )

    expect(screen.getByText("Rezumat indisponibil")).toBeInTheDocument()
    expect(screen.getByText("3/5")).toBeInTheDocument()
  })
})
