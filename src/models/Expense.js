const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group is required for expense']
  },
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
    minlength: [2, 'Description must be at least 2 characters long'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0.01, 'Expense amount must be greater than 0'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'Amount must be a valid positive number'
    }
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'INR',
    trim: true,
    uppercase: true
  },
  paidByEmail: {
    type: String,
    required: [true, 'Expense must have a payer email'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // basic email regex
        return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(v);
      },
      message: 'paidByEmail must be a valid email'
    }
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  paidByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  splitBetween: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }],
  splitAmong: [{
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }],
  splitAmounts: [{
    type: Number,
    required: true,
    min: [0.01, 'Split amount must be greater than 0']
  }],
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters'],
    default: ''
  },
  settled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validation: Ensure splitBetween has at least one member (can include nulls for email-only members)
expenseSchema.pre('save', function(next) {
  // Check if we have splitAmong (new format) or splitBetween (legacy format)
  const hasSplitMembers = (this.splitAmong && this.splitAmong.length > 0) || 
                          (this.splitBetween && this.splitBetween.length > 0);
  
  if (!hasSplitMembers) {
    const error = new Error('Expense must be split among at least one member');
    error.name = 'ValidationError';
    return next(error);
  }
  
  // Validate splitAmounts match split members length
  const splitMembersCount = this.splitAmong ? this.splitAmong.length : this.splitBetween.length;
  if (this.splitAmounts && this.splitAmounts.length !== splitMembersCount) {
    const error = new Error('Split amounts must match number of split users');
    error.name = 'ValidationError';
    return next(error);
  }
  
  // Validate paidByEmail is present
  if (!this.paidByEmail) {
    const error = new Error('Expense must have a payer email');
    error.name = 'ValidationError';
    return next(error);
  }
  
  next();
});

// Validation: No duplicate users in splitBetween (only if splitBetween exists)
expenseSchema.pre('save', function(next) {
  if (this.splitBetween && this.splitBetween.length > 0) {
    // Filter out null values (email-only members) before checking duplicates
    const validUserIds = this.splitBetween.filter(id => id !== null);
    const uniqueUsers = [...new Set(validUserIds.map(id => id.toString()))];
    if (uniqueUsers.length !== validUserIds.length) {
      const error = new Error('Cannot split expense with duplicate users');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Instance method to calculate individual balances
expenseSchema.methods.calculateBalances = function() {
  const balances = {};
  
  // Use splitAmong (new format) if available, otherwise fall back to splitBetween
  const splitMembers = this.splitAmong || [];
  
  if (splitMembers.length === 0) {
    return balances; // Return empty balances if no split data
  }
  
  // Use splitAmounts if available, otherwise split equally
  if (this.splitAmounts && this.splitAmounts.length === splitMembers.length) {
    // Custom split amounts
    splitMembers.forEach((member, index) => {
      // Use userId if available, otherwise use email as key
      const key = member.userId ? member.userId.toString() : `email:${member.email}`;
      balances[key] = (balances[key] || 0) - this.splitAmounts[index];
    });
  } else {
    // Equal split
    const splitAmount = this.amount / splitMembers.length;
    splitMembers.forEach((member) => {
      // Use userId if available, otherwise use email as key
      const key = member.userId ? member.userId.toString() : `email:${member.email}`;
      balances[key] = (balances[key] || 0) - splitAmount;
    });
  }

  // Payer gets credit for full amount
  if (this.paidBy) {
    const payerId = this.paidBy.toString();
    balances[payerId] = (balances[payerId] || 0) + this.amount;
  } else if (this.paidByUserId) {
    const payerId = this.paidByUserId.toString();
    balances[payerId] = (balances[payerId] || 0) + this.amount;
  } else {
    // Email-only payer gets credit
    const payerKey = `email:${this.paidByEmail}`;
    balances[payerKey] = (balances[payerKey] || 0) + this.amount;
  }
  
  return balances;
};

// Instance method to get settlement information
expenseSchema.methods.getSettlementInfo = function() {
  const balances = this.calculateBalances();
  const settlements = [];
  
  const creditors = []; // People who are owed money (positive balance)
  const debtors = []; // People who owe money (negative balance)
  
  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ userId, amount: Math.abs(balance) });
    }
  });
  
  return {
    balances,
    creditors,
    debtors,
    isBalanced: Math.abs(Object.values(balances).reduce((sum, bal) => sum + bal, 0)) < 0.01
  };
};

// Instance method to mark as settled
expenseSchema.methods.markAsSettled = function() {
  this.settled = true;
  this.updatedAt = Date.now();
  return this;
};

// Static method to find expenses by group
expenseSchema.statics.findByGroup = function(groupId, options = {}) {
  const query = this.find({ group: groupId });
  
  if (options.settled !== undefined) {
    query.where({ settled: options.settled });
  }
  
  if (options.paidByEmail) {
    query.where({ paidByEmail: options.paidByEmail });
  }
  
  if (options.startDate || options.endDate) {
    const dateQuery = {};
    if (options.startDate) dateQuery.$gte = options.startDate;
    if (options.endDate) dateQuery.$lte = options.endDate;
    query.where({ date: dateQuery });
  }
  
  return query.populate('paidBy', 'username email')
              .populate('splitBetween', 'username email')
              .populate('group', 'name')
              .sort({ date: -1 });
};

// Static method to calculate group totals
expenseSchema.statics.calculateGroupTotals = function(groupId) {
  return this.aggregate([
    { $match: { group: new mongoose.Types.ObjectId(groupId) } },
    {
      $group: {
        _id: '$group',
        totalAmount: { $sum: '$amount' },
        expenseCount: { $sum: 1 },
        settledAmount: {
          $sum: {
            $cond: [{ $eq: ['$settled', true] }, '$amount', 0]
          }
        },
        unsettledAmount: {
          $sum: {
            $cond: [{ $eq: ['$settled', false] }, '$amount', 0]
          }
        }
      }
    }
  ]);
};

// Create indexes for better performance
expenseSchema.index({ group: 1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ splitBetween: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ settled: 1 });
expenseSchema.index({ group: 1, date: -1 }); // Compound index for group expenses by date
expenseSchema.index({ group: 1, settled: 1 }); // Compound index for settled/unsettled expenses in group
expenseSchema.index({ paidBy: 1, date: -1 }); // Compound index for user's expenses by date
expenseSchema.index({ splitBetween: 1, settled: 1 }); // Compound index for user's split expenses

// Virtual for amount formatting
expenseSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);