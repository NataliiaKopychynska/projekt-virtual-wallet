import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './HomePage.css'

const transactions = [
  { id: 1, label: 'Netflix', category: 'Rozrywka', amount: -54.99, date: '12 mar' },
  { id: 2, label: 'Przelew od Marka', category: 'Przychód', amount: +500.0, date: '11 mar' },
  { id: 3, label: 'Biedronka', category: 'Zakupy', amount: -87.43, date: '10 mar' },
  { id: 4, label: 'Spotify', category: 'Rozrywka', amount: -23.99, date: '9 mar' },
  { id: 5, label: 'Wynagrodzenie', category: 'Przychód', amount: +6200.0, date: '1 mar' },
]

const quickActions = [
  { icon: '↑', label: 'Wyślij' },
  { icon: '↓', label: 'Odbierz' },
  { icon: '⊕', label: 'Doładuj' },
  { icon: '⋯', label: 'Historia' },
]

const HomePage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as { flashMessage?: string } | null
  const fallbackFlashMessage = sessionStorage.getItem('vw_toast_message') || ''
  const [toastMessage, setToastMessage] = useState(routeState?.flashMessage ?? fallbackFlashMessage)

  useEffect(() => {
    if (!routeState?.flashMessage) return
    sessionStorage.removeItem('vw_toast_message')
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, navigate, routeState?.flashMessage])

  useEffect(() => {
    if (!routeState?.flashMessage && fallbackFlashMessage) {
      sessionStorage.removeItem('vw_toast_message')
    }
  }, [fallbackFlashMessage, routeState?.flashMessage])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(''), 3500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const balance = 8342.58

  return (
    <div className="home">
      {/* ── Sidebar nav ── */}
      <aside className="home__sidebar">
        <div className="home__brand">
          <span className="home__brand-icon">◈</span>
          <span className="home__brand-name">Virtual Wallet</span>
        </div>

        <nav className="home__nav">
          <a href="#" className="home__nav-item home__nav-item--active">
            <span>⊞</span> Pulpit
          </a>
          <a href="#" className="home__nav-item">
            <span>↔</span> Transakcje
          </a>
          <a href="#" className="home__nav-item">
            <span>◻</span> Karty
          </a>
          <a href="#" className="home__nav-item">
            <span>◑</span> Analityka
          </a>
          <a href="#" className="home__nav-item">
            <span>⚙</span> Ustawienia
          </a>
        </nav>

        <button className="home__logout-btn" onClick={handleLogout}>
          <span>⏻</span> Wyloguj
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="home__main">
        {toastMessage && (
          <div className="home__flash-message" role="status" aria-live="polite">
            <span>{toastMessage}</span>
            <button
              type="button"
              className="home__flash-close"
              onClick={() => setToastMessage('')}
              aria-label="OK"
            >
              OK
            </button>
          </div>
        )}

        {/* Top bar */}
        <header className="home__topbar">
          <div>
            <p className="home__greeting">Dzień dobry,</p>
            <h1 className="home__username">{user?.givenName ?? user?.name} 👋</h1>
          </div>
          <button className="home__avatar-btn" onClick={handleLogout} title="Wyloguj">
            {user?.picture
              ? <img src={user.picture} alt={user.name} className="home__avatar-img" referrerPolicy="no-referrer" />
              : <span className="home__avatar-fallback">{user?.name?.[0]}</span>
            }
          </button>
        </header>

        {/* Balance card */}
        <section className="home__balance-card">
          <div className="home__balance-card-inner">
            <p className="home__balance-label">Saldo główne</p>
            <p className="home__balance-amount">
              {balance.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </p>
            <p className="home__balance-sub">{user?.email}</p>
            <div className="home__balance-chip">VISA •••• 4821</div>
          </div>
          <div className="home__balance-deco" aria-hidden="true" />
        </section>

        {/* Quick actions */}
        <section className="home__section">
          <h2 className="home__section-title">Szybkie akcje</h2>
          <div className="home__actions">
            {quickActions.map((a) => (
              <button key={a.label} className="home__action-btn">
                <span className="home__action-icon">{a.icon}</span>
                <span className="home__action-label">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Transactions */}
        <section className="home__section">
          <h2 className="home__section-title">Ostatnie transakcje</h2>
          <ul className="home__transactions">
            {transactions.map((t) => (
              <li key={t.id} className="home__tx">
                <div className="home__tx-icon-wrap">
                  <span className="home__tx-icon">{t.amount > 0 ? '↓' : '↑'}</span>
                </div>
                <div className="home__tx-info">
                  <span className="home__tx-label">{t.label}</span>
                  <span className="home__tx-category">{t.category}</span>
                </div>
                <div className="home__tx-right">
                  <span className={`home__tx-amount ${t.amount > 0 ? 'home__tx-amount--positive' : 'home__tx-amount--negative'}`}>
                    {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                  </span>
                  <span className="home__tx-date">{t.date}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

export default HomePage
