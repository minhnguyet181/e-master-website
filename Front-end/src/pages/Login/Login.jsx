import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { login } from '../../services/authService';
import api from '../../api/api';
import './Login.css';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.657-3.444-11.303-8H6.306C9.656,39.663,16.318,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.02,35.816,44,30.271,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login({ username, password });
      if (result.success) {
        console.log('Login successful:', result.user);
        // Ensure token saved before making protected calls
        const token = result.token || localStorage.getItem('token');
        if (!token) {
          setError('Login succeeded but no token received. Please try again or contact support.');
          setLoading(false);
          return;
        }

        // After login, check whether the user already has a generated plan / progress
        try {
          const progressResp = await api.progress.getProgress();
          // if we get data, route to dashboard/progress
          navigate('/dashboard');
        } catch (pErr) {
          // if 404 -> no progress/plan yet, redirect to generate-plan
          if (pErr.response?.status === 404) {
            navigate('/user/generate-plan');
          } else if (pErr.response?.status === 401 || pErr.response?.status === 403) {
            // session issue - force login
            setError('Session error. Please login again.');
            localStorage.removeItem('token');
          } else {
            // other errors - go to dashboard as fallback
            navigate('/dashboard');
          }
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please check backend server.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">
        <span className="title-bar"></span>Login
      </h1>
      
      <button className="google-btn">
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="divider">
        <div className="divider-line"></div>
        <span className="divider-text">Or enter your account</span>
        <div className="divider-line"></div>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="error-message" style={{color: '#d32f2f', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px'}}>{error}</div>}
        
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            User Name or Email
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            required
            aria-label="User Name or Email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
              aria-label="Password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
          </div>
        </div>

        <div className="form-options">
          <div className="remember-me">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe">
              Remember me
            </label>
          </div>
          <a href="#" className="forgot-password">
            Forgot password?
          </a>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p className="signup-link">
        Haven't had an account?{' '}
        <Link to="/signup">
          Sign up here
        </Link>
      </p>
    </div>
  );
}