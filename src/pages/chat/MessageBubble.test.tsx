import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageBubble } from './MessageBubble';
import type { Message } from './types';

const baseMessage: Message = {
  id: '1',
  from: 'me',
  senderId: 1,
  timestamp: new Date(2024, 0, 15, 10, 30, 0),
  content: { type: 'text', text: 'Salut!' },
};

describe('MessageBubble', () => {
  it('renders text message content', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText('Salut!')).toBeInTheDocument();
  });

  it('aligns right for messages from me', () => {
    const { container } = render(<MessageBubble message={baseMessage} />);
    expect(container.firstChild).toHaveClass('justify-end');
  });

  it('aligns left for messages from them', () => {
    const message: Message = { ...baseMessage, from: 'them' };
    const { container } = render(<MessageBubble message={message} />);
    expect(container.firstChild).toHaveClass('justify-start');
  });

  it('renders a timestamp', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('renders AudioPlayer for audio messages', () => {
    const message: Message = {
      ...baseMessage,
      content: { type: 'audio', url: 'blob:test', durationSec: 15 },
    };
    render(<MessageBubble message={message} />);
    expect(screen.getByRole('button', { name: /redă/i })).toBeInTheDocument();
  });
});
