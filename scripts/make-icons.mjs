/**
 * Erzeugt die App-Icons fuer das PWA-Manifest.
 *
 * Bewusst ohne Bildbibliothek: das Motiv besteht aus konzentrischen Kreisen,
 * die sich Pixel fuer Pixel berechnen lassen. zlib und ein kleiner
 * PNG-Schreiber reichen dafuer aus.
 *
 * Aufruf: node scripts/make-icons.mjs
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [13, 21, 18]
const GOLD = [232, 181, 48]

/** Kreisringe des Motivs: Radius und Strichstaerke, relativ zur Kantenlaenge. */
const RINGS = [
  { r: 0.33, w: 0.05, alpha: 1 },
  { r: 0.19, w: 0.05, alpha: 0.65 },
]
const DOT_R = 0.066

function mix(base, color, alpha) {
  return [
    Math.round(base[0] + (color[0] - base[0]) * alpha),
    Math.round(base[1] + (color[1] - base[1]) * alpha),
    Math.round(base[2] + (color[2] - base[2]) * alpha),
  ]
}

/** Deckung eines Pixels, mit weichem Rand ueber eine halbe Pixelbreite. */
function coverage(distance, target, halfWidth, pixel) {
  const edge = Math.abs(distance - target)
  return 1 - smoothstep(halfWidth - pixel, halfWidth + pixel, edge)
}

function smoothstep(a, b, x) {
  if (b <= a) return x < a ? 0 : 1
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function renderIcon(size) {
  const pixel = 1 / size
  // Eine Zeile ist ein Filterbyte plus RGB je Pixel.
  const raw = Buffer.alloc(size * (1 + size * 3))
  let offset = 0

  for (let y = 0; y < size; y++) {
    raw[offset++] = 0 // Filtertyp "none"
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5
      const dy = (y + 0.5) / size - 0.5
      const d = Math.hypot(dx, dy)

      let color = BG
      for (const ring of RINGS) {
        const a = coverage(d, ring.r, ring.w / 2, pixel) * ring.alpha
        if (a > 0) color = mix(color, GOLD, a)
      }
      const dot = 1 - smoothstep(DOT_R - pixel, DOT_R + pixel, d)
      if (dot > 0) color = mix(color, GOLD, dot)

      raw[offset++] = color[0]
      raw[offset++] = color[1]
      raw[offset++] = color[2]
    }
  }
  return raw
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let c = -1
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function toPng(size, raw) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // Bittiefe
  header[9] = 2 // Farbtyp: Truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT_DIR, { recursive: true })
for (const size of [192, 512]) {
  const file = join(OUT_DIR, `icon-${size}.png`)
  writeFileSync(file, toPng(size, renderIcon(size)))
  console.log(`geschrieben: ${file}`)
}
