import { describe, expect, it } from "vitest"

import { formatInteractionDate, getInteractionSummary, getMockInteractionHistory } from "@/lib/interactionHistory"

describe("interactionHistory helpers", () => {
  it("foloseste fallback cand rezumatul lipseste", () => {
    expect(getInteractionSummary("")).toBe("Rezumat indisponibil")
    expect(getInteractionSummary("   ")).toBe("Rezumat indisponibil")
    expect(getInteractionSummary(null)).toBe("Rezumat indisponibil")
  })

  it("foloseste fallback cand data lipseste sau este invalida", () => {
    expect(formatInteractionDate("")).toBe("Data indisponibilă")
    expect(formatInteractionDate("not-a-date")).toBe("Data indisponibilă")
    expect(formatInteractionDate(null)).toBe("Data indisponibilă")
  })

  it("intoarce intrari mock doar pentru utilizator autentificat", () => {
    expect(getMockInteractionHistory()).toEqual([])

    const history = getMockInteractionHistory({
      id: "user-1",
      email: "test@example.com",
      name: "Ion Socol",
    })

    expect(history).toHaveLength(3)
    expect(history[0]?.id).toBe("user-1-history-1")
  })
})
