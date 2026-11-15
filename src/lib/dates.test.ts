import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  daysBetween,
  daysLeftLabel,
  extractAllDates,
  extractPrintedDates,
  extractProductionExpiry,
  getBucket,
  parseISODate,
  suggestExpiryFromPurchase,
} from './dates'

describe('parseISODate', () => {
  it('parses a valid date', () => {
    expect(parseISODate('2026-11-15')).toEqual(new Date(2026, 10, 15))
  })
  it('rejects impossible dates', () => {
    expect(parseISODate('2026-02-30')).toBeNull()
    expect(parseISODate('2026-13-01')).toBeNull()
    expect(parseISODate('2026-00-10')).toBeNull()
    expect(parseISODate('2026-11-00')).toBeNull()
  })
  it('accepts leap day only in leap years', () => {
    expect(parseISODate('2024-02-29')).not.toBeNull()
    expect(parseISODate('2026-02-29')).toBeNull()
  })
  it('rejects wrong formats', () => {
    expect(parseISODate('2026/11/15')).toBeNull()
    expect(parseISODate('15-11-2026')).toBeNull()
    expect(parseISODate('')).toBeNull()
  })
})

describe('addDays / addMonths', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-30', 5)).toBe('2026-02-04')
    expect(addDays('2026-11-15', -15)).toBe('2026-10-31')
  })
  it('adds months and clamps to month end', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-01-15', 12)).toBe('2027-01-15')
    expect(addMonths('2026-10-31', 4)).toBe('2027-02-28')
  })
  it('returns null on bad input', () => {
    expect(addDays('not-a-date', 3)).toBeNull()
    expect(addMonths('2026-02-30', 1)).toBeNull()
  })
})

describe('daysBetween', () => {
  it('counts whole days', () => {
    expect(daysBetween('2026-11-15', '2026-11-15')).toBe(0)
    expect(daysBetween('2026-11-15', '2026-11-18')).toBe(3)
    expect(daysBetween('2026-11-18', '2026-11-15')).toBe(-3)
    expect(daysBetween('2026-12-31', '2027-01-02')).toBe(2)
  })
})

describe('getBucket', () => {
  const today = '2026-11-15'
  it('classifies each bucket', () => {
    expect(getBucket('2026-11-14', today)).toBe('expired')
    expect(getBucket('2026-11-15', today)).toBe('today')
    expect(getBucket('2026-11-16', today)).toBe('soon3')
    expect(getBucket('2026-11-18', today)).toBe('soon3')
    expect(getBucket('2026-11-19', today)).toBe('soon7')
    expect(getBucket('2026-11-22', today)).toBe('soon7')
    expect(getBucket('2026-11-23', today)).toBe('safe')
  })
})

describe('daysLeftLabel', () => {
  it('labels overdue, today, tomorrow and future', () => {
    expect(daysLeftLabel('2026-11-12', '2026-11-15')).toBe('已过期 3 天')
    expect(daysLeftLabel('2026-11-15', '2026-11-15')).toBe('今天到期')
    expect(daysLeftLabel('2026-11-16', '2026-11-15')).toBe('明天到期')
    expect(daysLeftLabel('2026-11-30', '2026-11-15')).toBe('还剩 15 天')
  })
})

describe('extractPrintedDates', () => {
  it('finds dash, slash and dot separators', () => {
    expect(extractPrintedDates('保质期至 2026-11-15').map((c) => c.date)).toEqual(['2026-11-15'])
    expect(extractPrintedDates('EXP 2026/12/01').map((c) => c.date)).toEqual(['2026-12-01'])
    expect(extractPrintedDates('2026.09.30').map((c) => c.date)).toEqual(['2026-09-30'])
  })
  it('finds Chinese 年月日 dates', () => {
    expect(extractPrintedDates('保质期至2026年11月15日').map((c) => c.date)).toEqual(['2026-11-15'])
  })
  it('finds compact 8-digit dates', () => {
    expect(extractPrintedDates('EXP20261115').map((c) => c.date)).toEqual(['2026-11-15'])
  })
  it('reads short-year dates as 20YY', () => {
    expect(extractPrintedDates('26.11.15').map((c) => c.date)).toEqual(['2026-11-15'])
  })
  it('rejects impossible dates from OCR noise', () => {
    expect(extractPrintedDates('2026-13-40')).toEqual([])
    expect(extractPrintedDates('2026-02-30')).toEqual([])
  })
  it('dedupes and sorts earliest first', () => {
    const dates = extractPrintedDates('2026-12-01 2026-11-15 2026-11-15').map((c) => c.date)
    expect(dates).toEqual(['2026-11-15', '2026-12-01'])
  })
  it('ignores long digit runs that are not dates', () => {
    expect(extractPrintedDates('6923456789012')).toEqual([])
  })
})

describe('extractProductionExpiry', () => {
  it('computes expiry from production date + months', () => {
    const r = extractProductionExpiry('生产日期 2026-01-01 保质期 12个月')
    expect(r?.productionDate).toBe('2026-01-01')
    expect(r?.expiryDate).toBe('2027-01-01')
  })
  it('handles days and years', () => {
    expect(extractProductionExpiry('生产日期2026-11-01 保质期 90天')?.expiryDate).toBe('2027-01-30')
    expect(extractProductionExpiry('生产日期 2025-06-15 保质期 2年')?.expiryDate).toBe('2027-06-15')
  })
  it('clamps month-end when adding months', () => {
    expect(extractProductionExpiry('生产日期 2026-01-31 保质期 1个月')?.expiryDate).toBe('2026-02-28')
  })
  it('returns production date with null expiry when no shelf life is printed', () => {
    const r = extractProductionExpiry('生产日期 2026-03-01')
    expect(r?.productionDate).toBe('2026-03-01')
    expect(r?.expiryDate).toBeNull()
  })
  it('returns null when there is no production date', () => {
    expect(extractProductionExpiry('保质期 12个月')).toBeNull()
    expect(extractProductionExpiry('')).toBeNull()
  })
})

describe('extractAllDates', () => {
  it('combines printed and production-derived dates', () => {
    // The printed production date itself is also found as a printed date;
    // the user picks from the candidates in the UI.
    const dates = extractAllDates('生产日期 2026-01-01 保质期 12个月 保质期至 2026-06-01')
    expect(dates.map((c) => c.date)).toEqual(['2026-01-01', '2026-06-01', '2027-01-01'])
    expect(dates[2].derived).toBe(true)
  })
})

describe('suggestExpiryFromPurchase', () => {
  it('adds shelf life to the purchase date', () => {
    expect(suggestExpiryFromPurchase('2026-11-10', 7)).toBe('2026-11-17')
  })
  it('returns null when there is no reference value', () => {
    expect(suggestExpiryFromPurchase('2026-11-10', null)).toBeNull()
  })
})
