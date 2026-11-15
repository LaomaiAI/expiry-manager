// barcode.ts - browser-only barcode scanning wrapper around @zxing/browser.
// Lazy-imported so the first page load stays light. Needs camera permission
// (getUserMedia) for live scanning; still-image decoding works from a file.
// Not unit tested: it needs a camera or a real barcode image.

import type { IScannerControls } from '@zxing/browser'

/**
 * Scan barcodes from the device camera into a <video> element.
 * Calls onResult for every decoded code. Returns a stop function that
 * releases the camera. The caller owns the <video> element.
 */
export async function scanBarcodeFromVideo(
  video: HTMLVideoElement,
  onResult: (code: string) => void,
): Promise<() => void> {
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  const reader = new BrowserMultiFormatReader()
  let controls: IScannerControls | undefined
  try {
    controls = await reader.decodeFromVideoDevice(undefined, video, (result, err) => {
      if (result) onResult(result.getText())
      // NotFoundException while scanning is normal; ignore all errors here.
      void err
    })
  } catch {
    // Camera unavailable or permission denied: fall back to still images.
    throw new Error('无法打开摄像头，请检查权限或改用拍照上传')
  }
  return () => {
    try {
      controls?.stop()
    } catch {
      // ignore
    }
  }
}

/** Decode a barcode from a still image file (photo upload fallback). */
export async function decodeBarcodeFromImage(file: Blob): Promise<string | null> {
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  const url = URL.createObjectURL(file)
  try {
    const reader = new BrowserMultiFormatReader()
    const result = await reader.decodeFromImageUrl(url)
    return result.getText()
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}
