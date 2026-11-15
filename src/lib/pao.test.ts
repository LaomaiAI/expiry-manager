import { describe, expect, it } from 'vitest'
import { paoExpiry, resolveExpiry } from './pao'

describe('resolveExpiry', () => {
  it('uses the printed date when there is no opening info', () => {
    expect(resolveExpiry('2027-06-01', null, 6)).toEqual({ expiryDate: '2027-06-01', basis: 'printed' })
    expect(resolveExpiry('2027-06-01', '2026-11-01', null)).toEqual({ expiryDate: '2027-06-01', basis: 'printed' })
  })
  it('uses the PAO date when it is earlier than the printed date', () => {
    // Opened 2026-11-01 + 6 months = 2027-05-01, earlier than printed 2027-06-01
    expect(resolveExpiry('2027-06-01', '2026-11-01', 6)).toEqual({ expiryDate: '2027-05-01', basis: 'pao' })
  })
  it('uses the printed date when it is earlier than the PAO date', () => {
    // Opened 2026-11-01 + 12 months = 2027-11-01, later than printed 2027-06-01
    expect(resolveExpiry('2027-06-01', '2026-11-01', 12)).toEqual({ expiryDate: '2027-06-01', basis: 'printed' })
  })
  it('prefers printed on a tie', () => {
    expect(resolveExpiry('2027-05-01', '2026-11-01', 6)).toEqual({ expiryDate: '2027-05-01', basis: 'printed' })
  })
  it('works from the PAO date alone when no printed date exists', () => {
    expect(resolveExpiry(null, '2026-11-01', 6)).toEqual({ expiryDate: '2027-05-01', basis: 'pao' })
  })
  it('returns null when neither input gives a date', () => {
    expect(resolveExpiry(null, null, 6).expiryDate).toBeNull()
    expect(resolveExpiry(null, '2026-11-01', null).expiryDate).toBeNull()
    expect(resolveExpiry('not-a-date', '2026-11-01', 6)).toEqual({ expiryDate: '2027-05-01', basis: 'pao' })
  })
  it('ignores invalid PAO month counts', () => {
    expect(resolveExpiry('2027-06-01', '2026-11-01', 0)).toEqual({ expiryDate: '2027-06-01', basis: 'printed' })
    expect(resolveExpiry('2027-06-01', '2026-11-01', -3)).toEqual({ expiryDate: '2027-06-01', basis: 'printed' })
  })
  it('clamps to the end of the month (eye drops opened Jan 31 + 1 month)', () => {
    expect(resolveExpiry(null, '2026-01-31', 1)).toEqual({ expiryDate: '2026-02-28', basis: 'pao' })
  })
})

describe('paoExpiry', () => {
  it('adds months to the opening date', () => {
    expect(paoExpiry('2026-11-15', 6)).toBe('2027-05-15')
    expect(paoExpiry('2026-11-15', 1)).toBe('2026-12-15')
  })
  it('returns null on bad input', () => {
    expect(paoExpiry('2026-02-30', 6)).toBeNull()
    expect(paoExpiry('2026-11-15', 0)).toBeNull()
  })
})
