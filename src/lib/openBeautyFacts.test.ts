import { describe, expect, it, vi } from 'vitest'
import { lookupProduct, parseProductResponse, productUrl } from './openBeautyFacts'

describe('productUrl', () => {
  it('builds the OpenBeautyFacts API URL', () => {
    expect(productUrl('4005900000000')).toBe('https://world.openbeautyfacts.org/api/v0/product/4005900000000.json')
  })
})

describe('parseProductResponse', () => {
  it('parses a found product', () => {
    const info = parseProductResponse(
      { status: 1, product: { product_name: '洗发水', brands: '某品牌' } },
      '4005900000000',
    )
    expect(info).toEqual({ barcode: '4005900000000', name: '洗发水', brands: '某品牌' })
  })
  it('returns nulls for unknown barcodes and odd shapes', () => {
    expect(parseProductResponse({ status: 0 }, '1')).toEqual({ barcode: '1', name: null, brands: null })
    expect(parseProductResponse(null, '1')).toEqual({ barcode: '1', name: null, brands: null })
    expect(parseProductResponse({ status: 1, product: {} }, '1').name).toBeNull()
  })
})

describe('lookupProduct', () => {
  it('returns the product on success', async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: 1, product: { product_name: '面霜', brands: '' } }),
    }) as unknown as Response)
    const info = await lookupProduct('123', fetchFn)
    expect(info.name).toBe('面霜')
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('openbeautyfacts.org'), expect.anything())
  })
  it('returns nulls on HTTP errors and network failures', async () => {
    const httpFail = vi.fn(async () => ({ ok: false, json: async () => ({}) }) as unknown as Response)
    expect((await lookupProduct('123', httpFail)).name).toBeNull()
    const netFail = vi.fn(async () => {
      throw new Error('offline')
    })
    expect((await lookupProduct('123', netFail)).name).toBeNull()
  })
})
