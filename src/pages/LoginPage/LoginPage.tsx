import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../features/i18n/useTranslation'
import loginBgDesktop from '../../images/backgrounds/login-bg-d.jpg'
import loginBgTablet from '../../images/backgrounds/login-bg-t.jpg'
import loginBgMobile from '../../images/backgrounds/register&login-bg-m.jpg'
import './LoginPage.css'

const LoginPage = () => {
  const { user, isLoading, loginWithEmail, loginWithGoogle, resetPassword } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (user) navigate('/home', { replace: true })
  }, [user, navigate])

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setInfo('')

    try {
      await loginWithEmail(email, password)
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('login.errorGeneric')
      setError(message)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setInfo('')
    try {
      await loginWithGoogle()
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('login.errorGoogle')
      setError(message)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setInfo('')
    if (!email) {
      setError(t('login.errorEmailRequired'))
      return
    }

    try {
      await resetPassword(email)
      setInfo(t('login.resetSent'))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('login.errorResetFailed')
      setError(message)
    }
  }

  return (
    <div className="login-page" data-testid="login-page">
      <picture className="login-page__bg" aria-hidden="true">
        <source media="(min-width: 1024px)" srcSet={loginBgDesktop} />
        <source media="(min-width: 768px)" srcSet={loginBgTablet} />
        <img src={loginBgMobile} alt="" />
      </picture>

      <div className="login-page__overlay" aria-hidden="true" />

      <main className="login-page__card">
        <div className="login-page__header">
          <div className="login-page__logo" aria-label="Virtual Wallet">
            <span className="login-page__logo-icon">◈</span>
          </div>
          <h1 className="login-page__title">Virtual Wallet</h1>
          <p className="login-page__subtitle">{t('appShell.tagline')}</p>
        </div>

        <div className="login-page__body">
          <p className="login-page__welcome">{t('login.welcome')}</p>
          <p className="login-page__description">{t('login.description')}</p>

          <form className="login-page__form" onSubmit={handleEmailLogin}>
            <label className="login-page__field-label" htmlFor="email">
              {t('common.email')}
            </label>
            <input
              id="email"
              className="login-page__input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              required
            />

            <label className="login-page__field-label" htmlFor="password">
              {t('common.password')}
            </label>
            <input
              id="password"
              className="login-page__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="login-page__forgot-link"
              onClick={handleForgotPassword}
              data-testid="forgot-password-button"
            >
              {t('login.forgot')}
            </button>

            <button
              className="login-page__submit-btn"
              type="submit"
              disabled={isLoading}
              data-testid="login-submit-button"
            >
              {t('login.submit')}
            </button>
          </form>

          {isLoading && <div className="login-page__spinner" aria-label={t('common.loading')} />}

          <div className="login-page__divider">
            <span>{t('common.or')}</span>
          </div>

          <button
            type="button"
            className="login-page__google-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            data-testid="login-google-button"
          >
            <span className="login-page__google-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12S6.6 21.7 12 21.7c6.9 0 9.6-4.9 9.6-7.4 0-.5 0-.9-.1-1.3H12z"
                />
                <path
                  fill="#34A853"
                  d="M2.3 7.3l3.2 2.3C6.3 7.8 8.9 6 12 6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.3 12 2.3 8.2 2.3 4.9 4.4 2.3 7.3z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 21.7c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1.1-3.4 1.1-3.8 0-5.2-2.6-5.4-3.9l-3.2 2.5C4.8 19.5 8.1 21.7 12 21.7z"
                />
                <path
                  fill="#4285F4"
                  d="M21.6 12.9c.1-.4.1-.8.1-1.3s0-.9-.1-1.3H12v3.9h5.4c-.3 1.3-1.6 3.9-5.4 3.9-3.3 0-6-2.7-6-6 0-1 .2-1.9.6-2.7L3.4 6.8C2.7 8.3 2.3 10 2.3 12c0 5.4 4.3 9.7 9.7 9.7 6.9 0 9.6-4.9 9.6-8.8z"
                />
              </svg>
            </span>
            {t('login.google')}
          </button>

          {error && (
            <p className="login-page__message login-page__message--error" data-testid="login-error">
              {error}
            </p>
          )}
          {info && (
            <p className="login-page__message login-page__message--info" data-testid="login-info">
              {info}
            </p>
          )}

          <p className="login-page__register-prompt">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="login-page__register-link">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
