import React from 'react';
import './Logout.css';
import { Link } from 'react-router-dom';

const LogoutSuccess = () => {
  return (
    <div className="logout-card">
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
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
  <h2 className="logout-title">Logged Out</h2>
  <p className="logout-text">You have successfully signed out of your account.</p>

      <div className="button-container">
        <Link to="/login" className="logout-button confirm-button" aria-label="Sign in again">
          Sign in Again
        </Link>
        <Link to="/" className="logout-button cancel-button" aria-label="Go to homepage">
          Homepage
        </Link>
      </div>
    </div>
  );
};

export default LogoutSuccess;
