import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';

// Mock axios to avoid actual API calls in tests
jest.mock('axios');

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

test('renders login form', () => {
  renderWithProviders(<LoginForm />);
  expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});

test('renders registration form elements', () => {
  const RegisterForm = require('../components/auth/RegisterForm').default;
  renderWithProviders(<RegisterForm />);
  expect(screen.getByText('Join Settlio')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
});