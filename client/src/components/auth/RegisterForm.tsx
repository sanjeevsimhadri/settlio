import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registerSchema, RegisterFormData } from '../../utils/validation';
import './Auth.css';

const RegisterForm: React.FC = () => {
  const { register: registerUser, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  // Watch password field to validate confirm password in real-time
  const password = watch('password');

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

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setSubmitError('');
      // Remove confirmPassword from the data before sending to API
      const { confirmPassword, ...registrationData } = data;
      await registerUser(registrationData);
      reset();
      // Navigation will happen automatically via useEffect above
    } catch (error: any) {
      setSubmitError(error.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Join Settlio</h1>
          <p>Create your account to start splitting expenses</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register('username')}
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="Choose a username"
              autoComplete="username"
            />
            {errors.username && (
              <span className="error-message">{errors.username.message}</span>
            )}
          </div>

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
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Password Requirements */}
          <div className="password-requirements">
            <p className="requirements-title">Password must contain:</p>
            <ul className="requirements-list">
              <li className={password && /[a-z]/.test(password) ? 'valid' : ''}>
                At least one lowercase letter
              </li>
              <li className={password && /[A-Z]/.test(password) ? 'valid' : ''}>
                At least one uppercase letter
              </li>
              <li className={password && /[0-9]/.test(password) ? 'valid' : ''}>
                At least one number
              </li>
              <li className={password && /[!@#\$%\^&\*]/.test(password) ? 'valid' : ''}>
                At least one special character
              </li>
              <li className={password && password.length >= 6 ? 'valid' : ''}>
                At least 6 characters
              </li>
            </ul>
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
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;