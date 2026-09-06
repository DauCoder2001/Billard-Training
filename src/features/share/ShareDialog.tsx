/** Stoss weitergeben: Link, QR-Code, PNG oder JSON. */

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { ShotDiagram } from '@/components/table/ShotDiagram'
import { shareUrl } from '@/domain/share'
import type { Shot } from '@/domain/types'
import { useApp } from '@/app/store'
import { useDialogs } from '@/ui/Dialogs'
import { downloadText, safeFilename, svgToPngBlob, downloadBlob } from './exportImage'

export function ShareDialog({ shot, onClose }: { shot: Shot; onClose: () => void }) {
  const settings = useApp((s) => s.settings)
  const dialogs = useDialogs()
  const [qr, setQr] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [tooLong, setTooLong] = useState(false)
  const diagramRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const link = shareUrl(shot)
    setUrl(link)
    // Sehr grosse Stoesse passen nicht mehr in einen QR-Code.
    if (link.length > 2200) {
      setTooLong(true)
      setQr(null)
      return
    }
    setTooLong(false)
    QRCode.toDataURL(link, { margin: 1, width: 320, color: { dark: '#0d1512', light: '#f4f1e8' } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [shot])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      dialogs.toast('Link kopiert', 'ok')
    } catch {
      dialogs.toast('Kopieren nicht moeglich, Link bitte markieren', 'error')
    }
  }

  const savePng = async () => {
    const svg = diagramRef.current?.querySelector('svg')
    if (!svg) return
    try {
      const blob = await svgToPngBlob(svg as SVGSVGElement)
      downloadBlob(blob, `${safeFilename(shot.name)}.png`)
    } catch (err) {
      dialogs.toast(err instanceof Error ? err.message : 'PNG fehlgeschlagen', 'error')
    }
  }

  const saveJson = () => {
    downloadText(JSON.stringify(shot, null, 2), `${safeFilename(shot.name)}.json`)
  }

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--wide">
        <div className="modal__head">
          <h2>Stoss teilen</h2>
        </div>
        <div className="modal__body stack">
          <div ref={diagramRef}>
            <ShotDiagram shot={shot} clothColor={settings.clothColor} railColor={settings.railColor} />
          </div>

          <div className="row" style={{ alignItems: 'flex-start' }}>
            {qr && (
              <img
                src={qr}
                alt="QR-Code mit dem Stoss"
                width={168}
                height={168}
                style={{ borderRadius: 8 }}
              />
            )}
            <div className="stack" style={{ flex: '1 1 240px' }}>
              {tooLong ? (
                <p className="small muted">
                  Dieser Stoss ist zu umfangreich fuer einen QR-Code. Der Link funktioniert
                  trotzdem, ebenso der Export als Datei.
                </p>
              ) : (
                <p className="small muted">
                  Der Stoss steckt vollstaendig im Link. Wer ihn oeffnet, bekommt ihn zum
                  Uebernehmen angeboten &ndash; ohne Server, ohne Konto.
                </p>
              )}
              <textarea className="textarea" readOnly value={url} style={{ minHeight: 64, fontSize: 12 }} />
              <div className="row row--tight">
                <button className="btn btn--sm" onClick={() => void copy()}>
                  Link kopieren
                </button>
                <button className="btn btn--sm" onClick={() => void savePng()}>
                  Als PNG
                </button>
                <button className="btn btn--sm" onClick={saveJson}>
                  Als JSON
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal__foot">
          <button className="btn btn--primary" onClick={onClose}>
            Fertig
          </button>
        </div>
      </div>
    </div>
  )
}
