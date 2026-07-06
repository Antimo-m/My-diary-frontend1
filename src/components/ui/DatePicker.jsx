import { useMemo, useState } from 'react'
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useI18n } from '../../i18n/useI18n'
import Popover from './Popover'
import '../CustomDatePicker.css'

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

function DatePicker({ label = 'Data', onChange, value }) {
  const { localeTag, t, timeZone } = useI18n()
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

  const monthLabel = new Intl.DateTimeFormat(localeTag, { month: 'long', timeZone, year: 'numeric' }).format(visibleMonth)
  const selectedIso = value || ''
  const selectedLabel = selectedIso
    ? new Intl.DateTimeFormat(localeTag, { day: '2-digit', month: 'short', timeZone, year: 'numeric' }).format(toDate(selectedIso))
    : t('date.selectDate')
  const weekdayLabels = useMemo(() => {
    const monday = new Date(2024, 0, 1)

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + index)
      return new Intl.DateTimeFormat(localeTag, { weekday: 'narrow' }).format(day)
    })
  }, [localeTag])

  const selectDate = (date) => {
    onChange(toIso(date))
    setIsOpen(false)
  }

  return (
    <div className="custom-date">
      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        className="custom-date__panel"
        trigger={
          <button className="custom-date__trigger" type="button" aria-expanded={isOpen}>
            <FiCalendar aria-hidden="true" />
            <span>{selectedLabel}</span>
          </button>
        }
      >
        <div className="custom-date__header">
          <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} aria-label={t('date.previousMonth')}>
            <FiChevronLeft />
          </button>
          <strong>{monthLabel}</strong>
          <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} aria-label={t('date.nextMonth')}>
            <FiChevronRight />
          </button>
        </div>
        <div className="custom-date__weekdays" aria-hidden="true">
          {weekdayLabels.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}
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
      </Popover>
      <input type="hidden" value={value || ''} aria-label={label} readOnly />
    </div>
  )
}

export default DatePicker
