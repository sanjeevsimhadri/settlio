import React from 'react';
import './UI.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
}

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  placeholder?: string;
  children: React.ReactNode;
}

const InputBase: React.FC<{
  label?: string;
  error?: string;
  helperText?: string;
  variant?: string;
  size?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}> = ({ label, error, helperText, variant, size, fullWidth, children, htmlFor }) => {
  const fieldClasses = [
    'form-field',
    variant && `form-field--${variant}`,
    size && `form-field--${size}`,
    fullWidth && 'form-field--full-width',
    error && 'form-field--error',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fieldClasses}>
      {label && (
        <label className="form-field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      <div className="form-field__input-wrapper">
        {children}
      </div>
      {(error || helperText) && (
        <div className="form-field__helper">
          {error ? (
            <span className="form-field__error" role="alert" aria-live="polite">
              {error}
            </span>
          ) : (
            <span className="form-field__helper-text">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'outlined',
      size = 'medium',
      fullWidth = false,
      startIcon,
      endIcon,
      loading = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    
    const inputClasses = [
      'form-input',
      startIcon && 'form-input--with-start-icon',
      endIcon && 'form-input--with-end-icon',
      loading && 'form-input--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <InputBase
        label={label}
        error={error}
        helperText={helperText}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        htmlFor={inputId}
      >
        {startIcon && (
          <div className="form-input__icon form-input__icon--start" aria-hidden="true">
            {startIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          disabled={loading}
          {...props}
        />
        {(endIcon || loading) && (
          <div className="form-input__icon form-input__icon--end" aria-hidden="true">
            {loading ? (
              <div className="spinner spinner--small"></div>
            ) : (
              endIcon
            )}
          </div>
        )}
      </InputBase>
    );
  }
);

Input.displayName = 'Input';

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'outlined',
      size = 'medium',
      fullWidth = false,
      resize = 'vertical',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    
    const textareaClasses = [
      'form-textarea',
      `form-textarea--resize-${resize}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <InputBase
        label={label}
        error={error}
        helperText={helperText}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        htmlFor={textareaId}
      >
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
      </InputBase>
    );
  }
);

TextArea.displayName = 'TextArea';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'outlined',
      size = 'medium',
      fullWidth = false,
      placeholder,
      children,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId();
    
    const selectClasses = [
      'form-select',
      placeholder && !props.value && 'form-select--placeholder',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <InputBase
        label={label}
        error={error}
        helperText={helperText}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        htmlFor={selectId}
      >
        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <div className="form-select__icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </div>
      </InputBase>
    );
  }
);

Select.displayName = 'Select';

export default Input;