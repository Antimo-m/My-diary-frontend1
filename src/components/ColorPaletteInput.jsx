import { defaultPaletteColor } from '../data/colors'
import './ColorPaletteInput.css'

const presetColors = [
  { name: 'Marrone', value: '#80521f' },
  { name: 'Beige', value: '#d8b98c' },
  { name: 'Oro', value: defaultPaletteColor },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Blu', value: '#2563eb' },
  { name: 'Rosso', value: '#ef4444' },
  { name: 'Ambra', value: '#f8c052' },
  { name: 'Viola', value: '#8b5cf6' },
  { name: 'Grigio', value: '#64748b' },
  { name: 'Nero', value: '#172026' },
]

function ColorPaletteInput({ label = 'Colore', onChange, value }) {
  const currentValue = value || defaultPaletteColor
  const isPresetColor = presetColors.some((color) => color.value.toLowerCase() === currentValue.toLowerCase())

  return (
    <fieldset className="color-palette">
      <legend>{label}</legend>
      <div className="color-palette__grid">
        {presetColors.map((color) => (
          <button
            className={`color-swatch ${value?.toLowerCase() === color.value.toLowerCase() ? 'active' : ''}`}
            key={color.value}
            style={{ '--swatch-color': color.value }}
            type="button"
            onClick={() => onChange(color.value)}
            aria-label={color.name}
          />
        ))}
        <label className={`color-swatch color-swatch--custom ${isPresetColor ? '' : 'active'}`} style={{ '--swatch-color': currentValue }} title="Colore personalizzato">
          <input type="color" value={currentValue} onChange={(event) => onChange(event.target.value)} aria-label="Colore personalizzato" />
        </label>
      </div>
    </fieldset>
  )
}

export default ColorPaletteInput
