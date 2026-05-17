import { describe, expect, it } from "vitest"

import {
  buildRequestDetailsPayload,
  hasCompleteRequestDetailsInput,
  hasPartialRequestDetailsInput,
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
    expect(hasCompleteRequestDetailsInput(payload)).toBe(false)
    expect(hasPartialRequestDetailsInput(payload)).toBe(true)
  })

  it("marcheaza payload-ul complet cand toate detaliile sunt completate", () => {
    const payload = buildRequestDetailsPayload("context", "romana", "acces seara")

    expect(hasRequestDetailsInput(payload)).toBe(true)
    expect(hasCompleteRequestDetailsInput(payload)).toBe(true)
    expect(hasPartialRequestDetailsInput(payload)).toBe(false)
  })

  it("nu marcheaza payload-ul gol ca detalii de salvat", () => {
    const payload = buildRequestDetailsPayload("", " ", "   ")

    expect(hasRequestDetailsInput(payload)).toBe(false)
    expect(hasCompleteRequestDetailsInput(payload)).toBe(false)
    expect(hasPartialRequestDetailsInput(payload)).toBe(false)
  })
})
