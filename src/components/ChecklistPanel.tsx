import { useMemo, useState } from 'react'
import { buildChecklistItems, CHECKLISTS, checklistDefaultDate, type ChecklistSelection } from '../lib/checklists'
import { categoryLabel } from '../lib/shelfLife'
import { todayISO } from '../lib/dates'
import type { ExpiryItem } from '../lib/store'

/**
 * Bulk-add from a preset checklist. Each entry is checked in, carries its
 * default category and a reference expiry date, and the user only fills
 * dates for entries without a generic value (e.g. medicine). Nothing is
 * added until every checked entry has a date.
 */
export default function ChecklistPanel({
  onAdd,
  onCancel,
}: {
  onAdd: (items: ExpiryItem[]) => void
  onCancel: () => void
}) {
  const today = todayISO()
  const [presetId, setPresetId] = useState(CHECKLISTS[0].id)
  const preset = CHECKLISTS.find((c) => c.id === presetId) ?? CHECKLISTS[0]
  // key: `${presetId}:${name}`; value: chosen expiry date ('' = not set)
  const [dates, setDates] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const rows = useMemo(
    () =>
      preset.entries.map((e) => {
        const key = `${preset.id}:${e.name}`
        const fallback = checklistDefaultDate(e, today)
        return { key, entry: e, fallback, date: dates[key] ?? fallback ?? '', isChecked: checked[key] ?? false }
      }),
    [preset, dates, checked, today],
  )

  const selected = rows.filter((r) => r.isChecked)
  const missingDate = selected.filter((r) => r.date === '')
  const canAdd = selected.length > 0 && missingDate.length === 0

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function setDate(key: string, value: string) {
    setDates((prev) => ({ ...prev, [key]: value }))
  }

  function confirm() {
    if (!canAdd) return
    const selections: ChecklistSelection[] = selected.map((r) => ({
      name: r.entry.name,
      categoryId: r.entry.categoryId,
      expiryDate: r.date,
    }))
    const items = buildChecklistItems(selections, today)
    if (items.length > 0) onAdd(items)
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-900">从清单批量添加</h2>
        <button type="button" onClick={onCancel} className="text-sm text-stone-500">
          取消
        </button>
      </div>
      <p className="mb-3 text-sm text-stone-600">
        打勾要加的物品，参考保质期已经按今天推算好；没有参考值的要补填包装上的日期，都填好才能加入。
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {CHECKLISTS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setPresetId(c.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              c.id === presetId ? 'border-amber-600 bg-amber-600 text-white' : 'border-stone-300 bg-white text-stone-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2 rounded-lg border border-stone-200 px-2 py-2">
            <input type="checkbox" checked={r.isChecked} onChange={() => toggle(r.key)} aria-label={r.entry.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900">{r.entry.name}</p>
              <p className="text-xs text-stone-500">
                {categoryLabel(r.entry.categoryId)}
                {r.fallback === null ? ' · 无参考值，请填包装日期' : ''}
              </p>
            </div>
            <input
              type="date"
              value={r.date}
              onChange={(e) => setDate(r.key, e.target.value)}
              className="w-36 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
              aria-label={`${r.entry.name}的保质期`}
            />
          </li>
        ))}
      </ul>
      {missingDate.length > 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          还有 {missingDate.length} 件没填日期：{missingDate.map((r) => r.entry.name).join('、')}。药品没有参考值，请按包装日期填。
        </p>
      ) : null}
      <button
        type="button"
        onClick={confirm}
        disabled={!canAdd}
        className="mt-3 w-full rounded-lg bg-amber-600 px-4 py-2.5 font-semibold text-white disabled:opacity-40"
      >
        {selected.length === 0 ? '先打勾要加的物品' : `加入所选 ${selected.length} 件`}
      </button>
    </div>
  )
}
