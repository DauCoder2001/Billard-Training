/**
 * Der Baukasten: Speichern macht eine mitgelieferte Uebung zu deiner.
 *
 * Gewacht wird ueber die Befunde 47 und 51. Beide haengen an einer einzigen
 * Marke: builtIn. Wer eine mitgelieferte Uebung speichert, uebernimmt sie -
 * ab da geht die Aktualisierung der Sammlung daran vorbei (bootstrap.ts), und
 * ab da darf sie geloescht werden. Vorher nicht, denn die Stossseite bot das
 * nie an und die naechste Aktualisierung holte den Stoss ohnehin zurueck.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useApp } from '@/app/store'
import { db } from '@/data/db'
import { DEFAULT_SETTINGS } from '@/data/repositories/settings'
import { createShot } from '@/domain/shot'
import { DEFAULT_MARKINGS } from '@/domain/types'
import { frischeDatenbank, zeige } from '@/test/zeige'
import { BuilderPage } from './BuilderPage'
import { useBuilder } from './store'

const ORT = { pfad: '/builder/s1', muster: '/builder/:id' }

beforeEach(async () => {
  await frischeDatenbank()
  useApp.setState({ settings: { ...DEFAULT_SETTINGS }, ready: true, error: null })
})

describe('Baukasten an einem mitgelieferten Stoss', () => {
  it('bietet kein Loeschen an, Duplizieren aber schon', async () => {
    await db.shots.add({ ...createShot({ id: 's1', name: 'Bandenball' }), builtIn: true })

    zeige(<BuilderPage />, ORT)

    expect(await screen.findByRole('button', { name: 'Duplizieren' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Übung löschen' })).toBeNull()
  })

  it('uebernimmt ihn beim Speichern und gibt das Loeschen frei', async () => {
    await db.shots.add({ ...createShot({ id: 's1', name: 'Bandenball' }), builtIn: true })
    zeige(<BuilderPage />, ORT)
    await screen.findByRole('button', { name: 'Duplizieren' })

    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(await screen.findByRole('button', { name: 'Übung löschen' })).toBeTruthy()
    const gespeichert = await db.shots.get('s1')
    expect(gespeichert?.builtIn).toBe(false)
    expect(gespeichert?.name).toBe('Bandenball')
  })
})

describe('Hilfslinien und Raster', () => {
  const ebene = (name: string) => document.querySelector(`[data-ebene="${name}"]`)

  it('zeigt die Hilfslinien, die Hilfen zum Bauen aber erst auf Wunsch', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)
    await screen.findByRole('button', { name: 'Hilfslinien' })

    expect(ebene('hilfslinien')).toBeTruthy()
    expect(ebene('breakbox')).toBeNull()
    expect(ebene('dreieck')).toBeNull()
    expect(ebene('raster')).toBeNull()
  })

  it('zeichnet Anstossfeld und Dreieck, sobald die Einstellung es sagt', async () => {
    useApp.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        markings: { ...DEFAULT_MARKINGS, breakBox: true, rackOutline: true },
      },
    })
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)
    await screen.findByRole('button', { name: 'Hilfslinien' })

    expect(ebene('breakbox')).toBeTruthy()
    expect(ebene('dreieck')).toBeTruthy()
  })

  it('merkt sich, was in der Werkzeugleiste umgelegt wird', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Hilfslinien' }))
    await waitFor(() => expect(ebene('hilfslinien')).toBeNull())
    await userEvent.click(screen.getByRole('button', { name: 'Raster' }))
    await waitFor(() => expect(ebene('raster')).toBeTruthy())

    // Die Leiste schaltet dieselbe Einstellung wie die Einstellungsseite -
    // und die steht danach auch in der Datenbank.
    expect(useApp.getState().settings.markings.guides).toBe(false)
    expect(useApp.getState().settings.markings.grid).toBe(true)
    const gespeichert = await db.settings.get('settings')
    expect(gespeichert?.markings.guides).toBe(false)
    expect(gespeichert?.markings.grid).toBe(true)

    // Das Einrasten haengt an einer eigenen Einstellung und bleibt, wie es war.
    expect(useApp.getState().settings.snapToGrid).toBe(DEFAULT_SETTINGS.snapToGrid)
  })
})

describe('Aufbauen mit einem Griff', () => {
  const objektbaelle = () => useBuilder.getState().shot.balls.filter((b) => b.kind === 'object')

  it('stellt mit "Rack 8" das volle Dreieck auf und nimmt es wieder zurueck', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Rack 8' }))

    expect(objektbaelle()).toHaveLength(15)
    // Der Weisse bleibt stehen, der Aufbau ersetzt nur die Objektbaelle.
    expect(useBuilder.getState().shot.balls.filter((b) => b.kind === 'cue')).toHaveLength(1)

    await userEvent.click(screen.getByTitle('Rückgängig'))
    expect(objektbaelle()).toHaveLength(1)
  })

  it('stellt mit "Rack 9" neun Kugeln auf', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Rack 9' }))

    expect(objektbaelle()).toHaveLength(9)
  })

  it('verteilt die Objektbaelle mit "Mischen" neu, ohne sie zu vertauschen', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)
    await screen.findByRole('button', { name: 'Mischen' })
    const vorher = objektbaelle()[0]

    await userEvent.click(screen.getByRole('button', { name: 'Mischen' }))

    const nachher = objektbaelle()[0]
    expect(nachher.id).toBe(vorher.id)
    expect(nachher.number).toBe(vorher.number)
    expect(nachher.x !== vorher.x || nachher.y !== vorher.y).toBe(true)
  })

  it('sperrt "Mischen" sichtbar, solange es keine Objektbaelle gibt', async () => {
    const ohne = createShot({ id: 's1', name: 'Meine Übung' })
    await db.shots.add({ ...ohne, balls: ohne.balls.filter((b) => b.kind === 'cue') })
    zeige(<BuilderPage />, ORT)

    const knopf = (await screen.findByRole('button', { name: 'Mischen' })) as HTMLButtonElement
    expect(knopf.disabled).toBe(true)
    expect(knopf.title).toBe('Diese Übung hat keine Objektbälle')
  })
})

describe('Baukasten an einem eigenen Stoss', () => {
  it('loescht ihn nach Rueckfrage und fuehrt zurueck zu den Stoessen', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    const { adresse } = zeige(<BuilderPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Übung löschen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Löschen' }))

    expect(await db.shots.count()).toBe(0)
    expect(adresse()).toBe('/library')
  })

  it('laesst ihn stehen, wenn die Rueckfrage abgebrochen wird', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Übung löschen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Abbrechen' }))

    expect(await db.shots.count()).toBe(1)
  })
})

describe('Die Angaben unter dem Tischbild', () => {
  it('klappen zu und wieder auf, und der Knopf sagt jeweils, was er tut', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)

    // Offen beim Betreten: der Reiter "Bewertung" ist da, der Knopf bietet
    // das Ausblenden an.
    const zuKlappen = await screen.findByRole('button', { name: 'Angaben ausblenden ▾' })
    expect(screen.getByRole('button', { name: 'Bewertung' })).toBeTruthy()
    // aria-expanded sagt Vorleseprogrammen, ob der Bereich offen ist.
    expect(zuKlappen.getAttribute('aria-expanded')).toBe('true')

    await userEvent.click(zuKlappen)

    expect(screen.queryByRole('button', { name: 'Bewertung' })).toBeNull()
    const aufKlappen = screen.getByRole('button', { name: 'Angaben einblenden ▴' })
    expect(aufKlappen.getAttribute('aria-expanded')).toBe('false')

    await userEvent.click(aufKlappen)

    expect(screen.getByRole('button', { name: 'Bewertung' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Angaben ausblenden ▾' }).getAttribute('aria-expanded'),
    ).toBe('true')
  })
})

describe('Die Sperrzone im Baukasten', () => {
  it('zeigt Radius und Entfernen, sobald der Stoss eine hat', async () => {
    const basis = createShot({ id: 's1', name: 'Meine Übung' })
    await db.shots.add({
      ...basis,
      scoring: { ...basis.scoring, avoidZone: { x: 20, y: 20, r: 6 } },
    })
    zeige(<BuilderPage />, ORT)
    // Die Regeln stehen im Reiter "Bewertung" der Angaben.
    await userEvent.click(await screen.findByRole('button', { name: 'Bewertung' }))

    expect(screen.getByText(/Radius der Sperrzone 6.0 Zoll/)).toBeTruthy()
    expect(document.querySelector('[data-ebene="sperrzone"]')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Sperrzone entfernen' }))

    expect(document.querySelector('[data-ebene="sperrzone"]')).toBeNull()
    expect(useBuilder.getState().shot.scoring.avoidZone).toBeUndefined()
  })

  it('bietet das Werkzeug an und erklaert die Regel, solange keine da ist', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)

    expect(await screen.findByRole('button', { name: 'Sperrzone' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Bewertung' }))
    expect(screen.getByText(/kostet den ganzen Versuch/)).toBeTruthy()
    expect(document.querySelector('[data-ebene="sperrzone"]')).toBeNull()
  })
})

/**
 * Die Stufe im Baukasten.
 *
 * Sie ist absichtlich ohne Vorgabewert: eine geratene Stufe waere schlechter
 * als gar keine, denn die Stufe sagt etwas ueber das Thema der Uebung aus -
 * und das kennt nur, wer sie baut.
 */
describe('Die Stufe im Baukasten', () => {
  it('steht auf "Keine Stufe", solange keine gewaehlt ist', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)

    const feld = (await screen.findByLabelText('Stufe')) as HTMLSelectElement
    expect(feld.value).toBe('')
  })

  it('speichert die gewaehlte Stufe an der Uebung', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<BuilderPage />, ORT)

    await userEvent.selectOptions(await screen.findByLabelText('Stufe'), 'C')
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(async () => expect((await db.shots.get('s1'))?.level).toBe('C'))
  })

  it('nimmt die Stufe wieder weg, ohne ein leeres Feld zu hinterlassen', async () => {
    // Das Feld muss verschwinden, nicht leer dastehen: der Filter "Ohne
    // Stufe" fragt nach seinem Fehlen.
    await db.shots.add({ ...createShot({ id: 's1', name: 'Meine Übung' }), level: 'B' })
    zeige(<BuilderPage />, ORT)

    const feld = (await screen.findByLabelText('Stufe')) as HTMLSelectElement
    expect(feld.value).toBe('B')

    await userEvent.selectOptions(feld, '')
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(async () => expect((await db.shots.get('s1'))?.level).toBeUndefined())
  })
})
