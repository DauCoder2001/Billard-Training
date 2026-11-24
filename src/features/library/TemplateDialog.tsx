/**
 * Die eigene Fassung einer mitgelieferten Uebung neben der ueberarbeiteten
 * Vorlage.
 *
 * Zwei Bilder nebeneinander und eine Liste der betroffenen Bereiche - erst
 * danach die Entscheidung. Das Zuruecksetzen braucht deshalb keine zweite
 * Rueckfrage: wer hier steht, hat gesehen, was er aufgibt und was er
 * bekommt. Nur der Satz, was dabei verloren geht, steht ueber den Knoepfen.
 */

import { useApp } from '@/app/store'
import { ShotDiagram } from '@/components/table/ShotDiagram'
import { templateDifferences, type TemplateArea } from '@/domain/seedStamp'
import type { Shot } from '@/domain/types'
import { Modal } from '@/ui/Modal'

const AREA_LABELS: Record<TemplateArea, string> = {
  layout: 'Ballpositionen und Wege',
  name: 'Name',
  description: 'Beschreibung',
  coachNotes: 'Hinweis',
  attributes: 'Eigenschaften',
  scoring: 'Bewertung',
  tags: 'Schlagwörter',
}

interface TemplateDialogProps {
  shot: Shot
  template: Shot
  onReset: () => void
  onKeep: () => void
  onClose: () => void
}

export function TemplateDialog({ shot, template, onReset, onKeep, onClose }: TemplateDialogProps) {
  const settings = useApp((s) => s.settings)
  const unterschiede = templateDifferences(shot, template)

  const bild = (s: Shot) => (
    <ShotDiagram
      shot={s}
      orientation={settings.orientation}
      clothColor={settings.clothColor}
      railColor={settings.railColor}
    />
  )

  return (
    <Modal onClose={onClose} wide label="Überarbeitete Vorlage">
      <div className="modal__head">
        <h2>Überarbeitete Vorlage</h2>
      </div>
      <div className="modal__body stack">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="stack" style={{ flex: '1 1 260px' }}>
            <strong className="small">Deine Fassung</strong>
            {bild(shot)}
          </div>
          <div className="stack" style={{ flex: '1 1 260px' }}>
            <strong className="small">Überarbeitete Vorlage</strong>
            {bild(template)}
          </div>
        </div>

        {unterschiede.length > 0 ? (
          <div className="stack">
            <strong className="small">Das ist anders:</strong>
            <div className="row row--tight">
              {unterschiede.map((bereich) => (
                <span key={bereich} className="chip">
                  {AREA_LABELS[bereich]}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            Deine Fassung stimmt inzwischen mit der Vorlage überein. Es gibt nichts zu
            entscheiden – &bdquo;Meine Fassung behalten&ldquo; beendet den Hinweis.
          </p>
        )}

        <p className="small muted" style={{ margin: 0 }}>
          Beim Zurücksetzen gehen deine Änderungen an dieser Übung verloren. Favorit und
          Trainingshistorie bleiben.
        </p>
      </div>
      <div className="modal__foot">
        <button className="btn btn--danger" onClick={onReset}>
          Auf Vorlage zurücksetzen
        </button>
        <button className="btn" onClick={onKeep}>
          Meine Fassung behalten
        </button>
        <button className="btn btn--ghost" onClick={onClose}>
          Später entscheiden
        </button>
      </div>
    </Modal>
  )
}
