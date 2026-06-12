import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppShell from '../../components/AppShell/AppShell'
import { useAuth } from '../../contexts/AuthContext'
import { usePreferences } from '../../contexts/PreferencesContext'
import {
  currencyOptions,
  dateFormatOptions,
  defaultPreferences,
  formatCurrencyValue,
  formatDateByPreference,
  localeOptions,
  themeOptions,
} from '../../features/preferences/preferences'
import { useTranslation } from '../../features/i18n/useTranslation'
import type { TranslationKey } from '../../features/i18n/translations'
import './SettingsPage.css'

interface ProfileFormState {
  username: string
  avatarURL: string
}

interface PasswordFormState {
  nextPassword: string
  repeatPassword: string
}

const SettingsPage = () => {
  const { user, updateUserProfile, changePassword } = useAuth()
  const { preferences, updatePreferences, resolvedTheme } = usePreferences()
  const { t } = useTranslation()
  const [profileState, setProfileState] = useState<ProfileFormState>({
    username: user?.username ?? '',
    avatarURL: user?.avatarURL ?? '',
  })
  const [preferencesState, setPreferencesState] = useState(preferences)
  const [passwordState, setPasswordState] = useState<PasswordFormState>({
    nextPassword: '',
    repeatPassword: '',
  })
  const [securityMessage, setSecurityMessage] = useState('')
  const [profileToast, setProfileToast] = useState('')
  const [preferencesToast, setPreferencesToast] = useState('')
  const [profileError, setProfileError] = useState('')
  const [preferencesError, setPreferencesError] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    setProfileState({
      username: user?.username ?? '',
      avatarURL: user?.avatarURL ?? '',
    })
  }, [user?.avatarURL, user?.username])

  useEffect(() => {
    setPreferencesState(preferences)
  }, [preferences])

  useEffect(() => {
    if (!profileToast) return

    const timer = window.setTimeout(() => setProfileToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [profileToast])

  useEffect(() => {
    if (!preferencesToast) return

    const timer = window.setTimeout(() => setPreferencesToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [preferencesToast])

  const profilePreviewLetter = useMemo(() => {
    return (profileState.username.trim() || user?.username || 'U').charAt(0).toUpperCase()
  }, [profileState.username, user?.username])

  const previewDate = useMemo(
    () => formatDateByPreference(new Date('2026-04-12T12:00:00'), preferencesState),
    [preferencesState],
  )
  const previewAmount = useMemo(
    () => formatCurrencyValue(2499.5, preferencesState),
    [preferencesState],
  )
  const authProviderLabel = t(`auth.provider.${user?.authProvider ?? 'unknown'}` as TranslationKey)

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSavingProfile) return

    const username = profileState.username.trim()
    const avatarURL = profileState.avatarURL.trim()

    if (!username) {
      setProfileError(t('settings.errorUsernameRequired'))
      setProfileToast('')
      return
    }

    if (avatarURL && !/^https?:\/\/.+/i.test(avatarURL)) {
      setProfileError(t('settings.errorAvatarUrl'))
      setProfileToast('')
      return
    }

    setIsSavingProfile(true)
    setProfileError('')
    setProfileToast('')

    try {
      await updateUserProfile({ username, avatarURL })
      setProfileToast(t('settings.profileSaved'))
    } catch (error) {
      console.error('Saving profile settings failed:', error)
      setProfileError(t('settings.profileSaveError'))
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSavePreferences = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSavingPreferences) return

    setIsSavingPreferences(true)
    setPreferencesError('')
    setPreferencesToast('')

    try {
      updatePreferences(preferencesState)
      setPreferencesToast(t('settings.prefsSaved'))
    } catch (error) {
      console.error('Saving app preferences failed:', error)
      setPreferencesError(t('settings.prefsSaveError'))
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const handleResetPreferences = () => {
    setPreferencesState(defaultPreferences)
    updatePreferences(defaultPreferences)
    setPreferencesError('')
    setPreferencesToast('')
  }

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSavingPassword) return

    if (user?.authProvider !== 'password') {
      setSecurityError(t('settings.errorNoPassword'))
      setSecurityMessage('')
      return
    }

    if (passwordState.nextPassword.length < 6) {
      setSecurityError(t('settings.errorPasswordShort'))
      setSecurityMessage('')
      return
    }

    if (passwordState.nextPassword !== passwordState.repeatPassword) {
      setSecurityError(t('settings.errorPasswordMismatch'))
      setSecurityMessage('')
      return
    }

    setIsSavingPassword(true)
    setSecurityError('')
    setSecurityMessage('')

    try {
      await changePassword(passwordState.nextPassword)
      setPasswordState({ nextPassword: '', repeatPassword: '' })
      setSecurityMessage(t('settings.passwordChanged'))
    } catch (error) {
      console.error('Changing password failed:', error)
      setSecurityError(t('settings.passwordChangeError'))
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <AppShell title={t('nav.settings')} subtitle={t('settings.subtitle')}>
      <div className="settings-page" data-testid="settings-page">
        {profileToast && (
          <div className="settings-page__toast" role="status" aria-live="polite">
            <span>{profileToast}</span>
            <button
              type="button"
              className="settings-page__toast-close"
              onClick={() => setProfileToast('')}
              aria-label={t('settings.closeMessage')}
            >
              OK
            </button>
          </div>
        )}

        {preferencesToast && (
          <div className="settings-page__toast" role="status" aria-live="polite">
            <span>{preferencesToast}</span>
            <button
              type="button"
              className="settings-page__toast-close"
              onClick={() => setPreferencesToast('')}
              aria-label={t('settings.closeMessage')}
            >
              OK
            </button>
          </div>
        )}

        <section className="settings-page__hero">
          <div>
            <p className="settings-page__eyebrow">{t('settings.heroEyebrow')}</p>
            <h2 className="settings-page__hero-title">{t('settings.heroTitle')}</h2>
            <p className="settings-page__hero-copy">{t('settings.heroCopy')}</p>
          </div>

          <div className="settings-page__hero-meta">
            <span className="settings-page__hero-chip">
              {t('settings.themeChip', {
                theme:
                  resolvedTheme === 'dark'
                    ? t('settings.themeDarkLower')
                    : t('settings.themeLightLower'),
              })}
            </span>
          </div>
        </section>

        <div className="settings-page__grid">
          <section className="settings-page__card settings-page__card--profile">
            <div className="settings-page__card-head">
              <div>
                <p className="settings-page__section-eyebrow">{t('settings.profileEyebrow')}</p>
                <h3 className="settings-page__section-title">{t('settings.profileTitle')}</h3>
              </div>
            </div>

            <div className="settings-page__profile-preview">
              <div className="settings-page__avatar-shell">
                {profileState.avatarURL ? (
                  <img
                    src={profileState.avatarURL}
                    alt={profileState.username || user?.username || 'Avatar'}
                    className="settings-page__avatar-image"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="settings-page__avatar-fallback">{profilePreviewLetter}</span>
                )}
              </div>

              <div>
                <strong className="settings-page__profile-name">
                  {profileState.username.trim() || user?.username || t('settings.defaultUser')}
                </strong>
                <p className="settings-page__profile-meta">{user?.email}</p>
              </div>
            </div>

            <form className="settings-page__form" onSubmit={handleSaveProfile}>
              <label className="settings-page__field">
                <span>{t('settings.usernameLabel')}</span>
                <input
                  type="text"
                  value={profileState.username}
                  onChange={(event) =>
                    setProfileState((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder={t('settings.usernamePlaceholder')}
                />
              </label>

              <label className="settings-page__field">
                <span>{t('settings.avatarUrlLabel')}</span>
                <input
                  type="url"
                  value={profileState.avatarURL}
                  onChange={(event) =>
                    setProfileState((current) => ({ ...current, avatarURL: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="settings-page__field">
                <span>{t('common.email')}</span>
                <input type="email" value={user?.email ?? ''} disabled />
              </label>

              <label className="settings-page__field">
                <span>{t('settings.authMethod')}</span>
                <input type="text" value={authProviderLabel} disabled />
              </label>

              {profileError && (
                <p className="settings-page__feedback settings-page__feedback--error">
                  {profileError}
                </p>
              )}

              <div className="settings-page__actions">
                <button
                  type="submit"
                  className="settings-page__primary-btn"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? t('common.saving') : t('settings.saveProfile')}
                </button>
              </div>
            </form>
          </section>

          <section className="settings-page__card">
            <div className="settings-page__card-head">
              <div>
                <p className="settings-page__section-eyebrow">{t('settings.securityEyebrow')}</p>
                <h3 className="settings-page__section-title">{t('settings.securityTitle')}</h3>
              </div>
            </div>

            {user?.authProvider === 'password' ? (
              <form className="settings-page__form" onSubmit={handleChangePassword}>
                <label className="settings-page__field">
                  <span>{t('settings.newPassword')}</span>
                  <input
                    type="password"
                    value={passwordState.nextPassword}
                    onChange={(event) =>
                      setPasswordState((current) => ({
                        ...current,
                        nextPassword: event.target.value,
                      }))
                    }
                    placeholder={t('settings.min6')}
                    autoComplete="new-password"
                  />
                </label>

                <label className="settings-page__field">
                  <span>{t('settings.repeatNewPassword')}</span>
                  <input
                    type="password"
                    value={passwordState.repeatPassword}
                    onChange={(event) =>
                      setPasswordState((current) => ({
                        ...current,
                        repeatPassword: event.target.value,
                      }))
                    }
                    placeholder={t('settings.repeatPassword')}
                    autoComplete="new-password"
                  />
                </label>

                {securityError && (
                  <p className="settings-page__feedback settings-page__feedback--error">
                    {securityError}
                  </p>
                )}
                {securityMessage && (
                  <p className="settings-page__feedback settings-page__feedback--success">
                    {securityMessage}
                  </p>
                )}

                <div className="settings-page__actions">
                  <button
                    type="submit"
                    className="settings-page__primary-btn"
                    disabled={isSavingPassword}
                  >
                    {isSavingPassword ? t('common.saving') : t('settings.changePassword')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings-page__info-block">
                <p className="settings-page__info-copy">{t('settings.noPasswordInfo')}</p>
                {securityError && (
                  <p className="settings-page__feedback settings-page__feedback--error">
                    {securityError}
                  </p>
                )}
                {securityMessage && (
                  <p className="settings-page__feedback settings-page__feedback--success">
                    {securityMessage}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="settings-page__card settings-page__card--wide">
            <div className="settings-page__card-head">
              <div>
                <p className="settings-page__section-eyebrow">{t('settings.appEyebrow')}</p>
                <h3 className="settings-page__section-title">{t('settings.prefsTitle')}</h3>
              </div>
            </div>

            <form
              className="settings-page__form"
              onSubmit={handleSavePreferences}
              data-testid="preferences-form"
            >
              <div className="settings-page__preferences-grid">
                <label className="settings-page__field">
                  <span>{t('settings.currency')}</span>
                  <select
                    value={preferencesState.currency}
                    onChange={(event) =>
                      setPreferencesState((current) => ({
                        ...current,
                        currency: event.target.value as typeof current.currency,
                      }))
                    }
                    data-testid="preferences-currency-select"
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(`currency.${option.value}` as TranslationKey)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="settings-page__field">
                  <span>{t('settings.language')}</span>
                  <select
                    value={preferencesState.locale}
                    onChange={(event) =>
                      setPreferencesState((current) => ({
                        ...current,
                        locale: event.target.value as typeof current.locale,
                      }))
                    }
                  >
                    {localeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="settings-page__field">
                  <span>{t('settings.dateFormat')}</span>
                  <select
                    value={preferencesState.dateFormat}
                    onChange={(event) =>
                      setPreferencesState((current) => ({
                        ...current,
                        dateFormat: event.target.value as typeof current.dateFormat,
                      }))
                    }
                  >
                    {dateFormatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="settings-page__field">
                  <span>{t('settings.theme')}</span>
                  <select
                    value={preferencesState.theme}
                    onChange={(event) =>
                      setPreferencesState((current) => ({
                        ...current,
                        theme: event.target.value as typeof current.theme,
                      }))
                    }
                    data-testid="preferences-theme-select"
                  >
                    {themeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(`theme.${option.value}` as TranslationKey)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="settings-page__preview-card">
                <span className="settings-page__preview-label">{t('settings.previewLabel')}</span>
                <strong>{previewAmount}</strong>
                <span>{previewDate}</span>
              </div>

              {preferencesError && (
                <p className="settings-page__feedback settings-page__feedback--error">
                  {preferencesError}
                </p>
              )}

              <div className="settings-page__actions settings-page__actions--split">
                <button
                  type="submit"
                  className="settings-page__primary-btn"
                  disabled={isSavingPreferences}
                  data-testid="preferences-submit-button"
                >
                  {isSavingPreferences ? t('common.saving') : t('settings.savePrefs')}
                </button>
                <button
                  type="button"
                  className="settings-page__secondary-btn"
                  onClick={handleResetPreferences}
                >
                  {t('settings.resetDefaults')}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  )
}

export default SettingsPage
