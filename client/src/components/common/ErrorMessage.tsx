import React from 'react';
import { LoadingButton } from '../ui';
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
        <LoadingButton
          variant="secondary"
          onClick={onRetry}
        >
          {retryText}
        </LoadingButton>
      )}
    </div>
  );
};

export default ErrorMessage;