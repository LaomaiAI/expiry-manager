// checklists.ts - preset household checklists for bulk adding.
// Each preset is a list of everyday items with a default category. Items
// with a reference shelf life get a computed default expiry date
// (today + reference days); items without one (e.g. medicine) have no
// default date and the user fills the printed date before adding.
// Nothing here is invented data: names are common household items and
// dates always come from the reference table or the user.

import { addDays } from './dates'
import { shelfLifeFor } from './shelfLife'
import { makeItem, type ExpiryItem } from './store'

export interface ChecklistEntry {
  name: string
  categoryId: string
}

export interface ChecklistPreset {
  id: string
  label: string
  entries: ChecklistEntry[]
}

export const CHECKLISTS: ChecklistPreset[] = [
  {
    id: 'kitchen-staples',
    label: '厨房常备',
    entries: [
      { name: '大米', categoryId: 'rice' },
      { name: '面粉', categoryId: 'rice' },
      { name: '食用油', categoryId: 'oil' },
      { name: '酱油', categoryId: 'sauce' },
      { name: '醋', categoryId: 'sauce' },
      { name: '料酒', categoryId: 'sauce' },
      { name: '鸡蛋', categoryId: 'eggs' },
      { name: '鲜牛奶', categoryId: 'fresh-milk' },
      { name: '冷冻水饺', categoryId: 'frozen' },
      { name: '罐头', categoryId: 'canned' },
      { name: '方便面', categoryId: 'instant-noodles' },
      { name: '蜂蜜', categoryId: 'honey' },
    ],
  },
  {
    id: 'medicine-cabinet',
    label: '家庭药箱',
    entries: [
      { name: '感冒药', categoryId: 'medicine' },
      { name: '退烧药', categoryId: 'medicine' },
      { name: '创可贴', categoryId: 'medicine' },
      { name: '眼药水', categoryId: 'eye-drops' },
      { name: '碘伏', categoryId: 'medicine' },
      { name: '医用酒精', categoryId: 'medicine' },
      { name: '维生素 C', categoryId: 'vitamins' },
      { name: '鱼油', categoryId: 'fish-oil' },
      { name: '钙片', categoryId: 'calcium' },
      { name: '蛋白粉', categoryId: 'protein' },
    ],
  },
  {
    id: 'bathroom',
    label: '浴室日化',
    entries: [
      { name: '洗发水', categoryId: 'shampoo' },
      { name: '护发素', categoryId: 'conditioner' },
      { name: '沐浴露', categoryId: 'body-wash' },
      { name: '牙膏', categoryId: 'toothpaste' },
      { name: '防晒霜', categoryId: 'sunscreen' },
      { name: '面膜', categoryId: 'face-mask' },
      { name: '洗衣液', categoryId: 'detergent' },
      { name: '洗洁精', categoryId: 'dish-soap' },
      { name: '香皂', categoryId: 'soap' },
      { name: '消毒液', categoryId: 'sanitizer' },
      { name: '化妆水', categoryId: 'cosmetics' },
      { name: '口红', categoryId: 'cosmetics' },
    ],
  },
  {
    id: 'baby',
    label: '母婴',
    entries: [
      { name: '婴儿配方奶粉', categoryId: 'baby-formula' },
      { name: '婴幼儿米粉', categoryId: 'baby-food' },
      { name: '纸尿裤', categoryId: 'diapers' },
      { name: '婴儿湿巾', categoryId: 'baby-wipes' },
      { name: '婴儿洗发水', categoryId: 'shampoo' },
      { name: '婴儿面霜', categoryId: 'cosmetics' },
      { name: '宠物干粮', categoryId: 'petfood' },
      { name: '宠物罐头', categoryId: 'petfood' },
      { name: '宠物零食', categoryId: 'pet-snacks' },
      { name: '宠物奶粉', categoryId: 'petfood' },
    ],
  },
]

/**
 * Default expiry date for a checklist entry: today + the category's
 * reference shelf life. Null when the category has no generic value
 * (the user must fill the printed date).
 */
export function checklistDefaultDate(entry: ChecklistEntry, today: string): string | null {
  const days = shelfLifeFor(entry.categoryId).days
  if (days === null) return null
  return addDays(today, days)
}

export interface ChecklistSelection {
  name: string
  categoryId: string
  /** ISO date YYYY-MM-DD, must be a real date */
  expiryDate: string
}

/** Build real items from confirmed checklist selections. Skips rows with a bad date. */
export function buildChecklistItems(selections: ChecklistSelection[], today: string): ExpiryItem[] {
  const items: ExpiryItem[] = []
  for (const s of selections) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.expiryDate)) continue
    items.push(
      makeItem({
        name: s.name,
        categoryId: s.categoryId,
        expiryDate: s.expiryDate,
        purchaseDate: today,
        source: 'manual',
      }),
    )
  }
  return items
}
