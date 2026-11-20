import { useState } from 'react';

export default function AuthPage({ onLogin, onRegister, setPage }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please fill in both username and password.');
      return;
    }

    if (isRegistering && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegistering) {
        await onRegister(username.trim(), password, email.trim());
      } else {
        await onLogin(username.trim(), password);
      }
    } catch (err) {
      const serverErr = err?.response?.data?.error || err?.response?.data?.detail;
      if (serverErr) {
        setErrorMessage(serverErr);
      } else if (isRegistering) {
        setErrorMessage('Could not register account. The username may already be taken.');
      } else {
        setErrorMessage('Invalid username or password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>{isRegistering ? 'Create your Account' : 'Welcome Back'}</h2>
          <p className="text-secondary">
            {isRegistering
              ? 'Join FreshMart to save your delivery addresses and track live orders.'
              : 'Sign in to access your saved basket, wishlist, and past orders.'}
          </p>
        </div>

        {errorMessage && (
          <div className="auth-error-banner" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth_user">Username</label>
            <input
              id="auth_user"
              type="text"
              placeholder="e.g. freshuser"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label htmlFor="auth_email">Email (optional)</label>
              <input
                id="auth_email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth_pass">Password</label>
            <input
              id="auth_pass"
              type="password"
              placeholder={isRegistering ? 'Minimum 6 characters' : 'Enter your password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
            />
          </div>

          <button className="btn-primary full auth-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : (isRegistering ? 'Create FreshMart Account' : 'Sign In')}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            {isRegistering ? 'Already have an account?' : "Don't have an account yet?"}
            {' '}
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMessage('');
              }}
            >
              {isRegistering ? 'Sign In instead' : 'Create an Account'}
            </button>
          </p>

          <button type="button" className="btn-text" onClick={() => setPage('shop')} style={{ marginTop: '12px' }}>
            ← Return to Groceries
          </button>
        </div>
      </div>
    </div>
  );
}
