// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import VolunteerProfilePage from './VolunteerProfilePage'

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: '1', name: 'Test User' },
  }),
}))

vi.mock('@/lib/backend', () => ({
  backend: {
    profile: {
      getByUserId: vi.fn().mockResolvedValue({
        success: true,
        data: { hiddenIdentity: false },
      }),
      updateMe: vi.fn().mockResolvedValue({
        success: true,
        data: { hiddenIdentity: false },
      }),
    },
  },
}))

describe('VolunteerProfilePage - Locație și Distanță (FE-005-A)', () => {
  it('randează corect câmpurile pentru distanță și locație', () => {
    render(
      <BrowserRouter>
        <VolunteerProfilePage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/Zona si distanta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Distanta maxima/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Locatia curenta/i)).toBeInTheDocument()
    expect(screen.getByText(/Locatii cunoscute/i)).toBeInTheDocument()
  })
})
