import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { createGroupSchema } from '../../utils/groupValidation';
import { groupsAPI, CreateGroupData } from '../../services/groupsAPI';
import { LoadingButton, Alert, Badge } from '../ui';
import './Groups.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(createGroupSchema),
    defaultValues: {
      name: '',
      memberEmails: ''
    }
  });

  const memberEmails = watch('memberEmails');

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSuccessMessage('');

      // Parse member emails
      const memberEmailsList = data.memberEmails
        ? data.memberEmails
            .split(',')
            .map((email: string) => email.trim())
            .filter((email: string) => email !== '')
        : [];

      const groupData: CreateGroupData = {
        name: data.name,
        members: memberEmailsList
      };

      const result = await groupsAPI.createGroup(groupData);
      
      // Show success message
      const memberCount = memberEmailsList.length;
      const successMsg = memberCount > 0 
        ? `Group "${data.name}" created successfully! ${memberCount} invitation${memberCount > 1 ? 's' : ''} sent.`
        : `Group "${data.name}" created successfully!`;
      
      setSuccessMessage(successMsg);
      
      // Brief delay to show success state
      setTimeout(() => {
        reset();
        setSuccessMessage('');
        onClose();
        onGroupCreated();
      }, 2000);

    } catch (error: any) {
      const errorMsg = error.error || 'Failed to create group. Please try again.';
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    reset();
    setSubmitError('');
    setSuccessMessage('');
    onClose();
  };

  const addSampleEmails = () => {
    const samples = 'john@example.com, jane@example.com, bob@example.com';
    setValue('memberEmails', samples);
  };

  // Parse member emails for preview
  const parsedEmails = memberEmails
    ? memberEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email !== '')
    : [];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content create-group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={isSubmitting}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="create-group-form">
          {/* Success Message */}
          {successMessage && (
            <Alert type="success" message={successMessage} />
          )}

          {/* Error Message */}
          {submitError && (
            <Alert type="error" message={submitError} />
          )}

          {/* Group Name */}
          <div className="form-group">
            <label htmlFor="groupName" className="form-label">
              Group Name *
            </label>
            <input
              id="groupName"
              type="text"
              {...register('name')}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter group name (e.g., 'Weekend Trip', 'Office Lunch')"
              disabled={isSubmitting}
            />
            {errors.name && (
              <span className="error-message">{errors.name.message}</span>
            )}
          </div>

          {/* Member Emails */}
          <div className="form-group">
            <label htmlFor="memberEmails" className="form-label">
              Member Emails (Optional)
            </label>
            <textarea
              id="memberEmails"
              {...register('memberEmails')}
              className={`form-input form-textarea ${errors.memberEmails ? 'error' : ''}`}
              placeholder="Enter member emails separated by commas&#10;Example: john@example.com, jane@example.com"
              rows={3}
              disabled={isSubmitting}
            />
            <div className="form-helper-text">
              Enter email addresses separated by commas. You can add members later too.
            </div>
            {errors.memberEmails && (
              <span className="error-message">{errors.memberEmails.message}</span>
            )}
            
            <div className="email-controls">
              <LoadingButton
                type="button"
                onClick={addSampleEmails}
                variant="secondary"
                size="sm"
                disabled={isSubmitting}
              >
                Use Sample Emails
              </LoadingButton>
              
              {parsedEmails.length > 0 && (
                <Badge variant="secondary">
                  {parsedEmails.length} member{parsedEmails.length > 1 ? 's' : ''} to invite
                </Badge>
              )}
            </div>
          </div>

          {/* Email Preview */}
          {parsedEmails.length > 0 && (
            <div className="email-preview">
              <h4>Members to invite:</h4>
              <div className="email-list">
                {parsedEmails.map((email, index) => (
                  <Badge key={index} variant="primary" size="small">
                    {email}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <LoadingButton
              type="button"
              onClick={handleClose}
              variant="secondary"
              disabled={isSubmitting}
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting || !!successMessage}
            >
              {successMessage ? 'Created!' : 'Create Group'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;