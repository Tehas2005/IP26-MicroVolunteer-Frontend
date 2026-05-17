import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChatInput } from './ChatInput'

const audioRecorderMock = vi.hoisted(() => ({
  state: {
    isRecording: false,
    audioBlob: null as Blob | null,
    audioUrl: null as string | null,
    micError: '',
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    clearAudio: vi.fn(),
  },
}))

vi.mock('./hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => audioRecorderMock.state,
}))

describe('ChatInput', () => {
  beforeEach(() => {
    audioRecorderMock.state.isRecording = false
    audioRecorderMock.state.audioBlob = null
    audioRecorderMock.state.audioUrl = null
    audioRecorderMock.state.micError = ''
    audioRecorderMock.state.startRecording.mockClear()
    audioRecorderMock.state.stopRecording.mockClear()
    audioRecorderMock.state.clearAudio.mockClear()
  })

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
    return waitFor(() => {
      expect(screen.getByPlaceholderText('Scrie un mesaj...')).toHaveValue('')
    })
  })

  it('keeps text when sending fails', async () => {
    const onSend = vi.fn().mockResolvedValue(false)

    render(<ChatInput onSend={onSend} />)

    fireEvent.change(screen.getByPlaceholderText('Scrie un mesaj...'), {
      target: { value: 'Buna ziua' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Trimite mesajul/i }))

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith({ type: 'text', text: 'Buna ziua' })
    })
    expect(screen.getByPlaceholderText('Scrie un mesaj...')).toHaveValue('Buna ziua')
  })

  it('keeps audio preview when sending fails', async () => {
    const audioBlob = new Blob(['audio'], { type: 'audio/webm' })
    const onSend = vi.fn().mockResolvedValue(false)
    audioRecorderMock.state.audioBlob = audioBlob
    audioRecorderMock.state.audioUrl = 'blob:test-audio'

    render(<ChatInput onSend={onSend} />)

    fireEvent.click(screen.getByRole('button', { name: /Trimite mesajul/i }))

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith({
        type: 'audio',
        blob: audioBlob,
        previewUrl: 'blob:test-audio',
      })
    })
    expect(audioRecorderMock.state.clearAudio).not.toHaveBeenCalled()
  })

  it('clears audio preview when sending succeeds', async () => {
    const audioBlob = new Blob(['audio'], { type: 'audio/webm' })
    const onSend = vi.fn().mockResolvedValue(true)
    audioRecorderMock.state.audioBlob = audioBlob
    audioRecorderMock.state.audioUrl = 'blob:test-audio'

    render(<ChatInput onSend={onSend} />)

    fireEvent.click(screen.getByRole('button', { name: /Trimite mesajul/i }))

    await waitFor(() => {
      expect(audioRecorderMock.state.clearAudio).toHaveBeenCalled()
    })
  })

  it('calls onSend on Enter key press', () => {
    const onSend = vi.fn()

    render(<ChatInput onSend={onSend} />)

    const input = screen.getByPlaceholderText('Scrie un mesaj...')

    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    return waitFor(() => {
      expect(onSend).toHaveBeenCalledWith({ type: 'text', text: 'Test' })
    })
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
