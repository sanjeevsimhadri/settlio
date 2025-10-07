import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { expensesAPI, CreateExpenseData, SplitAmongMember } from '../../services/expensesAPI';
import { groupsAPI, Group, GroupMember } from '../../services/groupsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage } from '../common';
import { LoadingButton, Alert, Input, TextArea, Modal, Card, Select } from '../ui';
import './AddExpense.css';

interface AddExpenseProps {
  groupId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Expense categories with icons
const expenseCategories = [
  { value: 'food', label: 'Food & Dining', icon: '🍽️' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'shopping', label: 'Shopping', icon: '🛒' },
  { value: 'bills', label: 'Bills & Utilities', icon: '💡' },
  { value: 'travel', label: 'Travel & Hotels', icon: '✈️' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'groceries', label: 'Groceries', icon: '🥬' },
  { value: 'fitness', label: 'Fitness & Sports', icon: '💪' },
  { value: 'gifts', label: 'Gifts & Donations', icon: '🎁' },
  { value: 'home', label: 'Home & Garden', icon: '🏠' },
  { value: 'pets', label: 'Pets', icon: '🐕' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'other', label: 'Other', icon: '📦' }
];

// Validation schema
const expenseSchema = yup.object().shape({
  description: yup
    .string()
    .required('Description is required')
    .min(2, 'Description must be at least 2 characters'),
  category: yup.string().required('Category is required'),
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
  category: string;
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
      category: 'other',
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

  // Memoized computed values for performance
  const memberOptions = useMemo(() => 
    group?.members.map(member => ({
      value: member.email,
      label: member.fullName 
        ? member.fullName
        : member.userId?.username 
        ? member.userId.username
        : member.email.split('@')[0],
      isPending: member.status === 'invited',
      member
    })) || [], [group?.members]
  );

  const currencyOptions = useMemo(() => [
    { value: 'INR', label: 'INR (₹)', symbol: '₹' },
    { value: 'USD', label: 'USD ($)', symbol: '$' },
    { value: 'EUR', label: 'EUR (€)', symbol: '€' },
    { value: 'GBP', label: 'GBP (£)', symbol: '£' },
    { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
    { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' }
  ], []);

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
        category: data.category,
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
      <Modal
        isOpen={true}
        onClose={onCancel}
        title="Add Expense"
        size="large"
      >
        <LoadingSpinner message="Loading group details..." />
      </Modal>
    );
  }

  if (!group) {
    return (
      <Modal
        isOpen={true}
        onClose={onCancel}
        title="Add Expense"
        size="large"
      >
        <ErrorMessage 
          message={error || 'Failed to load group details'} 
          onRetry={() => window.location.reload()}
        />
      </Modal>
    );
  }

  return (
    <div className="expense-modal-overlay">
      <div className="expense-modal-container">
        {/* Modal Header */}
        <div className="expense-modal-header">
          <div className="header-content">
            <div className="header-icon">💰</div>
            <div className="header-text">
              <h2>Add New Expense</h2>
              <p>Split costs with <span className="group-name">{group.name}</span> members</p>
            </div>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onCancel}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="expense-form">
          {/* Expense Details Section */}
          <div className="form-section">
            <h3 className="section-title">💸 Expense Details</h3>
            
            {/* Description Field */}
            <div className="field-group">
              <label className="field-label">
                <span className="label-text">What was this for? *</span>
                <span className="label-icon">📝</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.description ? 'error' : ''}`}
                placeholder="e.g. Dinner at restaurant, Uber ride, Movie tickets"
                disabled={submitting}
                {...register('description')}
              />
              {errors.description && (
                <span className="error-message">{errors.description.message}</span>
              )}
            </div>

            {/* Category Field */}
            <div className="field-group">
              <label className="field-label">
                <span className="label-text">Category *</span>
                <span className="label-icon">🏷️</span>
              </label>
              <select
                className={`form-select category-select ${errors.category ? 'error' : ''}`}
                disabled={submitting}
                {...register('category')}
              >
                {expenseCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="error-message">{errors.category.message}</span>
              )}
            </div>

            {/* Amount and Currency Row */}
            <div className="amount-currency-row">
              <div className="field-group flex-2">
                <label className="field-label">
                  <span className="label-text">Amount *</span>
                  <span className="label-icon">💰</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-input amount-input ${errors.amount ? 'error' : ''}`}
                  placeholder="0.00"
                  disabled={submitting}
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                  <span className="error-message">{errors.amount.message}</span>
                )}
              </div>
              
              <div className="field-group flex-1">
                <label className="field-label">
                  <span className="label-text">Currency *</span>
                  <span className="label-icon">🌍</span>
                </label>
                <select
                  className={`form-select ${errors.currency ? 'error' : ''}`}
                  disabled={submitting}
                  {...register('currency')}
                >
                  {currencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.currency && (
                  <span className="error-message">{errors.currency.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="form-section">
            <h3 className="section-title">💳 Payment Information</h3>
            
            <div className="field-group">
              <label className="field-label">
                <span className="label-text">Who paid for this? *</span>
                <span className="label-icon">👤</span>
              </label>
              <select
                className={`form-select ${errors.paidByEmail ? 'error' : ''}`}
                disabled={submitting}
                {...register('paidByEmail')}
              >
                <option value="">Choose the person who paid</option>
                {memberOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}{option.isPending ? ' (Pending)' : ''}
                  </option>
                ))}
              </select>
              {errors.paidByEmail && (
                <span className="error-message">{errors.paidByEmail.message}</span>
              )}
            </div>
          </div>

          {/* Split Among Section */}
          <div className="form-section">
            <div className="split-header">
              <div className="split-title">
                <h3 className="section-title">👥 Split Between</h3>
                <p className="section-subtitle">Select who should split this expense</p>
              </div>
              <div className="split-actions">
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={selectAllMembers}
                  disabled={submitting}
                >
                  <span>✓</span> All
                </button>
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={clearAllMembers}
                  disabled={submitting}
                >
                  <span>✕</span> Clear
                </button>
              </div>
            </div>

            <div className="members-grid">
              {group.members.map((member) => {
                const isSelected = watchedSplitAmong?.includes(member.email);
                const memberInitial = (member.fullName || member.userId?.username || member.email)[0].toUpperCase();
                return (
                  <div 
                    key={member._id} 
                    className={`member-card ${isSelected ? 'selected' : ''} ${submitting ? 'disabled' : ''}`}
                    onClick={() => !submitting && toggleSplitMember(member.email)}
                  >
                    <div className="member-avatar">{memberInitial}</div>
                    <div className="member-details">
                      <div className="member-name">
                        {member.fullName || member.userId?.username || member.email.split('@')[0]}
                      </div>
                      {member.status === 'invited' && (
                        <div className="member-status pending">⏳ Pending Invitation</div>
                      )}
                    </div>
                    <div className="selection-indicator">
                      {isSelected && <span className="checkmark">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.splitAmong && (
              <div className="error-message">{errors.splitAmong.message}</div>
            )}

            {watchedSplitAmong && watchedSplitAmong.length > 0 && (
              <div className="split-summary">
                <span className="summary-icon">📊</span>
                <span className="summary-text">
                  Split equally among <strong>{watchedSplitAmong.length}</strong> member{watchedSplitAmong.length !== 1 ? 's' : ''}
                  {watch('amount') > 0 && (
                    <span className="per-person"> • {currencyOptions.find(c => c.value === watch('currency'))?.symbol}{(watch('amount') / watchedSplitAmong.length).toFixed(2)} per person</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Additional Details Section */}
          <div className="form-section">
            <h3 className="section-title">📅 Additional Details</h3>
            
            <div className="details-row">
              <div className="field-group">
                <label className="field-label">
                  <span className="label-text">Date *</span>
                  <span className="label-icon">📆</span>
                </label>
                <input
                  type="date"
                  className={`form-input ${errors.date ? 'error' : ''}`}
                  disabled={submitting}
                  {...register('date')}
                />
                {errors.date && (
                  <span className="error-message">{errors.date.message}</span>
                )}
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">
                <span className="label-text">Notes (Optional)</span>
                <span className="label-icon">📝</span>
              </label>
              <textarea
                className={`form-textarea ${errors.comments ? 'error' : ''}`}
                placeholder="Add any additional notes about this expense..."
                rows={3}
                disabled={submitting}
                {...register('comments')}
              />
              {errors.comments && (
                <span className="error-message">{errors.comments.message}</span>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="action-btn cancel"
              onClick={onCancel}
              disabled={submitting}
            >
              <span className="btn-icon">✕</span>
              Cancel
            </button>
            <button
              type="submit"
              className={`action-btn primary ${submitting ? 'loading' : ''}`}
              disabled={submitting || !watchedSplitAmong?.length}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="btn-icon">💰</span>
                  Create Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;