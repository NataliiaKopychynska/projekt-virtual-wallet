import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../features/i18n/useTranslation'
import type { TranslationKey } from '../../features/i18n/translations'
import './AppShell.css'

interface AppShellProps {
  title: string
  subtitle: string
  children: ReactNode
}

const SIDEBAR_STORAGE_KEY = 'vw_app_shell_sidebar_collapsed'

const navItems: Array<{ to: string; icon: string; labelKey: TranslationKey }> = [
  { to: '/home/dashboard', icon: '⊞', labelKey: 'nav.dashboard' },
  { to: '/home/transactions', icon: '↔', labelKey: 'nav.transactions' },
  { to: '/home/analytics', icon: '◑', labelKey: 'nav.analytics' },
  { to: '/home/settings', icon: '⚙', labelKey: 'nav.settings' },
]

const loadSidebarCollapsedState = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
}

const AppShell = ({ title, subtitle, children }: AppShellProps) => {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(loadSidebarCollapsedState)

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((current) => !current)
  }

  const handleOpenSettings = () => {
    navigate('/home/settings')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside
        className={`app-shell__sidebar${isSidebarCollapsed ? ' app-shell__sidebar--collapsed' : ''}`}
        data-testid="app-shell-sidebar"
      >
        <div className="app-shell__brand">
          <div className="app-shell__brand-lockup">
            <span className="app-shell__brand-icon">◈</span>
            <span className="app-shell__brand-name">Virtual Wallet</span>
          </div>
        </div>
        <button
          type="button"
          className="app-shell__sidebar-toggle"
          onClick={handleToggleSidebar}
          aria-label={isSidebarCollapsed ? t('appShell.expandSidebar') : t('appShell.collapseSidebar')}
          title={isSidebarCollapsed ? t('appShell.expandSidebar') : t('appShell.collapseSidebar')}
          data-testid="app-shell-sidebar-toggle"
        >
          <span aria-hidden="true">{isSidebarCollapsed ? '›' : '‹'}</span>
        </button>

        <nav className="app-shell__nav" aria-label={t('appShell.mainNav')}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `app-shell__nav-item${isActive ? ' app-shell__nav-item--active' : ''}`
              }
              title={t(item.labelKey)}
            >
              <span className="app-shell__nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="app-shell__nav-label">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className="app-shell__logout-btn"
          onClick={handleLogout}
          title={t('common.logout')}
          data-testid="app-shell-logout-button"
        >
          <span className="app-shell__nav-icon" aria-hidden="true">
            ⏻
          </span>
          <span className="app-shell__nav-label">{t('common.logout')}</span>
        </button>
      </aside>

      <main className="app-shell__main">
        <header className="app-shell__topbar">
          <div>
            <p className="app-shell__greeting">{t('appShell.greeting')}</p>
            <h1 className="app-shell__title">{user?.givenName ?? user?.username} 👋</h1>
            <p className="app-shell__subtitle">{subtitle}</p>
          </div>
          <div className="app-shell__topbar-right">
            <div className="app-shell__context">
              <span className="app-shell__context-label">{title}</span>
              <span className="app-shell__context-value">{user?.email}</span>
            </div>
            <button
              className="app-shell__avatar-btn"
              onClick={handleOpenSettings}
              title={t('appShell.goToSettings')}
            >
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

        <nav className="app-shell__mobile-nav" aria-label={t('appShell.mobileNav')}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `app-shell__mobile-nav-item${isActive ? ' app-shell__mobile-nav-item--active' : ''}`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {children}
      </main>
    </div>
  )
}

export default AppShell
