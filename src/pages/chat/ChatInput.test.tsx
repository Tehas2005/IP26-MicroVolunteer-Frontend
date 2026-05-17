import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ChatInput } from './ChatInput'

vi.mock('./hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    micError: '',
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    clearAudio: vi.fn(),
  }),
}))

describe('ChatInput', () => {
  it('renders input and action buttons', () => {
    render(<ChatInput onSend={vi.fn()} />)

    expect(screen.getByPlaceholderText('Scrie un mesaj...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Inregistreaza mesaj vocal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Trimite mesajul/i })).toBeInTheDocument()
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatInput onSend={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Trimite mesajul/i })).toBeDisabled()
  })

  it('send button is enabled when text is typed', () => {
    render(<ChatInput onSend={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Scrie un mesaj...'), {
      target: { value: 'Buna ziua' },
    })

    expect(screen.getByRole('button', { name: /Trimite mesajul/i })).not.toBeDisabled()
  })

  it('calls onSend with text content and clears input', () => {
    const onSend = vi.fn()

    render(<ChatInput onSend={onSend} />)

    fireEvent.change(screen.getByPlaceholderText('Scrie un mesaj...'), {
      target: { value: 'Buna ziua' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Trimite mesajul/i }))

    expect(onSend).toHaveBeenCalledWith({ type: 'text', text: 'Buna ziua' })
    expect(screen.getByPlaceholderText('Scrie un mesaj...')).toHaveValue('')
  })

  it('calls onSend on Enter key press', () => {
    const onSend = vi.fn()

    render(<ChatInput onSend={onSend} />)

    const input = screen.getByPlaceholderText('Scrie un mesaj...')

    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSend).toHaveBeenCalledWith({ type: 'text', text: 'Test' })
  })

  it('does not send on Shift+Enter', () => {
    const onSend = vi.fn()

    render(<ChatInput onSend={onSend} />)

    const input = screen.getByPlaceholderText('Scrie un mesaj...')

    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('shows closed message when conversationClosed is true', () => {
    render(<ChatInput onSend={vi.fn()} conversationClosed />)

    expect(screen.getByText(/Conversatia este inchisa/i)).toBeInTheDocument()
  })

  it('does not render input when conversation is closed', () => {
    render(<ChatInput onSend={vi.fn()} conversationClosed />)

    expect(screen.queryByPlaceholderText('Scrie un mesaj...')).not.toBeInTheDocument()
  })
})
