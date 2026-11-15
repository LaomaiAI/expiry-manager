import { describe, expect, it } from 'vitest'
import {
  bucketCounts,
  exportItemsCSV,
  exportItemsJSON,
  importItemsJSON,
  makeItem,
  sampleItems,
  sanitizeItem,
  sortItems,
} from './store'

const item = (over: Record<string, unknown>) =>
  makeItem({ name: '测试', categoryId: 'other', expiryDate: '2026-11-20', source: 'manual', ...over })

describe('sanitizeItem', () => {
  it('accepts a good row', () => {
    expect(sanitizeItem({ name: '牛奶', expiryDate: '2026-11-20', categoryId: 'fresh-milk', source: 'ocr' })?.name).toBe('牛奶')
  })
  it('rejects rows without a name or with a bad date', () => {
    expect(sanitizeItem({ expiryDate: '2026-11-20' })).toBeNull()
    expect(sanitizeItem({ name: '牛奶', expiryDate: '2026-02-30' })).toBeNull()
    expect(sanitizeItem({ name: '牛奶', expiryDate: 'tomorrow' })).toBeNull()
    expect(sanitizeItem(null)).toBeNull()
    expect(sanitizeItem('nope')).toBeNull()
  })
  it('fills defaults for missing fields', () => {
    const s = sanitizeItem({ name: '牛奶', expiryDate: '2026-11-20' })
    expect(s?.categoryId).toBe('other')
    expect(s?.source).toBe('manual')
    expect(s?.id).toBeTruthy()
  })
})

describe('sortItems', () => {
  it('sorts by expiry date, earliest first', () => {
    const sorted = sortItems([
      item({ name: '晚', expiryDate: '2026-12-01' }),
      item({ name: '早', expiryDate: '2026-11-10' }),
      item({ name: '中', expiryDate: '2026-11-20' }),
    ])
    expect(sorted.map((i) => i.name)).toEqual(['早', '中', '晚'])
  })
})

describe('bucketCounts', () => {
  it('counts each bucket', () => {
    const counts = bucketCounts(
      [
        item({ expiryDate: '2026-11-14' }),
        item({ expiryDate: '2026-11-15' }),
        item({ expiryDate: '2026-11-17' }),
        item({ expiryDate: '2026-11-21' }),
        item({ expiryDate: '2027-01-01' }),
      ],
      '2026-11-15',
    )
    expect(counts).toEqual({ expired: 1, today: 1, soon3: 1, soon7: 1, safe: 1 })
  })
})

describe('JSON export/import round-trip', () => {
  it('round-trips items unchanged', () => {
    const items = [item({ name: '牛奶', categoryId: 'fresh-milk' }), item({ name: '鸡蛋', expiryDate: '2026-12-01' })]
    const { items: back, skipped } = importItemsJSON(exportItemsJSON(items))
    expect(skipped).toBe(0)
    expect(back.map((i) => i.name)).toEqual(['牛奶', '鸡蛋'])
    expect(back[0].expiryDate).toBe('2026-11-20')
  })
  it('skips bad rows and counts them', () => {
    const { items, skipped } = importItemsJSON('[{"name":"好","expiryDate":"2026-11-20"},{"name":"","expiryDate":"2026-11-20"},{"name":"坏日期","expiryDate":"2026-02-30"}]')
    expect(items).toHaveLength(1)
    expect(skipped).toBe(2)
  })
  it('returns empty on invalid JSON', () => {
    expect(importItemsJSON('not json')).toEqual({ items: [], skipped: 0 })
    expect(importItemsJSON('{"a":1}')).toEqual({ items: [], skipped: 0 })
  })
})

describe('CSV export', () => {
  it('writes a header and one row per item', () => {
    const csv = exportItemsCSV([item({ name: '牛奶', categoryId: 'fresh-milk' })])
    const lines = csv.split('\n')
    expect(lines[0]).toBe('名称,分类,保质期,购买日期,条码,数量,备注,来源')
    expect(lines[1]).toContain('牛奶')
    expect(lines[1]).toContain('鲜牛奶')
    expect(lines[1]).toContain('2026-11-20')
  })
  it('quotes cells with commas or quotes', () => {
    const csv = exportItemsCSV([item({ name: '牛奶,全脂', note: '他说"好喝"' })])
    expect(csv).toContain('"牛奶,全脂"')
    expect(csv).toContain('"他说""好喝"""')
  })
})

describe('sampleItems', () => {
  it('labels every sample as an example and keeps dates relative to today', () => {
    const samples = sampleItems('2026-11-15')
    expect(samples.length).toBe(5)
    expect(samples.every((s) => s.name.includes('(示例)'))).toBe(true)
    expect(samples.map((s) => s.expiryDate)).toEqual(['2026-11-17', '2026-11-20', '2026-11-14', '2027-06-03', '2026-12-15'])
  })
})
