import { describe, expect, it } from "vitest"

import {
  buildRequestDetailsPayload,
  hasCompleteRequestDetails,
} from "@/lib/requestDetails"

describe("requestDetails", () => {
  it("normalizeaza campurile optionale ca string-uri goale", () => {
    expect(buildRequestDetailsPayload("  ", "", "   ")).toEqual({
      notes: "",
      languageNeeded: "",
      safetyNotes: "",
    })
  })

  it("pastreaza campurile completate si verifica payload complet", () => {
    const payload = buildRequestDetailsPayload("  context  ", " engleza ", " acces seara ")

    expect(payload).toEqual({
      notes: "context",
      languageNeeded: "engleza",
      safetyNotes: "acces seara",
    })
    expect(hasCompleteRequestDetails(payload)).toBe(true)
  })
})
