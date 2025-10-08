/**
 * Profile Photo Utilities
 * Helper functions for handling profile photos across the application
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Generate profile photo URL from user data
 * @param user - User object with potential profilePhoto field
 * @returns Full URL to profile photo or null if not available
 */
export const getProfilePhotoUrl = (user: any): string | null => {
  if (!user?.profilePhoto) {
    return null;
  }
  
  // If profilePhoto already includes the domain, return as-is
  if (user.profilePhoto.startsWith('http')) {
    return user.profilePhoto;
  }
  
  // Construct full URL
  return `${API_BASE_URL}${user.profilePhoto}`;
};

/**
 * Generate avatar props for Avatar component
 * @param user - User object with username, email, and optional profilePhoto
 * @param size - Size variant for the avatar
 * @returns Props object for Avatar component
 */
export const getAvatarProps = (
  user: { username?: string; email?: string; profilePhoto?: string } | null,
  size: 'small' | 'medium' | 'large' = 'medium'
) => {
  if (!user) {
    return {
      alt: 'Unknown User',
      size,
      src: undefined
    };
  }

  const profilePhotoUrl = getProfilePhotoUrl(user);
  const displayName = user.username || user.email?.split('@')[0] || 'User';
  
  return {
    alt: displayName,
    size,
    src: profilePhotoUrl || undefined
  };
};

/**
 * Get initials for user when profile photo is not available
 * @param user - User object with username or email
 * @returns Single character initial
 */
export const getUserInitial = (user: { username?: string; email?: string } | null): string => {
  if (!user) {
    return 'U';
  }
  
  const name = user.username || user.email?.split('@')[0] || 'User';
  return name.charAt(0).toUpperCase();
};

/**
 * Get display name for user
 * @param user - User object with username or email
 * @returns Display name
 */
export const getDisplayName = (user: { username?: string; email?: string } | null): string => {
  if (!user) {
    return 'Unknown User';
  }
  
  return user.username || user.email?.split('@')[0] || 'User';
};

/**
 * Check if user has a profile photo
 * @param user - User object with potential profilePhoto field
 * @returns Boolean indicating if profile photo exists
 */
export const hasProfilePhoto = (user: any): boolean => {
  return !!(user?.profilePhoto);
};