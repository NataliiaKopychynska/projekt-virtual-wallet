import { Link } from 'react-router-dom'

const RegisterPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <h1>Rejestracja</h1>
      <Link to="/login">Wróć do logowania</Link>
    </div>
  )
}

export default RegisterPage
