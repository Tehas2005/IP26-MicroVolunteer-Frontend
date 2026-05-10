import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("cn", () => {
  it("combina clasele si ignora valorile falsy", () => {
    expect(cn("px-4", undefined, "py-2")).toBe("px-4 py-2")
  })

  it("rezolva conflictele simple de Tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })
})
