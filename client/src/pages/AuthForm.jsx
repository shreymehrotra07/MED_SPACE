import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { TailSpin } from 'react-loader-spinner';
import { notify } from '../components/notification';
import '../styles/Login.css';
import { Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { mode } from '../store/atom';
import { databaseUrls } from '../data/databaseUrls';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    frontend: {},
    backend: {},
  });

  const [showPassword, setShowPassword] = useState({
    password: false,
  });

  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dark = useRecoilValue(mode);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors((prev) => ({
      ...prev,
      frontend: {
        ...prev.frontend,
        [e.target.name]: '',
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required (frontend)';
    if (!formData.password || formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters long';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({
        ...prev,
        frontend: validationErrors,
      }));
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(databaseUrls.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        notify('Login successful', 'success');
        window.location.href = '/profile';
      } else {
        if (data.errors) {
          const backendErrors = {};
          data.errors.forEach((error) => {
            backendErrors[error.field] = `${error.message} (backend)`;
          });
          setErrors((prev) => ({
            ...prev,
            backend: backendErrors,
          }));
        } else {
          notify(data.message || 'An error occurred. Please try again.', 'warn');
        }
      }
    } catch (error) {
      notify('Error connecting to the server', 'error');
      console.error('Network Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleGoogleSignIn = () => {
    const googleSignInWindow = window.open(
      'http://localhost:3000/auth/google',
      '_blank',
      'width=500,height=600'
    );

    window.addEventListener('message', (event) => {
      if (event.origin === 'https://medi-connect-f671.onrender.com') {
        const { token } = event.data;
        if (token) {
          localStorage.setItem('token', token);
          notify('Login successful', 'success');
          window.location.href = '/profile';
        }
      }
    });
  };

  return (
    <div
      className={`login_background ${
        dark === 'dark' ? ' text-yellow-400' : 'bg-white text-gray-900'
      }`}
    >
      <div className="auth-maindiv">
        <div
          className={`auth-container ${
            dark === 'dark' ? ' text-yellow-400' : 'bg-white text-gray-900'
          }`}
        >
          <h2
            className={`${
              dark === 'dark' ? ' text-yellow-400' : 'bg-white text-gray-700'
            } text-3xl font-bold mb-6`}
          >
            Login
          </h2>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-section">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.frontend.email && (
                <span className="error">{errors.frontend.email}</span>
              )}
              {errors.backend.email && (
                <span className="error">{errors.backend.email}</span>
              )}
            </div>

            <div className="form-section">
              <label>Password:</label>
              <div className="password-wrapper">
                <input
                  type={showPassword.password ? 'text' : 'password'}
                  name="password"
                  placeholder="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="password-toggle"
                >
                  {showPassword.password ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.frontend.password && (
                <span className="error">{errors.frontend.password}</span>
              )}
              {errors.backend.password && (
                <span className="error">{errors.backend.password}</span>
              )}
            </div>

            <div className="register-button">
              <button type="submit" className="auth-button">
                Login
              </button>
            </div>

            <div className="google-signin flex items-center justify-center">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="google-button flex items-center justify-center"
              >
                <FaGoogle className="mr-2" />
                Sign in with Google
              </button>
            </div>

            <Link to="/register" className="toggle-auth-button text-center">
              Don't have an account? Register
            </Link>
          </form>

          <div className="mt-4">
            <button
              onClick={() => navigate('/forgot-password')}
              className="auth-button"
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="loader-overlay">
          <TailSpin height="80" width="80" ariaLabel="loading" />
        </div>
      )}
    </div>
  );
};

export default AuthPage;
