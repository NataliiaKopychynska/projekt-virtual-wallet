import { useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '../../components/AppShell/AppShell'
import { useAuth } from '../../contexts/AuthContext'
import {
  allTransactionCategories,
  transactionTypeOptions,
} from '../../features/transactions/constants'
import {
  formatAbsoluteAmount,
  formatTransactionDate,
  toDateInputValue,
} from '../../features/transactions/utils'
import {
  fetchTransactionsPage,
  type Transaction,
  type TransactionCursor,
  type TransactionFilters,
} from '../../services/transactionsService'
import './TransactionsPage.css'

const PAGE_SIZE = 25

const parseAmountInput = (value: string) => {
  if (!value.trim()) return null
  const parsed = Number(value.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

const TransactionsPage = () => {
  const { user } = useAuth()
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
      setErrorMessage('Nie udało się pobrać transakcji. Spróbuj ponownie.')
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

  return (
    <AppShell
      title="Transakcje"
      subtitle="Pełna historia operacji z filtrowaniem i doczytywaniem kolejnych rekordów."
    >
      <div className="transactions-page">
        <section className="transactions-page__filters">
          <div className="transactions-page__filters-head">
            <div>
              <p className="transactions-page__eyebrow">Historia konta</p>
              <h2 className="transactions-page__title">Wszystkie transakcje</h2>
            </div>
            <button
              type="button"
              className="transactions-page__reset-btn"
              onClick={handleResetFilters}
            >
              Resetuj filtry
            </button>
          </div>

          <div className="transactions-page__filters-grid">
            <label className="transactions-page__field">
              <span>Data od</span>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label className="transactions-page__field">
              <span>Data do</span>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </label>
            <label className="transactions-page__field">
              <span>Typ</span>
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
                {transactionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="transactions-page__field">
              <span>Kategoria</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Wszystkie kategorie</option>
                {allTransactionCategories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="transactions-page__field transactions-page__field--wide">
              <span>Szukaj po opisie</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="np. Lidl, pensja, Netflix"
              />
            </label>
            <label className="transactions-page__field">
              <span>Kwota min (PLN)</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountMin}
                onChange={(event) => setAmountMin(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <label className="transactions-page__field">
              <span>Kwota max (PLN)</span>
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

        <section className="transactions-page__table-card">
          <div className="transactions-page__table-head">
            <span>{transactions.length} rekordów w aktualnym widoku</span>
            {(dateFrom || dateTo) && (
              <span>
                Zakres: {dateFrom ? toDateInputValue(new Date(`${dateFrom}T00:00:00`)) : '...'} -{' '}
                {dateTo ? toDateInputValue(new Date(`${dateTo}T00:00:00`)) : '...'}
              </span>
            )}
          </div>

          {isInitialLoading && <p className="transactions-page__status">Ładowanie transakcji...</p>}
          {!isInitialLoading && errorMessage && (
            <p className="transactions-page__status transactions-page__status--error">
              {errorMessage}
            </p>
          )}
          {!isInitialLoading && !errorMessage && transactions.length === 0 && (
            <p className="transactions-page__status">
              Brak wyników dla wybranych filtrów.
            </p>
          )}

          {transactions.length > 0 && (
            <>
              <div className="transactions-page__table-wrap">
                <table className="transactions-page__table">
                  <thead>
                    <tr>
                      <th>Data transakcji</th>
                      <th>Typ</th>
                      <th>Kategoria</th>
                      <th>Opis</th>
                      <th>Kwota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.tId}>
                        <td>{formatTransactionDate(transaction.transactionDate)}</td>
                        <td>
                          <span
                            className={`transactions-page__type-pill ${
                              transaction.type === 'income'
                                ? 'transactions-page__type-pill--income'
                                : 'transactions-page__type-pill--expense'
                            }`}
                          >
                            {transaction.type === 'income' ? 'Przychód' : 'Wydatek'}
                          </span>
                        </td>
                        <td>{transaction.category}</td>
                        <td>{transaction.comment || '—'}</td>
                        <td
                          className={`transactions-page__amount ${
                            transaction.type === 'income'
                              ? 'transactions-page__amount--income'
                              : 'transactions-page__amount--expense'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatAbsoluteAmount(transaction.amount)}
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
                      <span>Data</span>
                      <strong>{formatTransactionDate(transaction.transactionDate)}</strong>
                    </div>
                    <div className="transactions-page__card-row">
                      <span>Typ</span>
                      <strong>{transaction.type === 'income' ? 'Przychód' : 'Wydatek'}</strong>
                    </div>
                    <div className="transactions-page__card-row">
                      <span>Kategoria</span>
                      <strong>{transaction.category}</strong>
                    </div>
                    <div className="transactions-page__card-row">
                      <span>Opis</span>
                      <strong>{transaction.comment || '—'}</strong>
                    </div>
                    <div className="transactions-page__card-row">
                      <span>Kwota</span>
                      <strong
                        className={
                          transaction.type === 'income'
                            ? 'transactions-page__amount transactions-page__amount--income'
                            : 'transactions-page__amount transactions-page__amount--expense'
                        }
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatAbsoluteAmount(transaction.amount)}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div ref={sentinelRef} className="transactions-page__sentinel" aria-hidden="true" />

          {!isInitialLoading && transactions.length > 0 && isLoadingMore && (
            <p className="transactions-page__status">Doczytywanie kolejnych transakcji...</p>
          )}
          {!isInitialLoading && transactions.length > 0 && !hasMore && (
            <p className="transactions-page__status">To już cała historia dla bieżących filtrów.</p>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default TransactionsPage
