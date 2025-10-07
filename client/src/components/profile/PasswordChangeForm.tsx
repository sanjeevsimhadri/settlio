import React, { useState } from 'react';
import { Input, LoadingButton, Alert } from '../ui';
import { authAPI } from '../../services/api';

interface PasswordChangeFormProps {
  onSave?: () => void;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Current password validation
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is different from current
    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear success/error messages
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      setSuccess('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onSave?.();
    } catch (err: any) {
      setError(err.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = 
    formData.currentPassword.trim() ||
    formData.newPassword.trim() ||
    formData.confirmPassword.trim();

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?\":{}|<>]/.test(password),
      password.length >= 12
    ];
    
    strength = checks.filter(Boolean).length;
    
    if (strength < 3) {
      return { strength, label: 'Weak', color: 'text-red-600' };
    } else if (strength < 5) {
      return { strength, label: 'Medium', color: 'text-yellow-600' };
    } else {
      return { strength, label: 'Strong', color: 'text-green-600' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert type="error" message={error} />
      )}
      
      {success && (
        <Alert type="success" message={success} />
      )}

      <div className="space-y-6">
        <div>
          <Input
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange('currentPassword')}
            error={errors.currentPassword}
            placeholder="Enter your current password"
            required
            helperText="We need to verify your current password"
          />
        </div>

        <div>
          <Input
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange('newPassword')}
            error={errors.newPassword}
            placeholder="Enter your new password"
            required
          />
          
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Password strength:</span>
                <span className={`font-medium ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    passwordStrength.strength < 3 ? 'bg-red-500' :
                    passwordStrength.strength < 5 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li className={formData.newPassword.length >= 8 ? 'text-green-600' : ''}>
                    At least 8 characters
                  </li>
                  <li className={/[a-z]/.test(formData.newPassword) ? 'text-green-600' : ''}>
                    One lowercase letter
                  </li>
                  <li className={/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : ''}>
                    One uppercase letter
                  </li>
                  <li className={/\d/.test(formData.newPassword) ? 'text-green-600' : ''}>
                    One number
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div>
          <Input
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={errors.confirmPassword}
            placeholder="Confirm your new password"
            required
            helperText="Re-enter your new password to confirm"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <LoadingButton
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={!hasData}
        >
          Change Password
        </LoadingButton>
      </div>
    </form>
  );
};

export default PasswordChangeForm;