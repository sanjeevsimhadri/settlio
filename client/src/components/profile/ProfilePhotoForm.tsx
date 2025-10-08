import React, { useState, useRef } from 'react';
import { LoadingButton, Alert } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import ImageCropperModal from './ImageCropperModal';
import './ProfilePhoto.css';

interface ProfilePhotoFormProps {
  onSave?: () => void;
}

const ProfilePhotoForm: React.FC<ProfilePhotoFormProps> = ({ onSave }) => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing || isLoading) {
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsProcessing(false);
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image size must be less than 5MB');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsProcessing(false);
        return;
      }

      setSelectedImage(file);
      setShowCropper(true);
      setError(null);
      setSuccess(null);
    } else {
      setIsProcessing(false);
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('profilePhoto', croppedImageBlob, 'profile-photo.jpg');

      // Upload the cropped image
      const response = await authAPI.uploadProfilePhoto(formData);
      
      if (response.success) {
        // Update user context with new profile photo
        await updateUser({ profilePhoto: response.data.profilePhoto });
        setSuccess('Profile photo updated successfully!');
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onSave?.();
      }
    } catch (err: any) {
      setError(err.error || 'Failed to update profile photo');
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
      setShowCropper(false);
      setIsProcessing(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.profilePhoto) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUser({ profilePhoto: '' });
      setSuccess('Profile photo removed successfully!');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSave?.();
    } catch (err: any) {
      setError(err.error || 'Failed to remove profile photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isLoading || isProcessing) {
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="profile-photo-form">
      {error && (
        <Alert type="error" message={error} />
      )}
      
      {success && (
        <Alert type="success" message={success} />
      )}

      <div className="profile-photo-content">
        {/* Profile Photo Display */}
        <div className="profile-photo-display">
          <div className="profile-photo-avatar">
            {user?.profilePhoto ? (
              <img src={`http://localhost:5000${user.profilePhoto}`} alt={user?.name || user?.username || 'Profile'} />
            ) : (
              user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          
          <div className="profile-photo-info">
            <p>Profile Photo</p>
            <p>JPG, PNG up to 5MB</p>
          </div>
        </div>

        {/* Upload Controls */}
        <div className="profile-photo-controls">
          <div className="profile-photo-buttons">
            <div className="button-group">
              <LoadingButton
                variant="primary"
                onClick={handleUploadClick}
                isLoading={isLoading}
                disabled={isLoading || isProcessing}
              >
                {user?.profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </LoadingButton>
              
              {user?.profilePhoto && (
                <LoadingButton
                  variant="secondary"
                  onClick={handleRemovePhoto}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  Remove Photo
                </LoadingButton>
              )}
            </div>
          </div>

          <div className="profile-photo-guidelines">
            <p>
              <strong>Photo Guidelines:</strong>
            </p>
            <ul>
              <li>Use a clear, recent photo of yourself</li>
              <li>Square photos work best (will be cropped to circle)</li>
              <li>Avoid group photos or photos with text</li>
              <li>Good lighting and high contrast recommended</li>
              <li>File formats: JPG, PNG, GIF</li>
              <li>Maximum file size: 5MB</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="profile-photo-hidden-input"
      />

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={showCropper}
        onClose={() => {
          setShowCropper(false);
          setSelectedImage(null);
          setIsProcessing(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        onCropComplete={handleCropComplete}
        selectedImage={selectedImage}
      />
    </div>
  );
};

export default ProfilePhotoForm;