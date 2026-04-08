import type { TransactionType } from '../../services/transactionsService'

export type SupportedCurrency = 'PLN' | 'EUR' | 'USD'
export type SupportedLocale = 'pl-PL' | 'en-US'
export type DateFormatPreference = 'short' | 'long' | 'iso'
export type ThemePreference = 'dark' | 'light' | 'system'
export type AuthProviderType = 'google' | 'password' | 'unknown'

export interface AppPreferences {
  currency: SupportedCurrency
  locale: SupportedLocale
  dateFormat: DateFormatPreference
  theme: ThemePreference
}

export const defaultPreferences: AppPreferences = {
  currency: 'PLN',
  locale: 'pl-PL',
  dateFormat: 'long',
  theme: 'dark',
}

export const currencyOptions: Array<{ value: SupportedCurrency; label: string }> = [
  { value: 'PLN', label: 'Polski zloty (PLN)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'US dollar (USD)' },
]

export const localeOptions: Array<{ value: SupportedLocale; label: string }> = [
  { value: 'pl-PL', label: 'Polski' },
  { value: 'en-US', label: 'English' },
]

export const dateFormatOptions: Array<{ value: DateFormatPreference; label: string }> = [
  { value: 'long', label: '12 kwi 2026' },
  { value: 'short', label: '12.04.2026' },
  { value: 'iso', label: '2026-04-12' },
]

export const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: 'dark', label: 'Ciemny' },
  { value: 'light', label: 'Jasny' },
  { value: 'system', label: 'Systemowy' },
]

const pad = (value: number) => `${value}`.padStart(2, '0')

export const getResolvedTheme = (
  theme: ThemePreference,
  prefersDarkMode: boolean,
): 'dark' | 'light' => {
  if (theme === 'system') {
    return prefersDarkMode ? 'dark' : 'light'
  }

  return theme
}

export const formatCurrencyValue = (value: number, preferences: AppPreferences) => {
  return value.toLocaleString(preferences.locale, {
    style: 'currency',
    currency: preferences.currency,
  })
}

export const formatCurrencyFromCents = (amount: number, preferences: AppPreferences) => {
  return formatCurrencyValue(amount / 100, preferences)
}

export const formatSignedAmount = (
  amount: number,
  type: TransactionType,
  preferences: AppPreferences,
) => {
  const sign = type === 'income' ? '+' : '-'
  return `${sign}${formatCurrencyFromCents(amount, preferences)}`
}

export const formatDateByPreference = (date: Date, preferences: AppPreferences) => {
  if (preferences.dateFormat === 'iso') {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  if (preferences.dateFormat === 'short') {
    return date.toLocaleDateString(preferences.locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return date.toLocaleDateString(preferences.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatPercent = (value: number, locale: SupportedLocale) => {
  return `${(value * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}%`
}

export const getAuthProviderLabel = (provider: AuthProviderType) => {
  if (provider === 'google') return 'Google'
  if (provider === 'password') return 'Email i hasło'
  return 'Nieznany'
}
