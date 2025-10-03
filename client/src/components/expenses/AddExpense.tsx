import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { expensesAPI, CreateExpenseData, SplitAmongMember } from '../../services/expensesAPI';
import { groupsAPI, Group, GroupMember } from '../../services/groupsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage } from '../common';
import './AddExpense.css';

interface AddExpenseProps {
  groupId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Validation schema
const expenseSchema = yup.object().shape({
  description: yup
    .string()
    .required('Description is required')
    .min(2, 'Description must be at least 2 characters'),
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .typeError('Amount must be a valid number'),
  currency: yup.string().required('Currency is required'),
  paidByEmail: yup
    .string()
    .email('Must be a valid email')
    .required('Paid by is required'),
  splitAmong: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Must select at least one person to split among')
    .required('Split among is required'),
  date: yup.string().required('Date is required'),
  comments: yup.string().max(1000, 'Comments cannot exceed 1000 characters').optional()
});

interface FormData {
  description: string;
  amount: number;
  currency: string;
  paidByEmail: string;
  splitAmong: string[];
  date: string;
  comments?: string;
}

const AddExpense: React.FC<AddExpenseProps> = ({ groupId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>({
    resolver: yupResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      currency: 'INR',
      paidByEmail: user?.email || '',
      splitAmong: [],
      date: new Date().toISOString().split('T')[0],
      comments: ''
    }
  });

  const watchedSplitAmong = watch('splitAmong');

  // Load group details
  useEffect(() => {
    const loadGroup = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await groupsAPI.getGroupById(groupId);
        setGroup(response.data.group);
        
        // Set default currency from group
        if (response.data.group.currency) {
          setValue('currency', response.data.group.currency);
        }
      } catch (error: any) {
        setError(error.error || 'Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      loadGroup();
    }
  }, [groupId, setValue]);

  const getDisplayName = (member: GroupMember): string => {
    if (member.fullName) {
      return `${member.fullName} (${member.email})`;
    }
    if (member.userId?.username) {
      return `${member.userId.username} (${member.email})`;
    }
    return member.email;
  };

  const onSubmit = async (data: FormData) => {
    if (!group) {
      setError('Group information not loaded');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Find payer member info
      const payerMember = group.members.find(m => m.email === data.paidByEmail);
      
      // Process splitAmong
      const splitAmong: SplitAmongMember[] = data.splitAmong.map(email => {
        const member = group.members.find(m => m.email === email);
        return {
          email,
          userId: member?.userId?._id
        };
      });

      const expenseData: CreateExpenseData = {
        groupId,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        paidByEmail: data.paidByEmail,
        paidByUserId: payerMember?.userId?._id,
        splitAmong,
        date: data.date,
        comments: data.comments
      };

      await expensesAPI.createExpense(expenseData);
      onSuccess();

    } catch (error: any) {
      setError(error.error || error.message || 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSplitMember = (email: string) => {
    const currentSplit = watchedSplitAmong || [];
    const isSelected = currentSplit.includes(email);
    
    if (isSelected) {
      setValue('splitAmong', currentSplit.filter(e => e !== email));
    } else {
      setValue('splitAmong', [...currentSplit, email]);
    }
  };

  const selectAllMembers = () => {
    if (group) {
      setValue('splitAmong', group.members.map(m => m.email));
    }
  };

  const clearAllMembers = () => {
    setValue('splitAmong', []);
  };

  if (loading) {
    return (
      <div className="add-expense-modal">
        <div className="modal-content">
          <LoadingSpinner message="Loading group details..." />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="add-expense-modal">
        <div className="modal-content">
          <ErrorMessage 
            message={error || 'Failed to load group details'} 
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="add-expense-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Expense</h2>
          <p>Add a new expense to {group.name}</p>
          <button 
            className="close-button" 
            onClick={onCancel}
            disabled={submitting}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="add-expense-form">
          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <input
              id="description"
              type="text"
              {...register('description')}
              className={`form-input ${errors.description ? 'error' : ''}`}
              placeholder="What was this expense for?"
              disabled={submitting}
            />
            {errors.description && (
              <span className="error-message">{errors.description.message}</span>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { valueAsNumber: true })}
                className={`form-input ${errors.amount ? 'error' : ''}`}
                placeholder="0.00"
                disabled={submitting}
              />
              {errors.amount && (
                <span className="error-message">{errors.amount.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency *</label>
              <select
                id="currency"
                {...register('currency')}
                className={`form-select ${errors.currency ? 'error' : ''}`}
                disabled={submitting}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
              {errors.currency && (
                <span className="error-message">{errors.currency.message}</span>
              )}
            </div>
          </div>

          {/* Paid By */}
          <div className="form-group">
            <label htmlFor="paidByEmail">Paid By *</label>
            <select
              id="paidByEmail"
              {...register('paidByEmail')}
              className={`form-select ${errors.paidByEmail ? 'error' : ''}`}
              disabled={submitting}
            >
              <option value="">Select who paid</option>
              {group.members.map((member) => (
                <option key={member._id} value={member.email}>
                  {getDisplayName(member)}
                  {member.status === 'invited' && ' (Pending)'}
                </option>
              ))}
            </select>
            {errors.paidByEmail && (
              <span className="error-message">{errors.paidByEmail.message}</span>
            )}
          </div>

          {/* Split Among */}
          <div className="form-group">
            <div className="split-header">
              <label>Split Among *</label>
              <div className="split-controls">
                <button
                  type="button"
                  className="button small secondary"
                  onClick={selectAllMembers}
                  disabled={submitting}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="button small secondary"
                  onClick={clearAllMembers}
                  disabled={submitting}
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="member-selection">
              {group.members.map((member) => {
                const isSelected = watchedSplitAmong?.includes(member.email);
                return (
                  <label key={member._id} className="member-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSplitMember(member.email)}
                      disabled={submitting}
                    />
                    <span className="checkmark"></span>
                    <span className="member-info">
                      {getDisplayName(member)}
                      {member.status === 'invited' && (
                        <span className="invited-indicator"> (Pending)</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            
            {errors.splitAmong && (
              <span className="error-message">{errors.splitAmong.message}</span>
            )}
            
            {watchedSplitAmong && watchedSplitAmong.length > 0 && (
              <div className="split-summary">
                Split equally among {watchedSplitAmong.length} member{watchedSplitAmong.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              id="date"
              type="date"
              {...register('date')}
              className={`form-input ${errors.date ? 'error' : ''}`}
              disabled={submitting}
            />
            {errors.date && (
              <span className="error-message">{errors.date.message}</span>
            )}
          </div>

          {/* Comments */}
          <div className="form-group">
            <label htmlFor="comments">Comments</label>
            <textarea
              id="comments"
              {...register('comments')}
              className={`form-input ${errors.comments ? 'error' : ''}`}
              placeholder="Optional notes about this expense"
              rows={3}
              disabled={submitting}
            />
            {errors.comments && (
              <span className="error-message">{errors.comments.message}</span>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={submitting || !watchedSplitAmong?.length}
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="small" />
                  Creating...
                </>
              ) : (
                'Create Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;