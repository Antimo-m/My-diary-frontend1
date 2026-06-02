import './ColorPaletteInput.css'

const presetColors = [
  { name: 'Marrone', value: '#80521f' },
  { name: 'Beige', value: '#d8b98c' },
  { name: 'Oro', value: '#d6a43a' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Blu', value: '#2563eb' },
  { name: 'Rosso', value: '#ef4444' },
  { name: 'Arancione', value: '#f97316' },
  { name: 'Viola', value: '#8b5cf6' },
  { name: 'Grigio', value: '#64748b' },
  { name: 'Nero', value: '#172026' },
]

function ColorPaletteInput({ label = 'Colore', onChange, value }) {
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
      </div>
      <label className="custom-color-field">
        Personalizzato
        <input type="color" value={value || '#00a7c8'} onChange={(event) => onChange(event.target.value)} />
      </label>
    </fieldset>
  )
}

export default ColorPaletteInput
