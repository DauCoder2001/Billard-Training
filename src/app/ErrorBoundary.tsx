/** Faengt Fehler beim Rendern ab.
 *
 *  Ohne diese Grenze reisst React bei einem Fehler den gesamten Baum ab und
 *  hinterlaesst eine weisse Seite. Auf einem Tablet ohne Entwicklerkonsole
 *  waere dann nicht zu erkennen, was passiert ist.
 *
 *  Die Anzeige selbst steht in ErrorView.tsx - der Router braucht dieselbe
 *  (siehe RouteError).
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorView } from './ErrorView'

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

    return <ErrorView error={error} />
  }
}
