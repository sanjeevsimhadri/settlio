import * as yup from 'yup';

// Create group validation schema
export const createGroupSchema = yup.object({
  name: yup
    .string()
    .required('Group name is required')
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name cannot exceed 100 characters')
    .trim(),
  memberEmails: yup
    .string()
    .optional()
    .test('valid-emails', 'Invalid email format in member list', function(value) {
      if (!value || value.trim() === '') return true;
      
      const emails = value.split(',').map(email => email.trim()).filter(email => email !== '');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      for (const email of emails) {
        if (!emailRegex.test(email)) {
          return this.createError({
            message: `Invalid email: ${email}`
          });
        }
      }
      return true;
    })
});

// Add member validation schema
export const addMemberSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .trim()
});

export type CreateGroupFormData = yup.InferType<typeof createGroupSchema>;
export type AddMemberFormData = yup.InferType<typeof addMemberSchema>;