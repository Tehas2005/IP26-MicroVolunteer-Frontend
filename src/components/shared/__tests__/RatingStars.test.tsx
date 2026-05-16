import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { RatingStars } from "@/components/shared/RatingStars"

afterEach(() => {
  cleanup()
})

describe("RatingStars", () => {
  it("afiseaza scorul pentru rating numeric", () => {
    render(<RatingStars value={4} />)

    expect(screen.getByText("4/5")).toBeInTheDocument()
  })

  it("afiseaza fallback cand ratingul lipseste", () => {
    render(<RatingStars value={null} />)

    expect(screen.getByText("Fără rating")).toBeInTheDocument()
    expect(screen.queryByText("0/5")).not.toBeInTheDocument()
  })

  it("afiseaza fallback cand ratingul este invalid", () => {
    render(<RatingStars value={Number.NaN} />)

    expect(screen.getByText("Fără rating")).toBeInTheDocument()
    expect(screen.queryByText("0/5")).not.toBeInTheDocument()
  })
})
