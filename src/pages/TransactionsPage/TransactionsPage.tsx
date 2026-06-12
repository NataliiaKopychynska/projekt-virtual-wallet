import { useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '../../components/AppShell/AppShell'
import { useAuth } from '../../contexts/AuthContext'
import { usePreferences } from '../../contexts/PreferencesContext'
import { useTranslation } from '../../features/i18n/useTranslation'
import type { TranslationKey } from '../../features/i18n/translations'
import {
  allTransactionCategories,
  transactionTypeOptions,
} from '../../features/transactions/constants'
import {
  formatAbsoluteAmount,
  formatTransactionDate,
  parseCurrencyAmountToCents,
  toDateInputValue,
} from '../../features/transactions/utils'
import {
  deleteTransaction,
  fetchTransactionsPage,
  type Transaction,
  type TransactionCursor,
  type TransactionFilters,
} from '../../services/transactionsService'
import './TransactionsPage.css'

const PAGE_SIZE = 25

const typeOptionKeys: Record<'all' | 'income' | 'expense', TranslationKey> = {
  all: 'tx.allTypes',
  income: 'tx.income',
  expense: 'tx.expense',
}

const parseAmountInput = (value: string) => {
  if (!value.trim()) return null
  return parseCurrencyAmountToCents(value, { allowZero: true })
}

const TransactionsPage = () => {
  const { user } = useAuth()
  const { preferences } = usePreferences()
  const { t, tCategory } = useTranslation()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cursor, setCursor] = useState<TransactionCursor>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const filters = useMemo<TransactionFilters>(() => {
    return {
      dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`) : null,
      dateTo: dateTo ? new Date(`${dateTo}T00:00:00`) : null,
      type,
      category,
      search,
      amountMin: parseAmountInput(amountMin),
      amountMax: parseAmountInput(amountMax),
    }
  }, [amountMax, amountMin, category, dateFrom, dateTo, search, type])

  const loadTransactions = async (mode: 'reset' | 'append') => {
    if (!user?.id) return

    if (mode === 'reset') {
      setIsInitialLoading(true)
      setErrorMessage('')
    } else {
      if (isInitialLoading || isLoadingMore || !hasMore) return
      setIsLoadingMore(true)
    }

    try {
      const result = await fetchTransactionsPage(user.id, {
        filters,
        cursor: mode === 'append' ? cursor : null,
        pageSize: PAGE_SIZE,
      })

      setTransactions((current) =>
        mode === 'append' ? [...current, ...result.items] : result.items,
      )
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Loading transactions page failed:', error)
      setErrorMessage(t('txPage.fetchError'))
      if (mode === 'reset') {
        setTransactions([])
      }
    } finally {
      if (mode === 'reset') {
        setIsInitialLoading(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    setTransactions([])
    setCursor(null)
    setHasMore(true)
    void loadTransactions('reset')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filters])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        void loadTransactions('append')
      },
      { rootMargin: '0px 0px 240px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  })

  const handleResetFilters = () => {
    setDateFrom('')
    setDateTo('')
    setType('all')
    setCategory('')
    setSearch('')
    setAmountMin('')
    setAmountMax('')
  }

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!user?.id || deletingId) return

    const isConfirmed = window.confirm(t('tx.confirmDelete'))
    if (!isConfirmed) return

    setDeletingId(transaction.tId)
    setErrorMessage('')

    try {
      await deleteTransaction(user.id, transaction.tId)
      setTransactions((current) => current.filter((item) => item.tId !== transaction.tId))
    } catch (error) {
      console.error('Deleting transaction from history failed:', error)
      setErrorMessage(t('txPage.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AppShell title={t('nav.transactions')} subtitle={t('txPage.subtitle')}>
      <div className="transactions-page" data-testid="transactions-page">
        <section className="transactions-page__filters" data-testid="transactions-filters">
          <div className="transactions-page__filters-head">
            <div>
              <p className="transactions-page__eyebrow">{t('txPage.eyebrow')}</p>
              <h2 className="transactions-page__title">{t('txPage.title')}</h2>
            </div>
            <button
              type="button"
              className="transactions-page__reset-btn"
              onClick={handleResetFilters}
              data-testid="transactions-reset-filters"
            >
              {t('txPage.resetFilters')}
            </button>
          </div>

          <div className="transactions-page__filters-grid">
            <label className="transactions-page__field">
              <span>{t('txPage.dateFrom')}</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="transactions-page__field">
              <span>{t('txPage.dateTo')}</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <label className="transactions-page__field">
              <span>{t('tx.type')}</span>
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
                {transactionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(typeOptionKeys[option.value])}
                  </option>
                ))}
              </select>
            </label>
            <label className="transactions-page__field">
              <span>{t('tx.category')}</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{t('txPage.allCategories')}</option>
                {allTransactionCategories.map((option) => (
                  <option key={option} value={option}>
                    {tCategory(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="transactions-page__field transactions-page__field--wide">
              <span>{t('txPage.searchLabel')}</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('txPage.searchPlaceholder')}
                data-testid="transactions-search-input"
              />
            </label>
            <label className="transactions-page__field">
              <span>{t('txPage.amountMin', { currency: preferences.currency })}</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountMin}
                onChange={(event) => setAmountMin(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <label className="transactions-page__field">
              <span>{t('txPage.amountMax', { currency: preferences.currency })}</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountMax}
                onChange={(event) => setAmountMax(event.target.value)}
                placeholder="9999.99"
              />
            </label>
          </div>
        </section>

        <section className="transactions-page__table-card" data-testid="transactions-results">
          <div className="transactions-page__table-head">
            <span>{t('txPage.recordCount', { count: transactions.length })}</span>
            {(dateFrom || dateTo) && (
              <span>
                {t('txPage.range', {
                  from: dateFrom ? toDateInputValue(new Date(`${dateFrom}T00:00:00`)) : '...',
                  to: dateTo ? toDateInputValue(new Date(`${dateTo}T00:00:00`)) : '...',
                })}
              </span>
            )}
          </div>

          {isInitialLoading && <p className="transactions-page__status">{t('txPage.loading')}</p>}
          {!isInitialLoading && errorMessage && (
            <p className="transactions-page__status transactions-page__status--error">
              {errorMessage}
            </p>
          )}
          {!isInitialLoading && !errorMessage && transactions.length === 0 && (
            <p className="transactions-page__status">{t('txPage.noResults')}</p>
          )}

          {transactions.length > 0 && (
            <>
              <div className="transactions-page__table-wrap">
                <table className="transactions-page__table">
                  <thead>
                    <tr>
                      <th>{t('txPage.colDate')}</th>
                      <th>{t('tx.type')}</th>
                      <th>{t('tx.category')}</th>
                      <th>{t('txPage.colDesc')}</th>
                      <th>{t('txPage.colAmount')}</th>
                      <th>{t('txPage.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.tId}
                        data-testid="transactions-table-row"
                        data-transaction-id={transaction.tId}
                      >
                        <td>{formatTransactionDate(transaction.transactionDate, preferences)}</td>
                        <td>
                          <span
                            className={`transactions-page__type-pill ${
                              transaction.type === 'income'
                                ? 'transactions-page__type-pill--income'
                                : 'transactions-page__type-pill--expense'
                            }`}
                          >
                            {transaction.type === 'income' ? t('tx.income') : t('tx.expense')}
                          </span>
                        </td>
                        <td>{tCategory(transaction.category)}</td>
                        <td>{transaction.comment || '—'}</td>
                        <td
                          className={`transactions-page__amount ${
                            transaction.type === 'income'
                              ? 'transactions-page__amount--income'
                              : 'transactions-page__amount--expense'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatAbsoluteAmount(transaction.amount, preferences)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="transactions-page__delete-btn"
                            onClick={() => void handleDeleteTransaction(transaction)}
                            disabled={deletingId === transaction.tId}
                            data-testid="transactions-delete-button"
                          >
                            {deletingId === transaction.tId ? t('txPage.deleting') : t('common.delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="transactions-page__cards">
                {transactions.map((transaction) => (
                  <article key={transaction.tId} className="transactions-page__card">
                    <div className="transactions-page__card-row">
                      <span>{t('tx.date')}</span>
                      <strong>
                        {formatTransactionDate(transaction.transactionDate, preferences)}
                      </strong>
                    </div>
                    <div className="transactions-page__card-row">
                      <span>{t('tx.type')}</span>
                      <strong>
                        {transaction.type === 'income' ? t('tx.income') : t('tx.expense')}
                      </strong>
                    </div>
                    <div className="transactions-page__card-row">
                      <span>{t('tx.category')}</span>
                      <strong>{tCategory(transaction.category)}</strong>
                    </div>
                    <div className="transactions-page__card-row">
                      <span>{t('txPage.colDesc')}</span>
                      <strong>{transaction.comment || '—'}</strong>
                    </div>
                    <div className="transactions-page__card-row">
                      <span>{t('txPage.colAmount')}</span>
                      <strong
                        className={
                          transaction.type === 'income'
                            ? 'transactions-page__amount transactions-page__amount--income'
                            : 'transactions-page__amount transactions-page__amount--expense'
                        }
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatAbsoluteAmount(transaction.amount, preferences)}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="transactions-page__delete-btn"
                      onClick={() => void handleDeleteTransaction(transaction)}
                      disabled={deletingId === transaction.tId}
                      data-testid="transactions-delete-button"
                    >
                      {deletingId === transaction.tId ? t('txPage.deleting') : t('common.delete')}
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}

          <div ref={sentinelRef} className="transactions-page__sentinel" aria-hidden="true" />

          {!isInitialLoading && transactions.length > 0 && isLoadingMore && (
            <p className="transactions-page__status">{t('txPage.loadingMore')}</p>
          )}
          {!isInitialLoading && transactions.length > 0 && !hasMore && (
            <p className="transactions-page__status">{t('txPage.endOfHistory')}</p>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default TransactionsPage
