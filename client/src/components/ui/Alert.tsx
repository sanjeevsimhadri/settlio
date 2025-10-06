import React from 'react';
import './UI.css';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
  showIcon?: boolean;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      );
    case 'error':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      );
    case 'warning':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
      );
    case 'info':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      );
    default:
      return null;
  }
};

export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  onClose,
  className = '',
  showIcon = true,
}) => {
  return (
    <div 
      className={`alert alert--${type} ${className}`.trim()}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <div className="alert__icon" aria-hidden="true">
          {getIcon(type)}
        </div>
      )}
      <div className="alert__content">
        <span className="alert__message">{message}</span>
      </div>
      {onClose && (
        <button
          className="alert__close"
          onClick={onClose}
          aria-label="Close alert"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="assertive">
      <div className="toast__icon" aria-hidden="true">
        {getIcon(type)}
      </div>
      <div className="toast__content">
        <span className="toast__message">{message}</span>
      </div>
      <button
        className="toast__close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  );
};

export default Alert;