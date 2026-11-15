// ocr.ts - browser-only OCR wrapper around Tesseract.js.
// The heavy library is lazy-imported so the first page load stays light.
// Language data (chi_sim + eng) downloads from a CDN on first use, about
// 10 MB, and is then cached by the browser. Needs network on first use.
// Not unit tested: it needs a browser, a camera image and the CDN.

/**
 * Recognize text in an image (File/Blob or data URL).
 * onProgress receives 0..1 while the worker runs.
 */
export async function recognizeDateText(image: Blob | string, onProgress?: (p: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(['chi_sim', 'eng'], 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(m.progress)
    },
  })
  try {
    const { data } = await worker.recognize(image)
    return data.text
  } finally {
    await worker.terminate()
  }
}
