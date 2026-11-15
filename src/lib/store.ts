// store.ts - item model, localStorage persistence, CSV/JSON export-import.
// Pure functions except for the two localStorage helpers.

import { addDays, getBucket, parseISODate, todayISO, type Bucket } from './dates'
import { categoryLabel } from './shelfLife'

export type ItemSource = 'ocr' | 'barcode' | 'manual'

export interface ExpiryItem {
  id: string
  name: string
  categoryId: string
  /** ISO date YYYY-MM-DD */
  expiryDate: string
  /** ISO date YYYY-MM-DD, optional */
  purchaseDate?: string
  /** ISO date the product was opened, optional (period after opening) */
  openedDate?: string
  /** PAO in months used for this item, optional */
  paoMonths?: number
  /** Printed expiry date, kept when PAO changed the effective date */
  printedExpiryDate?: string
  /** Which input determined expiryDate: the printed date or the PAO date */
  expiryBasis?: 'printed' | 'pao'
  barcode?: string
  quantity?: number
  note?: string
  createdAt: number
  source: ItemSource
}

export const STORAGE_KEY = 'expiry-manager.items.v1'

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function makeItem(input: Omit<ExpiryItem, 'id' | 'createdAt'>): ExpiryItem {
  return { ...input, id: newId(), createdAt: Date.now() }
}

export function loadItems(storage: Pick<Storage, 'getItem'> = localStorage): ExpiryItem[] {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((row) => {
      const item = sanitizeItem(row)
      return item ? [item] : []
    })
  } catch {
    return []
  }
}

export function saveItems(items: ExpiryItem[], storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(items))
}

/** Validate one unknown row into an item, or null when it is unusable. */
export function sanitizeItem(row: unknown): ExpiryItem | null {
  if (typeof row !== 'object' || row === null) return null
  const r = row as Record<string, unknown>
  if (typeof r.name !== 'string' || r.name.trim() === '') return null
  if (typeof r.expiryDate !== 'string' || !parseISODate(r.expiryDate)) return null
  const source: ItemSource = r.source === 'ocr' || r.source === 'barcode' ? r.source : 'manual'
  const item: ExpiryItem = {
    id: typeof r.id === 'string' && r.id !== '' ? r.id : newId(),
    name: r.name.trim(),
    categoryId: typeof r.categoryId === 'string' && r.categoryId !== '' ? r.categoryId : 'other',
    expiryDate: r.expiryDate,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
    source,
  }
  if (typeof r.purchaseDate === 'string' && parseISODate(r.purchaseDate)) item.purchaseDate = r.purchaseDate
  if (typeof r.openedDate === 'string' && parseISODate(r.openedDate)) item.openedDate = r.openedDate
  if (typeof r.paoMonths === 'number' && Number.isInteger(r.paoMonths) && r.paoMonths > 0 && r.paoMonths <= 36)
    item.paoMonths = r.paoMonths
  if (typeof r.printedExpiryDate === 'string' && parseISODate(r.printedExpiryDate))
    item.printedExpiryDate = r.printedExpiryDate
  if (r.expiryBasis === 'pao' || r.expiryBasis === 'printed') item.expiryBasis = r.expiryBasis
  if (typeof r.barcode === 'string' && r.barcode !== '') item.barcode = r.barcode
  if (typeof r.quantity === 'number' && r.quantity > 0) item.quantity = r.quantity
  if (typeof r.note === 'string' && r.note !== '') item.note = r.note
  return item
}

/** Items sorted by expiry date, earliest first, then by name. */
export function sortItems(items: ExpiryItem[]): ExpiryItem[] {
  return [...items].sort((a, b) => {
    if (a.expiryDate !== b.expiryDate) return a.expiryDate < b.expiryDate ? -1 : 1
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

export type BucketCounts = Record<Bucket, number>

export function bucketCounts(items: ExpiryItem[], today: string): BucketCounts {
  const counts: BucketCounts = { expired: 0, today: 0, soon3: 0, soon7: 0, safe: 0 }
  for (const item of items) counts[getBucket(item.expiryDate, today)] += 1
  return counts
}

// ---------------------------------------------------------------------------
// JSON export / import
// ---------------------------------------------------------------------------

export function exportItemsJSON(items: ExpiryItem[]): string {
  return JSON.stringify(items, null, 2)
}

export interface ImportResult {
  items: ExpiryItem[]
  skipped: number
}

/** Import items from a JSON string. Bad rows are skipped and counted, never fatal. */
export function importItemsJSON(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { items: [], skipped: 0 }
  }
  if (!Array.isArray(parsed)) return { items: [], skipped: 0 }
  const items: ExpiryItem[] = []
  let skipped = 0
  for (const row of parsed) {
    const item = sanitizeItem(row)
    if (item) items.push(item)
    else skipped += 1
  }
  return { items, skipped }
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function exportItemsCSV(items: ExpiryItem[]): string {
  const header = ['名称', '分类', '保质期', '到期依据', '购买日期', '开封日期', '条码', '数量', '备注', '来源']
  const lines = [header.map(csvCell).join(',')]
  for (const item of sortItems(items)) {
    lines.push(
      [
        item.name,
        categoryLabel(item.categoryId),
        item.expiryDate,
        item.expiryBasis === 'pao' ? `开封后 ${item.paoMonths ?? ''} 个月` : '包装日期',
        item.purchaseDate ?? '',
        item.openedDate ?? '',
        item.barcode ?? '',
        item.quantity !== undefined ? String(item.quantity) : '',
        item.note ?? '',
        item.source === 'ocr' ? '拍照识别' : item.source === 'barcode' ? '扫码' : '手动',
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Sample data (clearly labelled as examples, never presented as real)
// ---------------------------------------------------------------------------

/** Demo items with dates relative to today, so the demo always looks alive. */
export function sampleItems(today: string = todayISO()): ExpiryItem[] {
  const at = (daysFromToday: number): string => addDays(today, daysFromToday) ?? today
  return [
    makeItem({ name: '鲜牛奶 (示例)', categoryId: 'fresh-milk', expiryDate: at(2), source: 'manual' }),
    makeItem({ name: '酸奶 (示例)', categoryId: 'yogurt', expiryDate: at(5), source: 'manual' }),
    makeItem({ name: '鸡蛋 (示例)', categoryId: 'eggs', expiryDate: at(-1), source: 'manual' }),
    makeItem({ name: '大米 (示例)', categoryId: 'rice', expiryDate: at(200), source: 'manual' }),
    makeItem({ name: '面膜 (示例)', categoryId: 'cosmetics', expiryDate: at(30), source: 'manual' }),
  ]
}
