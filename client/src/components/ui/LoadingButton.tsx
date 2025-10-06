import React from 'react';
import './UI.css';

export interface LoadingButtonProps {
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
  'aria-label'?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  children,
  className = '',
  loadingText = 'Loading...',
  'aria-label': ariaLabel,
}) => {
  const baseClass = 'loading-button';
  const variantClass = `loading-button--${variant}`;
  const sizeClass = `loading-button--${size}`;
  const disabledClass = (isLoading || disabled) ? 'loading-button--disabled' : '';

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${disabledClass} ${className}`.trim()}
      onClick={onClick}
      disabled={isLoading || disabled}
      aria-label={ariaLabel}
      aria-busy={isLoading}
    >
      {isLoading && (
        <span className="loading-button__spinner" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="31.416"
              strokeDashoffset="31.416"
              className="loading-button__spinner-circle"
            />
          </svg>
        </span>
      )}
      <span className={isLoading ? 'loading-button__text--loading' : ''}>
        {isLoading ? loadingText : children}
      </span>
    </button>
  );
};

export default LoadingButton;