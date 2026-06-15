import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { FiCheck, FiClock, FiX } from 'react-icons/fi'
import { useI18n } from '../i18n/useI18n'
import { currentTimeInTimeZone } from '../utils/dateTime'
import './CustomTimePicker.css'

function CustomTimePicker({ label = 'Ora', onChange, value }) {
  const { t, timeZone } = useI18n()
  const id = useId()
  const rootRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [draftHour, setDraftHour] = useState('09')
  const [draftMinute, setDraftMinute] = useState('00')
  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')), [])
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')), [])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const closeFromOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const closeFromEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeFromOutside)
    document.addEventListener('keydown', closeFromEscape)

    return () => {
      document.removeEventListener('pointerdown', closeFromOutside)
      document.removeEventListener('keydown', closeFromEscape)
    }
  }, [isOpen])

  const togglePicker = () => {
    if (!isOpen) {
      const [nextHour, nextMinute] = (value || currentTimeInTimeZone(timeZone)).split(':')
      setDraftHour(nextHour)
      setDraftMinute(nextMinute)
    }

    setIsOpen((current) => !current)
  }

  const confirmTime = () => {
    onChange(`${draftHour}:${draftMinute}`)
    setIsOpen(false)
  }

  const clearTime = () => {
    onChange('')
    setIsOpen(false)
  }

  return (
    <div className={`custom-time ${isOpen ? 'is-open' : ''}`} ref={rootRef}>
      <span className="sr-only" id={`${id}-label`}>{label}</span>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${id}-value`}
        className="custom-time__control"
        id={`${id}-value`}
        onClick={togglePicker}
        type="button"
      >
        <FiClock aria-hidden="true" />
        <span>{value || '--:--'}</span>
      </button>

      {isOpen ? (
        <div className="custom-time__panel" role="dialog" aria-label={label}>
          <div className="custom-time__display" aria-live="polite">
            <FiClock aria-hidden="true" />
            <strong>{draftHour}:{draftMinute}</strong>
          </div>
          <div className="custom-time__columns">
            <div className="custom-time__column" role="listbox" aria-label={t('time.hours')}>
              <span>{t('time.hours')}</span>
              <div>
                {hours.map((hour) => (
                  <button
                    aria-selected={draftHour === hour}
                    className={draftHour === hour ? 'is-selected' : ''}
                    key={hour}
                    onClick={() => setDraftHour(hour)}
                    role="option"
                    type="button"
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>
            <div className="custom-time__column" role="listbox" aria-label={t('time.minutes')}>
              <span>{t('time.minutes')}</span>
              <div>
                {minutes.map((minute) => (
                  <button
                    aria-selected={draftMinute === minute}
                    className={draftMinute === minute ? 'is-selected' : ''}
                    key={minute}
                    onClick={() => setDraftMinute(minute)}
                    role="option"
                    type="button"
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="custom-time__actions">
            <button className="custom-time__clear" onClick={clearTime} type="button">
              <FiX aria-hidden="true" />
              {t('time.clear')}
            </button>
            <button className="custom-time__confirm" onClick={confirmTime} type="button">
              <FiCheck aria-hidden="true" />
              {t('time.confirm')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default CustomTimePicker
