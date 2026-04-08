import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  createTransaction,
  deleteTransaction,
  subscribeToTransactions,
  updateTransaction,
  type Transaction,
  type TransactionType,
} from '../../services/transactionsService'
import './HomePage.css'

const quickActions = [
  { icon: '↑', label: 'Wyślij' },
  { icon: '↓', label: 'Odbierz' },
]

const expenseCategories = [
  'Zakupy',
  'Dom',
  'Transport',
  'Zdrowie',
  'Rozrywka',
  'Jedzenie',
  'Restauracje',
  'Edukacja',
  'Ubrania',
  'Subskrypcje',
  'Podróże',
  'Dzieci',
  'Zwierzęta',
  'Prezenty',
  'Opłaty bankowe',
  'Inne',
]
const incomeCategories = ['Wynagrodzenie', 'Premia', 'Zwrot', 'Sprzedaż', 'Inne']

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatAmount = (amount: number, type: TransactionType) => {
  const value = amount / 100
  const sign = type === 'income' ? '+' : '-'
  return `${sign}${value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}`
}

interface TransactionFormState {
  type: TransactionType
  amount: string
  category: string
  comment: string
  transactionDate: string
}

const getInitialFormState = (): TransactionFormState => ({
  type: 'expense',
  amount: '',
  category: expenseCategories[0],
  comment: '',
  transactionDate: toDateInputValue(new Date()),
})

const HomePage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as { flashMessage?: string } | null
  const fallbackFlashMessage = sessionStorage.getItem('vw_toast_message') || ''
  const [toastMessage, setToastMessage] = useState(routeState?.flashMessage ?? fallbackFlashMessage)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true)
  const [formState, setFormState] = useState<TransactionFormState>(getInitialFormState())
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  useEffect(() => {
    if (!user?.id) return

    setIsTransactionsLoading(true)
    const unsubscribe = subscribeToTransactions(
      user.id,
      (items) => {
        setTransactions(items)
        setIsTransactionsLoading(false)
      },
      (error) => {
        console.error('Transactions subscription failed:', error)
        setToastMessage('Nie udało się pobrać transakcji.')
        setIsTransactionsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user?.id])

  const categories = formState.type === 'income' ? incomeCategories : expenseCategories

  useEffect(() => {
    if (!categories.includes(formState.category)) {
      setFormState((prev) => ({ ...prev, category: categories[0] }))
    }
  }, [categories, formState.category])

  const balance = useMemo(() => {
    const totalCents = transactions.reduce((sum, tx) => {
      return tx.type === 'income' ? sum + tx.amount : sum - tx.amount
    }, 0)
    return totalCents / 100
  }, [transactions])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const resetForm = () => {
    setFormState(getInitialFormState())
    setFormError('')
    setEditingId(null)
  }

  const validateForm = () => {
    const parsedAmount = Number(formState.amount.replace(',', '.'))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return 'Podaj poprawną kwotę większą od zera.'
    }

    if (!formState.transactionDate) {
      return 'Wybierz datę transakcji.'
    }

    if (!formState.category.trim()) {
      return 'Wybierz kategorię.'
    }

    if (formState.comment.length > 100) {
      return 'Komentarz może mieć maksymalnie 100 znaków.'
    }

    return ''
  }

  const buildPayload = () => {
    const parsedAmount = Number(formState.amount.replace(',', '.'))
    return {
      type: formState.type,
      amount: Math.round(parsedAmount * 100),
      category: formState.category.trim(),
      comment: formState.comment.trim(),
      transactionDate: new Date(`${formState.transactionDate}T12:00:00`),
    }
  }

  const handleSubmitTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id || isSubmitting) return

    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setFormError('')
    setIsSubmitting(true)
    try {
      const payload = buildPayload()
      if (editingId) {
        await updateTransaction(user.id, editingId, payload)
        setToastMessage('Transakcja zaktualizowana.')
      } else {
        await createTransaction(user.id, payload)
        setToastMessage('Transakcja dodana.')
      }
      resetForm()
    } catch (error) {
      console.error('Saving transaction failed:', error)
      setToastMessage('Nie udało się zapisać transakcji.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.tId)
    setFormState({
      type: tx.type,
      amount: (tx.amount / 100).toFixed(2),
      category: tx.category,
      comment: tx.comment,
      transactionDate: toDateInputValue(tx.transactionDate),
    })
    setFormError('')
  }

  const handleDelete = async (txId: string) => {
    if (!user?.id) return
    const isConfirmed = window.confirm('Czy na pewno chcesz usunąć tę transakcję?')
    if (!isConfirmed) return

    try {
      await deleteTransaction(user.id, txId)
      setToastMessage('Transakcja usunięta.')
      if (editingId === txId) {
        resetForm()
      }
    } catch (error) {
      console.error('Deleting transaction failed:', error)
      setToastMessage('Nie udało się usunąć transakcji.')
    }
  }

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
            <h1 className="home__username">{user?.givenName ?? user?.username} 👋</h1>
          </div>
          <button className="home__avatar-btn" onClick={handleLogout} title="Wyloguj">
            {user?.avatarURL
              ? <img src={user.avatarURL} alt={user.username} className="home__avatar-img" referrerPolicy="no-referrer" />
              : <span className="home__avatar-fallback">{user?.username?.[0]}</span>
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

        <section className="home__section">
          <h2 className="home__section-title">
            {editingId ? 'Edytuj transakcję' : 'Dodaj transakcję'}
          </h2>
          <form className="home__transaction-form" onSubmit={handleSubmitTransaction}>
            <label className="home__field">
              <span>Typ</span>
              <select
                value={formState.type}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, type: event.target.value as TransactionType }))
                }
              >
                <option value="expense">Wydatek</option>
                <option value="income">Przychód</option>
              </select>
            </label>

            <label className="home__field">
              <span>Kwota (PLN)</span>
              <input
                type="text"
                inputMode="decimal"
                value={formState.amount}
                onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="np. 54.99"
              />
            </label>

            <label className="home__field">
              <span>Kategoria</span>
              <select
                value={formState.category}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, category: event.target.value }))
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="home__field">
              <span>Data</span>
              <input
                type="date"
                value={formState.transactionDate}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, transactionDate: event.target.value }))
                }
              />
            </label>

            <label className="home__field home__field--full">
              <span>Komentarz</span>
              <input
                type="text"
                value={formState.comment}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, comment: event.target.value }))
                }
                placeholder="Opcjonalnie"
                maxLength={100}
              />
            </label>

            {formError && <p className="home__form-error">{formError}</p>}

            <div className="home__form-actions">
              <button type="submit" className="home__action-submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Zapisywanie...'
                  : editingId
                    ? 'Zapisz zmiany'
                    : 'Dodaj transakcję'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="home__action-cancel"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Anuluj edycję
                </button>
              )}
            </div>
          </form>
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
          {isTransactionsLoading && <p className="home__transactions-placeholder">Ładowanie...</p>}
          {!isTransactionsLoading && transactions.length === 0 && (
            <p className="home__transactions-placeholder">
              Brak transakcji. Dodaj pierwszą transakcję powyżej.
            </p>
          )}
          <ul className="home__transactions">
            {transactions.map((t) => (
              <li key={t.tId} className="home__tx">
                <div className="home__tx-icon-wrap">
                  <span className="home__tx-icon">{t.type === 'income' ? '↓' : '↑'}</span>
                </div>
                <div className="home__tx-info">
                  <span className="home__tx-label">{t.comment || t.category}</span>
                  <span className="home__tx-category">{t.category}</span>
                </div>
                <div className="home__tx-right">
                  <span className={`home__tx-amount ${t.type === 'income' ? 'home__tx-amount--positive' : 'home__tx-amount--negative'}`}>
                    {formatAmount(t.amount, t.type)}
                  </span>
                  <span className="home__tx-date">
                    {t.transactionDate.toLocaleDateString('pl-PL', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div className="home__tx-actions">
                  <button type="button" className="home__tx-action" onClick={() => handleEdit(t)}>
                    Edytuj
                  </button>
                  <button
                    type="button"
                    className="home__tx-action home__tx-action--danger"
                    onClick={() => void handleDelete(t.tId)}
                  >
                    Usuń
                  </button>
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
