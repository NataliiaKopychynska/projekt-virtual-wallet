import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'
import loginBgDesktop from '../../images/backgrounds/login-bg-d.jpg'
import loginBgTablet from '../../images/backgrounds/login-bg-t.jpg'
import loginBgMobile from '../../images/backgrounds/register&login-bg-m.jpg'
import './LoginPage.css'

const LoginPage = () => {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/home', { replace: true })
  }, [user, navigate])

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return
    try {
      await login(response.credential)
      navigate('/home', { replace: true })
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const handleError = () => {
    console.error('Google Sign-In failed')
  }

  return (
    <div className="login-page">
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
          <p className="login-page__subtitle">Twój cyfrowy portfel</p>
        </div>

        <div className="login-page__body">
          <p className="login-page__welcome">Witaj z powrotem</p>
          <p className="login-page__description">
            Zaloguj się, aby zarządzać swoimi finansami
          </p>

          {isLoading ? (
            <div className="login-page__spinner" aria-label="Ładowanie..." />
          ) : (
            <div className="login-page__google-wrap">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="filled_black"
                size="large"
                shape="rectangular"
                width="100%"
                text="signin_with"
              />
            </div>
          )}

          <div className="login-page__divider">
            <span>lub</span>
          </div>

          <p className="login-page__register-prompt">
            Nie masz jeszcze konta?{' '}
            <Link to="/register" className="login-page__register-link">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
