const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  // Payer (who is paying)
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  fromEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  // Payee (who is receiving payment)
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  toEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Settlement amount must be positive']
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    uppercase: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Indexes for performance
settlementSchema.index({ groupId: 1 });
settlementSchema.index({ fromEmail: 1 });
settlementSchema.index({ toEmail: 1 });
settlementSchema.index({ createdAt: -1 });

// Validate that from and to are different
settlementSchema.pre('validate', function(next) {
  if (this.fromEmail === this.toEmail) {
    return next(new Error('Cannot settle with yourself'));
  }
  
  // Validate that both emails are provided
  if (!this.fromEmail || !this.toEmail) {
    return next(new Error('Both payer and payee email are required'));
  }
  
  next();
});

// Static method to calculate balances for a group
settlementSchema.statics.calculateGroupBalances = async function(groupId) {
  try {
    const Expense = mongoose.model('Expense');
    
    // Get all expenses for the group
    const expenses = await Expense.find({ groupId }).populate('paidByUserId', 'username email');
    
    // Get all settlements for the group
    const settlements = await this.find({ groupId }).populate(['fromUserId', 'toUserId'], 'username email');
    
    const balances = new Map();
    
    // Initialize balances for all members
    const initBalance = (email) => {
      if (!balances.has(email)) {
        balances.set(email, { amount: 0, transactions: [] });
      }
    };
    
    // Process expenses - calculate who owes what
    expenses.forEach(expense => {
      const { paidByEmail, splitAmong, amount, description, date } = expense;
      const splitAmount = amount / splitAmong.length;
      
      initBalance(paidByEmail);
      
      splitAmong.forEach(split => {
        initBalance(split.email);
        
        if (split.email !== paidByEmail) {
          // Split member owes payer
          balances.get(split.email).amount -= splitAmount;
          balances.get(paidByEmail).amount += splitAmount;
          
          // Track transaction details
          balances.get(split.email).transactions.push({
            type: 'expense',
            amount: -splitAmount,
            description,
            date,
            relatedTo: paidByEmail
          });
          
          balances.get(paidByEmail).transactions.push({
            type: 'expense',
            amount: splitAmount,
            description,
            date,
            relatedTo: split.email
          });
        }
      });
    });
    
    // Process settlements - reduce debts
    settlements.forEach(settlement => {
      const { fromEmail, toEmail, amount, date, comments } = settlement;
      
      initBalance(fromEmail);
      initBalance(toEmail);
      
      // Settlement reduces debt
      balances.get(fromEmail).amount += amount;
      balances.get(toEmail).amount -= amount;
      
      // Track settlement transactions
      balances.get(fromEmail).transactions.push({
        type: 'settlement',
        amount: amount,
        description: comments || 'Settlement',
        date,
        relatedTo: toEmail
      });
      
      balances.get(toEmail).transactions.push({
        type: 'settlement',
        amount: -amount,
        description: comments || 'Settlement',
        date,
        relatedTo: fromEmail
      });
    });
    
    return balances;
  } catch (error) {
    throw new Error(`Error calculating balances: ${error.message}`);
  }
};

// Static method to calculate balance between two users
settlementSchema.statics.calculateBalanceBetween = async function(groupId, userEmail1, userEmail2) {
  const balances = await this.calculateGroupBalances(groupId);
  
  const user1Balance = balances.get(userEmail1);
  const user2Balance = balances.get(userEmail2);
  
  if (!user1Balance || !user2Balance) {
    return 0;
  }
  
  // Calculate net balance between the two users
  let netBalance = 0;
  
  user1Balance.transactions.forEach(transaction => {
    if (transaction.relatedTo === userEmail2) {
      netBalance += transaction.amount;
    }
  });
  
  return netBalance;
};

const Settlement = mongoose.model('Settlement', settlementSchema);

module.exports = Settlement;