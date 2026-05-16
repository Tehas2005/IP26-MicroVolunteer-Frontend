import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { AudioPlayer } from './AudioPlayer';
import type { AudioContent } from './types';

const content: AudioContent = { type: 'audio', url: 'blob:test', durationSec: 30 };

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe('AudioPlayer', () => {
  it('renders play button when idle', () => {
    render(<AudioPlayer content={content} fromMe={false} />);
    expect(screen.getByRole('button', { name: /redă/i })).toBeInTheDocument();
  });

  it('shows total duration when idle', () => {
    render(<AudioPlayer content={content} fromMe={false} />);
    expect(screen.getByText('0:30')).toBeInTheDocument();
  });

  it('renders progress bar at 0', () => {
    render(<AudioPlayer content={content} fromMe={false} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('switches to pause button after clicking play', async () => {
    render(<AudioPlayer content={content} fromMe={false} />);
    fireEvent.click(screen.getByRole('button', { name: /redă/i }));
    expect(await screen.findByRole('button', { name: /pauză/i })).toBeInTheDocument();
  });

  it('applies fromMe styles on play button', () => {
    render(<AudioPlayer content={content} fromMe={true} />);
    const btn = screen.getByRole('button', { name: /redă/i });
    expect(btn.className).toContain('bg-white/20');
  });
});
