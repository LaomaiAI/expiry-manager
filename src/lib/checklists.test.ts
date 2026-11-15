import { describe, expect, it } from 'vitest'
import { buildChecklistItems, CHECKLISTS, checklistDefaultDate } from './checklists'
import { shelfLifeFor } from './shelfLife'

describe('checklists', () => {
  it('has four presets with 8 to 15 entries each', () => {
    expect(CHECKLISTS.map((c) => c.id)).toEqual(['kitchen-staples', 'medicine-cabinet', 'bathroom', 'baby'])
    for (const c of CHECKLISTS) {
      expect(c.entries.length).toBeGreaterThanOrEqual(8)
      expect(c.entries.length).toBeLessThanOrEqual(15)
    }
  })
  it('points every entry at a real category and has no duplicate names per list', () => {
    for (const c of CHECKLISTS) {
      const names = c.entries.map((e) => e.name)
      expect(new Set(names).size).toBe(names.length)
      for (const e of c.entries) {
        expect(shelfLifeFor(e.categoryId).id).toBe(e.categoryId)
      }
    }
  })
  it('computes a default date from the reference table', () => {
    expect(checklistDefaultDate({ name: '大米', categoryId: 'rice' }, '2026-11-16')).toBe('2027-11-16')
    expect(checklistDefaultDate({ name: '鸡蛋', categoryId: 'eggs' }, '2026-11-16')).toBe('2026-12-16')
  })
  it('returns null for entries with no generic value', () => {
    expect(checklistDefaultDate({ name: '感冒药', categoryId: 'medicine' }, '2026-11-16')).toBeNull()
    expect(checklistDefaultDate({ name: '眼药水', categoryId: 'eye-drops' }, '2026-11-16')).toBeNull()
  })
})

describe('buildChecklistItems', () => {
  it('builds items with purchase date today and manual source', () => {
    const items = buildChecklistItems(
      [
        { name: '大米', categoryId: 'rice', expiryDate: '2027-11-16' },
        { name: '鸡蛋', categoryId: 'eggs', expiryDate: '2026-12-16' },
      ],
      '2026-11-16',
    )
    expect(items).toHaveLength(2)
    expect(items[0].name).toBe('大米')
    expect(items[0].purchaseDate).toBe('2026-11-16')
    expect(items[0].source).toBe('manual')
    expect(items[0].id).toBeTruthy()
  })
  it('skips rows with a bad date', () => {
    const items = buildChecklistItems(
      [
        { name: '大米', categoryId: 'rice', expiryDate: '2027-11-16' },
        { name: '坏日期', categoryId: 'rice', expiryDate: 'tomorrow' },
      ],
      '2026-11-16',
    )
    expect(items).toHaveLength(1)
  })
})
