// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import VolunteerProfilePage from './VolunteerProfilePage'

vi.mock('@/store/authStore', () => ({
    useAuthStore: () => ({
        user: { id: '1', name: 'Test User' },
        sessionStatus: 'authenticated',
    }),
}))

describe('VolunteerProfilePage - Locație și Distanță (FE-005-A)', () => {
    it('randează corect câmpurile pentru distanță și locație', () => {
        render(
            <BrowserRouter>
                <VolunteerProfilePage />
            </BrowserRouter>
        )

        expect(screen.getByText(/Zonă și Distanță/i)).toBeInTheDocument()
        expect(screen.getByText(/Distanța maximă/i)).toBeInTheDocument()
        expect(screen.getByText(/Locația curentă/i)).toBeInTheDocument()
    })
})