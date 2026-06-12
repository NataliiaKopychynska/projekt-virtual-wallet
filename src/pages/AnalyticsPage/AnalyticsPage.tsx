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
import { usePreferences } from '../../contexts/PreferencesContext'
import {
  analyticsRangeOptions,
  buildAnalyticsDashboardData,
  type AnalyticsRange,
} from '../../features/analytics/analytics'
import {
  formatCurrencyValue,
  formatDateByPreference,
  formatPercent,
} from '../../features/preferences/preferences'
import { useTranslation } from '../../features/i18n/useTranslation'
import type { TranslationKey } from '../../features/i18n/translations'
import { formatAbsoluteAmount, formatTransactionDate } from '../../features/transactions/utils'
import { subscribeToTransactions, type Transaction } from '../../services/transactionsService'
import './AnalyticsPage.css'

const CHART_COLORS = ['#4ecdc4', '#6c63ff', '#ffb84d', '#ff7a90', '#78e08f', '#8bd3ff']

const toTooltipNumber = (value: number | string | ReadonlyArray<string | number> | undefined) => {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0)
  }

  return Number(value ?? 0)
}

const formatDateRange = (
  start: Date | null,
  end: Date,
  formatter: (value: Date) => string,
  noDataLabel: string,
) => {
  if (!start) return noDataLabel
  return `${formatter(start)} - ${formatter(end)}`
}

const rangeOptionKeys: Record<AnalyticsRange, TranslationKey> = {
  '30d': 'analytics.range.30d',
  '90d': 'analytics.range.90d',
  '12m': 'analytics.range.12m',
  all: 'analytics.range.all',
}

const AnalyticsPage = () => {
  const { user } = useAuth()
  const { preferences, resolvedTheme } = usePreferences()
  const { t, tCategory } = useTranslation()
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
        setErrorMessage(t('analytics.fetchError'))
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
    if (!comparison) return t('analytics.comparisonUnavailable')

    if (comparison.previousExpensesCents === 0) {
      return t('analytics.comparisonNoBase')
    }

    const direction =
      comparison.expensesDiffCents > 0 ? t('analytics.increased') : t('analytics.decreased')
    return t('analytics.comparisonMsg', {
      direction,
      amount: formatAbsoluteAmount(Math.abs(comparison.expensesDiffCents), preferences),
      pct: formatPercent(Math.abs(comparison.expensesDiffPct ?? 0), preferences.locale),
    })
  }, [analytics.summary.comparison, preferences, t])

  const hasAnyTransactions = transactions.length > 0
  const hasRangeData = analytics.filteredTransactions.length > 0
  const summary = analytics.summary
  const formatCurrency = (value: number) => formatCurrencyValue(value, preferences)
  const tooltipFormatter = (
    value: number | string | ReadonlyArray<string | number> | undefined,
    name: string | number | undefined,
  ) => [formatCurrencyValue(toTooltipNumber(value), preferences), String(name ?? '')] as [string, string]
  const tooltipContentStyle = useMemo(
    () => ({
      background: resolvedTheme === 'dark' ? '#141414' : '#ffffff',
      border:
        resolvedTheme === 'dark'
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(23,26,33,0.12)',
      borderRadius: '14px',
      color: resolvedTheme === 'dark' ? '#fbfbfb' : '#171a21',
    }),
    [resolvedTheme],
  )

  return (
    <AppShell title={t('nav.analytics')} subtitle={t('analytics.subtitle')}>
      <div className="analytics-page">
        <section className="analytics-page__hero">
          <div>
            <p className="analytics-page__eyebrow">{t('analytics.heroEyebrow')}</p>
            <h2 className="analytics-page__hero-title">{t('analytics.heroTitle')}</h2>
            <p className="analytics-page__hero-copy">{t('analytics.heroCopy')}</p>
          </div>

          <div className="analytics-page__hero-meta">
            <span className="analytics-page__hero-chip">
              {t('analytics.rangeLabel')}{' '}
              {formatDateRange(
                summary.start,
                summary.end,
                (value) => formatDateByPreference(value, preferences),
                t('common.noData'),
              )}
            </span>
            <span className="analytics-page__hero-chip">
              {t('analytics.records', { count: summary.transactionCount })}
            </span>
          </div>
        </section>

        <section className="analytics-page__range-bar" aria-label={t('analytics.rangeAria')}>
          {analyticsRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`analytics-page__range-btn${
                range === option.value ? ' analytics-page__range-btn--active' : ''
              }`}
              onClick={() => setRange(option.value)}
            >
              {t(rangeOptionKeys[option.value])}
            </button>
          ))}
        </section>

        {isLoading && <p className="analytics-page__status">{t('analytics.loading')}</p>}
        {!isLoading && errorMessage && (
          <p className="analytics-page__status analytics-page__status--error">{errorMessage}</p>
        )}

        {!isLoading && !errorMessage && !hasAnyTransactions && (
          <section className="analytics-page__empty">
            <h3>{t('analytics.emptyTitle')}</h3>
            <p>{t('analytics.emptyCopy')}</p>
            <div className="analytics-page__empty-actions">
              <Link to="/home/dashboard" className="analytics-page__empty-link analytics-page__empty-link--primary">
                {t('analytics.addTx')}
              </Link>
              <Link to="/home/transactions" className="analytics-page__empty-link">
                {t('analytics.seeHistory')}
              </Link>
            </div>
          </section>
        )}

        {!isLoading && !errorMessage && hasAnyTransactions && (
          <>
            <section className="analytics-page__kpi-grid">
              <article className="analytics-page__kpi-card">
                <span className="analytics-page__kpi-label">{t('analytics.net')}</span>
                <strong
                  className={`analytics-page__kpi-value ${
                    summary.netCents >= 0
                      ? 'analytics-page__kpi-value--positive'
                      : 'analytics-page__kpi-value--negative'
                  }`}
                >
                  {summary.netCents >= 0 ? '+' : '-'}
                  {formatAbsoluteAmount(Math.abs(summary.netCents), preferences)}
                </strong>
                <p className="analytics-page__kpi-meta">{t('analytics.netMeta')}</p>
              </article>

              <article className="analytics-page__kpi-card">
                <span className="analytics-page__kpi-label">{t('analytics.totalExpenses')}</span>
                <strong className="analytics-page__kpi-value">
                  {formatAbsoluteAmount(summary.expensesCents, preferences)}
                </strong>
                <p className="analytics-page__kpi-meta">{t('analytics.totalExpensesMeta')}</p>
              </article>

              <article className="analytics-page__kpi-card">
                <span className="analytics-page__kpi-label">{t('analytics.totalIncome')}</span>
                <strong className="analytics-page__kpi-value analytics-page__kpi-value--positive">
                  {formatAbsoluteAmount(summary.incomeCents, preferences)}
                </strong>
                <p className="analytics-page__kpi-meta">{t('analytics.totalIncomeMeta')}</p>
              </article>

              <article className="analytics-page__kpi-card">
                <span className="analytics-page__kpi-label">{t('analytics.avgDaily')}</span>
                <strong className="analytics-page__kpi-value">
                  {formatAbsoluteAmount(summary.averageDailyExpenseCents, preferences)}
                </strong>
                <p className="analytics-page__kpi-meta">{t('analytics.avgDailyMeta')}</p>
              </article>
            </section>

            {!hasRangeData && (
              <section className="analytics-page__empty analytics-page__empty--compact">
                <h3>{t('analytics.noRangeTitle')}</h3>
                <p>{t('analytics.noRangeCopy')}</p>
              </section>
            )}

            {hasRangeData && (
              <>
                <section className="analytics-page__panel analytics-page__panel--wide">
                  <div className="analytics-page__panel-head">
                    <div>
                      <p className="analytics-page__panel-eyebrow">{t('analytics.cashflowEyebrow')}</p>
                      <h3 className="analytics-page__panel-title">{t('analytics.incomeVsExpenses')}</h3>
                    </div>
                    <span className="analytics-page__panel-note">{t('analytics.cashflowNote')}</span>
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
                        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} />
                        <Legend />
                        <Bar dataKey="income" name={t('analytics.income')} fill="#4ecdc4" radius={[10, 10, 0, 0]} />
                        <Bar dataKey="expenses" name={t('analytics.expenses')} fill="#6c63ff" radius={[10, 10, 0, 0]} />
                        <Line
                          type="monotone"
                          dataKey="net"
                          name={t('analytics.netLine')}
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
                        <p className="analytics-page__panel-eyebrow">{t('analytics.categories')}</p>
                        <h3 className="analytics-page__panel-title">{t('analytics.expenseStructure')}</h3>
                      </div>
                      <span className="analytics-page__panel-note">{t('analytics.top5Note')}</span>
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
                            <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="analytics-page__chart-empty">{t('analytics.noCategoryData')}</p>
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
                              {tCategory(item.name)}
                            </span>
                            <span className="analytics-page__legend-values">
                              {formatCurrency(item.value)} • {formatPercent(item.share, preferences.locale)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>

                  <article className="analytics-page__panel">
                    <div className="analytics-page__panel-head">
                      <div>
                        <p className="analytics-page__panel-eyebrow">{t('analytics.insightsEyebrow')}</p>
                        <h3 className="analytics-page__panel-title">{t('analytics.keySignals')}</h3>
                      </div>
                    </div>

                    <div className="analytics-page__insights">
                      <div className="analytics-page__insight-card">
                        <span className="analytics-page__insight-label">{t('analytics.topCategory')}</span>
                        <strong className="analytics-page__insight-value">
                          {summary.topExpenseCategory
                            ? tCategory(summary.topExpenseCategory.name)
                            : t('common.noData')}
                        </strong>
                        <p className="analytics-page__insight-copy">
                          {summary.topExpenseCategory
                            ? t('analytics.topCategoryCopy', {
                                amount: formatCurrency(summary.topExpenseCategory.value),
                                pct: formatPercent(
                                  summary.topExpenseCategory.share,
                                  preferences.locale,
                                ),
                              })
                            : t('analytics.noExpensesRange')}
                        </p>
                      </div>

                      <div className="analytics-page__insight-card">
                        <span className="analytics-page__insight-label">{t('analytics.largestExpense')}</span>
                        <strong className="analytics-page__insight-value">
                          {summary.largestExpense
                            ? formatAbsoluteAmount(summary.largestExpense.amount, preferences)
                            : t('common.noData')}
                        </strong>
                        <p className="analytics-page__insight-copy">
                          {summary.largestExpense
                            ? `${tCategory(summary.largestExpense.category)} • ${summary.largestExpense.comment || t('analytics.noDescription')} • ${formatTransactionDate(summary.largestExpense.transactionDate, preferences)}`
                            : t('analytics.largestExpenseEmpty')}
                        </p>
                      </div>

                      <div className="analytics-page__insight-card">
                        <span className="analytics-page__insight-label">{t('analytics.periodChange')}</span>
                        <strong className="analytics-page__insight-value">
                          {summary.comparison
                            ? `${summary.comparison.expensesDiffCents >= 0 ? '+' : '-'}${formatAbsoluteAmount(Math.abs(summary.comparison.expensesDiffCents), preferences)}`
                            : t('analytics.noComparison')}
                        </strong>
                        <p className="analytics-page__insight-copy">{comparisonMessage}</p>
                      </div>
                    </div>
                  </article>
                </section>

                <section className="analytics-page__panel analytics-page__panel--wide">
                  <div className="analytics-page__panel-head">
                    <div>
                      <p className="analytics-page__panel-eyebrow">{t('analytics.trendEyebrow')}</p>
                      <h3 className="analytics-page__panel-title">{t('analytics.spendingPace')}</h3>
                    </div>
                    <span className="analytics-page__panel-note">{t('analytics.trendNote')}</span>
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
                          formatter={(value) => tooltipFormatter(value, t('analytics.expenses'))}
                          contentStyle={tooltipContentStyle}
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          name={t('analytics.expenses')}
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
