import type { Transaction, TransactionType } from '../../services/transactionsService'
import {
  defaultPreferences,
  formatCurrencyFromCents,
  formatDateByPreference,
  formatSignedAmount,
  type AppPreferences,
} from '../preferences/preferences'

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatAmount = (
  amount: number,
  type: TransactionType,
  preferences: AppPreferences = defaultPreferences,
) => {
  return formatSignedAmount(amount, type, preferences)
}

export const formatAbsoluteAmount = (
  amount: number,
  preferences: AppPreferences = defaultPreferences,
) => {
  return formatCurrencyFromCents(amount, preferences)
}

export const formatTransactionDate = (
  date: Date,
  preferences: AppPreferences = defaultPreferences,
) => formatDateByPreference(date, preferences)

export const sortTransactionsByDateDesc = (transactions: Transaction[]) => {
  return [...transactions].sort((left, right) => right.transactionDate.getTime() - left.transactionDate.getTime())
}
