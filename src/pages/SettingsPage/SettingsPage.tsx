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
  getAuthProviderLabel,
  localeOptions,
  themeOptions,
} from '../../features/preferences/preferences'
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

  const previewDate = useMemo(() => formatDateByPreference(new Date('2026-04-12T12:00:00'), preferencesState), [
    preferencesState,
  ])
  const previewAmount = useMemo(() => formatCurrencyValue(2499.5, preferencesState), [preferencesState])
  const authProviderLabel = getAuthProviderLabel(user?.authProvider ?? 'unknown')

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSavingProfile) return

    const username = profileState.username.trim()
    const avatarURL = profileState.avatarURL.trim()

    if (!username) {
      setProfileError('Imię lub nazwa użytkownika jest wymagana.')
      setProfileToast('')
      return
    }

    if (avatarURL && !/^https?:\/\/.+/i.test(avatarURL)) {
      setProfileError('Avatar musi być poprawnym adresem URL zaczynającym się od http lub https.')
      setProfileToast('')
      return
    }

    setIsSavingProfile(true)
    setProfileError('')
    setProfileToast('')

    try {
      await updateUserProfile({ username, avatarURL })
      setProfileToast('Dane profilu zostały zapisane.')
    } catch (error) {
      console.error('Saving profile settings failed:', error)
      setProfileError('Nie udało się zapisać zmian profilu.')
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
      setPreferencesToast('Preferencje zapisane pomyślnie.')
    } catch (error) {
      console.error('Saving app preferences failed:', error)
      setPreferencesError('Nie udało się zapisać preferencji.')
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
      setSecurityError('To konto nie korzysta z lokalnego hasła.')
      setSecurityMessage('')
      return
    }

    if (passwordState.nextPassword.length < 6) {
      setSecurityError('Nowe hasło musi mieć minimum 6 znaków.')
      setSecurityMessage('')
      return
    }

    if (passwordState.nextPassword !== passwordState.repeatPassword) {
      setSecurityError('Hasła nie są identyczne.')
      setSecurityMessage('')
      return
    }

    setIsSavingPassword(true)
    setSecurityError('')
    setSecurityMessage('')

    try {
      await changePassword(passwordState.nextPassword)
      setPasswordState({ nextPassword: '', repeatPassword: '' })
      setSecurityMessage('Hasło zostało zmienione.')
    } catch (error) {
      console.error('Changing password failed:', error)
      setSecurityError(
        'Nie udało się zmienić hasła. Jeśli logowanie było dawno temu, wyloguj się i zaloguj ponownie albo użyj resetu hasła.',
      )
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <AppShell
      title="Ustawienia"
      subtitle="Zarządzaj profilem, bezpieczeństwem i sposobem prezentacji danych."
    >
      <div className="settings-page">
        {profileToast && (
          <div className="settings-page__toast" role="status" aria-live="polite">
            <span>{profileToast}</span>
            <button
              type="button"
              className="settings-page__toast-close"
              onClick={() => setProfileToast('')}
              aria-label="Zamknij komunikat"
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
              aria-label="Zamknij komunikat"
            >
              OK
            </button>
          </div>
        )}

        <section className="settings-page__hero">
          <div>
            <p className="settings-page__eyebrow">Account Center</p>
            <h2 className="settings-page__hero-title">Ustawienia konta i aplikacji</h2>
            <p className="settings-page__hero-copy">
              Tu zmienisz dane profilu, sposób logowania oraz format prezentacji kwot i dat w aplikacji.
            </p>
          </div>

          <div className="settings-page__hero-meta">
            <span className="settings-page__hero-chip">Motyw: {resolvedTheme === 'dark' ? 'ciemny' : 'jasny'}</span>
          </div>
        </section>

        <div className="settings-page__grid">
          <section className="settings-page__card settings-page__card--profile">
            <div className="settings-page__card-head">
              <div>
                <p className="settings-page__section-eyebrow">Profil</p>
                <h3 className="settings-page__section-title">Dane użytkownika</h3>
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
                  {profileState.username.trim() || user?.username || 'Uzytkownik'}
                </strong>
                <p className="settings-page__profile-meta">{user?.email}</p>
              </div>
            </div>

            <form className="settings-page__form" onSubmit={handleSaveProfile}>
              <label className="settings-page__field">
                <span>Imię lub nazwa użytkownika</span>
                <input
                  type="text"
                  value={profileState.username}
                  onChange={(event) =>
                    setProfileState((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="Np. Karol Szwedo"
                />
              </label>

              <label className="settings-page__field">
                <span>Avatar URL</span>
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
                <span>Email</span>
                <input type="email" value={user?.email ?? ''} disabled />
              </label>

              <label className="settings-page__field">
                <span>Metoda logowania</span>
                <input type="text" value={authProviderLabel} disabled />
              </label>

              {profileError && <p className="settings-page__feedback settings-page__feedback--error">{profileError}</p>}

              <div className="settings-page__actions">
                <button type="submit" className="settings-page__primary-btn" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Zapisywanie...' : 'Zapisz profil'}
                </button>
              </div>
            </form>
          </section>

          <section className="settings-page__card">
            <div className="settings-page__card-head">
              <div>
                <p className="settings-page__section-eyebrow">Bezpieczeństwo</p>
                <h3 className="settings-page__section-title">Dostęp do konta</h3>
              </div>
            </div>

            {user?.authProvider === 'password' ? (
              <form className="settings-page__form" onSubmit={handleChangePassword}>
                <label className="settings-page__field">
                  <span>Nowe hasło</span>
                  <input
                    type="password"
                    value={passwordState.nextPassword}
                    onChange={(event) =>
                      setPasswordState((current) => ({ ...current, nextPassword: event.target.value }))
                    }
                    placeholder="Minimum 6 znaków"
                    autoComplete="new-password"
                  />
                </label>

                <label className="settings-page__field">
                  <span>Powtórz nowe hasło</span>
                  <input
                    type="password"
                    value={passwordState.repeatPassword}
                    onChange={(event) =>
                      setPasswordState((current) => ({ ...current, repeatPassword: event.target.value }))
                    }
                    placeholder="Powtórz hasło"
                    autoComplete="new-password"
                  />
                </label>

                {securityError && <p className="settings-page__feedback settings-page__feedback--error">{securityError}</p>}
                {securityMessage && <p className="settings-page__feedback settings-page__feedback--success">{securityMessage}</p>}

                <div className="settings-page__actions">
                  <button type="submit" className="settings-page__primary-btn" disabled={isSavingPassword}>
                    {isSavingPassword ? 'Zapisywanie...' : 'Zmień hasło'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings-page__info-block">
                <p className="settings-page__info-copy">
                  To konto nie korzysta z lokalnego hasła, więc zmiana hasła nie jest dostępna z poziomu aplikacji.
                </p>
                {securityError && <p className="settings-page__feedback settings-page__feedback--error">{securityError}</p>}
                {securityMessage && <p className="settings-page__feedback settings-page__feedback--success">{securityMessage}</p>}
              </div>
            )}
          </section>

          <section className="settings-page__card settings-page__card--wide">
            <div className="settings-page__card-head">
              <div>
                <p className="settings-page__section-eyebrow">Aplikacja</p>
                <h3 className="settings-page__section-title">Preferencje interfejsu</h3>
              </div>
            </div>

            <form className="settings-page__form" onSubmit={handleSavePreferences}>
              <div className="settings-page__preferences-grid">
                <label className="settings-page__field">
                  <span>Waluta</span>
                  <select
                    value={preferencesState.currency}
                    onChange={(event) =>
                      setPreferencesState((current) => ({
                        ...current,
                        currency: event.target.value as typeof current.currency,
                      }))
                    }
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="settings-page__field">
                  <span>Język i locale</span>
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
                  <span>Format daty</span>
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
                  <span>Motyw</span>
                  <select
                    value={preferencesState.theme}
                    onChange={(event) =>
                      setPreferencesState((current) => ({
                        ...current,
                        theme: event.target.value as typeof current.theme,
                      }))
                    }
                  >
                    {themeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="settings-page__preview-card">
                <span className="settings-page__preview-label">Podgląd formatowania</span>
                <strong>{previewAmount}</strong>
                <span>{previewDate}</span>
              </div>

              {preferencesError && (
                <p className="settings-page__feedback settings-page__feedback--error">{preferencesError}</p>
              )}

              <div className="settings-page__actions settings-page__actions--split">
                <button type="submit" className="settings-page__primary-btn" disabled={isSavingPreferences}>
                  {isSavingPreferences ? 'Zapisywanie...' : 'Zapisz preferencje'}
                </button>
                <button
                  type="button"
                  className="settings-page__secondary-btn"
                  onClick={handleResetPreferences}
                >
                  Przywróć domyślne
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
