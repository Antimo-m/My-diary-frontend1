import { describe, expect, it } from 'vitest'
import { clockPart, currentDateInTimeZone, currentTimeInTimeZone } from '../../src/utils/dateTime'

describe('dateTime', () => {
  const utcMidnight = new Date('2026-07-17T23:30:00Z')

  it('calcola la data nel fuso richiesto', () => {
    expect(currentDateInTimeZone('UTC', utcMidnight)).toBe('2026-07-17')
    expect(currentDateInTimeZone('Europe/Rome', utcMidnight)).toBe('2026-07-18')
  })

  it('calcola l orario nel fuso richiesto normalizzando la mezzanotte', () => {
    expect(currentTimeInTimeZone('UTC', utcMidnight)).toBe('23:30')
    expect(currentTimeInTimeZone('Europe/Rome', new Date('2026-07-17T22:00:00Z'))).toBe('00:00')
  })

  it('estrae ore e minuti da un orario completo', () => {
    expect(clockPart('14:30:00')).toBe('14:30')
    expect(clockPart('')).toBe('')
    expect(clockPart(null)).toBe('')
  })
})
