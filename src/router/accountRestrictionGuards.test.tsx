import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'
import RequireAvailableAccount from './RequireAvailableAccount'
import RequireRestrictedAccount from './RequireRestrictedAccount'

describe('account restriction guards', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: 'ready',
    })
  })

  it('redirectioneaza utilizatorul blocat catre /cont-blocat', async () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Ion',
        email: 'ion@example.com',
        accountStatus: 'BLOCKED',
      },
      isGuest: false,
      sessionStatus: 'ready',
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAvailableAccount>
                <div>Feed</div>
              </RequireAvailableAccount>
            }
          />
          <Route path="/cont-blocat" element={<div>Cont blocat</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Cont blocat')).toBeInTheDocument()
    })
  })

  it('permite afisarea ecranului de cont blocat doar pentru conturi restrictionate', async () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Ion',
        email: 'ion@example.com',
        accountStatus: 'INACTIVE',
      },
      isGuest: false,
      sessionStatus: 'ready',
    })

    render(
      <MemoryRouter initialEntries={['/cont-blocat']}>
        <Routes>
          <Route
            path="/cont-blocat"
            element={
              <RequireRestrictedAccount>
                <div>Ecran blocat</div>
              </RequireRestrictedAccount>
            }
          />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Ecran blocat')).toBeInTheDocument()
  })

  it('trimite utilizatorul activ inapoi la home daca incearca /cont-blocat', async () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Ion',
        email: 'ion@example.com',
        accountStatus: 'ACTIVE',
      },
      isGuest: false,
      sessionStatus: 'ready',
    })

    render(
      <MemoryRouter initialEntries={['/cont-blocat']}>
        <Routes>
          <Route
            path="/cont-blocat"
            element={
              <RequireRestrictedAccount>
                <div>Ecran blocat</div>
              </RequireRestrictedAccount>
            }
          />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
    })
  })
})
