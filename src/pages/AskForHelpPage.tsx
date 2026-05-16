import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import { SkillTagSelector } from '@/components/shared/SkillTagSelector'
import { backend } from '@/lib/backend'
import {
  decrementGuestRequestLimit,
  getGuestRequestLimit,
} from '@/lib/guestRequestLimit'
import { readGuestSessionId, setGuestSessionId as persistGuestSessionId } from '@/lib/guestSession'
import { extractCreatedTaskId, rememberCreatedTaskId } from '@/lib/liveRequests'
import {
  buildRequestDetailsPayload,
  hasRequestDetailsInput,
  type RequestDetailsPayload,
} from '@/lib/requestDetails'
import {
  ROMANIA_CITY_COORDINATES,
  ROMANIA_CITY_NAMES,
  ROMANIA_DEFAULT_COORDINATES,
  type TaskLocationPayload,
} from '@/lib/romania-city-coordinates'
import { COMMON_SKILL_SUGGESTIONS } from '@/lib/skillSuggestions'
import { useAuthStore } from '@/store/authStore'
import type { TaskSubmissionPayloadType, TaskUrgencyType } from '@/sdk/types'

type TaskCategory = 'MESSAGES_ONLY' | 'FACE_TO_FACE'

type ValidationErrorItem = {
  field: string
  message: string
}

type ValidationErrorResponseData = {
  errors?: ValidationErrorItem[]
}

type CreateTaskPayload = TaskSubmissionPayloadType & {
  status: 'OPEN'
  urgency: TaskUrgencyType
  category: TaskCategory
  anonymousMode: boolean
  location: TaskLocationPayload
  city?: string
  guestSessionId?: string
  skillsNeeded?: string[]
}

function mapRequestTypeToCategory(requestType: 'Online' | 'Fizic'): TaskCategory {
  return requestType === 'Fizic' ? 'FACE_TO_FACE' : 'MESSAGES_ONLY'
}

function mapUrgencyToBackend(urgency: 'Verde' | 'Galben' | 'Rosu'): TaskUrgencyType {
  switch (urgency) {
    case 'Galben':
      return 'MEDIUM'
    case 'Rosu':
      return 'CRITICAL'
    default:
      return 'LOW'
  }
}

function resolveTaskLocation(location: string): TaskLocationPayload | null {
  const normalizedLocation = location.trim()

  if (!normalizedLocation) {
    return ROMANIA_DEFAULT_COORDINATES
  }

  return ROMANIA_CITY_COORDINATES[normalizedLocation] ?? null
}

function buildTaskDescription(
  requestDetails: RequestDetailsPayload,
  location: string,
  skills: string[],
  audioMessageUrl?: string | null,
) {
  const contentParts = [
    requestDetails.notes || 'Cerere trimisa din formularul Cere Ajutor.',
    requestDetails.languageNeeded ? `Limba necesara: ${requestDetails.languageNeeded}` : null,
    requestDetails.safetyNotes ? `Siguranta: ${requestDetails.safetyNotes}` : null,
    location.trim() ? `Locatie declarata: ${location.trim()}` : null,
    skills.length > 0 ? `Skills needed: ${skills.join(', ')}` : null,
    audioMessageUrl ? `Mesaj vocal: ${audioMessageUrl}` : null,
  ]

  return contentParts.filter(Boolean).join('\n\n')
}

function getUploadedAssetUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return null
  }

  const data = payload.data
  return typeof data === 'string' && data.trim() ? data : null
}

function getValidationErrors(data: unknown): ValidationErrorItem[] {
  if (!data || typeof data !== 'object' || !('errors' in data)) {
    return []
  }

  const errors = (data as ValidationErrorResponseData).errors

  if (!Array.isArray(errors)) {
    return []
  }

  return errors.filter(
    (error): error is ValidationErrorItem =>
      Boolean(error) &&
      typeof error === 'object' &&
      typeof error.field === 'string' &&
      typeof error.message === 'string',
  )
}

function getTaskSubmitErrorMessage(response: { isUnauthorized: boolean; message: string | null }) {
  if (response.isUnauthorized) {
    return 'Nu am putut trimite cererea ca vizitator momentan. Te rugam sa te autentifici sau incearca din nou mai tarziu.'
  }

  return response.message || 'Nu am putut trimite cererea catre backend. Incearca din nou.'
}

const askForHelpStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .ask-help-page {
    color: #111827;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .ask-help-form-container {
    width: 100%;
    max-width: 80rem;
    margin: 0 auto;
    padding: 40px 16px;
    min-height: calc(100vh - 148px);
  }

  .ask-help-card {
    background-color: #ffffff;
    border-radius: 24px;
    padding: 40px;
    max-width: 680px;
    margin: 0 auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  }

  .ask-help-header-title {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .ask-help-header-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 32px 0;
  }

  .ask-help-field-group {
    margin-bottom: 28px;
  }

  .ask-help-field-label {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 10px;
    display: block;
  }

  .ask-help-required-asterisk {
    color: #ef4444;
  }

  .ask-help-text-input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .ask-help-text-input:focus {
    border-color: #7c3aed;
  }

  .ask-help-text-input::placeholder {
    color: #9ca3af;
  }

  .ask-help-toggle-grid {
    display: flex;
    gap: 16px;
  }

  .ask-help-toggle-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background-color: #ffffff;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ask-help-toggle-btn:hover:not(:disabled) {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }

  .ask-help-toggle-btn.ask-help-active {
    border-color: #7c3aed;
    background-color: #f5f3ff;
    color: #6d28d9;
  }

  .ask-help-toggle-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f3f4f6;
  }

  .ask-help-urgency-verde.ask-help-active {
    border-color: #10b981;
    background-color: #ecfdf5;
    color: #047857;
  }

  .ask-help-urgency-galben.ask-help-active {
    border-color: #f59e0b;
    background-color: #fffbeb;
    color: #b45309;
  }

  .ask-help-urgency-rosu.ask-help-active {
    border-color: #ef4444;
    background-color: #fef2f2;
    color: #b91c1c;
  }

  .ask-help-section-card {
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    background: #fbfbfd;
    padding: 18px;
  }

  .ask-help-section-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }

  .ask-help-section-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }

  .ask-help-section-copy {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
  }

  .ask-help-inline-field {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }

  .ask-help-inline-field .ask-help-text-input {
    flex: 1;
  }

  .ask-help-secondary-btn {
    border: 1px solid #d1d5db;
    border-radius: 12px;
    background: #ffffff;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
    min-height: 48px;
    padding: 12px 18px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ask-help-secondary-btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .ask-help-secondary-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .ask-help-helper-text {
    color: #6b7280;
    font-size: 13px;
    margin-top: 8px;
    font-weight: 500;
    line-height: 1.5;
  }

  .ask-help-details-grid {
    display: grid;
    gap: 14px;
  }

  .ask-help-textarea {
    min-height: 92px;
    resize: vertical;
  }

  .ask-help-safety-field {
    border: 1px solid #fed7aa;
    border-radius: 16px;
    background: #fff7ed;
    padding: 14px;
  }

  .ask-help-safety-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ask-help-warning-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: #f97316;
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    line-height: 1;
  }

  .ask-help-selected-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .ask-help-selected-skill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    background: #ede9fe;
    color: #5b21b6;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;
  }

  .ask-help-selected-skill button {
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font-size: 12px;
    font-weight: 800;
  }

  .ask-help-locked-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #f3f4f6;
    color: #6b7280;
    font-size: 12px;
    font-weight: 700;
    min-height: 36px;
    padding: 9px 14px;
    text-align: center;
    white-space: normal;
  }

  .ask-help-switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    background: #ffffff;
    padding: 14px 16px;
  }

  .ask-help-switch-copy {
    flex: 1;
  }

  .ask-help-switch-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #111827;
  }

  .ask-help-switch-text {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.5;
  }

  .ask-help-switch-btn {
    width: 56px;
    height: 32px;
    border: none;
    border-radius: 999px;
    background: #d1d5db;
    padding: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .ask-help-switch-btn span {
    display: block;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: #ffffff;
    transition: transform 0.2s ease;
    box-shadow: 0 2px 6px rgba(17, 24, 39, 0.18);
  }

  .ask-help-switch-btn.ask-help-active {
    background: #7c3aed;
  }

  .ask-help-switch-btn.ask-help-active span {
    transform: translateX(24px);
  }

  .ask-help-audio-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .ask-help-record-btn {
    border: none;
    border-radius: 12px;
    background: #111827;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    padding: 12px 18px;
    cursor: pointer;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .ask-help-record-btn:hover:not(:disabled) {
    opacity: 0.94;
    transform: translateY(-1px);
  }

  .ask-help-record-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .ask-help-record-btn.ask-help-danger {
    background: #b91c1c;
  }

  .ask-help-audio-status {
    margin-top: 12px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 700;
    color: #b91c1c;
  }

  .ask-help-audio-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #ef4444;
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
    animation: ask-help-pulse 1.6s infinite;
  }

  @keyframes ask-help-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
    }

    70% {
      box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
    }

    100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
  }

  .ask-help-audio-player {
    width: 100%;
    margin-top: 14px;
  }

  .ask-help-error-text {
    color: #ef4444;
    font-size: 13px;
    margin-top: 8px;
    font-weight: 600;
  }

  .ask-help-success-box {
    background-color: #dcfce7;
    color: #166534;
    padding: 16px;
    border-radius: 12px;
    margin-top: 24px;
    text-align: center;
    font-weight: 700;
    border: 1px solid #bbf7d0;
  }

  .ask-help-primary-submit-btn {
    background-color: #1a1a1a;
    color: #ffffff;
    border-radius: 12px;
    padding: 16px;
    border: none;
    width: 100%;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 10px;
    position: relative;
    overflow: hidden;
    background-size: 200% auto;
  }

  .ask-help-primary-submit-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .ask-help-primary-submit-btn.ask-help-submitting {
    background-image: linear-gradient(90deg, #1a1a1a 0%, #7c3aed 50%, #1a1a1a 100%);
    animation: ask-help-pulse-gradient 1.5s linear infinite;
    pointer-events: none;
    color: #fff;
  }

  .ask-help-submit-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .ask-help-submit-row .ask-help-primary-submit-btn {
    flex: 1;
  }

  .ask-help-guest-limit {
    flex-shrink: 0;
    color: #4b5563;
    font-size: 14px;
    font-weight: 700;
  }

  @keyframes ask-help-pulse-gradient {
    0% {
      background-position: 0% center;
    }

    100% {
      background-position: 200% center;
    }
  }

  @media (max-width: 768px) {
    .ask-help-form-container {
      padding: 24px 16px;
    }

    .ask-help-card {
      padding: 28px 20px;
      border-radius: 20px;
    }

    .ask-help-toggle-grid,
    .ask-help-inline-field,
    .ask-help-audio-actions,
    .ask-help-submit-row {
      flex-direction: column;
    }

    .ask-help-submit-row {
      align-items: stretch;
    }

    .ask-help-secondary-btn,
    .ask-help-locked-badge {
      width: 100%;
    }

    .ask-help-section-title-row,
    .ask-help-switch {
      flex-direction: column;
      align-items: stretch;
    }
  }
`

interface InformatiiSuplimentareProps {
  location: string
  onLocationChange: (value: string) => void
  onLocationBlur: () => void
  requestType: 'Online' | 'Fizic'
  showLocationError: boolean
}

function InformatiiSuplimentare({
  location,
  onLocationChange,
  onLocationBlur,
  requestType,
  showLocationError,
}: InformatiiSuplimentareProps) {
  const isPhysicalRequest = requestType === 'Fizic'

  return (
    <div
      className="ask-help-field-group"
      style={{ borderTop: '1px solid #e5e7eb', paddingTop: '28px', marginTop: '12px' }}
    >
      <label className="ask-help-field-label">
        Locatie {isPhysicalRequest && <span className="ask-help-required-asterisk">*</span>}
      </label>
      <input
        type="text"
        list="orase-romania"
        className="ask-help-text-input"
        placeholder="Scrie orasul sau alege din lista"
        value={location}
        onChange={(event) => onLocationChange(event.target.value)}
        onBlur={onLocationBlur}
      />
      <datalist id="orase-romania">
        {ROMANIA_CITY_NAMES.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
      {showLocationError ? (
        <div className="ask-help-error-text">Completeaza locatia pentru cererile fizice.</div>
      ) : (
        <div className="ask-help-helper-text">
          {isPhysicalRequest
            ? 'Alege un oras din Romania sau scrie-l manual.'
            : 'Pentru cererile online, locatia ramane optionala.'}
        </div>
      )}
    </div>
  )
}

export function AskForHelpPage() {
  const authIsGuest = useAuthStore((state) => state.isGuest)
  const authUserId = useAuthStore((state) => state.user?.id)
  const [isGuest, setIsGuest] = useState(true)
  const [titlu, setTitlu] = useState('')
  const [requestType, setRequestType] = useState<'Online' | 'Fizic'>('Online')
  const [urgency, setUrgency] = useState<'Verde' | 'Galben' | 'Rosu'>('Verde')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [languageNeeded, setLanguageNeeded] = useState('')
  const [safetyNotes, setSafetyNotes] = useState('')
  const [locationTouched, setLocationTouched] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [guestSessionId, setGuestSessionId] = useState('')
  const [requestLimit, setRequestLimit] = useState(0)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const activeStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setIsGuest(authIsGuest)
  }, [authIsGuest])

  useEffect(() => {
    let isMounted = true

    async function syncGuestSession() {
      if (!isGuest) {
        if (isMounted) {
          setGuestSessionId('')
        }
        return
      }

      const existingSessionId = readGuestSessionId()

      if (existingSessionId) {
        if (isMounted) {
          setGuestSessionId(existingSessionId)
          setRequestLimit(getGuestRequestLimit())
        }
        return
      }

      const response = await backend.guest.createSession()
      const nextSessionId =
        response.success && typeof response.data?.sessionId === 'string'
          ? response.data.sessionId.trim()
          : ''

      if (!isMounted) {
        return
      }

      if (!nextSessionId) {
        setError('Nu am putut crea sesiunea de vizitator. Incearca din nou mai tarziu.')
        return
      }

      persistGuestSessionId(nextSessionId)
      setGuestSessionId(nextSessionId)
      setRequestLimit(getGuestRequestLimit())
    }

    void syncGuestSession()

    return () => {
      isMounted = false
    }
  }, [isGuest])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  const clearAudio = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    setAudioUrl(null)
    setAudioFile(null)
    setRecordingError('')
  }, [audioUrl])

  useEffect(() => {
    const isLocationError =
      error === 'Completeaza locatia pentru cererile fizice.' ||
      error === 'Alege un oras din lista, ca sa putem trimite coordonatele cerute de backend.' ||
      error === 'Backendul a respins locatia. Selecteaza un oras din lista si incearca din nou.'

    if (isLocationError && (requestType === 'Online' || location.trim())) {
      setError('')
    }
  }, [error, location, requestType])

  useEffect(() => {
    if (isGuest) {
      setIsAnonymous(false)
      setRecordingError('')
      setIsRecording(false)
      clearAudio()

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop())
        activeStreamRef.current = null
      }
    }
  }, [clearAudio, isGuest])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const showLocationError = requestType === 'Fizic' && locationTouched && !location.trim()

  const startRecording = async () => {
    if (isGuest) {
      return
    }

    if (typeof window === 'undefined' || !('MediaRecorder' in window) || !navigator.mediaDevices) {
      setRecordingError('Browserul curent nu suporta inregistrarea audio.')
      return
    }

    try {
      clearAudio()
      setRecordingError('')

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      activeStreamRef.current = stream

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        if (blob.size > 0) {
          const recordedFile = new File([blob], `mesaj-vocal-${Date.now()}.webm`, {
            type: blob.type || 'audio/webm',
          })
          const nextAudioUrl = URL.createObjectURL(blob)
          setAudioFile(recordedFile)
          setAudioUrl(nextAudioUrl)
        }

        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach((track) => track.stop())
          activeStreamRef.current = null
        }

        setIsRecording(false)
      }

      recorder.start()
      setIsRecording(true)
    } catch {
      setRecordingError('Nu am putut accesa microfonul. Verifica permisiunile browserului.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!titlu.trim()) {
      setError('Completeaza titlul cererii.')
      return
    }

    if (isGuest && requestLimit <= 0) {
      setError(
        'ai atins limita de cereri pentru un cont de vizitator. te rugam sa creezi un cont gratuit!',
      )
      return
    }

    if (requestType === 'Fizic' && !location.trim()) {
      setLocationTouched(true)
      setError('Completeaza locatia pentru cererile fizice.')
      return
    }

    const nextSkills = selectedSkills
    const requestDetails = buildRequestDetailsPayload(notes, languageNeeded, safetyNotes)
    const resolvedLocation = resolveTaskLocation(location)

    if (!resolvedLocation) {
      setError('Alege un oras din lista, ca sa putem trimite coordonatele cerute de backend.')
      return
    }

    if (isGuest && !guestSessionId.trim()) {
      setError('Sesiunea de vizitator nu este pregatita inca. Reincarca pagina si incearca din nou.')
      return
    }

    setIsSubmitting(true)

    try {
      let uploadedAudioUrl: string | null = null

      if (audioFile) {
        const uploadResponse = await backend.uploads.uploadAudio(audioFile)

        if (!uploadResponse.success) {
          setError(
            uploadResponse.message || 'Nu am putut incarca mesajul vocal. Incearca din nou.',
          )
          return
        }

        uploadedAudioUrl = getUploadedAssetUrl(uploadResponse.data)

        if (!uploadedAudioUrl) {
          setError('Backendul nu a returnat URL-ul mesajului vocal incarcat.')
          return
        }
      }

      const response = isGuest
        ? await backend.guest.createTask(guestSessionId, {
            title: titlu.trim(),
            description: notes.trim() || undefined,
            audioUrl: uploadedAudioUrl || undefined,
            urgency: mapUrgencyToBackend(urgency),
            city: location.trim() || undefined,
            addressText: location.trim() || undefined,
            location: resolvedLocation,
            skillsNeeded: nextSkills,
            notes: notes.trim() || undefined,
            languageNeeded: languageNeeded.trim() || undefined,
            safetyNotes: safetyNotes.trim() || undefined,
          })
        : await backend.tasks.create({
            title: titlu.trim(),
            description: buildTaskDescription(requestDetails, location, nextSkills, uploadedAudioUrl),
            status: 'OPEN' as const,
            urgency: mapUrgencyToBackend(urgency),
            category: mapRequestTypeToCategory(requestType),
            location: resolvedLocation,
            anonymousMode: isAnonymous,
            city: location.trim() || undefined,
            skillsNeeded: nextSkills,
          } satisfies CreateTaskPayload)

      if (!response.success) {
        const validationErrors = getValidationErrors(response.data)
        const locationFieldError = validationErrors.find(
          (fieldError) => fieldError.field === 'location.x' || fieldError.field === 'location.y',
        )

        if (locationFieldError) {
          setError('Backendul a respins locatia. Selecteaza un oras din lista si incearca din nou.')
          return
        }

        setError(getTaskSubmitErrorMessage(response))
        return
      }

      const createdTaskId = extractCreatedTaskId(response.data)

      if (!isGuest && createdTaskId && hasRequestDetailsInput(requestDetails)) {
        const detailsResponse = await backend.tasks.updateDetails(createdTaskId, requestDetails)

        if (!detailsResponse.success) {
          setError(
            detailsResponse.message ||
              'Cererea a fost creata, dar detaliile aditionale nu au putut fi salvate.',
          )
          return
        }
      }

      if (authUserId) {
        rememberCreatedTaskId(authUserId, createdTaskId)
      }

      if (isGuest) {
        setRequestLimit(decrementGuestRequestLimit())
      }

      setSuccessMessage('Cererea ta a fost trimisa voluntarilor!')
      setTitlu('')
      setRequestType('Online')
      setUrgency('Verde')
      setLocation('')
      setNotes('')
      setLanguageNeeded('')
      setSafetyNotes('')
      setLocationTouched(false)
      setSelectedSkills([])
      setIsAnonymous(false)
      setError('')
      clearAudio()
    } catch {
      setError('Nu am putut trimite cererea catre backend. Incearca din nou.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="ask-help-page bg-brand-cream">
      <style>{askForHelpStyles}</style>

      <div className="ask-help-form-container">
        <main className="ask-help-card">
          <h1 className="ask-help-header-title">Solicitare Ajutor</h1>
          <p className="ask-help-header-subtitle">
            Completeaza detaliile de baza pentru cererea ta si personalizeaza cerinta
            pentru voluntarul potrivit.
          </p>

          <form noValidate onSubmit={handleSubmit}>
            <div className="ask-help-field-group">
              <label className="ask-help-field-label">
                Titlul cererii <span className="ask-help-required-asterisk">*</span>
              </label>
                <input
                  type="text"
                  className="ask-help-text-input"
                  placeholder="Ex: Ridicare medicamente de la farmacie"
                  value={titlu}
                  onChange={(event) => setTitlu(event.target.value)}
                />
            </div>

            <div className="ask-help-field-group">
              <label className="ask-help-field-label">
                Tipul cererii <span className="ask-help-required-asterisk">*</span>
              </label>
              <div className="ask-help-toggle-grid">
                <button
                  type="button"
                  className={`ask-help-toggle-btn ${requestType === 'Fizic' ? 'ask-help-active' : ''}`}
                  onClick={() => setRequestType('Fizic')}
                  disabled={isGuest}
                >
                  Fizic {isGuest && '(doar user logat)'}
                </button>

                <button
                  type="button"
                  className={`ask-help-toggle-btn ${requestType === 'Online' ? 'ask-help-active' : ''}`}
                  onClick={() => setRequestType('Online')}
                >
                  Online
                </button>
              </div>
            </div>

            <div className="ask-help-field-group">
              <label className="ask-help-field-label">
                Nivel de urgenta <span className="ask-help-required-asterisk">*</span>
              </label>
              <div className="ask-help-toggle-grid">
                <button
                  type="button"
                  className={`ask-help-toggle-btn ask-help-urgency-verde ${urgency === 'Verde' ? 'ask-help-active' : ''}`}
                  onClick={() => setUrgency('Verde')}
                >
                  Verde
                </button>
                <button
                  type="button"
                  className={`ask-help-toggle-btn ask-help-urgency-galben ${urgency === 'Galben' ? 'ask-help-active' : ''}`}
                  onClick={() => setUrgency('Galben')}
                >
                  Galben
                </button>
                <button
                  type="button"
                  className={`ask-help-toggle-btn ask-help-urgency-rosu ${urgency === 'Rosu' ? 'ask-help-active' : ''}`}
                  onClick={() => setUrgency('Rosu')}
                  disabled={isGuest}
                >
                  Rosu {isGuest && '(doar user logat)'}
                </button>
              </div>
            </div>

            <InformatiiSuplimentare
              location={location}
              onLocationChange={setLocation}
              onLocationBlur={() => setLocationTouched(true)}
              requestType={requestType}
              showLocationError={showLocationError}
            />

            <div className="ask-help-field-group">
              <label className="ask-help-field-label">Detalii aditionale</label>
              <div className="ask-help-section-card">
                <div className="ask-help-section-title-row">
                  <div>
                    <h2 className="ask-help-section-title">Detalii aditionale</h2>
                  </div>
                </div>

                <div className="ask-help-details-grid">
                  <label>
                    <span className="ask-help-field-label">Notite</span>
                    <textarea
                      className="ask-help-text-input ask-help-textarea"
                      placeholder="Context suplimentar pentru voluntar"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </label>

                  <label>
                    <span className="ask-help-field-label">Limba necesara</span>
                    <input
                      type="text"
                      className="ask-help-text-input"
                      placeholder="Ex: romana, engleza, ucraineana"
                      value={languageNeeded}
                      onChange={(event) => setLanguageNeeded(event.target.value)}
                    />
                  </label>

                  <label className="ask-help-safety-field">
                    <span className="ask-help-field-label ask-help-safety-label">
                      <span className="ask-help-warning-icon" aria-hidden="true">
                        !
                      </span>
                      Notite de siguranta
                    </span>
                    <textarea
                      className="ask-help-text-input ask-help-textarea"
                      placeholder="Riscuri, acces in zona sau alte lucruri importante"
                      value={safetyNotes}
                      onChange={(event) => setSafetyNotes(event.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="ask-help-field-group">
              <label className="ask-help-field-label">Skills needed</label>
              <div className="ask-help-section-card">
                <div className="ask-help-section-title-row">
                  <div>
                    <h2 className="ask-help-section-title">Abilitati necesare de la voluntar</h2>
                    <p className="ask-help-section-copy">
                      Selecteaza una sau mai multe abilitati, ca sa fie mai usor sa gasim omul
                      potrivit pentru cererea ta.
                    </p>
                  </div>
                </div>

                <SkillTagSelector
                  suggestions={COMMON_SKILL_SUGGESTIONS}
                  value={selectedSkills}
                  onChange={setSelectedSkills}
                  emptySelectionText="Nu ai selectat inca nicio abilitate."
                />
              </div>
            </div>

            <div className="ask-help-field-group">
              <label className="ask-help-field-label">Mod anonim</label>
              <div className="ask-help-section-card">
                <div className="ask-help-section-title-row">
                  <div>
                    <h2 className="ask-help-section-title">Trimite cererea sub anonimat</h2>
                    <p className="ask-help-section-copy">
                      Daca activezi optiunea, voluntarii nu vor vedea numele tau in lista cererii.
                    </p>
                  </div>
                  {isGuest && <span className="ask-help-locked-badge">Disponibil dupa login</span>}
                </div>

                <div className="ask-help-switch">
                  <div className="ask-help-switch-copy">
                    <p className="ask-help-switch-title">
                      {isAnonymous ? 'Mod anonim activ' : 'Afiseaza identitatea contului'}
                    </p>
                    <p className="ask-help-switch-text">
                      Optiunea este vizibila doar utilizatorilor autentificati.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`ask-help-switch-btn ${isAnonymous ? 'ask-help-active' : ''}`}
                    onClick={() => setIsAnonymous((currentValue) => !currentValue)}
                    disabled={isGuest}
                    aria-pressed={isAnonymous}
                  >
                    <span />
                  </button>
                </div>
              </div>
            </div>

            <div className="ask-help-field-group">
              <label className="ask-help-field-label">Mesaj vocal</label>
              <div className="ask-help-section-card">
                <div className="ask-help-section-title-row">
                  <div>
                    <h2 className="ask-help-section-title">Adauga un mesaj audio</h2>
                    <p className="ask-help-section-copy">
                      Poti explica mai usor situatia in voce. Functia este disponibila doar pentru
                      userii logati.
                    </p>
                  </div>
                  {isGuest && <span className="ask-help-locked-badge">Disponibil dupa login</span>}
                </div>

                <div className="ask-help-audio-actions">
                  {isRecording ? (
                    <button
                      type="button"
                      className="ask-help-record-btn ask-help-danger"
                      onClick={stopRecording}
                      disabled={isGuest}
                    >
                      Opreste inregistrarea
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ask-help-record-btn"
                      onClick={startRecording}
                      disabled={isGuest}
                    >
                      {audioUrl ? 'Reinregistreaza mesajul' : 'Incepe inregistrarea'}
                    </button>
                  )}

                  <button
                    type="button"
                    className="ask-help-secondary-btn"
                    onClick={clearAudio}
                    disabled={!audioUrl}
                  >
                    Sterge mesajul
                  </button>
                </div>

                {isRecording && (
                  <div className="ask-help-audio-status">
                    <span className="ask-help-audio-dot" />
                    Inregistrare in curs...
                  </div>
                )}

                {audioUrl && <audio controls src={audioUrl} className="ask-help-audio-player" />}

                {recordingError && <div className="ask-help-error-text">{recordingError}</div>}

                {!isGuest && !recordingError && (
                  <p className="ask-help-helper-text">
                    {audioUrl
                      ? 'Mesajul vocal va fi incarcat automat cand trimiti cererea.'
                      : 'Browserul va cere acces la microfon cand incepi inregistrarea.'}
                  </p>
                )}
              </div>
            </div>

            <div className="ask-help-submit-row">
              <button
                type="submit"
                className={`ask-help-primary-submit-btn ${isSubmitting ? 'ask-help-submitting' : ''}`}
                disabled={isSubmitting || isRecording}
              >
                {isSubmitting ? 'Se trimite...' : 'Trimite Cererea'}
              </button>

              {isGuest ? (
                <span className="ask-help-guest-limit">Cereri ramase: {requestLimit}</span>
              ) : null}
            </div>

            {error && <div className="ask-help-error-text">{error}</div>}
            {successMessage && <div className="ask-help-success-box">{successMessage}</div>}
          </form>
        </main>
      </div>
    </section>
  )
}

export default AskForHelpPage
