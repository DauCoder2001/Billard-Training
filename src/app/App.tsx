import { lazy, Suspense, useEffect } from 'react'
import { createHashRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
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

/** Wartet auf die nachgeladenen Buendel; liegt ueber allen Seiten. */
function Laderahmen() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <p className="muted">Wird geladen …</p>
        </div>
      }
    >
      <Outlet />
    </Suspense>
  )
}

// Ein Daten-Router, kein <HashRouter>: nur er kennt useBlocker, und nur
// damit laeuft die Zurueck-Taste in die Rueckfrage der Seite, statt still
// an ihr vorbei. Die Adressen bleiben dieselben.
const router = createHashRouter([
  {
    element: <Laderahmen />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'library', element: <LibraryPage /> },
          { path: 'shot/:id', element: <ShotDetailPage /> },
          { path: 'workouts', element: <WorkoutsPage /> },
          { path: 'stats', element: <StatsPage /> },
          { path: 'achievements', element: <AchievementsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'import', element: <ImportPage /> },
          { path: 'session/:id', element: <SessionSummaryPage /> },
        ],
      },
      // Builder und Training laufen ohne Rahmen, um Platz zu haben.
      { path: 'builder', element: <BuilderPage /> },
      { path: 'builder/:id', element: <BuilderPage /> },
      { path: 'train/:id', element: <TrainPage /> },
      { path: 'workout/:id/run', element: <WorkoutRunPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

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
      <RouterProvider router={router} />
    </DialogsProvider>
  )
}
