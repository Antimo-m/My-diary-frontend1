import { FiClock } from 'react-icons/fi'
import './CustomTimePicker.css'

function CustomTimePicker({ label = 'Ora', onChange, value }) {
  return (
    <label className="custom-time">
      <span className="sr-only">{label}</span>
      <span className="custom-time__control">
        <FiClock aria-hidden="true" />
        <input
          aria-label={label}
          type="time"
          step="60"
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  )
}

export default CustomTimePicker
