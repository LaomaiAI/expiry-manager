import { describe, expect, it } from 'vitest'
import {
  CATEGORY_GROUPS,
  entriesForGroup,
  groupLabelFor,
  groupOf,
  paoDefaultMonths,
  SHELF_LIFE,
  shelfLifeFor,
} from './shelfLife'

describe('shelf-life table', () => {
  it('has unique ids and a label and note for every entry', () => {
    const ids = SHELF_LIFE.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of SHELF_LIFE) {
      expect(e.label.trim()).not.toBe('')
      expect(e.note.trim()).not.toBe('')
    }
  })
  it('covers six everyday groups with 40+ subcategories', () => {
    expect(CATEGORY_GROUPS.map((g) => g.id)).toEqual([
      'food',
      'medicine',
      'supplements',
      'daily-chem',
      'kitchen',
      'baby-pet',
      'other',
    ])
    expect(SHELF_LIFE.length).toBeGreaterThanOrEqual(40)
    for (const g of ['food', 'medicine', 'supplements', 'daily-chem', 'kitchen', 'baby-pet'] as const) {
      expect(entriesForGroup(g).length).toBeGreaterThanOrEqual(3)
    }
  })
  it('keeps the v1 ids so old items still resolve', () => {
    for (const id of [
      'fresh-milk',
      'yogurt',
      'eggs',
      'bread',
      'cooked',
      'meat',
      'fish',
      'fruit',
      'vegetables',
      'frozen',
      'snacks',
      'rice',
      'oil',
      'canned',
      'sauce',
      'cosmetics',
      'petfood',
      'medicine',
      'other',
    ]) {
      expect(shelfLifeFor(id).id).toBe(id)
    }
  })
  it('marks medicine and other as having no generic value', () => {
    expect(shelfLifeFor('medicine').days).toBeNull()
    expect(shelfLifeFor('other').days).toBeNull()
  })
  it('marks every medicine entry as having no generic value', () => {
    for (const e of entriesForGroup('medicine')) {
      expect(e.days).toBeNull()
    }
  })
  it('gives a positive day count for categories that have one', () => {
    for (const e of SHELF_LIFE) {
      if (e.days !== null) expect(e.days).toBeGreaterThan(0)
    }
  })
  it('falls back to other for unknown categories', () => {
    expect(shelfLifeFor('no-such-category').id).toBe('other')
    expect(groupOf('no-such-category')).toBe('other')
    expect(groupLabelFor('fresh-milk')).toBe('食品')
    expect(groupLabelFor('cosmetics')).toBe('日化用品')
  })
  it('notes unopened vs opened in the oil and eye-drops entries', () => {
    expect(shelfLifeFor('oil').note).toContain('开封后 3 个月')
    expect(shelfLifeFor('eye-drops').note).toContain('开封后 4 周')
  })
})

describe('paoDefaultMonths', () => {
  it('uses the entry value when set', () => {
    expect(paoDefaultMonths(shelfLifeFor('cosmetics'))).toBe(6)
    expect(paoDefaultMonths(shelfLifeFor('shampoo'))).toBe(12)
    expect(paoDefaultMonths(shelfLifeFor('eye-drops'))).toBe(1)
    expect(paoDefaultMonths(shelfLifeFor('baby-wipes'))).toBe(3)
  })
  it('returns null for entries where opening starts no clock', () => {
    expect(paoDefaultMonths(shelfLifeFor('face-mask'))).toBeNull()
    expect(paoDefaultMonths(shelfLifeFor('soap'))).toBeNull()
  })
  it('defaults daily chemicals to 6 months and everything else to null', () => {
    expect(paoDefaultMonths(shelfLifeFor('sanitizer'))).toBe(6)
    expect(paoDefaultMonths(shelfLifeFor('rice'))).toBeNull()
    expect(paoDefaultMonths(shelfLifeFor('medicine'))).toBeNull()
  })
})
