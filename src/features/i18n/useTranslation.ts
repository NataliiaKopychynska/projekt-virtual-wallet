import { useCallback } from 'react'
import { usePreferences } from '../../contexts/PreferencesContext'
import type { SupportedLocale } from '../preferences/preferences'
import { translations, translateCategory, type TranslationKey } from './translations'

type InterpolationVars = Record<string, string | number>

const interpolate = (template: string, vars?: InterpolationVars) => {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  )
}

export const translate = (
  locale: SupportedLocale,
  key: TranslationKey,
  vars?: InterpolationVars,
): string => {
  const dictionary = translations[locale] ?? translations['pl-PL']
  const template = dictionary[key] ?? translations['pl-PL'][key] ?? key
  return interpolate(template, vars)
}

export const useTranslation = () => {
  const { preferences } = usePreferences()
  const locale = preferences.locale

  const t = useCallback(
    (key: TranslationKey, vars?: InterpolationVars) => translate(locale, key, vars),
    [locale],
  )

  const tCategory = useCallback(
    (category: string) => translateCategory(locale, category),
    [locale],
  )

  return { t, tCategory, locale }
}
