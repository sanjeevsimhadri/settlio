import * as yup from 'yup';

// Schema for creating/editing expenses
export const expenseSchema = yup.object().shape({
  description: yup
    .string()
    .required('Description is required')
    .min(3, 'Description must be at least 3 characters')
    .max(100, 'Description cannot exceed 100 characters'),
  
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be greater than 0')
    .max(999999.99, 'Amount cannot exceed $999,999.99')
    .test('decimal-places', 'Amount can have at most 2 decimal places', (value) => {
      if (value == null) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),
  
  paidBy: yup
    .string()
    .required('Please select who paid for this expense'),
  
  category: yup
    .string()
    .optional(),
  
  notes: yup
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
  
  splitBetween: yup
    .array()
    .of(
      yup.object().shape({
        user: yup.string().required('User is required'),
        amount: yup
          .number()
          .required('Amount is required')
          .positive('Amount must be greater than 0')
          .test('decimal-places', 'Amount can have at most 2 decimal places', (value) => {
            if (value == null) return true;
            return /^\d+(\.\d{1,2})?$/.test(value.toString());
          })
      })
    )
    .min(1, 'At least one person must be selected for the split')
    .test('total-amount', 'Split amounts must equal the total expense amount', function(splitBetween) {
      const { amount } = this.parent;
      if (!splitBetween || !amount) return true;
      
      const totalSplit = splitBetween.reduce((sum, split) => sum + (split.amount || 0), 0);
      const difference = Math.abs(totalSplit - amount);
      
      // Allow for small rounding differences (within 1 cent)
      return difference < 0.01;
    })
});

export interface ExpenseFormData {
  description: string;
  amount: number;
  paidBy: string;
  category?: string;
  notes?: string;
  splitBetween: {
    user: string;
    amount: number;
  }[];
}

// Schema for quick expense (equal split)
export const quickExpenseSchema = yup.object().shape({
  description: yup
    .string()
    .required('Description is required')
    .min(3, 'Description must be at least 3 characters')
    .max(100, 'Description cannot exceed 100 characters'),
  
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be greater than 0')
    .max(999999.99, 'Amount cannot exceed $999,999.99'),
  
  paidBy: yup
    .string()
    .required('Please select who paid for this expense'),
  
  splitMembers: yup
    .array()
    .of(yup.string())
    .min(1, 'At least one person must be selected for the split')
});

export interface QuickExpenseFormData {
  description: string;
  amount: number;
  paidBy: string;
  splitMembers: string[];
}