import React, { useState } from 'react';
import { Input, LoadingButton, Alert } from '../ui';
import PhoneInput from '../ui/PhoneInput';
import { useAuth } from '../../contexts/AuthContext';

interface PersonalDetailsFormProps {
  onSave?: () => void;
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({ onSave }) => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(formData.name)) {
      newErrors.name = 'Name can only contain letters, spaces, hyphens, apostrophes, and dots';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Mobile validation (optional but must be valid if provided)
    if (formData.mobile.trim()) {
      const cleanedMobile = formData.mobile.replace(/[\s-()]/g, '');
      const mobileRegex = /^\+[1-9]\d{1,14}$/;
      if (!mobileRegex.test(cleanedMobile)) {
        newErrors.mobile = 'Please enter a valid mobile number with country code';
      } else if (cleanedMobile.length < 8 || cleanedMobile.length > 16) {
        newErrors.mobile = 'Mobile number must be between 8-16 digits including country code';
      }
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
      // Only send fields that have changed
      const updatedFields: any = {};
      if (formData.name !== user?.name) updatedFields.name = formData.name;
      if (formData.email !== user?.email) updatedFields.email = formData.email;
      if (formData.mobile !== user?.mobile) updatedFields.mobile = formData.mobile;

      if (Object.keys(updatedFields).length === 0) {
        setSuccess('No changes to save');
        return;
      }

      await updateUser(updatedFields);
      setSuccess('Personal details updated successfully!');
      onSave?.();
    } catch (err: any) {
      setError(err.message || 'Failed to update personal details');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = 
    formData.name !== user?.name ||
    formData.email !== user?.email ||
    formData.mobile !== user?.mobile;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert type="error" message={error} />
      )}
      
      {success && (
        <Alert type="success" message={success} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <Input
            label="Name"
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={errors.name}
            placeholder="Enter your full name"
            required
            helperText="Your display name (2-50 characters, spaces allowed)"
          />
        </div>

        <div className="md:col-span-1">
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            placeholder="Enter your email address"
            required
            helperText="We'll use this for account-related communications"
          />
        </div>

        <div className="md:col-span-2">
          <PhoneInput
            label="Mobile Number"
            value={formData.mobile}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, mobile: value }));
              if (errors.mobile) {
                setErrors(prev => ({ ...prev, mobile: '' }));
              }
              setError(null);
              setSuccess(null);
            }}
            error={errors.mobile}
            placeholder="Enter phone number"
            helperText="Include country code for international numbers (optional)"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <LoadingButton
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={!hasChanges}
        >
          Save Changes
        </LoadingButton>
      </div>
    </form>
  );
};

export default PersonalDetailsForm;