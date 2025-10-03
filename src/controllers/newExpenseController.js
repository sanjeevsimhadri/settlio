const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res, next) => {
  const { 
    groupId, 
    description, 
    amount, 
    currency, 
    paidByEmail, 
    paidByUserId,
    splitAmong, 
    date, 
    comments 
  } = req.body;
  
  const currentUserId = req.user.id;

  // Validate required fields
  if (!groupId) {
    return next(new ErrorResponse('Group ID is required', 400));
  }

  if (!description || description.trim().length < 2) {
    return next(new ErrorResponse('Description is required and must be at least 2 characters long', 400));
  }

  if (!amount || amount <= 0) {
    return next(new ErrorResponse('Amount must be a positive number', 400));
  }

  if (!paidByEmail) {
    return next(new ErrorResponse('Payer email is required', 400));
  }

  if (!splitAmong || !Array.isArray(splitAmong) || splitAmong.length === 0) {
    return next(new ErrorResponse('Split among must include at least one member', 400));
  }

  // Validate group exists and user has access
  const group = await Group.findById(groupId).populate('members.userId', 'email');
  if (!group) {
    return next(new ErrorResponse('Group not found', 404));
  }

  // Check if current user is a member of the group
  const isMember = group.members.some(member => 
    (member.userId && member.userId._id.toString() === currentUserId) ||
    member.email === req.user.email
  );
  
  if (!isMember) {
    return next(new ErrorResponse('You are not a member of this group', 403));
  }

  // Validate paidByEmail exists in group members
  const payerMember = group.members.find(member => member.email === paidByEmail.toLowerCase());
  if (!payerMember) {
    return next(new ErrorResponse('Payer email is not a member of this group', 400));
  }

  // If paidByUserId is provided, validate it matches the email
  if (paidByUserId && payerMember.userId && payerMember.userId._id.toString() !== paidByUserId) {
    return next(new ErrorResponse('Payer user ID does not match the email', 400));
  }

  // Use the actual userId from the group member if available
  const actualPaidByUserId = payerMember.userId ? payerMember.userId._id : null;

  // Validate all splitAmong members exist in the group
  const processedSplitAmong = [];
  for (const splitMember of splitAmong) {
    let memberEmail, memberUserId;
    
    if (typeof splitMember === 'string') {
      // If it's just an email string
      memberEmail = splitMember.toLowerCase();
    } else if (splitMember.email) {
      // If it's an object with email (and possibly userId)
      memberEmail = splitMember.email.toLowerCase();
      memberUserId = splitMember.userId;
    } else {
      return next(new ErrorResponse('Each split member must have an email', 400));
    }

    const groupMember = group.members.find(member => member.email === memberEmail);
    if (!groupMember) {
      return next(new ErrorResponse(`Split member ${memberEmail} is not a member of this group`, 400));
    }

    // Use the actual userId from the group member if available
    const actualUserId = groupMember.userId ? groupMember.userId._id : null;

    processedSplitAmong.push({
      email: memberEmail,
      userId: actualUserId
    });
  }

  // Remove duplicates in splitAmong
  const uniqueSplitAmong = processedSplitAmong.filter((member, index, self) => 
    index === self.findIndex(m => m.email === member.email)
  );

  // For splitBetween, we need to include all members
  // For email-only members without user IDs, we'll use a special handling approach
  const splitBetween = uniqueSplitAmong.map(member => {
    // If member has userId, use it; otherwise we'll handle this differently in the model
    return member.userId || null;
  });

  // Create equal split amounts
  const splitAmount = parseFloat(amount) / uniqueSplitAmong.length;
  const splitAmounts = uniqueSplitAmong.map(() => splitAmount);

  try {
    // Create the expense
    const expense = new Expense({
      group: groupId,
      description: description.trim(),
      amount: parseFloat(amount),
      currency: currency || group.currency || 'INR',
      paidByEmail: paidByEmail.toLowerCase(),
      paidByUserId: actualPaidByUserId,
      splitBetween: splitBetween,
      splitAmong: uniqueSplitAmong,
      splitAmounts: splitAmounts,
      date: date ? new Date(date) : new Date(),
      comments: comments ? comments.trim() : ''
    });

    await expense.save();

    // Populate the created expense
    await expense.populate([
      { path: 'group', select: 'name currency' },
      { path: 'paidByUserId', select: 'username email' },
      { path: 'splitAmong.userId', select: 'username email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });

  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const message = error.errors && Object.keys(error.errors).length > 0 
        ? Object.values(error.errors).map(val => val.message).join(', ')
        : 'Validation error';
      return next(new ErrorResponse(message, 400));
    }
    
    console.error('Error creating expense:', error);
    return next(new ErrorResponse('Error creating expense', 500));
  }
});

// @desc    Get expenses for a group
// @route   GET /api/expenses/:groupId
// @access  Private
const getGroupExpenses = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const currentUserId = req.user.id;

  // Validate group exists and user has access
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new ErrorResponse('Group not found', 404));
  }

  // Check if current user is a member
  const isMember = group.members.some(member => 
    (member.userId && member.userId.toString() === currentUserId) ||
    member.email === req.user.email
  );
  
  if (!isMember) {
    return next(new ErrorResponse('You are not authorized to view expenses for this group', 403));
  }

  try {
    const expenses = await Expense.findByGroup(groupId);

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });

  } catch (error) {
    console.error('Error fetching group expenses:', error);
    return next(new ErrorResponse('Error fetching expenses', 500));
  }
});

// @desc    Get expense by ID
// @route   GET /api/expenses/expense/:expenseId
// @access  Private
const getExpenseById = asyncHandler(async (req, res, next) => {
  const { expenseId } = req.params;
  const currentUserId = req.user.id;

  try {
    const expense = await Expense.findById(expenseId)
      .populate('groupId', 'name currency')
      .populate('paidByUserId', 'username email')
      .populate('splitAmong.userId', 'username email');

    if (!expense) {
      return next(new ErrorResponse('Expense not found', 404));
    }

    // Check if user has access to this expense through group membership
    const group = await Group.findById(expense.groupId);
    const isMember = group.members.some(member => 
      (member.userId && member.userId.toString() === currentUserId) ||
      member.email === req.user.email
    );
    
    if (!isMember) {
      return next(new ErrorResponse('You are not authorized to view this expense', 403));
    }

    res.status(200).json({
      success: true,
      data: expense
    });

  } catch (error) {
    console.error('Error fetching expense:', error);
    return next(new ErrorResponse('Error fetching expense', 500));
  }
});

// @desc    Delete expense
// @route   DELETE /api/groups/:groupId/expenses/:expenseId
// @access  Private
const deleteExpense = asyncHandler(async (req, res, next) => {
  const { groupId, expenseId } = req.params;
  const currentUserId = req.user.id;

  console.log('🗑️  Delete expense request received:', {
    groupId,
    expenseId,
    currentUserId,
    userEmail: req.user.email
  });

  try {
    // Find the expense
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return next(new ErrorResponse('Expense not found', 404));
    }

    // Verify the expense belongs to the specified group
    if (expense.group.toString() !== groupId) {
      return next(new ErrorResponse('Expense does not belong to this group', 400));
    }

    // Verify group exists and user has access
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new ErrorResponse('Group not found', 404));
    }

    // Check if current user is a member of the group
    const isMember = group.members.some(member => 
      (member.userId && member.userId.toString() === currentUserId) ||
      member.email === req.user.email
    );
    
    if (!isMember) {
      return next(new ErrorResponse('You are not authorized to delete expenses in this group', 403));
    }

    // Additional authorization: only expense creator or group admin can delete
    const canDelete = expense.paidByUserId && expense.paidByUserId.toString() === currentUserId ||
                      expense.paidByEmail === req.user.email ||
                      group.createdBy.toString() === currentUserId;

    if (!canDelete) {
      return next(new ErrorResponse('You are not authorized to delete this expense', 403));
    }

    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting expense:', error);
    return next(new ErrorResponse('Error deleting expense', 500));
  }
});

module.exports = {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  deleteExpense
};