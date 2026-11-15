// shelfLife.ts - built-in shelf-life reference table.
//
// These are TYPICAL values after purchase / opening, compiled from public
// food-safety guidance (e.g. USDA FoodKeeper) and common manufacturer
// labelling. They are a starting point, not a guarantee: the date printed
// on the package always wins, and the user can adjust every item.
// days = null means there is no reliable generic value for the category.

export interface ShelfLifeEntry {
  id: string
  label: string
  /** Typical shelf life in days, or null when no generic value exists */
  days: number | null
  note: string
}

export const SHELF_LIFE: ShelfLifeEntry[] = [
  { id: 'fresh-milk', label: '鲜牛奶', days: 7, note: '开封后冷藏，常见参考 3 到 7 天' },
  { id: 'yogurt', label: '酸奶', days: 21, note: '冷藏，未开封常见参考 21 到 30 天' },
  { id: 'eggs', label: '鸡蛋', days: 30, note: '冷藏保存' },
  { id: 'bread', label: '面包', days: 5, note: '常温，含防腐剂的包装面包可更久' },
  { id: 'cooked', label: '熟食', days: 3, note: '冷藏，尽快吃完' },
  { id: 'meat', label: '生肉', days: 3, note: '冷藏；冷冻可保存数月' },
  { id: 'fish', label: '生鱼', days: 2, note: '冷藏，尽快吃完' },
  { id: 'fruit', label: '水果', days: 7, note: '因种类差异很大，仅供参考' },
  { id: 'vegetables', label: '蔬菜', days: 7, note: '因种类差异很大，仅供参考' },
  { id: 'frozen', label: '冷冻食品', days: 180, note: '冷冻保存，常见参考 3 到 6 个月' },
  { id: 'snacks', label: '零食饼干', days: 180, note: '未开封常见参考 6 到 12 个月，取下限' },
  { id: 'rice', label: '大米面粉', days: 365, note: '干燥密封保存' },
  { id: 'oil', label: '食用油', days: 540, note: '未开封常见参考 18 个月，避光保存' },
  { id: 'canned', label: '罐头', days: 730, note: '未开封，常温保存' },
  { id: 'sauce', label: '调味品', days: 365, note: '开封后冷藏更稳妥' },
  { id: 'cosmetics', label: '化妆品', days: 180, note: '开封后常见参考 6 个月，因产品差异很大' },
  { id: 'petfood', label: '宠物食品', days: 365, note: '未开封；开封后按包装说明' },
  { id: 'medicine', label: '药品', days: null, note: '没有通用参考值，必须按包装印刷日期填写' },
  { id: 'other', label: '其他', days: null, note: '没有通用参考值，请按包装印刷日期填写' },
]

export function shelfLifeFor(categoryId: string): ShelfLifeEntry {
  return SHELF_LIFE.find((e) => e.id === categoryId) ?? SHELF_LIFE[SHELF_LIFE.length - 1]
}

export function categoryLabel(categoryId: string): string {
  return shelfLifeFor(categoryId).label
}
