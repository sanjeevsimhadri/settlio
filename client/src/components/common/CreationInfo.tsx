import React from 'react';
import { Badge, Avatar } from '../ui';
import { formatCreatedAt, formatCreatedBy, formatRelativeTime } from '../../utils/dateUtils';
import './CreationInfo.css';

export interface CreationInfoProps {
  createdAt: string | number | Date;
  createdBy?: string | { _id?: string; id?: string; name?: string; username?: string; email?: string };
  users?: Array<{ _id?: string; id?: string; name?: string; username?: string; email?: string }>;
  showAvatar?: boolean;
  showRelativeTime?: boolean;
  layout?: 'horizontal' | 'vertical' | 'compact';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const CreationInfo: React.FC<CreationInfoProps> = ({
  createdAt,
  createdBy,
  users,
  showAvatar = false,
  showRelativeTime = false,
  layout = 'horizontal',
  size = 'medium',
  className = '',
}) => {
  const createdByUser = createdBy && typeof createdBy === 'object' ? createdBy : undefined;
  const creatorName = formatCreatedBy(createdBy, users);
  const formattedDate = showRelativeTime ? formatRelativeTime(createdAt) : formatCreatedAt(createdAt);

  const containerClass = `creation-info creation-info--${layout} creation-info--${size} ${className}`.trim();
  
  const textSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[size];

  if (layout === 'compact') {
    return (
      <div className={`${containerClass} ${textSizeClass} text-gray-600 flex items-center gap-2`}>
        {showAvatar && createdByUser && (
          <Avatar
            alt={creatorName}
            size={size === 'large' ? 'medium' : 'small'}
            className="flex-shrink-0"
          />
        )}
        <span className="truncate">
          By {creatorName} • {formattedDate}
        </span>
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={`${containerClass} space-y-1`}>
        <div className={`flex items-center gap-2 ${textSizeClass}`}>
          {showAvatar && createdByUser && (
            <Avatar
              alt={creatorName}
              size={size === 'large' ? 'medium' : 'small'}
              className="flex-shrink-0"
            />
          )}
          <span className="text-gray-700 font-medium">
            Created by {creatorName}
          </span>
        </div>
        <div className={`${textSizeClass} text-gray-500`}>
          {formattedDate}
        </div>
      </div>
    );
  }

  // Default horizontal layout
  return (
    <div className={`${containerClass} flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showAvatar && createdByUser && (
          <Avatar
            alt={creatorName}
            size={size === 'large' ? 'medium' : 'small'}
            className="flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className={`${textSizeClass} text-gray-700 font-medium truncate`}>
            Created by {creatorName}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Badge variant="secondary" size="small">
          {formattedDate}
        </Badge>
      </div>
    </div>
  );
};

export interface RecordHeaderProps {
  title: string;
  subtitle?: string;
  createdAt: string | number | Date;
  createdBy?: string | { _id?: string; id?: string; name?: string; username?: string; email?: string };
  users?: Array<{ _id?: string; id?: string; name?: string; username?: string; email?: string }>;
  actions?: React.ReactNode;
  showAvatar?: boolean;
  className?: string;
}

/**
 * A comprehensive header component for record displays that includes title, creation info, and actions
 */
export const RecordHeader: React.FC<RecordHeaderProps> = ({
  title,
  subtitle,
  createdAt,
  createdBy,
  users,
  actions,
  showAvatar = true,
  className = '',
}) => {
  return (
    <div className={`record-header ${className}`.trim()}>
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      <CreationInfo
        createdAt={createdAt}
        createdBy={createdBy}
        users={users}
        showAvatar={showAvatar}
        layout="horizontal"
        size="medium"
      />
    </div>
  );
};

export default CreationInfo;