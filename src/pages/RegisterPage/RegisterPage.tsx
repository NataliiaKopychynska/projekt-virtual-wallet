import { useState } from 'react';
import { registerWithEmail } from '../../firebase';
import { Link, useNavigate } from 'react-router-dom';

const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid #444',
  background: '#181818',
  color: '#fff',
  fontSize: 16,
  outline: 'none',
  marginBottom: 4,
  transition: 'border 0.2s',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 500,
  marginBottom: 2,
  color: '#bdbdbd',
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 0',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(90deg, #4f8cff, #2355e6)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  marginTop: 8,
  boxShadow: '0 2px 8px #0002',
  transition: 'background 0.2s',
};

const errorStyle: React.CSSProperties = {
  color: '#ff4d4f',
  marginTop: 8,
  fontWeight: 500,
  textAlign: 'center',
};

const cardStyle: React.CSSProperties = {
  background: '#23272f',
  borderRadius: 16,
  boxShadow: '0 4px 32px #0006',
  padding: 32,
  minWidth: 340,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
};

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const validatePassword = (password: string) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('Podaj poprawny adres email.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Hasło musi mieć min. 8 znaków, wielką literę, cyfrę i znak specjalny.');
      return;
    }
    if (password !== repeat) {
      setError('Hasła nie są takie same');
      return;
    }
    try {
      await registerWithEmail(email, password);
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #181c24 60%, #2a2f3a 100%)' }}>
      <div style={cardStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: 24, color: '#fff', fontWeight: 800, letterSpacing: 1 }}>Rejestracja</h1>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={labelStyle} htmlFor="email">Email</label>
          <input style={inputStyle} id="email" type="email" placeholder="np. jan.kowalski@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <label style={labelStyle} htmlFor="password">Hasło</label>
          <input style={inputStyle} id="password" type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          <label style={labelStyle} htmlFor="repeat">Powtórz hasło</label>
          <input style={inputStyle} id="repeat" type="password" placeholder="Powtórz hasło" value={repeat} onChange={e => setRepeat(e.target.value)} required autoComplete="new-password" />
          <button style={buttonStyle} type="submit">Zarejestruj się</button>
          {error && <div style={errorStyle}>{error}</div>}
        </form>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link to="/login" style={{ color: '#4f8cff', textDecoration: 'none', fontWeight: 500 }}>Wróć do logowania</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
