/**
 * Die Fehleranzeige - eine Anzeige, zwei Wege dorthin.
 *
 * Fehler beim Zeichnen kommen ueber die ErrorBoundary. Fehler *in einer
 * Seite* faengt aber der Router vorher ab und zeigt sonst seine eigene
 * englische Entwickleransicht (Befund 72); deshalb bekommt er mit
 * <RouteError /> dieselbe Anzeige als errorElement.
 */

import { useRouteError } from 'react-router-dom'

/** Macht aus allem, was geworfen werden kann, eine lesbare Zeile. */
function meldung(fehler: unknown): string {
  if (fehler instanceof Error) return fehler.message
  if (typeof fehler === 'string') return fehler
  try {
    return JSON.stringify(fehler)
  } catch {
    return String(fehler)
  }
}

export function ErrorView({ error }: { error: unknown }) {
  return (
    <div className="page stack">
      <h1>Da ist etwas schiefgegangen</h1>
      <p className="muted">
        Die Ansicht ließ sich nicht darstellen. Deine gespeicherten Stöße und Ergebnisse sind davon
        nicht betroffen.
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
        {meldung(error)}
        {'\n\n'}
        {`Billard Training ${__APP_VERSION__}`}
        {'\n'}
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
          Zum Start
        </button>
      </div>
    </div>
  )
}

/** Dasselbe Bild, aber fuer Fehler, die der Router abfaengt. */
export function RouteError() {
  return <ErrorView error={useRouteError()} />
}
