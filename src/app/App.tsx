import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DialogsProvider } from '@/ui/Dialogs'
import { AppShell } from './AppShell'
import { useApp } from './store'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LibraryPage } from '@/features/library/LibraryPage'
import { ShotDetailPage } from '@/features/library/ShotDetailPage'
import { SessionSummaryPage } from '@/features/training/SessionSummaryPage'
import { WorkoutsPage } from '@/features/workouts/WorkoutsPage'
import { StatsPage } from '@/features/stats/StatsPage'
import { AchievementsPage } from '@/features/achievements/AchievementsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

// Builder und Training sind die groessten Teile und werden selten als
// Erstes geoeffnet: sie kommen als eigene Buendel nach, damit der Start
// auf einem alten Geraet leichter wird. Der Service Worker legt sie im
// Vorrat ab, offline bleibt also alles verfuegbar.
const BuilderPage = lazy(() =>
  import('@/features/builder/BuilderPage').then((m) => ({ default: m.BuilderPage })),
)
const TrainPage = lazy(() =>
  import('@/features/training/TrainPage').then((m) => ({ default: m.TrainPage })),
)
const WorkoutRunPage = lazy(() =>
  import('@/features/workouts/WorkoutRunPage').then((m) => ({ default: m.WorkoutRunPage })),
)
// Die Importseite bringt den Entpacker fuer geteilte Links mit und wird nur
// ueber einen geteilten Link oder aus den Einstellungen geoeffnet.
const ImportPage = lazy(() =>
  import('@/features/share/ImportPage').then((m) => ({ default: m.ImportPage })),
)

export function App() {
  const ready = useApp((s) => s.ready)
  const error = useApp((s) => s.error)
  const load = useApp((s) => s.load)

  useEffect(() => {
    void load()
  }, [load])

  if (!ready) {
    return (
      <div className="page">
        <p className="muted">Daten werden geladen …</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <h1>Start fehlgeschlagen</h1>
        <p className="muted">{error}</p>
        <p className="small muted">
          Häufigste Ursache: der Browser lässt im privaten Modus keine lokale Datenbank zu.
        </p>
      </div>
    )
  }

  return (
    <DialogsProvider>
      <HashRouter>
        <Suspense
          fallback={
            <div className="page">
              <p className="muted">Wird geladen …</p>
            </div>
          }
        >
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/shot/:id" element={<ShotDetailPage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/session/:id" element={<SessionSummaryPage />} />
            </Route>
            {/* Builder und Training laufen ohne Rahmen, um Platz zu haben. */}
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/builder/:id" element={<BuilderPage />} />
            <Route path="/train/:id" element={<TrainPage />} />
            <Route path="/workout/:id/run" element={<WorkoutRunPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </DialogsProvider>
  )
}
