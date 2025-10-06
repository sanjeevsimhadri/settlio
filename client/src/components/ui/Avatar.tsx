import React from 'react';

export interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  fallback?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'medium',
  className = '',
  fallback,
  onClick,
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base',
    xlarge: 'w-16 h-16 text-lg',
  };

  const avatarClasses = [
    'inline-flex items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600 select-none',
    sizeClasses[size],
    onClick && 'cursor-pointer hover:bg-gray-200 transition-colors',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleError = () => {
    setImageError(true);
  };

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt}
        className={avatarClasses}
        onError={handleError}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
      />
    );
  }

  const displayText = fallback || getInitials(alt);

  return (
    <div
      className={avatarClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={alt}
    >
      {displayText}
    </div>
  );
};

export default Avatar;