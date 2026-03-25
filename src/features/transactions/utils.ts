import type { Transaction, TransactionType } from '../../services/transactionsService'

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatAmount = (amount: number, type: TransactionType) => {
  const value = amount / 100
  const sign = type === 'income' ? '+' : '-'
  return `${sign}${value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}`
}

export const formatAbsoluteAmount = (amount: number) => {
  return (amount / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
}

export const formatTransactionDate = (date: Date) =>
  date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

export const sortTransactionsByDateDesc = (transactions: Transaction[]) => {
  return [...transactions].sort((left, right) => right.transactionDate.getTime() - left.transactionDate.getTime())
}

