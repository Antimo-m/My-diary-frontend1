import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { FiCheck, FiChevronDown, FiSearch } from 'react-icons/fi'
import './CustomSelect.css'

function CustomSelect({ className = '', label, name, onChange, options, searchable = false, value }) {
  const id = useId()
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const normalizedOptions = options.map((option) => (
    typeof option === 'string' ? { label: option, value: option } : option
  ))
  const selectedOption = normalizedOptions.find((option) => option.value === value)
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return normalizedQuery
      ? normalizedOptions.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery))
      : normalizedOptions
  }, [normalizedOptions, query])

  useEffect(() => {
    const closeFromOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeFromOutside)

    return () => document.removeEventListener('pointerdown', closeFromOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchable) {
      searchRef.current?.focus()
    }
  }, [isOpen, searchable])

  const chooseOption = (option) => {
    onChange({
      target: {
        name,
        value: option.value,
      },
    })
    setIsOpen(false)
    setQuery('')
  }

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  return (
    <div className={`custom-select ${className} ${isOpen ? 'is-open' : ''}`.trim()} ref={rootRef}>
      <span className="custom-select__label" id={`${id}-label`}>{label}</span>
      <button
        aria-controls={`${id}-listbox`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label ${id}-value`}
        className="custom-select__trigger"
        id={`${id}-value`}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        type="button"
      >
        <span>{selectedOption?.label ?? value}</span>
        <FiChevronDown aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="custom-select__panel">
          {searchable ? (
            <label className="custom-select__search">
              <FiSearch aria-hidden="true" />
              <input
                aria-label={`${label} search`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={label}
                ref={searchRef}
                type="search"
                value={query}
              />
            </label>
          ) : null}

          <div className="custom-select__options" id={`${id}-listbox`} role="listbox" aria-labelledby={`${id}-label`}>
            {filteredOptions.map((option) => (
              <button
                aria-selected={option.value === value}
                className={option.value === value ? 'is-selected' : ''}
                key={option.value}
                onClick={() => chooseOption(option)}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {option.value === value ? <FiCheck aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default CustomSelect
