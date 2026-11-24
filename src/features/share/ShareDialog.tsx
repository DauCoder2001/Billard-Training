/** Stoss weitergeben: Link, QR-Code, PNG oder JSON. */

import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { ShotDiagram } from '@/components/table/ShotDiagram'
import { shareUrl, shotFileText } from '@/domain/share'
import type { Shot } from '@/domain/types'
import { useApp } from '@/app/store'
import { useDialogs } from '@/ui/Dialogs'
import { Modal } from '@/ui/Modal'
import { downloadText, safeFilename, svgToPngBlob, downloadBlob } from './exportImage'

/** Mehr Zeichen nimmt ein QR-Code in dieser Groesse nicht auf. */
const QR_MAX = 2200

export function ShareDialog({ shot, onClose }: { shot: Shot; onClose: () => void }) {
  const settings = useApp((s) => s.settings)
  const dialogs = useDialogs()
  const [qr, setQr] = useState<string | null>(null)
  const diagramRef = useRef<HTMLDivElement>(null)

  // Link und Laenge folgen aus dem Stoss. Nur der QR-Code entsteht
  // asynchron - er allein bleibt Zustand und braucht den Effekt.
  const url = useMemo(() => shareUrl(shot), [shot])
  const tooLong = url.length > QR_MAX

  useEffect(() => {
    if (tooLong) return
    let verworfen = false
    QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: '#0d1512', light: '#f4f1e8' } })
      .then((bild) => {
        if (!verworfen) setQr(bild)
      })
      .catch(() => {
        if (!verworfen) setQr(null)
      })
    // Ein spaet eintreffender Code gehoert sonst zum vorigen Link.
    return () => {
      verworfen = true
    }
  }, [url, tooLong])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      dialogs.toast('Link kopiert', 'ok')
    } catch {
      dialogs.toast('Kopieren nicht möglich, Link bitte markieren', 'error')
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
    downloadText(shotFileText(shot), `${safeFilename(shot.name)}.json`)
  }

  return (
    <Modal onClose={onClose} wide label="Stoß teilen">
      <div className="modal__head">
        <h2>Stoß teilen</h2>
      </div>
      <div className="modal__body stack">
        <div ref={diagramRef}>
          <ShotDiagram
            shot={shot}
            orientation={settings.orientation}
            clothColor={settings.clothColor}
            railColor={settings.railColor}
          />
        </div>

        <div className="row" style={{ alignItems: 'flex-start' }}>
          {qr && (
            <img
              src={qr}
              alt="QR-Code mit dem Stoß"
              width={168}
              height={168}
              style={{ borderRadius: 8 }}
            />
          )}
          <div className="stack" style={{ flex: '1 1 240px' }}>
            {tooLong ? (
              <p className="small muted">
                Dieser Stoß ist zu umfangreich für einen QR-Code. Der Link funktioniert
                trotzdem, ebenso der Export als Datei.
              </p>
            ) : (
              <p className="small muted">
                Der Stoß steckt vollständig im Link. Wer ihn öffnet, bekommt ihn zum
                Übernehmen angeboten &ndash; ohne Server, ohne Konto.
              </p>
            )}
            <textarea className="textarea" readOnly value={url} style={{ minHeight: 64, fontSize: 12 }} />
            <div className="row row--tight">
              <button className="btn btn--sm" onClick={() => void copy()}>
                Link kopieren
              </button>
              <button className="btn btn--sm" onClick={() => void savePng()}>
                Als Bild
              </button>
              <button className="btn btn--sm" onClick={saveJson}>
                Als Datei
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal__foot">
        <button className="btn" onClick={onClose}>
          Fertig
        </button>
      </div>
    </Modal>
  )
}
