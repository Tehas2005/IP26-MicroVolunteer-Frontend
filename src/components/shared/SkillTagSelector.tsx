import { useState, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

type SkillTagSelectorProps = {
  suggestions: string[]
  value: string[]
  onChange: (skills: string[]) => void
  inputLabel?: string
  inputPlaceholder?: string
  addButtonLabel?: string
  emptySelectionText?: string
  className?: string
}

function normalizeSkill(skill: string) {
  return skill.trim().toLowerCase()
}

function getCanonicalSkill(rawSkill: string, suggestions: string[]) {
  const normalizedSkill = normalizeSkill(rawSkill)

  return (
    suggestions.find((suggestion) => normalizeSkill(suggestion) === normalizedSkill) ??
    rawSkill.trim()
  )
}

export function SkillTagSelector({
  suggestions,
  value,
  onChange,
  inputLabel = 'Adauga abilitate',
  inputPlaceholder = 'Adauga o abilitate personalizata',
  addButtonLabel = 'Adauga',
  emptySelectionText = 'Nu ai adaugat inca nicio abilitate.',
  className,
}: SkillTagSelectorProps) {
  const [inputValue, setInputValue] = useState('')

  function isSelected(skill: string) {
    const normalizedSkill = normalizeSkill(skill)

    return value.some((selectedSkill) => normalizeSkill(selectedSkill) === normalizedSkill)
  }

  function addSkill(rawSkill: string) {
    const normalizedSkill = normalizeSkill(rawSkill)

    if (!normalizedSkill) {
      return
    }

    const nextSkill = getCanonicalSkill(rawSkill, suggestions)

    if (isSelected(nextSkill)) {
      setInputValue('')
      return
    }

    onChange([...value, nextSkill])
    setInputValue('')
  }

  function removeSkill(skillToRemove: string) {
    const normalizedSkillToRemove = normalizeSkill(skillToRemove)

    onChange(
      value.filter(
        (selectedSkill) => normalizeSkill(selectedSkill) !== normalizedSkillToRemove,
      ),
    )
  }

  function toggleSuggestion(suggestion: string) {
    if (isSelected(suggestion)) {
      removeSkill(suggestion)
      return
    }

    onChange([...value, suggestion])
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addSkill(inputValue)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const selected = isSelected(suggestion)

          return (
            <button
              key={suggestion}
              type="button"
              className={cn(
                'rounded-full border px-3 py-2 text-sm font-semibold transition-colors duration-200',
                selected
                  ? 'border-brand-purple bg-brand-purple text-white'
                  : 'border-brand-gray bg-white text-brand-gray-text hover:border-brand-purple hover:text-brand-black',
              )}
              aria-pressed={selected}
              onClick={() => toggleSuggestion(suggestion)}
            >
              {suggestion}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={inputPlaceholder}
          className="w-full rounded-[18px] border border-brand-gray bg-white px-4 py-3 text-sm text-brand-black outline-none transition-colors duration-200 focus:border-brand-purple"
          aria-label={inputLabel}
        />

        <button
          type="button"
          className="rounded-[18px] bg-brand-black px-5 py-3 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
          onClick={() => addSkill(inputValue)}
        >
          {addButtonLabel}
        </button>
      </div>

      <div className="flex min-h-9 flex-wrap gap-2">
        {value.length > 0 ? (
          value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple-light/70 px-3 py-2 text-sm font-medium text-brand-black transition-colors duration-200"
            >
              {skill}
              <button
                type="button"
                className="rounded-full text-brand-gray-text transition-colors duration-200 hover:text-brand-black"
                onClick={() => removeSkill(skill)}
                aria-label={`Sterge abilitatea ${skill}`}
              >
                x
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-brand-gray-text">{emptySelectionText}</p>
        )}
      </div>
    </div>
  )
}

export default SkillTagSelector
