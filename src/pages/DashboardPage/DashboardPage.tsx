import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell/AppShell'
import { useAuth } from '../../contexts/AuthContext'
import { usePreferences } from '../../contexts/PreferencesContext'
import { formatCurrencyValue } from '../../features/preferences/preferences'
import { expenseCategories, incomeCategories, quickActions } from '../../features/transactions/constants'
import {
  formatAmount,
  formatTransactionDate,
  sortTransactionsByDateDesc,
  toDateInputValue,
} from '../../features/transactions/utils'
import {
  createTransaction,
  deleteTransaction,
  subscribeToTransactions,
  updateTransaction,
  type Transaction,
  type TransactionType,
} from '../../services/transactionsService'
import './DashboardPage.css'

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

const DashboardPage = () => {
  const { user } = useAuth()
  const { preferences } = usePreferences()
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

  const recentTransactions = useMemo(() => {
    return sortTransactionsByDateDesc(transactions).slice(0, 10)
  }, [transactions])

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
    <AppShell title="Pulpit" subtitle="Saldo, szybkie akcje i ostatnie ruchy na koncie.">
      <div className="dashboard-page">
        {toastMessage && (
          <div className="dashboard-page__flash-message" role="status" aria-live="polite">
            <span>{toastMessage}</span>
            <button
              type="button"
              className="dashboard-page__flash-close"
              onClick={() => setToastMessage('')}
              aria-label="OK"
            >
              OK
            </button>
          </div>
        )}

        <section className="dashboard-page__balance-card">
          <div className="dashboard-page__balance-card-inner">
            <p className="dashboard-page__balance-label">Saldo główne</p>
            <p className="dashboard-page__balance-amount">{formatCurrencyValue(balance, preferences)}</p>
            <p className="dashboard-page__balance-sub">{user?.email}</p>
            <div className="dashboard-page__balance-chip">VISA •••• 4821</div>
          </div>
          <div className="dashboard-page__balance-deco" aria-hidden="true" />
        </section>

        <section className="dashboard-page__section">
          <h2 className="dashboard-page__section-title">
            {editingId ? 'Edytuj transakcję' : 'Dodaj transakcję'}
          </h2>
          <form className="dashboard-page__transaction-form" onSubmit={handleSubmitTransaction}>
            <label className="dashboard-page__field">
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

            <label className="dashboard-page__field">
              <span>Kwota ({preferences.currency})</span>
              <input
                type="text"
                inputMode="decimal"
                value={formState.amount}
                onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="np. 54.99"
              />
            </label>

            <label className="dashboard-page__field">
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

            <label className="dashboard-page__field">
              <span>Data</span>
              <input
                type="date"
                value={formState.transactionDate}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, transactionDate: event.target.value }))
                }
              />
            </label>

            <label className="dashboard-page__field dashboard-page__field--full">
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

            {formError && <p className="dashboard-page__form-error">{formError}</p>}

            <div className="dashboard-page__form-actions">
              <button
                type="submit"
                className="dashboard-page__action-submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Zapisywanie...'
                  : editingId
                    ? 'Zapisz zmiany'
                    : 'Dodaj transakcję'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="dashboard-page__action-cancel"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Anuluj edycję
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="dashboard-page__section">
          <h2 className="dashboard-page__section-title">Szybkie akcje</h2>
          <div className="dashboard-page__actions">
            {quickActions.map((action) => (
              <button key={action.label} className="dashboard-page__action-btn">
                <span className="dashboard-page__action-icon">{action.icon}</span>
                <span className="dashboard-page__action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-page__section">
          <div className="dashboard-page__section-head">
            <h2 className="dashboard-page__section-title">Ostatnie transakcje</h2>
            <Link to="/home/transactions" className="dashboard-page__section-link">
              Zobacz wszystkie
            </Link>
          </div>

          {isTransactionsLoading && <p className="dashboard-page__transactions-placeholder">Ładowanie...</p>}
          {!isTransactionsLoading && transactions.length === 0 && (
            <p className="dashboard-page__transactions-placeholder">
              Brak transakcji. Dodaj pierwszą transakcję powyżej.
            </p>
          )}
          <ul className="dashboard-page__transactions">
            {recentTransactions.map((transaction) => (
              <li key={transaction.tId} className="dashboard-page__tx">
                <div className="dashboard-page__tx-icon-wrap">
                  <span className="dashboard-page__tx-icon">
                    {transaction.type === 'income' ? '↓' : '↑'}
                  </span>
                </div>
                <div className="dashboard-page__tx-info">
                  <span className="dashboard-page__tx-label">
                    {transaction.comment || transaction.category}
                  </span>
                  <span className="dashboard-page__tx-category">{transaction.category}</span>
                </div>
                <div className="dashboard-page__tx-right">
                  <span
                    className={`dashboard-page__tx-amount ${
                      transaction.type === 'income'
                        ? 'dashboard-page__tx-amount--positive'
                        : 'dashboard-page__tx-amount--negative'
                    }`}
                  >
                    {formatAmount(transaction.amount, transaction.type, preferences)}
                  </span>
                  <span className="dashboard-page__tx-date">{formatTransactionDate(transaction.transactionDate, preferences)}</span>
                </div>
                <div className="dashboard-page__tx-actions">
                  <button
                    type="button"
                    className="dashboard-page__tx-action"
                    onClick={() => handleEdit(transaction)}
                  >
                    Edytuj
                  </button>
                  <button
                    type="button"
                    className="dashboard-page__tx-action dashboard-page__tx-action--danger"
                    onClick={() => void handleDelete(transaction.tId)}
                  >
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}

export default DashboardPage
