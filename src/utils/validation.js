const Joi = require('joi');

// User registration validation schema
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must only contain alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
});

// User login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Group creation validation schema
const createGroupSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Group name must be at least 2 characters long',
      'string.max': 'Group name cannot exceed 100 characters',
      'any.required': 'Group name is required'
    }),
  members: Joi.array()
    .items(Joi.string().email())
    .optional()
    .messages({
      'string.email': 'Invalid email format in members list'
    })
});

// Create expense validation schema
const createExpenseSchema = Joi.object({
  groupId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid group ID format',
      'any.required': 'Group ID is required'
    }),
  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be a positive number',
      'any.required': 'Amount is required'
    }),
  description: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .required()
    .messages({
      'string.min': 'Description must be at least 2 characters long',
      'string.max': 'Description cannot exceed 500 characters',
      'any.required': 'Description is required'
    }),
  currency: Joi.string()
    .valid('INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD')
    .optional()
    .default('INR')
    .messages({
      'any.only': 'Currency must be one of INR, USD, EUR, GBP, CAD, AUD'
    }),
  paidByUserId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid payer user ID format'
    }),
  paidByEmail: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Payer email is required'
    }),
  splitAmong: Joi.array()
    .items(Joi.object({
      email: Joi.string().email().required(),
      userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
    }))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one user must be included in the split',
      'any.required': 'splitAmong is required'
    }),
  date: Joi.date()
    .optional()
    .default(() => new Date()),
  comments: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Comments cannot exceed 1000 characters'
    })
});

// Add member to group validation schema
const addMemberSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    })
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createGroupSchema,
  createExpenseSchema,
  addMemberSchema
};