import { useState, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import type { AudioContent } from './types';

interface Props {
  content: AudioContent;
  fromMe: boolean;
}

export function AudioPlayer({ content, fromMe }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Playback failed (e.g., empty or invalid URL) — fail silently.
        });
    }
  }, [isPlaying]);

  function handleEnded() {
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }

  const formattedDuration =
    content.durationSec !== undefined
      ? `${Math.floor(content.durationSec / 60)}:${String(content.durationSec % 60).padStart(2, '0')}`
      : null;

  return (
    <div className="flex min-w-[140px] items-center gap-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? 'Pauză' : 'Redă'}
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
          fromMe
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'bg-brand-purple/15 text-brand-purple hover:bg-brand-purple/25',
        ].join(' ')}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>

      <div
        className={[
          'h-1 flex-1 rounded-full',
          fromMe ? 'bg-white/30' : 'bg-brand-purple/20',
        ].join(' ')}
      />

      {formattedDuration !== null && (
        <span
          className={[
            'tabular-nums text-[11px]',
            fromMe ? 'text-white/60' : 'text-brand-gray-text',
          ].join(' ')}
        >
          {formattedDuration}
        </span>
      )}

      <audio ref={audioRef} src={content.url} onEnded={handleEnded} preload="metadata" />
    </div>
  );
}
