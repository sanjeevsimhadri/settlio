import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

const PhotoUploadTest: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('✅ File selected:', file.name, file.type, file.size);
    setMessage(`File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    if (!file.type.startsWith('image/')) {
      setMessage('❌ Error: Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ Error: File too large (max 5MB)');
      return;
    }

    setIsLoading(true);
    setMessage('🚀 Uploading...');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      console.log('📡 Calling upload API...');
      
      // Upload file
      const response = await authAPI.uploadProfilePhoto(formData);
      console.log('📥 Upload response:', response);

      if (response.success) {
        console.log('🔄 Updating user context...');
        // Update user context
        await updateUser({ profilePhoto: response.data.profilePhoto });
        console.log('✅ User context updated');
        
        setMessage(`✅ Upload successful! Photo URL: ${response.data.profilePhoto}`);
        
        // Clear input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setMessage('❌ Upload failed: Server returned unsuccessful response');
      }
    } catch (error: any) {
      console.error('💥 Upload error:', error);
      setMessage(`❌ Upload failed: ${error.error || error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    console.log('🖱️ Button clicked');
    console.log('📁 File input ref:', fileInputRef.current);
    
    if (fileInputRef.current) {
      console.log('✅ Triggering file input');
      fileInputRef.current.click();
    } else {
      console.error('❌ File input ref is null');
      setMessage('❌ File input not found');
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #e5e7eb', 
      borderRadius: '8px', 
      margin: '20px 0',
      backgroundColor: '#f9fafb'
    }}>
      <h3 style={{ color: '#1f2937', marginBottom: '16px' }}>🧪 Photo Upload Test</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <p><strong>Current User:</strong> {user?.username || 'Not logged in'}</p>
        <p><strong>Current Photo:</strong> {user?.profilePhoto || 'None'}</p>
        {user?.profilePhoto && (
          <img 
            src={`http://localhost:5000${user.profilePhoto}`} 
            alt="Current profile" 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '2px solid #d1d5db',
              marginTop: '8px'
            }} 
          />
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={handleButtonClick}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {isLoading ? '⏳ Uploading...' : '📁 Select Photo'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {message && (
        <div style={{
          padding: '12px',
          backgroundColor: message.includes('❌') ? '#fef2f2' : 
                          message.includes('✅') ? '#f0fdf4' : '#fefce8',
          border: `1px solid ${message.includes('❌') ? '#fca5a5' : 
                                message.includes('✅') ? '#86efac' : '#fde047'}`,
          borderRadius: '6px',
          fontSize: '14px',
          wordBreak: 'break-all'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default PhotoUploadTest;