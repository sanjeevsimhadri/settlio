import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { balancesAPI, Balance, CreateSettlementData } from '../../services/balancesAPI';
import { Group } from '../../services/groupsAPI';
import { Modal, Input, Select, TextArea, LoadingButton, Alert, Card, Badge, Avatar, useToast } from '../ui';
import './Balances.css';

interface SettlementFormProps {
  group: Group;
  memberBalance: Balance;
  onSuccess: () => void;
  onCancel: () => void;
  isOpen?: boolean;
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
  onCancel,
  isOpen = true
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const { showSuccess, showError } = useToast();

  const maxAmount = Math.abs(memberBalance.balanceAmount);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
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
      setSuccessMessage('');

      // Validate amount doesn't exceed what's owed
      if (data.amount > maxAmount) {
        const errorMsg = `Amount cannot exceed ${balancesAPI.formatCurrency(maxAmount, data.currency)}`;
        setError(errorMsg);
        showError(errorMsg);
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
      
      const successMsg = `Settlement of ${balancesAPI.formatCurrency(data.amount, data.currency)} recorded successfully!`;
      setSuccessMessage(successMsg);
      showSuccess(successMsg);

      // Brief delay to show success state
      setTimeout(() => {
        reset();
        setSuccessMessage('');
        onSuccess();
      }, 2000);

    } catch (error: any) {
      const errorMsg = error.error || 'Failed to record settlement';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    setError('');
    setSuccessMessage('');
    onCancel();
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
    'UPI/PhonePe',
    'Paytm',
    'Google Pay',
    'Venmo',
    'PayPal',
    'Zelle',
    'Apple Pay',
    'Credit Card',
    'Debit Card',
    'Other'
  ];

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$'
    };
    return symbols[currency] || currency;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Settle Up"
      size="medium"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="space-y-6">
        {/* Member Info Card */}
        <Card variant="filled" padding="medium">
          <div className="flex items-center gap-4">
            <Avatar alt={memberBalance.memberName} size="large" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {memberBalance.memberName}
              </h3>
              <p className="text-gray-600">{memberBalance.memberEmail}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">You owe:</span>
                <Badge variant="error" size="medium">
                  {balancesAPI.formatCurrency(maxAmount, memberBalance.currency)}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Success Message */}
        {successMessage && (
          <Alert type="success" message={successMessage} />
        )}

        {/* Error Message */}
        {error && (
          <Alert type="error" message={error} />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Settlement Amount */}
          <div className="space-y-3">
            <Input
              label="Settlement Amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount}
              placeholder="0.00"
              error={errors.amount?.message}
              disabled={loading}
              {...register('amount', { valueAsNumber: true })}
              startIcon={
                <span className="font-medium">
                  {getCurrencySymbol(memberBalance.currency)}
                </span>
              }
            />
            
            {watchedAmount > maxAmount && (
              <Alert 
                type="error" 
                message={`Amount cannot exceed ${balancesAPI.formatCurrency(maxAmount, memberBalance.currency)}`} 
              />
            )}

            <div className="flex gap-2">
              <LoadingButton
                type="button"
                onClick={setHalfAmount}
                variant="secondary"
                size="sm"
                disabled={loading}
              >
                Half ({balancesAPI.formatCurrency(maxAmount / 2, memberBalance.currency)})
              </LoadingButton>
              <LoadingButton
                type="button"
                onClick={setFullAmount}
                variant="secondary"
                size="sm"
                disabled={loading}
              >
                Full Amount
              </LoadingButton>
            </div>
          </div>

          {/* Currency */}
          <Select
            label="Currency"
            error={errors.currency?.message}
            disabled={loading}
            {...register('currency')}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD (C$)</option>
            <option value="AUD">AUD (A$)</option>
          </Select>

          {/* Payment Method */}
          <Select
            label="Payment Method (Optional)"
            placeholder="Select payment method"
            error={errors.paymentMethod?.message}
            disabled={loading}
            {...register('paymentMethod')}
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>

          {/* Comments */}
          <TextArea
            label="Comments (Optional)"
            placeholder="Optional notes about this settlement"
            rows={3}
            error={errors.comments?.message}
            disabled={loading}
            {...register('comments')}
          />

          {/* Settlement Summary */}
          <Card variant="outlined" padding="medium">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Settlement Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">You will pay:</span>
                <Badge variant="primary" size="medium">
                  {watchedAmount 
                    ? balancesAPI.formatCurrency(watchedAmount, memberBalance.currency)
                    : balancesAPI.formatCurrency(0, memberBalance.currency)
                  }
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Remaining balance:</span>
                <Badge variant="warning" size="medium">
                  {watchedAmount 
                    ? balancesAPI.formatCurrency(Math.max(0, maxAmount - watchedAmount), memberBalance.currency)
                    : balancesAPI.formatCurrency(maxAmount, memberBalance.currency)
                  }
                </Badge>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <LoadingButton
              type="button"
              onClick={handleClose}
              variant="secondary"
              disabled={loading}
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              type="submit"
              variant="success"
              isLoading={loading}
              disabled={loading || !watchedAmount || watchedAmount > maxAmount || !!successMessage}
            >
              {successMessage ? 'Recorded!' : 'Record Settlement'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SettlementForm;