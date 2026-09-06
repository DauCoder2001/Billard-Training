import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DialogsProvider } from '@/ui/Dialogs'
import { AppShell } from './AppShell'
import { useApp } from './store'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LibraryPage } from '@/features/library/LibraryPage'
import { BuilderPage } from '@/features/builder/BuilderPage'
import { ShotDetailPage } from '@/features/library/ShotDetailPage'
import { TrainPage } from '@/features/training/TrainPage'
import { SessionSummaryPage } from '@/features/training/SessionSummaryPage'
import { WorkoutsPage } from '@/features/workouts/WorkoutsPage'
import { WorkoutRunPage } from '@/features/workouts/WorkoutRunPage'
import { StatsPage } from '@/features/stats/StatsPage'
import { AchievementsPage } from '@/features/achievements/AchievementsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { ImportPage } from '@/features/share/ImportPage'

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
          Haeufigste Ursache: der Browser laesst im privaten Modus keine lokale Datenbank zu.
        </p>
      </div>
    )
  }

  return (
    <DialogsProvider>
      <HashRouter>
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
          </Route>
          {/* Builder und Training laufen ohne Rahmen, um Platz zu haben. */}
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/builder/:id" element={<BuilderPage />} />
          <Route path="/train/:id" element={<TrainPage />} />
          <Route path="/session/:id" element={<SessionSummaryPage />} />
          <Route path="/workout/:id/run" element={<WorkoutRunPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </DialogsProvider>
  )
}
