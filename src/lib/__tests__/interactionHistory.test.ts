import { describe, expect, it } from "vitest"

import {
  formatInteractionDate,
  getInteractionSummary,
  mapInteractionToHistoryEntry,
} from "@/lib/interactionHistory"

describe("interactionHistory helpers", () => {
  it("foloseste fallback cand rezumatul lipseste", () => {
    expect(getInteractionSummary("")).toBe("Rezumat indisponibil")
    expect(getInteractionSummary("   ")).toBe("Rezumat indisponibil")
    expect(getInteractionSummary(null)).toBe("Rezumat indisponibil")
  })

  it("foloseste fallback cand data lipseste sau este invalida", () => {
    expect(formatInteractionDate("")).toBe("Data indisponibila")
    expect(formatInteractionDate("not-a-date")).toBe("Data indisponibila")
    expect(formatInteractionDate(null)).toBe("Data indisponibila")
  })

  it("mapeaza raspunsul backend la intrare de istoric", () => {
    const history = mapInteractionToHistoryEntry({
      id: "interaction-1",
      createdAt: "2026-05-04T14:30:00.000Z",
      taskTitle: "Formular local",
      stars: 5,
    })

    expect(history.id).toBe("interaction-1")
    expect(history.rating).toBe(5)
    expect(history.summary).toContain("Formular local")
  })

  it("mapeaza payloadul real de interactiune cu rating nested", () => {
    const history = mapInteractionToHistoryEntry({
      interactionId: 12,
      date: "2026-05-17T20:30:00.000Z",
      summary: "Task finalizat: \"History task\"",
      rating: {
        id: 4,
        stars: 4,
        comment: "Foarte bine",
      },
    })

    expect(history.id).toBe("12")
    expect(history.rating).toBe(4)
    expect(history.summary).toContain("History task")
    expect(history.comment).toBe("Foarte bine")
  })
})
