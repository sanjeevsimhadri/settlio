import React from 'react';
import './Common.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  return (
    <div className="loading-state">
      <div className={`spinner ${size}`}></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;