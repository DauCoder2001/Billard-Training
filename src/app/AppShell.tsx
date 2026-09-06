import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', icon: '◎', label: 'Start', end: true },
  { to: '/library', icon: '▦', label: 'Stoesse' },
  { to: '/workouts', icon: '≡', label: 'Workouts' },
  { to: '/stats', icon: '↗', label: 'Statistik' },
  { to: '/achievements', icon: '★', label: 'Erfolge' },
  { to: '/settings', icon: '⚙', label: 'Einstellungen' },
]

export function AppShell() {
  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="sidebar__brand">
          <span aria-hidden>{'●'}</span>
          Billard Training
        </div>
        <div className="sidebar__nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `navlink${isActive ? ' is-active' : ''}`}
            >
              <span className="navlink__icon" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
