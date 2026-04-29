import { useState, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import type { AudioContent } from './types';

function formatSec(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

interface Props {
  content: AudioContent;
  fromMe: boolean;
}

export function AudioPlayer({ content, fromMe }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(content.durationSec ?? 0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
        .catch(() => {});
    }
  }, [isPlaying]);

  function handleEnded() {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }

  function handleTimeUpdate() {
    setCurrentTime(audioRef.current?.currentTime ?? 0);
  }

  function handleLoadedMetadata() {
    const d = audioRef.current?.duration;
    if (d && isFinite(d)) setDuration(d);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || duration === 0) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasStarted = currentTime > 0;
  const displayTime = hasStarted || isPlaying ? formatSec(currentTime) : formatSec(duration);

  const trackBg = fromMe ? 'bg-white/30' : 'bg-brand-purple/20';
  const fillBg = fromMe ? 'bg-white' : 'bg-brand-purple';
  const thumbBg = fromMe ? 'bg-white' : 'bg-brand-purple';
  const timeColor = fromMe ? 'text-white/60' : 'text-brand-gray-text';
  const btnClass = fromMe
    ? 'bg-white/20 text-white hover:bg-white/30'
    : 'bg-brand-purple/15 text-brand-purple hover:bg-brand-purple/25';

  return (
    <div className="flex min-w-[160px] items-center gap-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? 'Pauză' : 'Redă'}
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
          btnClass,
        ].join(' ')}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>

      {/* Seekable track */}
      <div
        ref={trackRef}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        onClick={handleSeek}
        className={['relative h-1.5 flex-1 cursor-pointer rounded-full', trackBg].join(' ')}
      >
        {/* Fill */}
        <div
          className={['h-full rounded-full', fillBg].join(' ')}
          style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
        />
        {/* Thumb — visible once playback has started */}
        {(isPlaying || hasStarted) && (
          <div
            className={['absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full', thumbBg].join(' ')}
            style={{ left: `${progress}%` }}
          />
        )}
      </div>

      {/* Time display: current when playing, total when idle */}
      <span className={['w-8 shrink-0 text-right tabular-nums text-[11px]', timeColor].join(' ')}>
        {displayTime}
      </span>

      <audio
        ref={audioRef}
        src={content.url}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
      />
    </div>
  );
}
