const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { calculateSimplifiedDebts } = require('../utils/debtSimplification');

// @desc    Create new expense in group
// @route   POST /api/groups/:groupId/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res, next) => {
  const { amount, description, paidBy, paidByEmail, splitBetween, splitAmounts, splitEntries } = req.body;
  const { groupId } = req.params;
  const currentUserId = req.user.id;

  // Validate groupId parameter exists
  if (!groupId) {
    return next(new ErrorResponse('Group ID is required', 400));
  }

  // Validate group exists
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new ErrorResponse('Group not found', 404));
  }

  // Check if current user is a member of the group (by userId or email)
  const currentUser = req.user;
  const isMemberByUserId = group.isMember(currentUserId);
  const isMemberByEmail = group.isMemberByEmail(currentUser.email);
  
  if (!isMemberByUserId && !isMemberByEmail) {
    return next(new ErrorResponse('You are not a member of this group', 403));
  }

  // Determine payer: either registered userId or email (invited/unregistered)
  let payerUser = null;
  let payerEmail = null;
  if (paidBy) {
    payerUser = await User.findById(paidBy);
    if (!payerUser) {
      return next(new ErrorResponse('Payer user not found', 404));
    }
    if (!group.isMember(paidBy)) {
      return next(new ErrorResponse('Payer must be a member of the group', 400));
    }
  } else if (paidByEmail) {
    const normalizedEmail = paidByEmail.trim().toLowerCase();
    const memberByEmail = group.members.find(m => m.email === normalizedEmail);
    if (!memberByEmail) {
      return next(new ErrorResponse('Payer email is not a member of this group', 400));
    }
    payerEmail = normalizedEmail;
  } else {
    return next(new ErrorResponse('Either paidBy (userId) or paidByEmail must be provided', 400));
  }

  // Validate split information - prioritize new format over legacy
  let processedSplitEntries = [];
  let numericSplitAmounts = [];
  
  if (splitEntries && Array.isArray(splitEntries) && splitEntries.length > 0) {
    // New flexible format: validate splitEntries
    if (!splitEntries.every(entry => entry.email && typeof entry.amount === 'number' && entry.amount > 0)) {
      return next(new ErrorResponse('All splitEntries must have email and positive amount', 400));
    }

    // Validate all emails are group members and resolve userIds where available
    for (const entry of splitEntries) {
      const normalizedEmail = entry.email.toLowerCase().trim();
      const groupMember = group.members.find(m => m.email === normalizedEmail);
      
      if (!groupMember) {
        return next(new ErrorResponse(`Email ${entry.email} is not a member of this group`, 400));
      }
      
      processedSplitEntries.push({
        email: normalizedEmail,
        userId: groupMember.userId || null,
        amount: entry.amount
      });
    }
  } else if (splitBetween && splitAmounts) {
    // Legacy format: validate splitBetween/splitAmounts
    if (!Array.isArray(splitBetween) || splitBetween.length === 0) {
      return next(new ErrorResponse('splitBetween must be a non-empty array', 400));
    }

    if (!Array.isArray(splitAmounts) || splitAmounts.length === 0) {
      return next(new ErrorResponse('splitAmounts must be a non-empty array', 400));
    }

    if (splitBetween.length !== splitAmounts.length) {
      return next(new ErrorResponse('splitBetween and splitAmounts arrays must have the same length', 400));
    }

    // Validate all split users exist and are group members
    const splitUsers = await User.find({ _id: { $in: splitBetween } });
    if (splitUsers.length !== splitBetween.length) {
      return next(new ErrorResponse('One or more users in splitBetween not found', 404));
    }

    for (const userId of splitBetween) {
      if (!group.isMember(userId)) {
        return next(new ErrorResponse(`User ${userId} is not a member of this group`, 400));
      }
    }
  } else {
    return next(new ErrorResponse('Either splitEntries or splitBetween/splitAmounts must be provided', 400));
  }

  // Validate amounts
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return next(new ErrorResponse('Amount must be a positive number', 400));
  }

  // Validate split amounts based on format
  let totalSplitAmount = 0;
  if (processedSplitEntries.length > 0) {
    // New format: validate splitEntries amounts
    totalSplitAmount = processedSplitEntries.reduce((sum, entry) => sum + entry.amount, 0);
  } else {
    // Legacy format: validate splitAmounts
    numericSplitAmounts = splitAmounts.map((amt, index) => {
      const numAmt = parseFloat(amt);
      if (isNaN(numAmt) || numAmt < 0) {
        return next(new ErrorResponse(`Split amount at index ${index} must be a non-negative number`, 400));
      }
      return numAmt;
    });

    // Check if any errors occurred during split amount validation
    if (numericSplitAmounts.some(amt => amt === undefined)) {
      return; // Error already sent in the map function
    }
    
    totalSplitAmount = numericSplitAmounts.reduce((sum, amt) => sum + amt, 0);
  }

  // Validate sum of split amounts equals total amount
  const tolerance = 0.01;
  if (Math.abs(totalSplitAmount - numericAmount) > tolerance) {
    return next(new ErrorResponse(
      `Sum of split amounts (${totalSplitAmount.toFixed(2)}) must equal total amount (${numericAmount.toFixed(2)})`,
      400
    ));
  }

  // Validate description
  if (!description || description.trim().length < 2) {
    return next(new ErrorResponse('Description must be at least 2 characters long', 400));
  }

  // Check for duplicates
  if (processedSplitEntries.length > 0) {
    // Check for duplicate emails in new format
    const uniqueEmails = [...new Set(processedSplitEntries.map(entry => entry.email))];
    if (uniqueEmails.length !== processedSplitEntries.length) {
      return next(new ErrorResponse('Cannot split expense with duplicate participants', 400));
    }
  } else {
    // Legacy format duplicate check
    const uniqueUsers = [...new Set(splitBetween.map(id => id.toString()))];
    if (uniqueUsers.length !== splitBetween.length) {
      return next(new ErrorResponse('Cannot split expense with duplicate users', 400));
    }
  }

  // Ensure payer is part of splitUnless explicitly excluded (common pattern is payer included)
  if (payerUser && !splitBetween.some(id => id.toString() === payerUser._id.toString())) {
    // We won't enforce this strictly; just a warning comment could be logged.
  }

  try {
    // Create the expense with appropriate split format
    const expenseData = {
      group: new mongoose.Types.ObjectId(groupId),
      paidBy: payerUser ? payerUser._id : undefined,
      paidByEmail: payerUser ? payerUser.email : payerEmail,
      amount: numericAmount,
      description: description.trim(),
      date: req.body.date || new Date()
    };

    // Add split information based on format used
    if (processedSplitEntries.length > 0) {
      expenseData.splitEntries = processedSplitEntries;
    } else {
      expenseData.splitBetween = splitBetween;
      expenseData.splitAmounts = numericSplitAmounts;
    }

    console.log('🔍 Creating expense with data:', JSON.stringify(expenseData, null, 2));
    
    const expense = new Expense(expenseData);

    // Save the expense (model validations will run)
    await expense.save();

    // Populate the expense with user and group details
    const populateFields = [
      { path: 'splitBetween', select: 'username email' },
      { path: 'group', select: 'name' }
    ];
    
    // Only populate paidBy if it exists (not email-only payer)
    if (expense.paidBy) {
      populateFields.push({ path: 'paidBy', select: 'username email' });
    }
    
    await expense.populate(populateFields);

    // Calculate balances for this expense
    let expenseBalances;
    try {
      expenseBalances = expense.calculateBalances();
      console.log('✅ Balance calculation successful');
    } catch (balanceError) {
      console.error('❌ Error in calculateBalances:', balanceError.message);
      throw balanceError;
    }

    // Get updated group expense summary with simplified debts
    let groupSummary = {}; // Temporarily skip to isolate the error
    // try {
    //   groupSummary = await calculateSimplifiedDebts(groupId);
    //   console.log('✅ Group summary calculation successful');
    // } catch (summaryError) {
    //   console.error('❌ Error in calculateSimplifiedDebts:', summaryError.message);
    //   throw summaryError;
    // }

    // Response with expense details and updated group summary
    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: {
        expense: {
          id: expense._id,
          amount: expense.amount,
          formattedAmount: expense.formattedAmount,
          description: expense.description,
          paidBy: expense.paidBy || { email: expense.paidByEmail },
            // consumer can check paidBy.email if no user object
          paidByEmail: expense.paidByEmail,
          splitBetween: expense.splitBetween,
          splitAmounts: expense.splitAmounts,
          date: expense.date,
          settled: expense.settled,
          group: expense.group,
          balances: expenseBalances,
          createdAt: expense.createdAt
        },
        groupSummary
      }
    });

  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      console.error('Validation Error creating expense:', message);
      return next(new ErrorResponse(message, 400));
    }
    
    console.error('Error creating expense - Full Details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return next(new ErrorResponse(`Error creating expense: ${error.message}`, 500));
  }
});

// @desc    Get group expense summary
// @route   GET /api/groups/:groupId/expenses/summary
// @access  Private
const getGroupExpenseSummary = async (groupId) => {
  try {
    // Get all expenses for the group
    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'username email')
      .populate('splitBetween', 'username email')
      .sort({ date: -1 });

    // Calculate totals using aggregation - with error handling
    let groupTotals = {
      totalAmount: 0,
      expenseCount: 0,
      settledAmount: 0,
      unsettledAmount: 0
    };

    try {
      const totals = await Expense.calculateGroupTotals(groupId);
      if (totals && totals.length > 0) {
        groupTotals = totals[0];
      }
    } catch (aggregationError) {
      console.error('Error calculating group totals:', aggregationError.message);
      // Use default values if aggregation fails
    }

    // Calculate net balances for all group members
    const group = await Group.findById(groupId).populate('members.userId', 'username email');
    const netBalances = {};

    // Initialize all members with 0 balance (include email-only members)
    if (group && group.members && group.members.length > 0) {
      group.members.forEach(member => {
      const key = member.userId ? member.userId.toString() : `email:${member.email}`;
      
      // Handle populated vs non-populated userId
      let userInfo;
      if (member.userId) {
        // Check if userId is populated (has username/email) or just an ObjectId
        if (typeof member.userId === 'object' && member.userId.username) {
          // Populated user
          userInfo = {
            id: member.userId._id || member.userId,
            username: member.userId.username,
            email: member.userId.email
          };
        } else {
          // Non-populated userId (just ObjectId)
          userInfo = {
            id: member.userId,
            username: member.fullName || member.email,
            email: member.email
          };
        }
      } else {
        // Email-only member
        userInfo = {
          id: null,
          username: member.fullName || member.email,
          email: member.email
        };
      }
      
      netBalances[key] = {
        user: userInfo,
        balance: 0,
        totalPaid: 0,
        totalOwed: 0
      };
      });
    }

    // Calculate balances from all expenses
    expenses.forEach(expense => {
      const expenseBalances = expense.calculateBalances();

      Object.entries(expenseBalances).forEach(([userKey, balance]) => {
        if (netBalances[userKey]) {
          netBalances[userKey].balance += balance;

          // Track total paid and total owed for registered split participants
          if (expense.paidBy && expense.paidBy._id && expense.paidBy._id.toString() === userKey) {
            netBalances[userKey].totalPaid += expense.amount;
          }

          if (expense.splitBetween && Array.isArray(expense.splitBetween)) {
            const splitIndex = expense.splitBetween.findIndex(
              user => (user._id && user._id.toString() === userKey) || 
                      (user.toString && user.toString() === userKey)
            );
            if (splitIndex !== -1 && expense.splitAmounts && expense.splitAmounts[splitIndex]) {
              netBalances[userKey].totalOwed += expense.splitAmounts[splitIndex];
            }
          }
        }
      });

      // If payer is email-only, credit them (not part of calculateBalances map)
      if (!expense.paidBy && expense.paidByEmail) {
        const emailKey = `email:${expense.paidByEmail}`;
        if (netBalances[emailKey]) {
          netBalances[emailKey].balance += expense.amount;
          netBalances[emailKey].totalPaid += expense.amount;
        } else {
          // Edge: expense payer email not currently a member (legacy) -> initialize
            netBalances[emailKey] = {
              user: { id: null, username: expense.paidByEmail, email: expense.paidByEmail },
              balance: expense.amount,
              totalPaid: expense.amount,
              totalOwed: 0
            };
        }
      }
    });

    // Convert to array and sort by balance
    const balanceArray = Object.values(netBalances)
      .map(item => ({
        ...item,
        balance: Math.round(item.balance * 100) / 100, // Round to 2 decimal places
        totalPaid: Math.round(item.totalPaid * 100) / 100,
        totalOwed: Math.round(item.totalOwed * 100) / 100,
        formattedBalance: `$${Math.abs(item.balance).toFixed(2)}`,
        status: item.balance > 0.01 ? 'owed' : item.balance < -0.01 ? 'owes' : 'settled'
      }))
      .sort((a, b) => b.balance - a.balance);

    // Find creditors and debtors for settlement suggestions
    const creditors = balanceArray.filter(item => item.balance > 0.01);
    const debtors = balanceArray.filter(item => item.balance < -0.01);

    // Generate simple settlement suggestions
    const settlements = generateSettlementSuggestions(creditors, debtors);

    return {
      groupId,
      totals: {
        ...groupTotals,
        formattedTotal: `$${groupTotals.totalAmount.toFixed(2)}`,
        formattedSettled: `$${groupTotals.settledAmount.toFixed(2)}`,
        formattedUnsettled: `$${groupTotals.unsettledAmount.toFixed(2)}`
      },
      balances: balanceArray,
      settlements,
      recentExpenses: expenses.slice(0, 10), // Last 10 expenses
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error('Error calculating group summary:', error);
    throw error;
  }
};

// Helper function to generate settlement suggestions
const generateSettlementSuggestions = (creditors, debtors) => {
  const settlements = [];
  const creditorsCopy = [...creditors];
  const debtorsCopy = [...debtors];

  while (creditorsCopy.length > 0 && debtorsCopy.length > 0) {
    const creditor = creditorsCopy[0];
    const debtor = debtorsCopy[0];

    const settleAmount = Math.min(creditor.balance, Math.abs(debtor.balance));

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.user,
        to: creditor.user,
        amount: Math.round(settleAmount * 100) / 100,
        formattedAmount: `$${settleAmount.toFixed(2)}`
      });

      // Update balances
      creditor.balance -= settleAmount;
      debtor.balance += settleAmount;
    }

    // Remove settled parties
    if (Math.abs(creditor.balance) < 0.01) {
      creditorsCopy.shift();
    }
    if (Math.abs(debtor.balance) < 0.01) {
      debtorsCopy.shift();
    }
  }

  return settlements;
};

// Export the controller function and helper
module.exports = {
  createExpense,
  getGroupExpenseSummary
};