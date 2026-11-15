// dates.ts - pure date logic for expiry-manager.
// No DOM, no network, no LLM. Everything here is deterministic and
// covered by dates.test.ts.

export type Bucket = 'expired' | 'today' | 'soon3' | 'soon7' | 'safe'

export interface DateCandidate {
  /** ISO date YYYY-MM-DD */
  date: string
  /** Human-readable note about where the date came from */
  label: string
  /** true when the date was computed from production date + shelf life */
  derived: boolean
}

/** Format a Date as a local YYYY-MM-DD string. */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today as a local YYYY-MM-DD string. */
export function todayISO(now = new Date()): string {
  return toISODate(now)
}

/** Strictly parse YYYY-MM-DD. Returns null for anything that is not a real calendar date. */
export function parseISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!isValidCalendarDate(y, mo, d)) return null
  return new Date(y, mo - 1, d)
}

export function isValidCalendarDate(y: number, mo: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return false
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false
  const dt = new Date(y, mo - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
}

/** Add n days to an ISO date. Returns null on bad input. */
export function addDays(iso: string, n: number): string | null {
  const d = parseISODate(iso)
  if (!d) return null
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/**
 * Add n months to an ISO date, clamping to the end of the target month
 * when the day does not exist there (Jan 31 + 1 month -> Feb 28/29).
 */
export function addMonths(iso: string, n: number): string | null {
  const d = parseISODate(iso)
  if (!d) return null
  const day = d.getDate()
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastDay))
  return toISODate(target)
}

/** Whole days from a to b (b - a). Negative when b is before a. */
export function daysBetween(aISO: string, bISO: string): number | null {
  const a = parseISODate(aISO)
  const b = parseISODate(bISO)
  if (!a || !b) return null
  const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  return Math.round(ms / 86400000)
}

/** Which urgency bucket an expiry date falls in, relative to today. */
export function getBucket(expiryISO: string, today: string): Bucket {
  const diff = daysBetween(today, expiryISO)
  if (diff === null) return 'safe'
  if (diff < 0) return 'expired'
  if (diff === 0) return 'today'
  if (diff <= 3) return 'soon3'
  if (diff <= 7) return 'soon7'
  return 'safe'
}

export const BUCKET_LABELS: Record<Bucket, string> = {
  expired: '已过期',
  today: '今天到期',
  soon3: '3天内',
  soon7: '7天内',
  safe: '安全',
}

export const BUCKET_ORDER: Bucket[] = ['expired', 'today', 'soon3', 'soon7', 'safe']

/** Short label for how long is left, e.g. "已过期 3 天" / "今天到期" / "还剩 2 天". */
export function daysLeftLabel(expiryISO: string, today: string): string {
  const diff = daysBetween(today, expiryISO)
  if (diff === null) return '日期无效'
  if (diff < 0) return `已过期 ${-diff} 天`
  if (diff === 0) return '今天到期'
  if (diff === 1) return '明天到期'
  return `还剩 ${diff} 天`
}

// ---------------------------------------------------------------------------
// Date extraction from OCR text
// ---------------------------------------------------------------------------

interface RawMatch {
  year: number
  month: number
  day: number
  raw: string
}

function toCandidate(m: RawMatch, label: string, derived: boolean): DateCandidate | null {
  if (!isValidCalendarDate(m.year, m.month, m.day)) return null
  const date = `${m.year}-${String(m.month).padStart(2, '0')}-${String(m.day).padStart(2, '0')}`
  return { date, label, derived }
}

/**
 * Find dates printed on packaging inside OCR text.
 * Handles: 2026-11-15, 2026/11/15, 2026.11.15, 2026年11月15日,
 * 20261115, and short forms like 26.11.15 (read as 2026-11-15).
 * Returns unique valid dates, earliest first.
 */
export function extractPrintedDates(text: string): DateCandidate[] {
  const found = new Map<string, DateCandidate>()
  const push = (m: RawMatch | null, label: string) => {
    if (!m) return
    const c = toCandidate(m, label, false)
    if (c && !found.has(c.date)) found.set(c.date, c)
  }

  // Full year with separator: 2026-11-15 / 2026/11/15 / 2026.11.15 / 2026年11月15日
  const fullRe = /(\d{4})[/.年-](\d{1,2})[/.月-](\d{1,2})日?/g
  for (const m of text.matchAll(fullRe)) {
    push({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]), raw: m[0] }, `包装印刷：${m[0]}`)
  }

  // Compact 8 digits: 20261115 (not part of a longer digit run)
  const compactRe = /(?<!\d)(\d{4})(\d{2})(\d{2})(?!\d)/g
  for (const m of text.matchAll(compactRe)) {
    push({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]), raw: m[0] }, `包装印刷：${m[0]}`)
  }

  // Short year: 26.11.15 / 26/11/15 / 26-11-15 (read as 20YY)
  const shortRe = /(?<!\d)(\d{2})[/.-](\d{1,2})[/.-](\d{1,2})(?!\d)/g
  for (const m of text.matchAll(shortRe)) {
    const year = 2000 + Number(m[1])
    push({ year, month: Number(m[2]), day: Number(m[3]), raw: m[0] }, `包装印刷：${m[0]}`)
  }

  return [...found.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
}

export interface ProductionInfo {
  productionDate: string
  /** shelf life in days, or null when it could not be parsed */
  shelfDays: number | null
  expiryDate: string | null
  raw: string
}

/**
 * Chinese packaging often prints "生产日期 2026-01-01 保质期 12个月"
 * instead of an expiry date. Extract the production date and the shelf
 * life, then compute the expiry date. Returns null when no production
 * date is found.
 */
export function extractProductionExpiry(text: string): ProductionInfo | null {
  const prodRe = /生产日期[:：\s]*(\d{4})[/.年-](\d{1,2})[/.月-](\d{1,2})日?/
  const prod = prodRe.exec(text)
  if (!prod) return null
  const productionDate = toCandidate(
    { year: Number(prod[1]), month: Number(prod[2]), day: Number(prod[3]), raw: prod[0] },
    '',
    true,
  )
  if (!productionDate) return null

  const lifeRe = /保质期[:：\s]*(\d+(?:\.\d+)?)\s*(年|个月|月|天|日)/
  const life = lifeRe.exec(text)
  let shelfDays: number | null = null
  let expiryDate: string | null = null
  if (life) {
    const n = Number(life[1])
    const unit = life[2]
    if (unit === '年') {
      expiryDate = addMonths(productionDate.date, Math.round(n * 12))
      shelfDays = Math.round(n * 365)
    } else if (unit === '个月' || unit === '月') {
      expiryDate = addMonths(productionDate.date, n)
      shelfDays = Math.round(n * 30)
    } else {
      expiryDate = addDays(productionDate.date, n)
      shelfDays = n
    }
  }
  return {
    productionDate: productionDate.date,
    shelfDays,
    expiryDate,
    raw: `${prod[0]}${life ? ` ${life[0]}` : ''}`,
  }
}

/** All date candidates in OCR text: printed dates plus a production-derived date. */
export function extractAllDates(text: string): DateCandidate[] {
  const printed = extractPrintedDates(text)
  const derived = extractProductionExpiry(text)
  if (derived && derived.expiryDate) {
    const label = `生产日期 ${derived.productionDate} + 保质期推算`
    const c = { date: derived.expiryDate, label, derived: true }
    if (!printed.some((p) => p.date === c.date)) printed.push(c)
  }
  return printed.sort((a, b) => (a.date < b.date ? -1 : 1))
}

/** Expiry date from a purchase date plus a shelf-life in days. Null when no reference value exists. */
export function suggestExpiryFromPurchase(purchaseISO: string, shelfDays: number | null): string | null {
  if (shelfDays === null) return null
  return addDays(purchaseISO, shelfDays)
}
