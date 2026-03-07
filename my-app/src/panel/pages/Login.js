import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { apiLogin, apiRegister, apiHealth } from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

function Login() {
  const { user, login } = useAuth();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initialCardAmount, setInitialCardAmount] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [backendReachable, setBackendReachable] = useState(null);

  useEffect(() => {
    apiHealth().then(setBackendReachable);
  }, []);

  if (user) return <Navigate to="/" replace />;

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { user: userData, token } = await apiLogin(email.trim(), password);
      login(userData, token);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('email', email.trim());
      formData.append('password', password);
      if (username.trim()) formData.append('username', username.trim());
      if (initialCardAmount !== '') formData.append('initialCardAmount', initialCardAmount);
      if (profilePhoto) formData.append('profilePhoto', profilePhoto);
      const { user: userData, token } = await apiRegister(formData);
      login(userData, token);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const form = tab === 'login' ? (
    <form className="login-form" onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  ) : (
    <form className="login-form" onSubmit={handleRegister}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        autoComplete="new-password"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Initial card amount (optional)"
        value={initialCardAmount}
        onChange={(e) => setInitialCardAmount(e.target.value)}
      />
      <div className="login-form__photo">
        <label className="login-form__photo-label">
          <span>Profile photo (optional)</span>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </label>
        {photoPreview && (
          <div className="login-form__photo-preview" style={{ backgroundImage: `url(${photoPreview})` }} />
        )}
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Register'}
      </button>
    </form>
  );

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-card__title">SyncNest</h1>
        <p className="login-card__subtitle">Sign in or create an account</p>
        {backendReachable === false && (
          <div className="login-backend-warning">
            Backend is not reachable. Start it in a terminal: <code>cd backend && npm run dev</code> (and ensure Docker/PostgreSQL is running with <code>sudo docker-compose up -d</code>).
          </div>
        )}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tabs__btn${tab === 'login' ? ' login-tabs__btn--active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Log in
          </button>
          <button
            type="button"
            className={`login-tabs__btn${tab === 'register' ? ' login-tabs__btn--active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Register
          </button>
        </div>
        {error && <p className="login-error">{error}</p>}
        {form}
      </div>
    </div>
  );
}

export default Login;
