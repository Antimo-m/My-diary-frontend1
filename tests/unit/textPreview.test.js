import { describe, expect, it } from 'vitest'
import { textPreview } from '../../src/utils/textPreview'

describe('textPreview', () => {
  it('normalizza spazi e ritorni a capo', () => {
    expect(textPreview('  riga uno\n\nriga   due  ')).toBe('riga uno riga due')
  })

  it('restituisce stringa vuota per valori assenti', () => {
    expect(textPreview('')).toBe('')
    expect(textPreview(null)).toBe('')
    expect(textPreview(undefined)).toBe('')
  })

  it('tronca il testo lungo aggiungendo i puntini', () => {
    const preview = textPreview('a'.repeat(200), 20)

    expect(preview).toHaveLength(20)
    expect(preview.endsWith('...')).toBe(true)
  })

  it('non tronca il testo entro il limite', () => {
    expect(textPreview('testo breve', 20)).toBe('testo breve')
  })
})
