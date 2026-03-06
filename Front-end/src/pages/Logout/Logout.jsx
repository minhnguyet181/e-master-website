import React, { useState } from 'react';
import './Logout.css';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

const Logout = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await api.auth.logout();
      
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        console.warn('Could not clear localStorage', e);
      }
      
      navigate('/logout/success');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="logout-card">
      {error && <div style={{color: '#d32f2f', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px'}}>{error}</div>}
      <div className="icon-container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </div>
      <h2 className="logout-title">Log Out</h2>
      <p className="logout-text">Are you sure you want to sign out of your account?</p>
      <div className="button-container">
        <button
          onClick={handleCancel}
          className="logout-button cancel-button"
          aria-label="Cancel logout"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={handleLogout}
          className="logout-button confirm-button"
          aria-label="Confirm logout"
          disabled={isLoading}
        >
          {isLoading ? 'Logging out...' : 'Log Out'}
        </button>
      </div>
    </div>
  );
};

export default Logout;
