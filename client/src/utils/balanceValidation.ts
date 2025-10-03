import * as yup from 'yup';

// Schema for creating settlements
export const settlementSchema = yup.object().shape({
  payerId: yup
    .string()
    .required('Please select who made the payment'),
  
  payeeId: yup
    .string()
    .required('Please select who received the payment'),
  
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be greater than 0')
    .max(999999.99, 'Amount cannot exceed $999,999.99')
    .test('decimal-places', 'Amount can have at most 2 decimal places', (value) => {
      if (value == null) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),
  
  description: yup
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
});

export interface SettlementFormData {
  payerId: string;
  payeeId: string;
  amount: number;
  description?: string;
}

// Schema for partial settlements (settling portion of debt)
export const partialSettlementSchema = yup.object().shape({
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be greater than 0')
    .test('decimal-places', 'Amount can have at most 2 decimal places', (value) => {
      if (value == null) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),
  
  description: yup
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
});

export interface PartialSettlementFormData {
  amount: number;
  description?: string;
}