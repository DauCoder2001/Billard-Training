/**
 * Das gewaehlte Werkzeug bleibt stehen (Befund 73).
 *
 * Wer eine Aufstellung baut, setzt mehrere Baelle hintereinander. Bis 0.13.6
 * sprang das Werkzeug nach jedem Ball zurueck auf "Auswahl", man musste also
 * zwischen jedem Ball einmal zusaetzlich tippen. Der Weisse ist die Ausnahme:
 * von ihm gibt es nur einen.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createShot } from '@/domain/shot'
import { useBuilder } from './store'

beforeEach(() => {
  useBuilder.getState().init(createShot({ balls: [], paths: [] }), true)
})

describe('Einen Ball setzen', () => {
  it('laesst das Werkzeug fuer den naechsten Objektball stehen', () => {
    const laden = useBuilder.getState()
    laden.setMode('addObject')

    laden.addBall('object', { x: 20, y: 20 })
    expect(useBuilder.getState().mode).toBe('addObject')

    useBuilder.getState().addBall('object', { x: 40, y: 20 })

    expect(useBuilder.getState().mode).toBe('addObject')
    expect(useBuilder.getState().shot.balls).toHaveLength(2)
  })

  it('gilt genauso fuer Stoerball und Geisterball', () => {
    for (const [werkzeug, art] of [
      ['addObstacle', 'obstacle'],
      ['addGhost', 'ghost'],
    ] as const) {
      useBuilder.getState().setMode(werkzeug)
      useBuilder.getState().addBall(art, { x: 30, y: 30 })

      expect(useBuilder.getState().mode).toBe(werkzeug)
    }
  })

  it('schaltet nach dem Weissen zurueck auf Auswahl', () => {
    useBuilder.getState().setMode('addCue')

    useBuilder.getState().addBall('cue', { x: 25, y: 25 })

    // Ein zweiter Weisser waere nicht erlaubt, und sein Knopf wird grau -
    // ein stehengebliebenes Werkzeug taete hier nichts mehr.
    expect(useBuilder.getState().mode).toBe('select')
  })

  it('waehlt den neu gesetzten Ball aus', () => {
    useBuilder.getState().setMode('addObject')

    useBuilder.getState().addBall('object', { x: 20, y: 20 })

    const { shot, selectedBallId } = useBuilder.getState()
    expect(selectedBallId).toBe(shot.balls[0].id)
  })
})
