import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderResult {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  micError: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearAudio: () => void;
}

export function useAudioRecorder(): AudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setMicError('Permisiunea pentru microfon este necesară.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Resets pending state without revoking the URL so sent messages remain playable.
  const clearAudio = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
  }, []);

  return { isRecording, audioBlob, audioUrl, micError, startRecording, stopRecording, clearAudio };
}
