const { body } = require('express-validator');

// Validation for creating settlements
const validateSettlement = [
  body('fromEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required for payer'),
    
  body('toEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required for recipient'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('Currency must be a valid 3-letter code'),
  
  body('paymentMethod')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Payment method must be between 1-100 characters'),
  
  body('comments')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Comments cannot exceed 1000 characters'),
  
  body('fromUserId')
    .optional()
    .isMongoId()
    .withMessage('Invalid payer user ID format'),
    
  body('toUserId')
    .optional()
    .isMongoId()
    .withMessage('Invalid recipient user ID format')
];

module.exports = {
  validateSettlement
};