/** Diagramm als PNG-Datei sichern. */

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Erst nach dem Klick freigeben, sonst bricht der Download ab.
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadText(text: string, filename: string, type = 'application/json'): void {
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename)
}

/** Dateinamen aus einem Stossnamen bilden. */
export function safeFilename(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-zA-Z0-9 _-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase() || 'stoss'
  )
}

/**
 * Rechnet ein SVG-Element in ein PNG um. Das SVG wird dafuer serialisiert und
 * ueber ein Bild auf ein Canvas gezeichnet.
 */
export async function svgToPngBlob(svg: SVGSVGElement, width = 1600): Promise<Blob> {
  const viewBox = svg.viewBox.baseVal
  const ratio = viewBox.height / viewBox.width || 0.5
  const height = Math.round(width * ratio)

  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  const source = new XMLSerializer().serializeToString(clone)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Das Diagramm liess sich nicht umwandeln.'))
    img.src = url
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas nicht verfuegbar.')
  ctx.drawImage(image, 0, 0, width, height)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG fehlgeschlagen.'))), 'image/png')
  })
}
