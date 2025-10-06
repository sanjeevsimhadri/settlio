/**
 * Utility functions for date formatting and display
 */

/**
 * Format a date for display in record views
 * @param dateInput - ISO string, timestamp, or Date object
 * @returns Formatted date string (e.g., "October 6, 2025 – 10:30 AM")
 */
export const formatCreatedAt = (dateInput: string | number | Date): string => {
  try {
    const date = new Date(dateInput);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
};

/**
 * Format a relative time (e.g., "2 hours ago", "Yesterday")
 * @param dateInput - ISO string, timestamp, or Date object
 * @returns Relative time string
 */
export const formatRelativeTime = (dateInput: string | number | Date): string => {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }

    // For older dates, show the full date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

/**
 * Resolve creator name from user ID or return the name directly
 * @param createdBy - User ID, name, or user object
 * @param users - Optional array of users for ID lookup
 * @returns Formatted creator string
 */
export const formatCreatedBy = (
  createdBy: string | { _id?: string; id?: string; name?: string; username?: string; email?: string } | undefined,
  users?: Array<{ _id?: string; id?: string; name?: string; username?: string; email?: string }>
): string => {
  if (!createdBy) {
    return 'Unknown user';
  }

  // If createdBy is a string (could be ID or name)
  if (typeof createdBy === 'string') {
    // Try to find user by ID if users array is provided
    if (users && users.length > 0) {
      const user = users.find(u => u._id === createdBy || u.id === createdBy);
      if (user) {
        return user.name || user.username || user.email || 'Unknown user';
      }
    }
    
    // If it looks like an email or name, return it
    if (createdBy.includes('@') || createdBy.includes(' ') || createdBy.length < 24) {
      return createdBy;
    }
    
    // Likely an ID we can't resolve
    return 'Unknown user';
  }

  // If createdBy is an object
  if (typeof createdBy === 'object') {
    return createdBy.name || createdBy.username || createdBy.email || 'Unknown user';
  }

  return 'Unknown user';
};

/**
 * Get a complete creation info string
 * @param createdAt - Creation date
 * @param createdBy - Creator info
 * @param users - Optional users array for lookup
 * @returns Complete creation info (e.g., "Created by John Doe on October 6, 2025 – 10:30 AM")
 */
export const formatCreationInfo = (
  createdAt: string | number | Date,
  createdBy?: string | { _id?: string; id?: string; name?: string; username?: string; email?: string },
  users?: Array<{ _id?: string; id?: string; name?: string; username?: string; email?: string }>
): string => {
  const date = formatCreatedAt(createdAt);
  const creator = formatCreatedBy(createdBy, users);
  
  return `Created by ${creator} on ${date}`;
};