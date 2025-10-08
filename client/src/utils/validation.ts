import * as yup from 'yup';

// Login form validation schema
export const loginSchema = yup.object({
  identifier: yup
    .string()
    .required('Email or mobile number is required')
    .test('email-or-mobile', 'Please enter a valid email address or mobile number', (value) => {
      if (!value) return false;
      
      // Email pattern
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // Mobile pattern (with country code, allowing common formatting)
      const mobilePatternWithCode = /^\+[1-9]\d{1,14}$/;
      // Indian mobile pattern (10 digits, optionally starting with 9, 8, 7, 6)
      const indianMobilePattern = /^[6-9]\d{9}$/;
      
      // Remove common formatting characters for mobile validation
      const cleanValue = value.replace(/[\s-()]/g, '');
      
      return emailPattern.test(value) || 
             mobilePatternWithCode.test(cleanValue) || 
             indianMobilePattern.test(cleanValue);
    }),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

// Registration form validation schema
export const registerSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and dots'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  mobile: yup
    .string()
    .required('Mobile number is required')
    .test('mobile-format', 'Please enter a valid mobile number', (value) => {
      if (!value) return false;
      const cleanValue = value.replace(/[\s-()]/g, '');
      // Accept both formats: +919494698235 or 9494698235 (Indian format)
      const mobilePatternWithCode = /^\+[1-9]\d{1,14}$/;
      const indianMobilePattern = /^[6-9]\d{9}$/;
      return mobilePatternWithCode.test(cleanValue) || indianMobilePattern.test(cleanValue);
    }),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

// Profile update validation schema
export const profileUpdateSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .matches(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers'),
  email: yup
    .string()
    .email('Please enter a valid email address'),
});

// Utility function to normalize mobile numbers for login
export const normalizeMobileForLogin = (identifier: string): string => {
  // If it's an email, return as is
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailPattern.test(identifier)) {
    return identifier;
  }
  
  // Clean the identifier
  const cleaned = identifier.replace(/[\s-()]/g, '');
  
  // If it's already in international format, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it's a 10-digit Indian mobile number, add +91
  const indianMobilePattern = /^[6-9]\d{9}$/;
  if (indianMobilePattern.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // Return as is for other cases
  return identifier;
};

// Utility function to normalize mobile numbers for registration
export const normalizeMobileForRegistration = (mobile: string): string => {
  // Clean the mobile number
  const cleaned = mobile.replace(/[\s-()]/g, '');
  
  // If it's already in international format, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it's a 10-digit Indian mobile number, add +91
  const indianMobilePattern = /^[6-9]\d{9}$/;
  if (indianMobilePattern.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // Return as is for other cases
  return mobile;
};

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type ProfileUpdateFormData = yup.InferType<typeof profileUpdateSchema>;