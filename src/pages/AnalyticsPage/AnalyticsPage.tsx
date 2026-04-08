import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Bar,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AppShell from '../../components/AppShell/AppShell'
import { useAuth } from '../../contexts/AuthContext'
import {
  analyticsRangeOptions,
  buildAnalyticsDashboardData,
  type AnalyticsRange,
} from '../../features/analytics/analytics'
import { formatAbsoluteAmount, formatTransactionDate } from '../../features/transactions/utils'
import { subscribeToTransactions, type Transaction } from '../../services/transactionsService'
import './AnalyticsPage.css'

const CHART_COLORS = ['#4ecdc4', '#6c63ff', '#ffb84d', '#ff7a90', '#78e08f', '#8bd3ff']

const formatCurrency = (value: number) =>
  value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })

const formatPercent = (value: number) =>
  `${(value * 100).toLocaleString('pl-PL', { maximumFractionDigits: 1 })}%`

const toTooltipNumber = (value: number | string | ReadonlyArray<string | number> | undefined) => {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0)
  }

  return Number(value ?? 0)
}

const tooltipFormatter = (
  value: number | string | ReadonlyArray<string | number> | undefined,
  name: string | number | undefined,
) => [formatCurrency(toTooltipNumber(value)), String(name ?? '')] as [string, string]

const formatDateRange = (start: Date | null, end: Date) => {
  if (!start) return 'Brak danych'

  const format = (value: Date) =>
    value.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  return `${format(start)} - ${format(end)}`
}

const AnalyticsPage = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [range, setRange] = useState<AnalyticsRange>('90d')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToTransactions(
      user.id,
      (items) => {
        setTransactions(items)
        setErrorMessage('')
        setIsLoading(false)
      },
      (error) => {
        console.error('Analytics transaction subscription failed:', error)
        setErrorMessage('Nie udało się pobrać danych analitycznych.')
        setIsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user?.id])

  const analytics = useMemo(() => {
    return buildAnalyticsDashboardData(transactions, range)
  }, [transactions, range])

  const comparisonMessage = useMemo(() => {
    const comparison = analytics.summary.comparison
    if (!comparison) return 'Porównanie do poprzedniego okresu jest dostępne dla zakresów 30 dni, 90 dni i 12 miesięcy.'

    if (comparison.previousExpensesCents === 0) {
      return 'Brak wydatków w poprzednim porównywalnym okresie, więc nie ma jeszcze stabilnej bazy odniesienia.'
    }

    const direction = comparison.expensesDiffCents > 0 ? 'wzrosły' : 'spadły'
    return `Wydatki ${direction} o ${formatAbsoluteAmount(Math.abs(comparison.expensesDiffCents))} (${formatPercent(Math.abs(comparison.expensesDiffPct ?? 0))}) względem poprzedniego okresu.`
  }, [analytics.summary.comparison])

  const hasAnyTransactions = transactions.length > 0
  const hasRangeData = analytics.filteredTransactions.length > 0
  const summary = analytics.summary

  return (
    <AppShell
      title="Analityka"
      subtitle="Wydatki, trendy i kluczowe sygnały z historii konta."
    >
      <div className="analytics-page">
        <section className="analytics-page__hero">
          <div>
            <p className="analytics-page__eyebrow">Financial Intelligence</p>
            <h2 className="analytics-page__hero-title">Analityka wydatków</h2>
            <p className="analytics-page__hero-copy">
              Obserwuj cashflow, strukturę kosztów i tempo wydawania pieniędzy jak w bankowym dashboardzie.
            </p>
          </div>

          <div className="analytics-page__hero-meta">
            <span className="analytics-page__hero-chip">
              Zakres: {formatDateRange(summary.start, summary.end)}
            </span>
            <span className="analytics-page__hero-chip">
              Rekordy: {summary.transactionCount}
            </span>
          </div>
        </section>

        <section className="analytics-page__range-bar" aria-label="Zakres analizy">
          {analyticsRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`analytics-page__range-btn${
                range === option.value ? ' analytics-page__range-btn--active' : ''
              }`}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </section>

        {isLoading && <p className="analytics-page__status">Ładowanie analityki...</p>}
        {!isLoading && errorMessage && (
          <p className="analytics-page__status analytics-page__status--error">{errorMessage}</p>
        )}

        {!isLoading && !errorMessage && !hasAnyTransactions && (
          <section className="analytics-page__empty">
            <h3>Brak historii do przeanalizowania</h3>
            <p>
              Dodaj pierwsze transakcje, a tutaj pokażą się trendy, udział kategorii i porównania okresów.
            </p>
            <div className="analytics-page__empty-actions">
              <Link to="/home/dashboard" className="analytics-page__empty-link analytics-page__empty-link--primary">
                Dodaj transakcję
              </Link>
              <Link to="/home/transactions" className="analytics-page__empty-link">
                Zobacz historię
              </Link>
            </div>
          </section>
        )}

        {!isLoading && !errorMessage && hasAnyTransactions && (
          <>
            <section className="analytics-page__kpi-grid">
              <article className="analytics-page__kpi-card">
                <span className="analytics-page__kpi-label">Bilans netto</span>
                <strong
                  className={`analytics-page__kpi-value ${
                    summary.netCents >= 0
                      ? 'analytics-page__kpi-value--positive'
                      : 'analytics-page__kpi-value--negative'
                  }`}
                >
                  {summary.netCents >= 0 ? '+' : '-'}
                  {formatAbsoluteAmount(Math.abs(summary.netCents))}
                </strong>
                <p className="analytics-page__kpi-meta">Przychody minus wydatki w wybranym okresie.</p>
              </article>

              <article className="analytics-page__kpi-card">
                <span className="analytics-page__kpi-label">Suma wydatków</span>
                <strong className="analytics-page__kpi-value">{formatAbsoluteAmount(summary.expensesCents)}</strong>
                <p className="analytics-page__kpi-meta">Łączny wypływ środków dla aktywnego zakresu czasu.</p>
              </article>

              <article className="analytics-page__kpi-card">
                <span className="analytics-page__kpi-label">Suma przychodów</span>
                <strong className="analytics-page__kpi-value analytics-page__kpi-value--positive">
                  {formatAbsoluteAmount(summary.incomeCents)}
                </strong>
                <p className="analytics-page__kpi-meta">Wszystkie zasilenia portfela w badanym okresie.</p>
              </article>

              <article className="analytics-page__kpi-card">
                <span className="analytics-page__kpi-label">Średni dzienny wydatek</span>
                <strong className="analytics-page__kpi-value">
                  {formatAbsoluteAmount(summary.averageDailyExpenseCents)}
                </strong>
                <p className="analytics-page__kpi-meta">Uśrednione tempo wydatków dzień po dniu.</p>
              </article>
            </section>

            {!hasRangeData && (
              <section className="analytics-page__empty analytics-page__empty--compact">
                <h3>Brak danych w wybranym zakresie</h3>
                <p>
                  Zmień zakres czasu, aby zobaczyć wykresy i insighty dla okresu, w którym pojawiły się transakcje.
                </p>
              </section>
            )}

            {hasRangeData && (
              <>
                <section className="analytics-page__panel analytics-page__panel--wide">
                  <div className="analytics-page__panel-head">
                    <div>
                      <p className="analytics-page__panel-eyebrow">Cashflow</p>
                      <h3 className="analytics-page__panel-title">Przychody vs wydatki</h3>
                    </div>
                    <span className="analytics-page__panel-note">
                      Miesięczny przegląd wpływów, kosztów i wyniku netto.
                    </span>
                  </div>

                  <div className="analytics-page__chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analytics.cashflowSeries}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis dataKey="label" stroke="rgba(251,251,251,0.48)" tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="rgba(251,251,251,0.48)"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatCurrency}
                          width={92}
                        />
                        <Tooltip
                          formatter={tooltipFormatter}
                          contentStyle={{
                            background: '#141414',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            color: '#fbfbfb',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Przychody" fill="#4ecdc4" radius={[10, 10, 0, 0]} />
                        <Bar dataKey="expenses" name="Wydatki" fill="#6c63ff" radius={[10, 10, 0, 0]} />
                        <Line
                          type="monotone"
                          dataKey="net"
                          name="Netto"
                          stroke="#ffb84d"
                          strokeWidth={3}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="analytics-page__panel-grid">
                  <article className="analytics-page__panel">
                    <div className="analytics-page__panel-head">
                      <div>
                        <p className="analytics-page__panel-eyebrow">Kategorie</p>
                        <h3 className="analytics-page__panel-title">Struktura wydatków</h3>
                      </div>
                      <span className="analytics-page__panel-note">Top 5 kategorii plus agregacja reszty.</span>
                    </div>

                    <div className="analytics-page__chart analytics-page__chart--donut">
                      {analytics.categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.categoryBreakdown}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={68}
                              outerRadius={96}
                              paddingAngle={3}
                            >
                              {analytics.categoryBreakdown.map((entry, index) => (
                                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={tooltipFormatter}
                              contentStyle={{
                                background: '#141414',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '14px',
                                color: '#fbfbfb',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="analytics-page__chart-empty">Brak wydatków do pokazania na wykresie kategorii.</p>
                      )}
                    </div>

                    {analytics.categoryBreakdown.length > 0 && (
                      <ul className="analytics-page__legend-list">
                        {analytics.categoryBreakdown.map((item, index) => (
                          <li key={item.name} className="analytics-page__legend-item">
                            <span className="analytics-page__legend-name">
                              <span
                                className="analytics-page__legend-dot"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              {item.name}
                            </span>
                            <span className="analytics-page__legend-values">
                              {formatCurrency(item.value)} • {formatPercent(item.share)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>

                  <article className="analytics-page__panel">
                    <div className="analytics-page__panel-head">
                      <div>
                        <p className="analytics-page__panel-eyebrow">Insights</p>
                        <h3 className="analytics-page__panel-title">Najważniejsze sygnały</h3>
                      </div>
                    </div>

                    <div className="analytics-page__insights">
                      <div className="analytics-page__insight-card">
                        <span className="analytics-page__insight-label">Najmocniejsza kategoria</span>
                        <strong className="analytics-page__insight-value">
                          {summary.topExpenseCategory?.name ?? 'Brak danych'}
                        </strong>
                        <p className="analytics-page__insight-copy">
                          {summary.topExpenseCategory
                            ? `${formatCurrency(summary.topExpenseCategory.value)} • ${formatPercent(summary.topExpenseCategory.share)} wszystkich wydatków.`
                            : 'Brak wydatków w aktualnym zakresie.'}
                        </p>
                      </div>

                      <div className="analytics-page__insight-card">
                        <span className="analytics-page__insight-label">Największy pojedynczy wydatek</span>
                        <strong className="analytics-page__insight-value">
                          {summary.largestExpense
                            ? formatAbsoluteAmount(summary.largestExpense.amount)
                            : 'Brak danych'}
                        </strong>
                        <p className="analytics-page__insight-copy">
                          {summary.largestExpense
                            ? `${summary.largestExpense.category} • ${summary.largestExpense.comment || 'bez opisu'} • ${formatTransactionDate(summary.largestExpense.transactionDate)}`
                            : 'Dodaj więcej historii, aby wskazać największy koszt.'}
                        </p>
                      </div>

                      <div className="analytics-page__insight-card">
                        <span className="analytics-page__insight-label">Zmiana okres do okresu</span>
                        <strong className="analytics-page__insight-value">
                          {summary.comparison
                            ? `${summary.comparison.expensesDiffCents >= 0 ? '+' : '-'}${formatAbsoluteAmount(Math.abs(summary.comparison.expensesDiffCents))}`
                            : 'Brak porównania'}
                        </strong>
                        <p className="analytics-page__insight-copy">{comparisonMessage}</p>
                      </div>
                    </div>
                  </article>
                </section>

                <section className="analytics-page__panel analytics-page__panel--wide">
                  <div className="analytics-page__panel-head">
                    <div>
                      <p className="analytics-page__panel-eyebrow">Trend</p>
                      <h3 className="analytics-page__panel-title">Tempo wydatków w czasie</h3>
                    </div>
                    <span className="analytics-page__panel-note">
                      Dla 30 i 90 dni pokazujemy dane dzienne, dla dłuższych zakresów miesięczne.
                    </span>
                  </div>

                  <div className="analytics-page__chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.spendingTrendSeries}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke="rgba(251,251,251,0.48)"
                          tickLine={false}
                          axisLine={false}
                          minTickGap={24}
                        />
                        <YAxis
                          stroke="rgba(251,251,251,0.48)"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatCurrency}
                          width={92}
                        />
                        <Tooltip
                          formatter={(value) => tooltipFormatter(value, 'Wydatki')}
                          contentStyle={{
                            background: '#141414',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            color: '#fbfbfb',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          name="Wydatki"
                          stroke="#4ecdc4"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

export default AnalyticsPage
