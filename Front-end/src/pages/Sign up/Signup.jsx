import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import '../Sign up/Signup.css';
import { signup } from '../../services/authService';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" className="google-icon">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.657-3.444-11.303-8H6.306C9.656,39.663,16.318,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.02,35.816,44,30.271,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function SignUp() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const resp = await signup({ username, email, password });
            if (resp && resp.success) {
                if (resp.token) {
                    localStorage.setItem('token', resp.token);
                }
                try {
                    localStorage.setItem('user', JSON.stringify(resp.user));
                } catch (err) {
                    console.warn('Could not save user to localStorage', err);
                }

                const redirectTo = location && location.state && location.state.redirectTo ? location.state.redirectTo : '/user/generate-plan';
                navigate(redirectTo);
            } else {
                const msg = resp && resp.message ? resp.message : 'Signup failed';
                setError(msg);
            }
        } catch (err) {
            console.error('Signup error', err);
            setError('An error occurred while signing up. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="signup-box">
                <h1>Create an account</h1>

                <button className="google-btn">
                    <GoogleIcon />
                    Continue with Google
                </button>

                <div className="divider">
                    <div className="divider-line"></div>
                    <span className="divider-text">Or enter your information</span>
                    <div className="divider-line"></div>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message" style={{color: '#d32f2f', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px'}}>{error}</div>}
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">
                            User Name
                        </label>
                        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="form-input" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email
                        </label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" required />
                    </div>
                    <div className="form-group password-group">
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
                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'Signing up...' : 'Submit'}
                    </button>
                </form>

                <p className="signin-link">
                    Had an account already?{' '}
                    <Link to="/login" className="link">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
}
