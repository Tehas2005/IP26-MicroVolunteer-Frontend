import { useEffect, useId, useState, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlus, LoaderCircle, MapPin, Trash2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface AdditionalInfoData {
  description: string
  location: string
  attachment: File | null
}

export interface AdditionalInfoSectionProps {
  requestType: 'Online' | 'Fizic'
  showErrors: boolean
  value: AdditionalInfoData
  onChange: (value: AdditionalInfoData) => void
}

const MAX_DESCRIPTION_LENGTH = 500
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export function AdditionalInfoSection({
  requestType,
  showErrors,
  value,
  onChange,
}: AdditionalInfoSectionProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isLocationTouched, setIsLocationTouched] = useState(false)
  const [fileError, setFileError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const isLocationRequired = requestType === 'Fizic'
  const hasLocationError = isLocationRequired && value.location.trim().length === 0
  const showLocationError = (showErrors || isLocationTouched) && hasLocationError

  useEffect(() => {
    if (!value.attachment) {
      setPreviewUrl(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(value.attachment)
    setPreviewUrl(nextPreviewUrl)

    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [value.attachment])

  const updateValue = (nextValue: Partial<AdditionalInfoData>) => {
    onChange({ ...value, ...nextValue })
  }

  const handleFile = (file: File | null | undefined) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setFileError('Poți încărca doar imagini.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('Imaginea trebuie să aibă maximum 10MB.')
      return
    }

    setFileError('')
    updateValue({ attachment: file })
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0])
    event.target.value = ''
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFileError('')
      window.alert('Geolocația nu este disponibilă în acest browser.')
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateValue({
          location: `Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)}`,
        })
        setIsLocationTouched(true)
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
        window.alert('Nu am putut prelua locația. Completeaz-o manual.')
      },
    )
  }

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    handleFile(event.dataTransfer.files[0])
  }

  const handleRemoveAttachment = () => {
    setFileError('')
    updateValue({ attachment: null })
  }

  return (
    <div className="rounded-[28px] border border-brand-gray bg-[#F8FAFD] p-5 sm:p-6">
      <div className="flex flex-col gap-1 border-b border-brand-gray pb-4">
        <h2 className="text-xl font-bold text-brand-black sm:text-2xl">Informații suplimentare</h2>
        <p className="text-sm text-brand-gray-text">
          Adaugă context util pentru voluntari, astfel încât cererea ta să poată fi preluată mai
          repede.
        </p>
      </div>

      <div className="mt-5 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-brand-black" htmlFor="descriere-situatie">
            Descriere detaliată a situației
          </label>
          <div className="relative">
            <textarea
              id="descriere-situatie"
              className="min-h-32 w-full rounded-lg border border-brand-gray bg-white px-3 py-3 pr-16 text-sm text-brand-black transition placeholder:text-brand-gray-text focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-purple"
              maxLength={MAX_DESCRIPTION_LENGTH}
              onChange={(event) => updateValue({ description: event.target.value })}
              placeholder="Oferă câteva detalii despre ce s-a întâmplat și de ce ai nevoie acum."
              value={value.description}
            />
            <span className="absolute bottom-3 right-3 text-xs font-medium text-brand-gray-text">
              {value.description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-semibold text-brand-black" htmlFor="locatie-cerere">
              Locație
              {isLocationRequired ? (
                <span className="ml-1 text-brand-red">*</span>
              ) : (
                <span className="ml-2 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-gray-text">
                  Opțional pentru online
                </span>
              )}
            </label>

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-brand-gray bg-white px-4 py-2 text-sm font-semibold text-brand-black transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 sm:w-auto"
              disabled={isLocating}
              onClick={handleUseCurrentLocation}
              type="button"
            >
              {isLocating ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Se caută locația
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Folosește locația mea
                </>
              )}
            </button>
          </div>

          <Input
            id="locatie-cerere"
            onBlur={() => setIsLocationTouched(true)}
            onChange={(event) => updateValue({ location: event.target.value })}
            placeholder="Stradă, oraș sau un reper util"
            value={value.location}
            className={cn(showLocationError && 'border-brand-red focus:ring-brand-red')}
          />

          {showLocationError && (
            <p className="text-sm font-medium text-brand-red">
              Locația este obligatorie pentru cererile fizice.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-black">Atașează o imagine</span>
            <span className="text-xs font-medium text-brand-gray-text">Opțional</span>
          </div>

          {!previewUrl ? (
            <label
              className={cn(
                'flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed bg-white px-5 py-6 text-center transition',
                isDragging
                  ? 'border-brand-purple bg-brand-purple-light'
                  : 'border-brand-gray hover:border-brand-purple',
              )}
              htmlFor={inputId}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <span className="rounded-full bg-brand-purple-light p-3 text-brand-purple">
                <ImagePlus className="h-6 w-6" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-brand-black">
                  Trage o imagine aici sau apasă pentru a încărca
                </p>
                <p className="text-xs text-brand-gray-text">PNG, JPG, WEBP sau GIF, până la 10MB</p>
              </div>
              <input
                accept="image/*"
                className="sr-only"
                id={inputId}
                onChange={handleFileChange}
                type="file"
              />
            </label>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <img
                alt="Preview atașament"
                className="h-36 w-36 rounded-[20px] border border-brand-gray object-cover"
                src={previewUrl}
              />
              <div className="space-y-3">
                <p className="text-sm text-brand-gray-text">
                  Imaginea a fost adăugată și va fi trimisă împreună cu cererea.
                </p>
                <button
                  className="inline-flex items-center gap-2 rounded-[10px] border border-brand-gray bg-white px-4 py-2 text-sm font-semibold text-brand-black transition hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2"
                  onClick={handleRemoveAttachment}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  Șterge imaginea
                </button>
              </div>
            </div>
          )}

          {fileError && <p className="text-sm font-medium text-brand-red">{fileError}</p>}
        </div>
      </div>
    </div>
  )
}

export default AdditionalInfoSection
