import { useEffect, useRef, useState } from 'react'
import AddFlow from './components/AddFlow'
import ChecklistPanel from './components/ChecklistPanel'
import ItemCard from './components/ItemCard'
import { BUCKET_LABELS, BUCKET_ORDER, getBucket, todayISO, type Bucket } from './lib/dates'
import { CATEGORY_GROUPS, groupLabel, groupOf, type CategoryGroupId } from './lib/shelfLife'
import {
  bucketCounts,
  exportItemsCSV,
  exportItemsJSON,
  importItemsJSON,
  loadItems,
  sampleItems,
  saveItems,
  sortItems,
  type ExpiryItem,
} from './lib/store'

type Filter = 'all' | Bucket
type GroupFilter = 'all' | CategoryGroupId

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [items, setItems] = useState<ExpiryItem[]>(() => loadItems())
  const [filter, setFilter] = useState<Filter>('all')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [editing, setEditing] = useState<ExpiryItem | null>(null)
  const [message, setMessage] = useState('')
  const importRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    saveItems(items)
  }, [items])

  const today = todayISO()
  const counts = bucketCounts(items, today)
  const groupCounts = new Map<GroupFilter, number>()
  for (const item of items) {
    const g = groupOf(item.categoryId)
    groupCounts.set(g, (groupCounts.get(g) ?? 0) + 1)
  }
  const visible = sortItems(
    items.filter(
      (i) =>
        (filter === 'all' || getBucket(i.expiryDate, today) === filter) &&
        (groupFilter === 'all' || groupOf(i.categoryId) === groupFilter),
    ),
  )

  function addItem(item: ExpiryItem) {
    setItems((prev) => [...prev, item])
    setShowAdd(false)
    setMessage(`已保存：${item.name}，保质期至 ${item.expiryDate}。`)
  }

  function addChecklistItems(added: ExpiryItem[]) {
    setItems((prev) => [...prev, ...added])
    setShowChecklist(false)
    setMessage(`已从清单加入 ${added.length} 件，日期是按参考保质期推算的，请按包装日期核对。`)
  }

  function saveEdit(item: ExpiryItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
    setEditing(null)
    setMessage(`已更新：${item.name}。`)
  }

  function removeItem(item: ExpiryItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setMessage(`已移除：${item.name}。`)
  }

  function loadSamples() {
    setItems((prev) => [...prev, ...sampleItems(today)])
    setMessage('已载入 5 条示例数据（名称带“示例”标记），可以随时删掉。')
  }

  async function handleImportFile(file: File) {
    const text = await file.text()
    const { items: imported, skipped } = importItemsJSON(text)
    if (imported.length === 0) {
      setMessage('导入失败：文件里没有可用的物品数据。')
      return
    }
    setItems((prev) => {
      const ids = new Set(prev.map((i) => i.id))
      return [...prev, ...imported.filter((i) => !ids.has(i.id))]
    })
    setMessage(`导入完成：新增 ${imported.length} 条${skipped > 0 ? `，跳过 ${skipped} 条无效数据` : ''}。`)
  }

  const total = items.length
  const urgent = counts.expired + counts.today + counts.soon3

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 pb-16">
      <header className="pt-6">
        <h1 className="text-2xl font-bold text-stone-900">到期管理</h1>
        <p className="mt-1 text-sm text-stone-600">
          食品、药品、保健品、日化、厨房、母婴，家里的东西都能记。拍照或扫码就能录，不用一件件手动填。
        </p>
        <p className="mt-2 text-sm">
          {total === 0 ? (
            '还没有物品，先添加一件试试。'
          ) : (
            <>
              共 {total} 件
              {counts.expired > 0 ? <span className="font-semibold text-red-700"> · {counts.expired} 件已过期</span> : null}
              {urgent > 0 ? <span className="font-semibold text-amber-700"> · {urgent} 件 3 天内到期</span> : null}
            </>
          )}
        </p>
      </header>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setShowChecklist(false)
            setShowAdd((v) => !v)
          }}
          className="flex-1 rounded-xl bg-amber-600 px-4 py-3 text-base font-semibold text-white"
        >
          {showAdd ? '收起添加' : '+ 添加物品'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setShowAdd(false)
            setShowChecklist((v) => !v)
          }}
          className="rounded-xl border border-amber-600 bg-white px-4 py-3 text-base font-semibold text-amber-700"
        >
          {showChecklist ? '收起清单' : '从清单添加'}
        </button>
      </div>

      {showAdd ? (
        <div className="mt-4">
          <AddFlow onSave={addItem} onCancel={() => setShowAdd(false)} />
        </div>
      ) : null}

      {showChecklist ? (
        <div className="mt-4">
          <ChecklistPanel onAdd={addChecklistItems} onCancel={() => setShowChecklist(false)} />
        </div>
      ) : null}

      {editing ? (
        <div className="mt-4">
          <AddFlow initial={editing} onSave={saveEdit} onCancel={() => setEditing(null)} />
        </div>
      ) : null}

      {message ? <p className="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">{message}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip label={`全部 (${total})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        {BUCKET_ORDER.map((b) => (
          <FilterChip
            key={b}
            label={`${BUCKET_LABELS[b]} (${counts[b]})`}
            active={filter === b}
            onClick={() => setFilter(b)}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <FilterChip label={`全部分类 (${total})`} active={groupFilter === 'all'} onClick={() => setGroupFilter('all')} />
        {CATEGORY_GROUPS.map((g) => (
          <FilterChip
            key={g.id}
            label={`${groupLabel(g.id)} (${groupCounts.get(g.id) ?? 0})`}
            active={groupFilter === g.id}
            onClick={() => setGroupFilter(g.id)}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center">
          <p className="text-stone-600">
            {total === 0 ? '这里空空如也。点上面的“添加物品”，拍一张包装照片就能记一件。' : '这个分类下没有物品。'}
          </p>
          {total === 0 ? (
            <button
              type="button"
              onClick={loadSamples}
              className="mt-3 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            >
              先载入 5 条示例数据看看
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="mt-4 grid gap-3">
          {visible.map((item) => (
            <ItemCard key={item.id} item={item} onEdit={setEditing} onRemove={removeItem} />
          ))}
        </ul>
      )}

      <footer className="mt-8 border-t border-stone-200 pt-4">
        <p className="text-sm font-semibold text-stone-700">数据在你手里</p>
        <p className="mt-1 text-sm text-stone-600">
          所有数据只存在你这台手机的浏览器里，不上传、不注册、不登录。随时可以导出带走。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => download(`expiry-manager-${today}.csv`, exportItemsCSV(items), 'text/csv;charset=utf-8')}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700"
          >
            导出 CSV
          </button>
          <button
            type="button"
            onClick={() => download(`expiry-manager-${today}.json`, exportItemsJSON(items), 'application/json')}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700"
          >
            导出 JSON
          </button>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700"
          >
            导入 JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImportFile(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (window.confirm('确定要清空全部物品吗？导出备份后再清空更稳妥。')) {
                setItems([])
                setMessage('已清空全部物品。')
              }
            }}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700"
          >
            清空全部
          </button>
        </div>
        <details className="mt-4 text-sm text-stone-600">
          <summary className="cursor-pointer font-semibold text-stone-700">关于参考保质期</summary>
          <p className="mt-1">
            分类里的参考保质期是按公开食品安全指南的常见区间整理的参考值，只用来在没有印刷日期时帮你推算。
            包装上印的实际日期永远为准，药品和没有通用参考值的分类必须按包装日期填写。
            日化用品填了开封日期后，会按开封后有效期（默认 6 个月，可改）和包装日期取较早者。
          </p>
        </details>
        <p className="mt-4 text-xs text-stone-400">到期管理 v2 · 纯前端应用，无账号、无后端、无大模型调用</p>
      </footer>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
        active ? 'border-amber-600 bg-amber-600 text-white' : 'border-stone-300 bg-white text-stone-700'
      }`}
    >
      {label}
    </button>
  )
}
