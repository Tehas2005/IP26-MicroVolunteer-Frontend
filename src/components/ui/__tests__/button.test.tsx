import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("randeaza textul primit", () => {
    render(<Button>Trimite</Button>)

    expect(screen.getByRole("button", { name: "Trimite" })).toBeInTheDocument()
  })

  it("apeleaza onClick cand este apasat", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Continua</Button>)

    await user.click(screen.getByRole("button", { name: "Continua" }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

