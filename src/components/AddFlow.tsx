import { useEffect, useRef, useState } from 'react'
import { decodeBarcodeFromImage, scanBarcodeFromVideo } from '../lib/barcode'
import { extractAllDates, suggestExpiryFromPurchase, todayISO, type DateCandidate } from '../lib/dates'
import { recognizeDateText } from '../lib/ocr'
import { lookupProduct as lookupBeautyProduct } from '../lib/openBeautyFacts'
import { lookupProduct } from '../lib/openFoodFacts'
import { paoExpiry, resolveExpiry } from '../lib/pao'
import { CATEGORY_GROUPS, entriesForGroup, groupOf, paoDefaultMonths, shelfLifeFor } from '../lib/shelfLife'
import { makeItem, type ExpiryItem, type ItemSource } from '../lib/store'

type Tab = 'ocr' | 'barcode' | 'manual'

export default function AddFlow({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ExpiryItem | null
  onSave: (item: ExpiryItem) => void
  onCancel: () => void
}) {
  const editing = initial ?? null
  const [tab, setTab] = useState<Tab>('ocr')
  const [name, setName] = useState(editing?.name ?? '')
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? 'other')
  // When editing an item whose effective date came from PAO, the date
  // input shows the printed date; the effective date is recomputed on save.
  const [expiryDate, setExpiryDate] = useState(editing?.printedExpiryDate ?? editing?.expiryDate ?? '')
  const [purchaseDate, setPurchaseDate] = useState(editing?.purchaseDate ?? todayISO())
  const [openedDate, setOpenedDate] = useState(editing?.openedDate ?? '')
  const [paoMonthsText, setPaoMonthsText] = useState(editing?.paoMonths !== undefined ? String(editing.paoMonths) : '')
  const [quantity, setQuantity] = useState(editing?.quantity !== undefined ? String(editing.quantity) : '')
  const [note, setNote] = useState(editing?.note ?? '')
  const [barcode, setBarcode] = useState(editing?.barcode ?? '')
  const [source, setSource] = useState<ItemSource>(editing?.source ?? 'manual')

  const [status, setStatus] = useState('')
  const [ocrProgress, setOcrProgress] = useState<number | null>(null)
  const [candidates, setCandidates] = useState<DateCandidate[]>([])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const stopScanRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      stopScanRef.current?.()
      stopScanRef.current = null
    }
  }, [])

  const shelf = shelfLifeFor(categoryId)
  const paoDefault = paoDefaultMonths(shelf)
  const paoActive = paoDefault !== null && openedDate !== ''
  const paoMonthsValue =
    paoActive && paoMonthsText !== '' ? Math.max(1, Math.min(36, Math.floor(Number(paoMonthsText)) || paoDefault)) : paoDefault
  const paoDate = paoActive && paoMonthsValue !== null ? paoExpiry(openedDate, paoMonthsValue) : null
  const resolved = resolveExpiry(expiryDate || null, openedDate || null, paoActive ? paoMonthsValue : null)
  const effectiveDate = resolved.expiryDate
  const suggested = purchaseDate ? suggestExpiryFromPurchase(purchaseDate, shelf.days) : null

  const valid = name.trim() !== '' && effectiveDate !== null

  function changeCategory(id: string) {
    setCategoryId(id)
    setPaoMonthsText('')
    if (paoDefaultMonths(shelfLifeFor(id)) === null) setOpenedDate('')
  }

  function save() {
    if (!valid || !effectiveDate) return
    const base: Omit<ExpiryItem, 'id' | 'createdAt'> = {
      name: name.trim(),
      categoryId,
      expiryDate: effectiveDate,
      purchaseDate: purchaseDate || undefined,
      barcode: barcode || undefined,
      quantity: quantity !== '' ? Math.max(1, Math.floor(Number(quantity))) : undefined,
      note: note.trim() || undefined,
      source,
    }
    if (paoActive && paoMonthsValue !== null) {
      base.openedDate = openedDate
      base.paoMonths = paoMonthsValue
      base.expiryBasis = resolved.basis
      if (expiryDate !== '' && expiryDate !== effectiveDate) base.printedExpiryDate = expiryDate
    }
    if (editing) onSave({ ...editing, ...base })
    else onSave(makeItem(base))
  }

  async function handlePhoto(file: File) {
    setCandidates([])
    setStatus('')
    setOcrProgress(0)
    setPhotoUrl(URL.createObjectURL(file))
    setSource('ocr')
    try {
      const text = await recognizeDateText(file, (p) => setOcrProgress(Math.round(p * 100)))
      setOcrProgress(null)
      const found = extractAllDates(text)
      setCandidates(found)
      if (found.length === 0) {
        setStatus('没有识别到日期，可能是照片太暗或日期印得太小，请手动输入日期。')
      } else {
        // Default pick: a production-date-derived expiry when present,
        // otherwise the latest printed date (expiry is usually printed
        // after the production date on the same label).
        const pick = found.find((c) => c.derived) ?? found[found.length - 1]
        setExpiryDate(pick.date)
        setStatus(`识别到 ${found.length} 个日期，请确认下面选中的是保质期。`)
      }
    } catch {
      setOcrProgress(null)
      setStatus('识别失败：首次使用需要联网下载识别数据，请联网后重试，或改用手动输入。')
    }
  }

  async function handleBarcode(code: string) {
    const clean = code.trim()
    if (clean === '') return
    stopScanning()
    setBarcode(clean)
    const g = groupOf(categoryId)
    if (g === 'medicine' || g === 'supplements') {
      setStatus('药品和保健品不做扫码查询，请用手动添加，按包装日期填写。')
      return
    }
    setSource('barcode')
    setStatus('正在查询商品名称…')
    const info = await lookupProduct(clean)
    if (info.name) {
      setName(info.name)
      setStatus(`在 OpenFoodFacts 找到商品：${info.name}${info.brands ? `（${info.brands}）` : ''}。请选分类，确认到期日。`)
      return
    }
    const beauty = await lookupBeautyProduct(clean)
    if (beauty.name) {
      setName(beauty.name)
      setStatus(`在 OpenBeautyFacts 找到商品：${beauty.name}${beauty.brands ? `（${beauty.brands}）` : ''}。请选日化分类，确认到期日。`)
    } else {
      setStatus('两个数据库都没找到这个条码，请手动输入名称，再按参考表选分类。')
    }
  }

  async function startScanning() {
    const video = videoRef.current
    if (!video) return
    setStatus('正在打开摄像头…')
    setScanning(true)
    try {
      const stop = await scanBarcodeFromVideo(video, (code) => {
        void handleBarcode(code)
      })
      stopScanRef.current = stop
      setStatus('摄像头已打开，把条码对准画面。')
    } catch (e) {
      setScanning(false)
      setStatus(e instanceof Error ? e.message : '无法打开摄像头。')
    }
  }

  function stopScanning() {
    stopScanRef.current?.()
    stopScanRef.current = null
    setScanning(false)
  }

  async function handleBarcodePhoto(file: File) {
    setStatus('正在识别条码…')
    const code = await decodeBarcodeFromImage(file)
    if (code) await handleBarcode(code)
    else setStatus('这张照片里没有识别到条码，请换一张更清晰的，或手动输入条码。')
  }

  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold ${
        tab === id ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-900">{editing ? '编辑物品' : '添加物品'}</h2>
        <button type="button" onClick={onCancel} className="text-sm text-stone-500">
          取消
        </button>
      </div>

      {!editing && (
        <div className="mb-4 flex gap-2">
          {tabBtn('ocr', '拍照识别保质期')}
          {tabBtn('barcode', '扫码查商品')}
          {tabBtn('manual', '手动添加')}
        </div>
      )}

      {!editing && tab === 'ocr' && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-stone-700">
          <p className="mb-2">拍包装上印的保质期，自动识别日期。第一次使用需要联网下载识别数据，之后会缓存。</p>
          <label className="inline-block cursor-pointer rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white">
            拍照 / 选择照片
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handlePhoto(f)
              }}
            />
          </label>
          {photoUrl ? (
            <img src={photoUrl} alt="包装照片" className="mt-3 max-h-48 w-full rounded-lg object-contain bg-stone-100" />
          ) : null}
          {ocrProgress !== null ? (
            <p className="mt-2 text-stone-600">识别中… {ocrProgress}%</p>
          ) : null}
          {candidates.length > 0 ? (
            <div className="mt-3">
              <p className="mb-1 font-semibold">识别到的日期（点一个确认）：</p>
              {candidates.map((c) => (
                <label key={c.date + c.label} className="mb-1 flex items-center gap-2 rounded-lg border border-stone-200 px-2 py-1.5">
                  <input
                    type="radio"
                    name="ocr-date"
                    checked={expiryDate === c.date}
                    onChange={() => setExpiryDate(c.date)}
                  />
                  <span>
                    {c.date} <span className="text-stone-500">({c.label})</span>
                  </span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {!editing && tab === 'barcode' && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-stone-700">
          <p className="mb-2">扫条码查商品名，再按分类的参考保质期推算到期日。食品查 OpenFoodFacts，日化用品查 OpenBeautyFacts。药品和保健品不扫码，请手动添加。</p>
          <div className="flex flex-wrap gap-2">
            {!scanning ? (
              <button type="button" onClick={() => void startScanning()} className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white">
                打开摄像头扫码
              </button>
            ) : (
              <button type="button" onClick={stopScanning} className="rounded-lg bg-stone-600 px-4 py-2 font-semibold text-white">
                停止扫码
              </button>
            )}
            <label className="inline-block cursor-pointer rounded-lg border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-700">
              上传条码照片
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleBarcodePhoto(f)
                }}
              />
            </label>
          </div>
          {scanning ? (
            <video ref={videoRef} playsInline muted autoPlay className="mt-3 w-full rounded-lg bg-black" />
          ) : null}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="或手动输入条码数字"
              className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => void handleBarcode(barcode)}
              disabled={barcode.trim() === ''}
              className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white disabled:opacity-40"
            >
              查询
            </button>
          </div>
        </div>
      )}

      {status ? <p className="mb-3 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">{status}</p> : null}

      <div className="grid gap-3">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">名称 *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：纯牛奶"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">分类</span>
          <select
            value={categoryId}
            onChange={(e) => changeCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          >
            {CATEGORY_GROUPS.map((g) => (
              <optgroup key={g.id} label={g.label}>
                {entriesForGroup(g.id).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="mt-1 block text-xs text-stone-500">
            参考保质期：{shelf.days === null ? '无通用参考值，以包装日期为准' : `${shelf.days} 天（${shelf.note}）`}
            {paoDefault !== null ? ` 开封后参考 ${paoDefault} 个月，可在下方改。` : ''}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">{paoActive ? '包装到期日' : '保质期至 *'}</span>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">购买日期</span>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
        </div>
        {paoDefault !== null ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">开封日期（可选）</span>
              <input
                type="date"
                value={openedDate}
                onChange={(e) => setOpenedDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">开封后有效期（月）</span>
              <input
                type="number"
                min={1}
                max={36}
                value={paoMonthsText}
                onChange={(e) => setPaoMonthsText(e.target.value.replace(/[^\d]/g, ''))}
                placeholder={String(paoDefault)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </label>
          </div>
        ) : null}
        {paoActive && paoDate ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            开封后 {paoMonthsValue} 个月到期：{paoDate}
            {expiryDate !== '' ? (paoDate < expiryDate ? '，比包装日期早，保存时用这个。' : '，比包装日期晚，保存时仍用包装日期。') : '，没有包装日期，保存时就用这个日期。'}
          </p>
        ) : null}
        {suggested && suggested !== expiryDate ? (
          <button
            type="button"
            onClick={() => setExpiryDate(suggested)}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            按参考保质期推算：购买日 + {shelf.days} 天 = {suggested}，点一下填入
          </button>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">数量</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">备注</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：放冰箱上层"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!valid}
          className="rounded-lg bg-amber-600 px-4 py-2.5 font-semibold text-white disabled:opacity-40"
        >
          {editing ? '保存修改' : '保存'}
        </button>
      </div>
    </div>
  )
}
