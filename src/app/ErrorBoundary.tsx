/** Faengt Fehler beim Rendern ab.
 *
 *  Ohne diese Grenze reisst React bei einem Fehler den gesamten Baum ab und
 *  hinterlaesst eine weisse Seite. Auf einem Tablet ohne Entwicklerkonsole
 *  waere dann nicht zu erkennen, was passiert ist.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Fehler beim Rendern:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="page stack">
        <h1>Da ist etwas schiefgegangen</h1>
        <p className="muted">
          Die Ansicht liess sich nicht darstellen. Deine gespeicherten Stoesse und
          Ergebnisse sind davon nicht betroffen.
        </p>
        <pre
          className="small"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            padding: 12,
            margin: 0,
          }}
        >
          {error.message}
          {'\n\n'}
          {navigator.userAgent}
        </pre>
        <div className="row">
          <button className="btn btn--primary" onClick={() => window.location.reload()}>
            Neu laden
          </button>
          <button
            className="btn"
            onClick={() => {
              window.location.hash = '#/'
              window.location.reload()
            }}
          >
            Zur Startseite
          </button>
        </div>
      </div>
    )
  }
}
