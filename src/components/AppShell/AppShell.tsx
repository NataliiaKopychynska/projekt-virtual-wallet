import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './AppShell.css'

interface AppShellProps {
  title: string
  subtitle: string
  children: ReactNode
}

const AppShell = ({ title, subtitle, children }: AppShellProps) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">
          <span className="app-shell__brand-icon">◈</span>
          <span className="app-shell__brand-name">Virtual Wallet</span>
        </div>

        <nav className="app-shell__nav" aria-label="Główna nawigacja">
          <NavLink
            to="/home/dashboard"
            className={({ isActive }) =>
              `app-shell__nav-item${isActive ? ' app-shell__nav-item--active' : ''}`
            }
          >
            <span>⊞</span> Pulpit
          </NavLink>
          <NavLink
            to="/home/transactions"
            className={({ isActive }) =>
              `app-shell__nav-item${isActive ? ' app-shell__nav-item--active' : ''}`
            }
          >
            <span>↔</span> Transakcje
          </NavLink>
          <NavLink
            to="/home/analytics"
            className={({ isActive }) =>
              `app-shell__nav-item${isActive ? ' app-shell__nav-item--active' : ''}`
            }
          >
            <span>◑</span> Analityka
          </NavLink>
          <span className="app-shell__nav-item app-shell__nav-item--disabled">
            <span>⚙</span> Ustawienia
          </span>
        </nav>

        <button className="app-shell__logout-btn" onClick={handleLogout}>
          <span>⏻</span> Wyloguj
        </button>
      </aside>

      <main className="app-shell__main">
        <header className="app-shell__topbar">
          <div>
            <p className="app-shell__greeting">Dzień dobry,</p>
            <h1 className="app-shell__title">{user?.givenName ?? user?.username} 👋</h1>
            <p className="app-shell__subtitle">{subtitle}</p>
          </div>
          <div className="app-shell__topbar-right">
            <div className="app-shell__context">
              <span className="app-shell__context-label">{title}</span>
              <span className="app-shell__context-value">{user?.email}</span>
            </div>
            <button className="app-shell__avatar-btn" onClick={handleLogout} title="Wyloguj">
              {user?.avatarURL ? (
                <img
                  src={user.avatarURL}
                  alt={user.username}
                  className="app-shell__avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="app-shell__avatar-fallback">{user?.username?.[0]}</span>
              )}
            </button>
          </div>
        </header>

        <nav className="app-shell__mobile-nav" aria-label="Mobilna nawigacja">
          <NavLink
            to="/home/dashboard"
            className={({ isActive }) =>
              `app-shell__mobile-nav-item${isActive ? ' app-shell__mobile-nav-item--active' : ''}`
            }
          >
            Pulpit
          </NavLink>
          <NavLink
            to="/home/transactions"
            className={({ isActive }) =>
              `app-shell__mobile-nav-item${isActive ? ' app-shell__mobile-nav-item--active' : ''}`
            }
          >
            Transakcje
          </NavLink>
          <NavLink
            to="/home/analytics"
            className={({ isActive }) =>
              `app-shell__mobile-nav-item${isActive ? ' app-shell__mobile-nav-item--active' : ''}`
            }
          >
            Analityka
          </NavLink>
        </nav>

        {children}
      </main>
    </div>
  )
}

export default AppShell
