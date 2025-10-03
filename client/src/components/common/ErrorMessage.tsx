import React from 'react';
import './Common.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  retryText = 'Try Again' 
}) => {
  return (
    <div className="error-state">
      <div className="alert error">
        {message}
      </div>
      {onRetry && (
        <button
          className="button secondary"
          onClick={onRetry}
        >
          {retryText}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;