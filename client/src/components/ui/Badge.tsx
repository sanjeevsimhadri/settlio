import React from 'react';
import './UI.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  dot?: boolean;
}

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showText?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  dot = false,
}) => {
  const badgeClasses = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    dot && 'badge--dot',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses} role="status">
      {dot ? <span className="badge__dot" aria-hidden="true" /> : children}
    </span>
  );
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'medium',
  className = '',
  showText = false,
}) => {
  const statusText = {
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy',
  };

  const indicatorClasses = [
    'status-indicator',
    `status-indicator--${status}`,
    `status-indicator--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={indicatorClasses} role="status" aria-label={statusText[status]}>
      <span className="status-indicator__dot" aria-hidden="true" />
      {showText && <span className="status-indicator__text">{statusText[status]}</span>}
    </div>
  );
};

export default Badge;