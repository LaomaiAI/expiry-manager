import { daysLeftLabel, getBucket, todayISO } from '../lib/dates'
import { categoryLabel, groupLabelFor } from '../lib/shelfLife'
import type { ExpiryItem } from '../lib/store'

const BUCKET_STYLE: Record<string, string> = {
  expired: 'bg-red-100 text-red-800 border-red-300',
  today: 'bg-orange-100 text-orange-800 border-orange-300',
  soon3: 'bg-amber-100 text-amber-800 border-amber-300',
  soon7: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  safe: 'bg-green-100 text-green-800 border-green-300',
}

const SOURCE_LABEL: Record<string, string> = {
  ocr: '拍照识别',
  barcode: '扫码',
  manual: '手动',
}

export default function ItemCard({
  item,
  onEdit,
  onRemove,
}: {
  item: ExpiryItem
  onEdit: (item: ExpiryItem) => void
  onRemove: (item: ExpiryItem) => void
}) {
  const today = todayISO()
  const bucket = getBucket(item.expiryDate, today)
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-stone-900">{item.name}</p>
          <p className="mt-0.5 text-sm text-stone-500">
            {groupLabelFor(item.categoryId)} · {categoryLabel(item.categoryId)}
            {item.quantity !== undefined ? ` · ${item.quantity} 件` : ''}
            {item.purchaseDate ? ` · 购于 ${item.purchaseDate}` : ''} · {SOURCE_LABEL[item.source]}
          </p>
          {item.note ? <p className="mt-0.5 truncate text-sm text-stone-500">{item.note}</p> : null}
          {item.expiryBasis === 'pao' && item.printedExpiryDate ? (
            <p className="mt-0.5 text-sm text-amber-700">
              按开封后 {item.paoMonths} 个月算；包装印 {item.printedExpiryDate}
            </p>
          ) : null}
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${BUCKET_STYLE[bucket]}`}>
          {daysLeftLabel(item.expiryDate, today)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-stone-700">
          保质期至 <span className="font-semibold">{item.expiryDate}</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-700"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-700"
          >
            吃完 / 扔掉
          </button>
        </div>
      </div>
    </li>
  )
}
