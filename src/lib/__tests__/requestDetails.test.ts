import { describe, expect, it } from "vitest"

import {
  buildRequestDetailsPayload,
  hasRequestDetailsInput,
} from "@/lib/requestDetails"

describe("requestDetails", () => {
  it("normalizeaza campurile optionale ca string-uri goale", () => {
    expect(buildRequestDetailsPayload("  ", "", "   ")).toEqual({
      notes: "",
      languageNeeded: "",
      safetyNotes: "",
    })
  })

  it("pastreaza campurile completate si marcheaza payload-ul cu input partial", () => {
    const payload = buildRequestDetailsPayload("  context  ", " ", " acces seara ")

    expect(payload).toEqual({
      notes: "context",
      languageNeeded: "",
      safetyNotes: "acces seara",
    })
    expect(hasRequestDetailsInput(payload)).toBe(true)
  })

  it("nu marcheaza payload-ul gol ca detalii de salvat", () => {
    expect(hasRequestDetailsInput(buildRequestDetailsPayload("", " ", "   "))).toBe(false)
  })
})
