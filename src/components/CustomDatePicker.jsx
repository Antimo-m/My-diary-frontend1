import { useMemo, useState } from 'react'
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './CustomDatePicker.css'

function toDate(value) {
  if (!value) {
    return new Date()
  }

  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toIso(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function CustomDatePicker({ label = 'Data', onChange, value }) {
  const selectedDate = toDate(value)
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const startOffset = (firstDay.getDay() + 6) % 7
    const startDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1 - startOffset)

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + index)
      return date
    })
  }, [visibleMonth])

  const monthLabel = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(visibleMonth)
  const selectedIso = value || ''
  const selectedLabel = selectedIso
    ? new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(toDate(selectedIso))
    : 'Seleziona data'

  const selectDate = (date) => {
    onChange(toIso(date))
    setIsOpen(false)
  }

  return (
    <div className="custom-date">
      <button className="custom-date__trigger" type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen}>
        <FiCalendar aria-hidden="true" />
        <span>{selectedLabel}</span>
      </button>
      <input type="hidden" value={value || ''} aria-label={label} readOnly />

      {isOpen ? (
        <div className="custom-date__panel" role="dialog" aria-label={label}>
          <div className="custom-date__header">
            <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} aria-label="Mese precedente">
              <FiChevronLeft />
            </button>
            <strong>{monthLabel}</strong>
            <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} aria-label="Mese successivo">
              <FiChevronRight />
            </button>
          </div>
          <div className="custom-date__weekdays" aria-hidden="true">
            <span>L</span><span>M</span><span>M</span><span>G</span><span>V</span><span>S</span><span>D</span>
          </div>
          <div className="custom-date__grid">
            {days.map((date) => {
              const iso = toIso(date)
              const isMuted = date.getMonth() !== visibleMonth.getMonth()
              const isSelected = selectedIso ? iso === selectedIso : false
              return (
                <button
                  className={`${isMuted ? 'is-muted' : ''} ${isSelected ? 'is-selected' : ''}`}
                  key={iso}
                  type="button"
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default CustomDatePicker
