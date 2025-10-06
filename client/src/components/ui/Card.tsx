import React from 'react';
import './UI.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
}

export interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  actions,
  avatar,
  className = '',
}) => (
  <div className={`card__header ${className}`.trim()}>
    <div className="card__header-content">
      {avatar && <div className="card__avatar">{avatar}</div>}
      <div className="card__header-text">
        {title && <h3 className="card__title">{title}</h3>}
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="card__actions">{actions}</div>}
  </div>
);

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`card__body ${className}`.trim()}>
    {children}
  </div>
);

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  align = 'left',
}) => (
  <div className={`card__footer card__footer--${align} ${className}`.trim()}>
    {children}
  </div>
);

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'medium',
  hover = false,
  onClick,
  header,
  footer,
  loading = false,
}) => {
  const cardClasses = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    hover && 'card--hover',
    onClick && 'card--clickable',
    loading && 'card--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={cardClasses}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      disabled={loading}
      aria-busy={loading}
    >
      {loading && (
        <div className="card__loading" aria-hidden="true">
          <div className="spinner"></div>
        </div>
      )}
      
      {header && <div className="card__header-wrapper">{header}</div>}
      
      <div className="card__content">
        {children}
      </div>
      
      {footer && <div className="card__footer-wrapper">{footer}</div>}
    </CardComponent>
  );
};

export default Card;