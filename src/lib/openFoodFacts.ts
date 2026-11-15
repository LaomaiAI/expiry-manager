// openFoodFacts.ts - barcode -> product name via the OpenFoodFacts public API.
// No API key, no account. Pure URL building + response parsing is unit
// tested; the fetch itself is a thin wrapper with a timeout.

export function productUrl(barcode: string): string {
  return `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
}

export interface ProductInfo {
  barcode: string
  /** Product name, or null when the barcode is unknown to OpenFoodFacts */
  name: string | null
  brands: string | null
}

/** Parse an OpenFoodFacts API response. Never throws on odd shapes. */
export function parseProductResponse(json: unknown, barcode: string): ProductInfo {
  const empty: ProductInfo = { barcode, name: null, brands: null }
  if (typeof json !== 'object' || json === null) return empty
  const root = json as Record<string, unknown>
  if (root.status !== 1 || typeof root.product !== 'object' || root.product === null) return empty
  const product = root.product as Record<string, unknown>
  const name =
    typeof product.product_name === 'string' && product.product_name.trim() !== ''
      ? product.product_name.trim()
      : typeof product.product_name_zh === 'string' && product.product_name_zh.trim() !== ''
        ? product.product_name_zh.trim()
        : null
  const brands = typeof product.brands === 'string' && product.brands.trim() !== '' ? product.brands.trim() : null
  return { barcode, name, brands }
}

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

/**
 * Look up a barcode. Returns name null when the product is unknown, the
 * network fails, or the request times out. Never throws.
 */
export async function lookupProduct(barcode: string, fetchFn: FetchFn = fetch, timeoutMs = 8000): Promise<ProductInfo> {
  const empty: ProductInfo = { barcode, name: null, brands: null }
  const clean = barcode.trim()
  if (clean === '') return empty
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchFn(productUrl(clean), { signal: controller.signal })
    if (!res.ok) return empty
    const json: unknown = await res.json()
    return parseProductResponse(json, clean)
  } catch {
    return empty
  } finally {
    clearTimeout(timer)
  }
}
