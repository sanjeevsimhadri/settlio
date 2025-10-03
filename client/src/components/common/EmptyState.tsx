import React from 'react';
import './Common.css';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionButton?: {
    text: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  actionButton 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionButton && (
        <button
          className={`button ${actionButton.variant || 'primary'}`}
          onClick={actionButton.onClick}
        >
          {actionButton.text}
        </button>
      )}
    </div>
  );
};

export default EmptyState;