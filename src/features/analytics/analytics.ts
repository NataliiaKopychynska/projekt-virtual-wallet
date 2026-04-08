import type { Transaction } from '../../services/transactionsService'

export type AnalyticsRange = '30d' | '90d' | '12m' | 'all'

export interface AnalyticsRangeOption {
  value: AnalyticsRange
  label: string
}

export interface CategoryBreakdownItem {
  name: string
  value: number
  share: number
}

export interface CashflowPoint {
  label: string
  income: number
  expenses: number
  net: number
}

export interface SpendingTrendPoint {
  label: string
  expenses: number
}

export interface PeriodComparison {
  previousStart: Date
  previousEnd: Date
  previousExpensesCents: number
  expensesDiffCents: number
  expensesDiffPct: number | null
}

export interface AnalyticsSummary {
  start: Date | null
  end: Date
  incomeCents: number
  expensesCents: number
  netCents: number
  averageDailyExpenseCents: number
  transactionCount: number
  topExpenseCategory: CategoryBreakdownItem | null
  largestExpense: Transaction | null
  comparison: PeriodComparison | null
}

export interface AnalyticsDashboardData {
  filteredTransactions: Transaction[]
  summary: AnalyticsSummary
  categoryBreakdown: CategoryBreakdownItem[]
  cashflowSeries: CashflowPoint[]
  spendingTrendSeries: SpendingTrendPoint[]
}

export const analyticsRangeOptions: AnalyticsRangeOption[] = [
  { value: '30d', label: '30 dni' },
  { value: '90d', label: '90 dni' },
  { value: '12m', label: '12 miesięcy' },
  { value: 'all', label: 'Cały okres' },
]

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (date: Date) => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

const endOfDay = (date: Date) => {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

const startOfMonth = (date: Date) => {
  const value = new Date(date)
  value.setDate(1)
  value.setHours(0, 0, 0, 0)
  return value
}

const endOfMonth = (date: Date) => {
  const value = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  value.setHours(23, 59, 59, 999)
  return value
}

const addDays = (date: Date, amount: number) => {
  const value = new Date(date)
  value.setDate(value.getDate() + amount)
  return value
}

const addMonths = (date: Date, amount: number) => {
  const value = new Date(date)
  value.setMonth(value.getMonth() + amount)
  return value
}

const toPln = (amountCents: number) => Number((amountCents / 100).toFixed(2))

const sumCents = (transactions: Transaction[], type: 'income' | 'expense') => {
  return transactions.reduce((total, transaction) => {
    return transaction.type === type ? total + transaction.amount : total
  }, 0)
}

const getOldestTransactionDate = (transactions: Transaction[]) => {
  if (transactions.length === 0) return null

  return transactions.reduce((oldest, transaction) => {
    return transaction.transactionDate < oldest ? transaction.transactionDate : oldest
  }, transactions[0].transactionDate)
}

const filterTransactionsInRange = (transactions: Transaction[], start: Date | null, end: Date) => {
  const endTime = end.getTime()

  return transactions.filter((transaction) => {
    const time = transaction.transactionDate.getTime()
    if (start && time < start.getTime()) return false
    return time <= endTime
  })
}

const getRangeBounds = (range: AnalyticsRange, transactions: Transaction[], now: Date) => {
  const safeNow = endOfDay(now)
  const oldestDate = getOldestTransactionDate(transactions)

  if (!oldestDate) {
    return { start: null, end: safeNow }
  }

  if (range === 'all') {
    return { start: startOfDay(oldestDate), end: safeNow }
  }

  if (range === '12m') {
    return {
      start: startOfMonth(addMonths(safeNow, -11)),
      end: safeNow,
    }
  }

  const days = range === '30d' ? 29 : 89
  return {
    start: startOfDay(addDays(safeNow, -days)),
    end: safeNow,
  }
}

const getPreviousRangeBounds = (
  range: AnalyticsRange,
  currentStart: Date | null,
  transactions: Transaction[],
) => {
  if (!currentStart || range === 'all' || transactions.length === 0) return null

  if (range === '12m') {
    const previousStart = startOfMonth(addMonths(currentStart, -12))
    const previousEnd = endOfMonth(addMonths(currentStart, -1))
    return { start: previousStart, end: previousEnd }
  }

  const spanDays = range === '30d' ? 30 : 90
  const previousEnd = endOfDay(addDays(currentStart, -1))
  const previousStart = startOfDay(addDays(currentStart, -spanDays))

  return { start: previousStart, end: previousEnd }
}

const buildCategoryBreakdown = (transactions: Transaction[]): CategoryBreakdownItem[] => {
  const expenses = transactions.filter((transaction) => transaction.type === 'expense')
  const totalExpenses = sumCents(expenses, 'expense')

  if (expenses.length === 0 || totalExpenses === 0) return []

  const categoryTotals = new Map<string, number>()

  expenses.forEach((transaction) => {
    categoryTotals.set(
      transaction.category,
      (categoryTotals.get(transaction.category) ?? 0) + transaction.amount,
    )
  })

  const items = [...categoryTotals.entries()]
    .map(([name, value]) => ({
      name,
      value: toPln(value),
      share: value / totalExpenses,
    }))
    .sort((left, right) => right.value - left.value)

  if (items.length <= 5) return items

  const visible = items.slice(0, 5)
  const otherValue = items
    .slice(5)
    .reduce((total, item) => total + Math.round(item.value * 100), 0)

  return [
    ...visible,
    {
      name: 'Pozostałe',
      value: toPln(otherValue),
      share: otherValue / totalExpenses,
    },
  ]
}

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString('pl-PL', {
    month: 'short',
    year: '2-digit',
  })

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
  })

const buildMonthSequence = (start: Date, end: Date) => {
  const points: Date[] = []
  let cursor = startOfMonth(start)

  while (cursor.getTime() <= end.getTime()) {
    points.push(cursor)
    cursor = startOfMonth(addMonths(cursor, 1))
  }

  return points
}

const buildDaySequence = (start: Date, end: Date) => {
  const points: Date[] = []
  let cursor = startOfDay(start)

  while (cursor.getTime() <= end.getTime()) {
    points.push(cursor)
    cursor = startOfDay(addDays(cursor, 1))
  }

  return points
}

const buildCashflowSeries = (transactions: Transaction[], start: Date | null, end: Date): CashflowPoint[] => {
  if (!start) return []

  const buckets = new Map<string, { date: Date; incomeCents: number; expensesCents: number }>()

  buildMonthSequence(start, end).forEach((date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}`
    buckets.set(key, { date, incomeCents: 0, expensesCents: 0 })
  })

  transactions.forEach((transaction) => {
    const bucketDate = startOfMonth(transaction.transactionDate)
    const key = `${bucketDate.getFullYear()}-${bucketDate.getMonth()}`
    const bucket = buckets.get(key)
    if (!bucket) return

    if (transaction.type === 'income') {
      bucket.incomeCents += transaction.amount
    } else {
      bucket.expensesCents += transaction.amount
    }
  })

  return [...buckets.values()].map((bucket) => ({
    label: formatMonthLabel(bucket.date),
    income: toPln(bucket.incomeCents),
    expenses: toPln(bucket.expensesCents),
    net: toPln(bucket.incomeCents - bucket.expensesCents),
  }))
}

const buildSpendingTrendSeries = (
  transactions: Transaction[],
  range: AnalyticsRange,
  start: Date | null,
  end: Date,
): SpendingTrendPoint[] => {
  if (!start) return []

  const isDaily = range === '30d' || range === '90d'

  if (isDaily) {
    const buckets = new Map<string, { date: Date; expensesCents: number }>()

    buildDaySequence(start, end).forEach((date) => {
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      buckets.set(key, { date, expensesCents: 0 })
    })

    transactions.forEach((transaction) => {
      if (transaction.type !== 'expense') return
      const date = startOfDay(transaction.transactionDate)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const bucket = buckets.get(key)
      if (!bucket) return
      bucket.expensesCents += transaction.amount
    })

    return [...buckets.values()].map((bucket) => ({
      label: formatDayLabel(bucket.date),
      expenses: toPln(bucket.expensesCents),
    }))
  }

  return buildCashflowSeries(transactions, start, end).map((point) => ({
    label: point.label,
    expenses: point.expenses,
  }))
}

const buildComparison = (
  range: AnalyticsRange,
  currentStart: Date | null,
  currentExpensesCents: number,
  transactions: Transaction[],
) => {
  const previousBounds = getPreviousRangeBounds(range, currentStart, transactions)
  if (!previousBounds) return null

  const previousTransactions = filterTransactionsInRange(
    transactions,
    previousBounds.start,
    previousBounds.end,
  )
  const previousExpensesCents = sumCents(previousTransactions, 'expense')
  const expensesDiffCents = currentExpensesCents - previousExpensesCents

  return {
    previousStart: previousBounds.start,
    previousEnd: previousBounds.end,
    previousExpensesCents,
    expensesDiffCents,
    expensesDiffPct:
      previousExpensesCents > 0 ? expensesDiffCents / previousExpensesCents : null,
  }
}

export const buildAnalyticsDashboardData = (
  transactions: Transaction[],
  range: AnalyticsRange,
  now = new Date(),
): AnalyticsDashboardData => {
  const { start, end } = getRangeBounds(range, transactions, now)
  const filteredTransactions = filterTransactionsInRange(transactions, start, end)
  const incomeCents = sumCents(filteredTransactions, 'income')
  const expensesCents = sumCents(filteredTransactions, 'expense')
  const comparison = buildComparison(range, start, expensesCents, transactions)
  const categoryBreakdown = buildCategoryBreakdown(filteredTransactions)
  const largestExpense = filteredTransactions
    .filter((transaction) => transaction.type === 'expense')
    .sort((left, right) => right.amount - left.amount)[0] ?? null

  const averageDays =
    start && filteredTransactions.length > 0
      ? Math.max(1, Math.ceil((endOfDay(end).getTime() - startOfDay(start).getTime()) / DAY_MS))
      : 1

  return {
    filteredTransactions,
    summary: {
      start,
      end,
      incomeCents,
      expensesCents,
      netCents: incomeCents - expensesCents,
      averageDailyExpenseCents: Math.round(expensesCents / averageDays),
      transactionCount: filteredTransactions.length,
      topExpenseCategory: categoryBreakdown[0] ?? null,
      largestExpense,
      comparison,
    },
    categoryBreakdown,
    cashflowSeries: buildCashflowSeries(filteredTransactions, start, end),
    spendingTrendSeries: buildSpendingTrendSeries(filteredTransactions, range, start, end),
  }
}
