// pao.ts - period-after-opening (PAO) expiry resolution.
// When a product has an opening date and a PAO in months, its effective
// expiry is the earlier of the printed expiry date and opening + PAO.
// The result says which one won, so the UI can show it honestly.

import { addMonths, parseISODate } from './dates'

export type ExpiryBasis = 'printed' | 'pao'

export interface ResolvedExpiry {
  /** Effective expiry date, or null when neither input gives one */
  expiryDate: string | null
  /** Which input determined the effective date */
  basis: ExpiryBasis
}

/**
 * Resolve the effective expiry date.
 * printed: date printed on the package (may be null when unknown).
 * opened: date the product was opened (may be null).
 * paoMonths: PAO in months (may be null when the category has none).
 * Returns null expiry when neither input yields a date.
 */
export function resolveExpiry(
  printed: string | null,
  opened: string | null,
  paoMonths: number | null,
): ResolvedExpiry {
  const printedDate = printed && parseISODate(printed) ? printed : null
  let paoDate: string | null = null
  if (opened && parseISODate(opened) && paoMonths !== null && Number.isInteger(paoMonths) && paoMonths > 0) {
    paoDate = addMonths(opened, paoMonths)
  }
  if (printedDate && paoDate) {
    if (paoDate < printedDate) return { expiryDate: paoDate, basis: 'pao' }
    return { expiryDate: printedDate, basis: 'printed' }
  }
  if (paoDate) return { expiryDate: paoDate, basis: 'pao' }
  if (printedDate) return { expiryDate: printedDate, basis: 'printed' }
  return { expiryDate: null, basis: 'printed' }
}

/** PAO expiry from an opening date alone. Null on bad input. */
export function paoExpiry(opened: string, paoMonths: number): string | null {
  if (!parseISODate(opened) || !Number.isInteger(paoMonths) || paoMonths <= 0) return null
  return addMonths(opened, paoMonths)
}
