import { describe, expect, it } from 'vitest'
import { SHELF_LIFE, shelfLifeFor } from './shelfLife'

describe('shelf-life table', () => {
  it('has unique ids and a label and note for every entry', () => {
    const ids = SHELF_LIFE.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of SHELF_LIFE) {
      expect(e.label.trim()).not.toBe('')
      expect(e.note.trim()).not.toBe('')
    }
  })
  it('marks medicine and other as having no generic value', () => {
    expect(shelfLifeFor('medicine').days).toBeNull()
    expect(shelfLifeFor('other').days).toBeNull()
  })
  it('gives a positive day count for food categories that have one', () => {
    for (const e of SHELF_LIFE) {
      if (e.days !== null) expect(e.days).toBeGreaterThan(0)
    }
  })
  it('falls back to other for unknown categories', () => {
    expect(shelfLifeFor('no-such-category').id).toBe('other')
  })
})
