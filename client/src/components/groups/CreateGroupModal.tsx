import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { createGroupSchema } from '../../utils/groupValidation';
import { groupsAPI, CreateGroupData } from '../../services/groupsAPI';
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

      await groupsAPI.createGroup(groupData);
      
      // Reset form and close modal
      reset();
      onClose();
      onGroupCreated();

    } catch (error: any) {
      setSubmitError(error.error || 'Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSubmitError('');
    onClose();
  };

  const addSampleEmails = () => {
    const samples = 'john@example.com, jane@example.com, bob@example.com';
    setValue('memberEmails', samples);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button 
            className="modal-close"
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="create-group-form">
          {/* Group Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Group Name *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter group name (e.g., 'Weekend Trip', 'Office Lunch')"
              autoComplete="off"
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
              className={`form-input ${errors.memberEmails ? 'error' : ''}`}
              placeholder="Enter member emails separated by commas&#10;Example: john@example.com, jane@example.com"
              rows={3}
            />
            {errors.memberEmails && (
              <span className="error-message">{errors.memberEmails.message}</span>
            )}
            <div className="form-hint">
              <p>Enter email addresses separated by commas. You can add members later too.</p>
              <button
                type="button"
                onClick={addSampleEmails}
                className="sample-button"
              >
                Use Sample Emails
              </button>
            </div>
          </div>

          {/* Email Preview */}
          {memberEmails && memberEmails.trim() && (
            <div className="email-preview">
              <h4>Members to invite:</h4>
              <div className="email-tags">
                {memberEmails
                  .split(',')
                  .map(email => email.trim())
                  .filter(email => email !== '')
                  .map((email, index) => (
                    <span key={index} className="email-tag">
                      {email}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="alert error">
              {submitError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="button secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="button primary"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;