import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { balancesAPI, Balance, CreateSettlementData } from '../../services/balancesAPI';
import { Group } from '../../services/groupsAPI';
import { LoadingSpinner } from '../common';
import './Balances.css';

interface SettlementFormProps {
  group: Group;
  memberBalance: Balance;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  amount: number;
  currency: string;
  paymentMethod?: string;
  comments?: string;
}

// Validation schema
const settlementSchema = yup.object().shape({
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .typeError('Amount must be a valid number'),
  currency: yup.string().required('Currency is required'),
  paymentMethod: yup.string().max(100, 'Payment method cannot exceed 100 characters'),
  comments: yup.string().max(1000, 'Comments cannot exceed 1000 characters')
});

const SettlementForm: React.FC<SettlementFormProps> = ({
  group,
  memberBalance,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const maxAmount = Math.abs(memberBalance.balanceAmount);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>({
    resolver: yupResolver(settlementSchema),
    defaultValues: {
      amount: maxAmount,
      currency: memberBalance.currency || 'INR',
      paymentMethod: '',
      comments: ''
    }
  });

  const watchedAmount = watch('amount');

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');

      // Validate amount doesn't exceed what's owed
      if (data.amount > maxAmount) {
        setError(`Amount cannot exceed ${balancesAPI.formatCurrency(maxAmount, data.currency)}`);
        return;
      }

      const settlementData: CreateSettlementData = {
        toEmail: memberBalance.memberEmail,
        toUserId: memberBalance.memberUserId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod || undefined,
        comments: data.comments || undefined
      };

      await balancesAPI.createSettlement(group._id, settlementData);
      onSuccess();

    } catch (error: any) {
      setError(error.error || 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  const setFullAmount = () => {
    setValue('amount', maxAmount);
  };

  const setHalfAmount = () => {
    setValue('amount', Math.round((maxAmount / 2) * 100) / 100);
  };

  const paymentMethods = [
    'Cash',
    'Bank Transfer',
    'Venmo',
    'PayPal',
    'Zelle',
    'Apple Pay',
    'Google Pay',
    'Credit Card',
    'Other'
  ];

  return (
    <div className="settlement-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Settle Up with {memberBalance.memberName}</h2>
          <p>
            You owe {balancesAPI.formatCurrency(maxAmount, memberBalance.currency)}
          </p>
          <button 
            className="close-button" 
            onClick={onCancel}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="settlement-form">
          <div className="form-group">
            <label htmlFor="amount">Settlement Amount *</label>
            <div className="amount-input-group">
              <div className="currency-input">
                <span className="currency-symbol">
                  {memberBalance.currency === 'INR' ? '₹' : memberBalance.currency === 'USD' ? '$' : memberBalance.currency}
                </span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxAmount}
                  {...register('amount', { valueAsNumber: true })}
                  className={`form-input ${errors.amount ? 'error' : ''}`}
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              <div className="amount-buttons">
                <button
                  type="button"
                  className="button small secondary"
                  onClick={setHalfAmount}
                  disabled={loading}
                >
                  Half
                </button>
                <button
                  type="button"
                  className="button small secondary"
                  onClick={setFullAmount}
                  disabled={loading}
                >
                  Full
                </button>
              </div>
            </div>
            {errors.amount && (
              <span className="error-message">{errors.amount.message}</span>
            )}
            {watchedAmount > maxAmount && (
              <span className="error-message">
                Amount cannot exceed {balancesAPI.formatCurrency(maxAmount, memberBalance.currency)}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="currency">Currency *</label>
            <select
              id="currency"
              {...register('currency')}
              className={`form-select ${errors.currency ? 'error' : ''}`}
              disabled={loading}
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

          <div className="form-group">
            <label htmlFor="paymentMethod">Payment Method</label>
            <select
              id="paymentMethod"
              {...register('paymentMethod')}
              className="form-select"
              disabled={loading}
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {errors.paymentMethod && (
              <span className="error-message">{errors.paymentMethod.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="comments">Comments</label>
            <textarea
              id="comments"
              {...register('comments')}
              className={`form-input ${errors.comments ? 'error' : ''}`}
              placeholder="Optional notes about this settlement"
              rows={3}
              disabled={loading}
            />
            {errors.comments && (
              <span className="error-message">{errors.comments.message}</span>
            )}
          </div>

          <div className="settlement-summary">
            <div className="summary-row">
              <span>You will pay:</span>
              <strong>
                {watchedAmount ? 
                  balancesAPI.formatCurrency(watchedAmount, memberBalance.currency) : 
                  '$0.00'
                }
              </strong>
            </div>
            <div className="summary-row">
              <span>Remaining balance:</span>
              <strong>
                {watchedAmount ? 
                  balancesAPI.formatCurrency(maxAmount - watchedAmount, memberBalance.currency) : 
                  balancesAPI.formatCurrency(maxAmount, memberBalance.currency)
                }
              </strong>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={loading || !watchedAmount || watchedAmount > maxAmount}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  Recording...
                </>
              ) : (
                'Record Settlement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettlementForm;