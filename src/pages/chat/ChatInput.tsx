import { useState, type KeyboardEvent } from 'react';
import { Mic, MicOff, Send, X } from 'lucide-react';
import type { MessageContent } from './types';
import { useAudioRecorder } from './hooks/useAudioRecorder';

interface Props {
  onSend: (content: MessageContent) => void;
  conversationClosed?: boolean;
}

export function ChatInput({ onSend, conversationClosed = false }: Props) {
  const [text, setText] = useState('');
  const { isRecording, audioUrl, micError, startRecording, stopRecording, clearAudio } =
    useAudioRecorder();

  const canSend = !conversationClosed && (text.trim().length > 0 || audioUrl !== null);
  const inputDisabled = conversationClosed || isRecording || audioUrl !== null;

  function handleSend() {
    if (!canSend) return;
    if (audioUrl) {
      onSend({ type: 'audio', url: audioUrl });
      clearAudio();
    } else if (text.trim()) {
      onSend({ type: 'text', text: text.trim() });
      setText('');
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleMicClick() {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }

  if (conversationClosed) {
    return (
      <div className="shrink-0 border-t border-brand-gray bg-white px-6 py-4 sm:px-8">
        <p className="text-center text-sm text-brand-gray-text">
          Acest task a fost finalizat. Conversația este închisă.
        </p>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-brand-gray bg-white px-6 py-3 sm:px-8">
      {micError && (
        <div
          role="alert"
          className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {micError}
        </div>
      )}

      {isRecording && (
        <div className="mb-2 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-sm font-medium text-red-600">Înregistrare...</span>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-brand-purple/20 bg-brand-purple/5 px-3 py-1.5">
          <audio src={audioUrl} controls className="h-7 min-w-0 flex-1" />
          <button
            type="button"
            onClick={clearAudio}
            aria-label="Șterge înregistrarea"
            className="shrink-0 text-brand-gray-text transition-colors hover:text-brand-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={inputDisabled}
          placeholder="Scrie un mesaj..."
          className="min-w-0 flex-1 rounded-full border border-brand-gray bg-brand-cream px-4 py-2 text-sm outline-none transition-colors placeholder:text-brand-gray-text focus:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="button"
          onClick={handleMicClick}
          aria-label={isRecording ? 'Oprește înregistrarea' : 'Înregistrează mesaj vocal'}
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
            isRecording
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'border border-brand-gray bg-brand-cream text-brand-gray-text hover:border-brand-purple hover:bg-brand-purple/5 hover:text-brand-purple',
          ].join(' ')}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Trimite mesajul"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple text-white transition-colors hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
