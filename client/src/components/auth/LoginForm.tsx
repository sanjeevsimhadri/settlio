import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema, LoginFormData } from '../../utils/validation';
import './Auth.css';

const LoginForm: React.FC = () => {
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
    setSubmitError('');
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setSubmitError('');
      await login(data);
      reset();
      // Navigation will happen automatically via useEffect above
    } catch (error: any) {
      setSubmitError(error.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your Settlio account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          {/* Error Messages */}
          {(error || submitError) && (
            <div className="alert error">
              {error || submitError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="auth-button primary"
          >
            {isSubmitting || isLoading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;