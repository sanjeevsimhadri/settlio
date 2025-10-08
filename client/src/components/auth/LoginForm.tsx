import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema, LoginFormData } from '../../utils/validation';
import { LoadingButton, Alert, Input, Card } from '../ui';
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
      console.log('🔐 Login attempt:', { identifier: data.identifier, passwordLength: data.password.length });
      setSubmitError('');
      await login(data);
      console.log('✅ Login successful');
      reset();
      // Navigation will happen automatically via useEffect above
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setSubmitError(error.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" padding="large">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your Settlio account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Identifier Field */}
          <div>
            <Input
              label="Email or Mobile Number"
              type="text"
              {...register('identifier')}
              error={errors.identifier?.message}
              placeholder="Enter email or 10-digit mobile number"
              autoComplete="username"
              fullWidth
              aria-describedby="identifier-help"
            />
            <p id="identifier-help" className="input-help-text">
              Enter your email address or 10-digit mobile number (e.g., 9494698235)
            </p>
          </div>

          {/* Password Field */}
          <Input
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            placeholder="Enter your password"
            autoComplete="current-password"
            fullWidth
            aria-describedby="password-help"
          />

          {/* Error Messages */}
          {(error || submitError) && (
            <Alert
              type="error"
              message={error || submitError}
              className="auth-alert"
            />
          )}

          {/* Submit Button */}
          <LoadingButton
            type="submit"
            isLoading={isSubmitting || isLoading}
            disabled={isSubmitting || isLoading}
            variant="primary"
            size="lg"
            className="auth-button-full"
            loadingText="Signing In..."
            aria-label="Sign in to your account"
          >
            Sign In
          </LoadingButton>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginForm;