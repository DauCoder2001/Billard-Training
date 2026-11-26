/**
 * Wohin der Fokus geht, wenn ein Dialog schliesst.
 *
 * Fuer wen mit der Tastatur arbeitet, ist das keine Kleinigkeit: landet der
 * Fokus auf dem Seitenkoerper, beginnt der Weg wieder ganz vorn und fuehrt
 * durch die gesamte Seite. Geprueft wird deshalb beides - der Regelfall
 * (zurueck zum Ausloeser) und der Fall, dass es den Ausloeser nicht mehr
 * gibt.
 */

import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

/**
 * Eine Seite mit Ueberschrift, einem Ausloeser und einem Dialog.
 *
 * "Ausloeser entfernen" steht fuer alles, was einen Knopf verschwinden
 * laesst, waehrend der Dialog offen ist - etwa Daten, die nachkommen.
 */
function Seite({ mitUeberschrift = true }: { mitUeberschrift?: boolean }) {
  const [offen, setOffen] = useState(false)
  const [weg, setWeg] = useState(false)
  return (
    <main>
      {mitUeberschrift && <h1>Übungsseite</h1>}
      {!weg && <button onClick={() => setOffen(true)}>Öffnen</button>}
      <button onClick={() => setWeg(true)}>Auslöser entfernen</button>
      {offen && (
        <Modal onClose={() => setOffen(false)} label="Probe">
          <button onClick={() => setOffen(false)}>Schließen</button>
        </Modal>
      )}
    </main>
  )
}

describe('Modal: Fokus beim Schliessen', () => {
  it('gibt den Fokus an den Ausloeser zurueck', async () => {
    render(<Seite />)
    const ausloeser = screen.getByRole('button', { name: 'Öffnen' })

    await userEvent.click(ausloeser)
    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }))

    expect(document.activeElement).toBe(ausloeser)
  })

  it('nimmt die Ueberschrift, wenn es den Ausloeser nicht mehr gibt', async () => {
    render(<Seite />)

    await userEvent.click(screen.getByRole('button', { name: 'Öffnen' }))
    await userEvent.click(screen.getByRole('button', { name: 'Auslöser entfernen' }))
    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }))

    const ueberschrift = screen.getByRole('heading', { name: 'Übungsseite' })
    expect(document.activeElement).toBe(ueberschrift)
    // Anspringbar ja, in der Tab-Reihenfolge nein.
    expect(ueberschrift.getAttribute('tabindex')).toBe('-1')
  })

  it('kommt auch ohne Ueberschrift zurecht', async () => {
    render(<Seite mitUeberschrift={false} />)

    await userEvent.click(screen.getByRole('button', { name: 'Öffnen' }))
    await userEvent.click(screen.getByRole('button', { name: 'Auslöser entfernen' }))
    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }))

    expect(screen.queryByRole('dialog', { name: 'Probe' })).toBeNull()
  })
})
