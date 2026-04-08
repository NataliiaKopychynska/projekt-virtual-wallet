import type { TransactionType } from '../../services/transactionsService'

export const quickActions = [
  { icon: '↑', label: 'Wyślij' },
  { icon: '↓', label: 'Odbierz' },
]

export const expenseCategories = [
  'Zakupy',
  'Dom',
  'Transport',
  'Zdrowie',
  'Rozrywka',
  'Jedzenie',
  'Restauracje',
  'Edukacja',
  'Ubrania',
  'Subskrypcje',
  'Podróże',
  'Dzieci',
  'Zwierzęta',
  'Prezenty',
  'Opłaty bankowe',
  'Inne',
]

export const incomeCategories = ['Wynagrodzenie', 'Premia', 'Zwrot', 'Sprzedaż', 'Inne']

export const transactionTypeOptions: Array<{ value: TransactionType | 'all'; label: string }> = [
  { value: 'all', label: 'Wszystkie typy' },
  { value: 'expense', label: 'Wydatek' },
  { value: 'income', label: 'Przychód' },
]

export const allTransactionCategories = [...new Set([...expenseCategories, ...incomeCategories])].sort(
  (left, right) => left.localeCompare(right, 'pl-PL'),
)
