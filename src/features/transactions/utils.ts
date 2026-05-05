import type { Transaction, TransactionType } from '../../services/transactionsService'
import {
  defaultPreferences,
  formatCurrencyFromCents,
  formatDateByPreference,
  formatSignedAmount,
  type AppPreferences,
} from '../preferences/preferences'

interface ParseCurrencyAmountOptions {
  allowZero?: boolean
}

const currencyAmountPattern = /^\d+(?:[,.]\d{1,2})?$/

export const parseCurrencyAmountToCents = (
  value: string,
  options: ParseCurrencyAmountOptions = {},
) => {
  const amount = value.trim()
  if (!amount || !currencyAmountPattern.test(amount)) return null

  const [wholePart, fractionalPart = ''] = amount.replace(',', '.').split('.')
  const cents = Number(wholePart) * 100 + Number(fractionalPart.padEnd(2, '0'))
  const minimumAmount = options.allowZero ? 0 : 1

  if (!Number.isSafeInteger(cents) || cents < minimumAmount) return null

  return cents
}

export const parseTransactionAmountToCents = (value: string) => {
  return parseCurrencyAmountToCents(value)
}

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
