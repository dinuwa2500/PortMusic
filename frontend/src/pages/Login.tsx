import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onNavigateRegister: () => void;
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateRegister, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff3344" className="auth-logo">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
          <h1>Sign In</h1>
          <p className="auth-subtitle">Welcome back to Music Free</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <button className="auth-link-btn" onClick={onNavigateRegister}>
            Create one
          </button>
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-main);
          padding: 24px;
        }

        .auth-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-logo {
          width: 56px;
          height: 56px;
          margin-bottom: 16px;
        }

        .auth-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .auth-subtitle {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-error {
          background: rgba(255, 51, 68, 0.1);
          border: 1px solid rgba(255, 51, 68, 0.3);
          color: #ff3344;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }

        .auth-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .auth-form .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .auth-form .form-group input {
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px 14px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 14px;
        }

        .auth-form .form-group input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }

        .auth-submit {
          background: var(--accent-gradient);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
          margin-top: 8px;
        }

        .auth-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .auth-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer-text {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .auth-link-btn {
          background: none;
          border: none;
          color: var(--accent-primary);
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .auth-link-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
