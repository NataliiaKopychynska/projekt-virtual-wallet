import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell/AppShell'
import { useAuth } from '../../contexts/AuthContext'
import { usePreferences } from '../../contexts/PreferencesContext'
import { formatCurrencyValue } from '../../features/preferences/preferences'
import { useTranslation } from '../../features/i18n/useTranslation'
import { expenseCategories, incomeCategories } from '../../features/transactions/constants'
import {
  formatAmount,
  formatTransactionDate,
  parseTransactionAmountToCents,
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
  const { t, tCategory } = useTranslation()
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
        setToastMessage(t('tx.fetchError'))
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
    if (parseTransactionAmountToCents(formState.amount) === null) {
      return t('tx.errorAmount')
    }

    if (!formState.transactionDate) {
      return t('tx.errorDate')
    }

    if (!formState.category.trim()) {
      return t('tx.errorCategory')
    }

    if (formState.comment.length > 100) {
      return t('tx.errorComment')
    }

    return ''
  }

  const buildPayload = () => {
    const amountCents = parseTransactionAmountToCents(formState.amount)
    if (amountCents === null) {
      throw new Error('Invalid transaction amount')
    }

    return {
      type: formState.type,
      amount: amountCents,
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
        setToastMessage(t('tx.updated'))
      } else {
        await createTransaction(user.id, payload)
        setToastMessage(t('tx.added'))
      }
      resetForm()
    } catch (error) {
      console.error('Saving transaction failed:', error)
      setToastMessage(t('tx.saveError'))
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
    const isConfirmed = window.confirm(t('tx.confirmDelete'))
    if (!isConfirmed) return

    try {
      await deleteTransaction(user.id, txId)
      setToastMessage(t('tx.deleted'))
      if (editingId === txId) {
        resetForm()
      }
    } catch (error) {
      console.error('Deleting transaction failed:', error)
      setToastMessage(t('tx.deleteError'))
    }
  }

  return (
    <AppShell title={t('nav.dashboard')} subtitle={t('dashboard.subtitle')}>
      <div className="dashboard-page" data-testid="dashboard-page">
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
            <p className="dashboard-page__balance-label">{t('dashboard.mainBalance')}</p>
            <p className="dashboard-page__balance-amount">
              {formatCurrencyValue(balance, preferences)}
            </p>
            <p className="dashboard-page__balance-sub">{user?.email}</p>
            <div className="dashboard-page__balance-chip">VISA •••• 4821</div>
          </div>
          <div className="dashboard-page__balance-deco" aria-hidden="true" />
        </section>

        <section className="dashboard-page__section">
          <h2 className="dashboard-page__section-title">
            {editingId ? t('tx.editTitle') : t('tx.addTitle')}
          </h2>
          <form
            className="dashboard-page__transaction-form"
            onSubmit={handleSubmitTransaction}
            data-testid="transaction-form"
          >
            <label className="dashboard-page__field">
              <span>{t('tx.type')}</span>
              <select
                value={formState.type}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, type: event.target.value as TransactionType }))
                }
                data-testid="transaction-type-select"
              >
                <option value="expense">{t('tx.expense')}</option>
                <option value="income">{t('tx.income')}</option>
              </select>
            </label>

            <label className="dashboard-page__field">
              <span>{t('tx.amount', { currency: preferences.currency })}</span>
              <input
                type="text"
                inputMode="decimal"
                value={formState.amount}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, amount: event.target.value }))
                }
                placeholder={t('tx.amountPlaceholder')}
                data-testid="transaction-amount-input"
              />
            </label>

            <label className="dashboard-page__field">
              <span>{t('tx.category')}</span>
              <select
                value={formState.category}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, category: event.target.value }))
                }
                data-testid="transaction-category-select"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {tCategory(category)}
                  </option>
                ))}
              </select>
            </label>

            <label className="dashboard-page__field">
              <span>{t('tx.date')}</span>
              <input
                type="date"
                value={formState.transactionDate}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, transactionDate: event.target.value }))
                }
                data-testid="transaction-date-input"
              />
            </label>

            <label className="dashboard-page__field dashboard-page__field--full">
              <span>{t('tx.comment')}</span>
              <input
                type="text"
                value={formState.comment}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, comment: event.target.value }))
                }
                placeholder={t('tx.commentPlaceholder')}
                maxLength={100}
                data-testid="transaction-comment-input"
              />
            </label>

            {formError && (
              <p className="dashboard-page__form-error" data-testid="transaction-form-error">
                {formError}
              </p>
            )}

            <div className="dashboard-page__form-actions">
              <button
                type="submit"
                className="dashboard-page__action-submit"
                disabled={isSubmitting}
                data-testid="transaction-submit-button"
              >
                {isSubmitting ? t('common.saving') : editingId ? t('tx.saveChanges') : t('tx.addTitle')}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="dashboard-page__action-cancel"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  {t('tx.cancelEdit')}
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="dashboard-page__section">
          <div className="dashboard-page__section-head">
            <h2 className="dashboard-page__section-title">{t('dashboard.recent')}</h2>
            <Link to="/home/transactions" className="dashboard-page__section-link">
              {t('dashboard.seeAll')}
            </Link>
          </div>

          {isTransactionsLoading && (
            <p className="dashboard-page__transactions-placeholder">{t('common.loading')}</p>
          )}
          {!isTransactionsLoading && transactions.length === 0 && (
            <p className="dashboard-page__transactions-placeholder">{t('dashboard.empty')}</p>
          )}
          <ul className="dashboard-page__transactions" data-testid="recent-transactions">
            {recentTransactions.map((transaction) => (
              <li
                key={transaction.tId}
                className="dashboard-page__tx"
                data-testid="recent-transaction"
              >
                <div className="dashboard-page__tx-icon-wrap">
                  <span className="dashboard-page__tx-icon">
                    {transaction.type === 'income' ? '↓' : '↑'}
                  </span>
                </div>
                <div className="dashboard-page__tx-info">
                  <span className="dashboard-page__tx-label">
                    {transaction.comment || tCategory(transaction.category)}
                  </span>
                  <span className="dashboard-page__tx-category">
                    {tCategory(transaction.category)}
                  </span>
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
                  <span className="dashboard-page__tx-date">
                    {formatTransactionDate(transaction.transactionDate, preferences)}
                  </span>
                </div>
                <div className="dashboard-page__tx-actions">
                  <button
                    type="button"
                    className="dashboard-page__tx-action"
                    onClick={() => handleEdit(transaction)}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    className="dashboard-page__tx-action dashboard-page__tx-action--danger"
                    onClick={() => void handleDelete(transaction.tId)}
                  >
                    {t('common.delete')}
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
