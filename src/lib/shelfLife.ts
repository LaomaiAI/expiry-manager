// shelfLife.ts - built-in shelf-life reference table, v2.
//
// Six everyday groups (food, medicine, supplements, daily chemicals,
// kitchen goods, baby and pet) with 50+ subcategories. These are TYPICAL
// values after purchase / opening, compiled from public guidance (e.g.
// USDA FoodKeeper) and common manufacturer labelling. They are a starting
// point, not a guarantee: the date printed on the package always wins,
// and the user can adjust every item.
// days = null means there is no reliable generic value for the category.
// paoMonths = the period-after-opening in months, when the category has
// one; null means opening does not start a separate clock for this entry
// (e.g. single-use items); undefined means "use the group default"
// (daily chemicals default to 6 months, everything else has no PAO).

export type CategoryGroupId =
  | 'food'
  | 'medicine'
  | 'supplements'
  | 'daily-chem'
  | 'kitchen'
  | 'baby-pet'
  | 'other'

export interface CategoryGroup {
  id: CategoryGroupId
  label: string
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'food', label: '食品' },
  { id: 'medicine', label: '药品' },
  { id: 'supplements', label: '保健品' },
  { id: 'daily-chem', label: '日化用品' },
  { id: 'kitchen', label: '厨房用品' },
  { id: 'baby-pet', label: '母婴及宠物' },
  { id: 'other', label: '其他' },
]

export interface ShelfLifeEntry {
  id: string
  label: string
  group: CategoryGroupId
  /** Typical shelf life in days, or null when no generic value exists */
  days: number | null
  /** Period after opening in months: number, null (not applicable), or undefined (group default) */
  paoMonths?: number | null
  note: string
}

export const SHELF_LIFE: ShelfLifeEntry[] = [
  // 食品
  { id: 'fresh-milk', label: '鲜牛奶', group: 'food', days: 7, note: '未开封冷藏 7 天；开封后冷藏 3 到 7 天' },
  { id: 'yogurt', label: '酸奶', group: 'food', days: 21, note: '冷藏；未开封常见参考 21 到 30 天' },
  { id: 'eggs', label: '鸡蛋', group: 'food', days: 30, note: '冷藏保存' },
  { id: 'bread', label: '面包', group: 'food', days: 5, note: '常温；含防腐剂的包装面包可更久' },
  { id: 'cooked', label: '熟食', group: 'food', days: 3, note: '冷藏，尽快吃完' },
  { id: 'meat', label: '生肉', group: 'food', days: 3, note: '冷藏；冷冻可保存数月' },
  { id: 'fish', label: '生鱼', group: 'food', days: 2, note: '冷藏，尽快吃完' },
  { id: 'fruit', label: '水果', group: 'food', days: 7, note: '因种类差异很大，仅供参考' },
  { id: 'vegetables', label: '蔬菜', group: 'food', days: 7, note: '因种类差异很大，仅供参考' },
  { id: 'frozen', label: '冷冻食品', group: 'food', days: 180, note: '冷冻保存，常见参考 3 到 6 个月' },
  { id: 'snacks', label: '零食饼干', group: 'food', days: 180, note: '未开封常见参考 6 到 12 个月，取下限' },
  { id: 'rice', label: '大米面粉', group: 'food', days: 365, note: '干燥密封保存' },
  { id: 'oil', label: '食用油', group: 'food', days: 540, note: '未开封常见参考 18 个月，避光保存；开封后 3 个月内用完' },
  { id: 'canned', label: '罐头', group: 'food', days: 730, note: '未开封，常温保存' },
  { id: 'sauce', label: '调味品', group: 'food', days: 365, note: '开封后冷藏更稳妥' },
  { id: 'tea', label: '茶叶', group: 'food', days: 365, note: '未开封干燥密封常见参考 12 个月；开封后 3 到 6 个月' },
  { id: 'milk-powder', label: '奶粉', group: 'food', days: 365, note: '未开封常见参考 12 个月；开封后 4 周内用完' },
  { id: 'nuts', label: '坚果', group: 'food', days: 180, note: '未开封常见参考 6 个月；开封后密封冷藏' },
  { id: 'instant-noodles', label: '方便面', group: 'food', days: 180, note: '未开封常见参考 6 个月' },
  { id: 'honey', label: '蜂蜜', group: 'food', days: 730, note: '未开封常见参考 24 个月；结晶不代表变质' },
  { id: 'coffee', label: '咖啡豆/咖啡粉', group: 'food', days: 180, note: '未开封常见参考 6 个月；开封后密封避光，1 个月内风味最佳' },
  // 药品：全部没有通用参考值，必须按包装印刷日期填写
  { id: 'medicine', label: '药品', group: 'medicine', days: null, note: '没有通用参考值，必须按包装印刷日期填写' },
  { id: 'eye-drops', label: '眼药水', group: 'medicine', days: null, paoMonths: 1, note: '没有通用参考值，必须按包装印刷日期填写；开封后 4 周内用完' },
  { id: 'topical', label: '外用药膏', group: 'medicine', days: null, note: '没有通用参考值，必须按包装印刷日期填写；开封后按说明书' },
  // 保健品
  { id: 'vitamins', label: '维生素片', group: 'supplements', days: 730, note: '未开封常见参考 24 个月；开封后防潮保存' },
  { id: 'fish-oil', label: '鱼油', group: 'supplements', days: 540, note: '未开封常见参考 18 个月；开封后冷藏' },
  { id: 'calcium', label: '钙片', group: 'supplements', days: 730, note: '未开封常见参考 24 个月；开封后防潮保存' },
  { id: 'probiotics', label: '益生菌', group: 'supplements', days: null, note: '需按包装要求冷藏，保质期差异大，以包装日期为准' },
  { id: 'protein', label: '蛋白粉', group: 'supplements', days: 540, note: '未开封常见参考 18 个月；开封后 3 到 6 个月' },
  // 日化用品
  { id: 'cosmetics', label: '化妆品', group: 'daily-chem', days: 180, paoMonths: 6, note: '未开封常见参考 3 年；开封后按 PAO，一般 6 或 12 个月' },
  { id: 'shampoo', label: '洗发水', group: 'daily-chem', days: 365, paoMonths: 12, note: '未开封常见参考 3 年；开封后 12 个月' },
  { id: 'conditioner', label: '护发素', group: 'daily-chem', days: 365, paoMonths: 12, note: '未开封常见参考 3 年；开封后 12 个月' },
  { id: 'body-wash', label: '沐浴露', group: 'daily-chem', days: 365, paoMonths: 12, note: '未开封常见参考 3 年；开封后 12 个月' },
  { id: 'toothpaste', label: '牙膏', group: 'daily-chem', days: 730, paoMonths: 3, note: '未开封常见参考 2 到 3 年；开封后 3 个月内用完' },
  { id: 'sunscreen', label: '防晒霜', group: 'daily-chem', days: 365, paoMonths: 6, note: '未开封常见参考 3 年；开封后 6 到 12 个月' },
  { id: 'face-mask', label: '面膜', group: 'daily-chem', days: 730, paoMonths: null, note: '未开封常见参考 2 到 3 年；一次一片，开封即用' },
  { id: 'detergent', label: '洗衣液', group: 'daily-chem', days: 730, paoMonths: 12, note: '未开封常见参考 2 年；开封后 6 到 12 个月' },
  { id: 'dish-soap', label: '洗洁精', group: 'daily-chem', days: 730, paoMonths: 12, note: '未开封常见参考 2 年；开封后 12 个月' },
  { id: 'soap', label: '肥皂/香皂', group: 'daily-chem', days: 1095, paoMonths: null, note: '未开封常见参考 3 年；开封后放干燥处' },
  { id: 'sanitizer', label: '消毒液', group: 'daily-chem', days: 365, paoMonths: 6, note: '未开封常见参考 12 个月；开封后 3 到 6 个月，避光保存' },
  // 厨房用品：海绵和抹布的 days 是建议更换周期，不是保质期
  { id: 'sponge', label: '洗碗海绵', group: 'kitchen', days: 30, note: '不是保质期，是建议更换周期：每 1 个月换一块' },
  { id: 'dishcloth', label: '抹布', group: 'kitchen', days: 90, note: '建议更换周期：每 3 个月更换' },
  { id: 'cling-film', label: '保鲜膜', group: 'kitchen', days: 1095, note: '未开封常见参考 3 年；开封后防潮保存' },
  { id: 'baking-soda', label: '小苏打', group: 'kitchen', days: 365, note: '未开封 12 个月；开封后 6 个月，吸潮结块后失效' },
  { id: 'kitchen-paper', label: '厨房纸', group: 'kitchen', days: 1095, note: '未开封常见参考 3 年；防潮保存' },
  { id: 'water-filter', label: '滤水器滤芯', group: 'kitchen', days: 180, note: '按说明书的更换周期，常见参考 6 个月' },
  // 母婴及宠物
  { id: 'baby-formula', label: '婴儿配方奶粉', group: 'baby-pet', days: 365, note: '未开封常见参考 12 个月；开封后 4 周内用完' },
  { id: 'baby-food', label: '婴幼儿辅食', group: 'baby-pet', days: 365, note: '未开封常见参考 12 个月；开封后冷藏 24 小时内吃完' },
  { id: 'diapers', label: '纸尿裤', group: 'baby-pet', days: 1095, note: '未开封常见参考 3 年；防潮保存' },
  { id: 'baby-wipes', label: '婴儿湿巾', group: 'baby-pet', days: 365, paoMonths: 3, note: '未开封常见参考 12 个月；开封后 3 个月' },
  { id: 'petfood', label: '宠物食品', group: 'baby-pet', days: 365, note: '未开封；开封后按包装说明' },
  { id: 'pet-snacks', label: '宠物零食', group: 'baby-pet', days: 180, note: '未开封常见参考 6 个月；开封后密封保存' },
  // 兜底
  { id: 'other', label: '其他', group: 'other', days: null, note: '没有通用参考值，请按包装印刷日期填写' },
]

export function shelfLifeFor(categoryId: string): ShelfLifeEntry {
  return SHELF_LIFE.find((e) => e.id === categoryId) ?? SHELF_LIFE[SHELF_LIFE.length - 1]
}

export function categoryLabel(categoryId: string): string {
  return shelfLifeFor(categoryId).label
}

/** Which top-level group a subcategory belongs to. Unknown ids fall back to other. */
export function groupOf(categoryId: string): CategoryGroupId {
  return shelfLifeFor(categoryId).group
}

export function groupLabel(groupId: CategoryGroupId): string {
  return CATEGORY_GROUPS.find((g) => g.id === groupId)?.label ?? '其他'
}

export function groupLabelFor(categoryId: string): string {
  return groupLabel(groupOf(categoryId))
}

export function entriesForGroup(groupId: CategoryGroupId): ShelfLifeEntry[] {
  return SHELF_LIFE.filter((e) => e.group === groupId)
}

/**
 * Default period-after-opening in months for an entry.
 * An explicit paoMonths wins; null means no PAO clock for this entry;
 * undefined falls back to the daily-chemicals group default of 6 months.
 */
export function paoDefaultMonths(entry: ShelfLifeEntry): number | null {
  if (typeof entry.paoMonths === 'number') return entry.paoMonths
  if (entry.paoMonths === null) return null
  return entry.group === 'daily-chem' ? 6 : null
}
