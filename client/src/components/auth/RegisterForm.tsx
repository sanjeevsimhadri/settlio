import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registerSchema, RegisterFormData, normalizeMobileForRegistration } from '../../utils/validation';
import { LoadingButton, Alert, Input, Card } from '../ui';
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
      // Remove confirmPassword and normalize mobile number
      const { confirmPassword, ...registrationData } = data;
      registrationData.mobile = normalizeMobileForRegistration(registrationData.mobile);
      await registerUser(registrationData);
      reset();
      // Navigation will happen automatically via useEffect above
    } catch (error: any) {
      setSubmitError(error.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" padding="large">
        <div className="auth-header">
          <h1>Join Settlio</h1>
          <p>Create your account to start splitting expenses</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Name Field */}
          <Input
            label="Full Name"
            type="text"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Enter your full name"
            autoComplete="name"
            fullWidth
            required
          />

          {/* Email Field */}
          <Input
            label="Email Address"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="Enter your email"
            autoComplete="email"
            fullWidth
            required
          />

          {/* Mobile Number Field */}
          <Input
            label="Mobile Number"
            type="tel"
            {...register('mobile')}
            error={errors.mobile?.message}
            placeholder="Enter 10-digit mobile number"
            autoComplete="tel"
            fullWidth
            required
            helperText="Enter your mobile number (e.g., 9494698235 or +919494698235)"
          />

          {/* Password Field */}
          <Input
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            placeholder="Create a strong password"
            autoComplete="new-password"
            fullWidth
          />

          {/* Confirm Password Field */}
          <Input
            label="Confirm Password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder="Confirm your password"
            autoComplete="new-password"
            fullWidth
          />

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
            loadingText="Creating Account..."
            aria-label="Create your Settlio account"
          >
            Create Account
          </LoadingButton>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RegisterForm;