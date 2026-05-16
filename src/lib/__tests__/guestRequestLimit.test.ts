import { afterEach, describe, expect, it } from "vitest"

import {
  DEFAULT_GUEST_REQUEST_LIMIT,
  decrementGuestRequestLimit,
  getGuestRequestLimit,
  setGuestRequestLimit,
} from "@/lib/guestRequestLimit"

describe("guestRequestLimit", () => {
  afterEach(() => {
    localStorage.clear()
  })

  it("initializeaza limita implicita pentru guest", () => {
    expect(getGuestRequestLimit()).toBe(DEFAULT_GUEST_REQUEST_LIMIT)
  })

  it("decrementeaza limita fara sa coboare sub zero", () => {
    setGuestRequestLimit(1)

    expect(decrementGuestRequestLimit()).toBe(0)
    expect(decrementGuestRequestLimit()).toBe(0)
  })
})
