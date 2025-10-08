const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { getGroupExpenseSummary } = require('./expenseController');
const { getPendingInvitationStats, syncUserWithGroupInvitations } = require('../utils/groupSync');
const { calculateSimplifiedDebts } = require('../utils/debtSimplification');

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
const createGroup = asyncHandler(async (req, res, next) => {
  const { name, members } = req.body;
  const adminId = req.user.id;

  // Validate required fields
  if (!name || name.trim().length < 2) {
    return next(new ErrorResponse('Group name must be at least 2 characters long', 400));
  }

  // Process member emails and create member objects
  let groupMembers = [];
  
  // Get admin user details
  const adminUser = await User.findById(adminId);
  if (!adminUser) {
    return next(new ErrorResponse('Admin user not found', 404));
  }

  // Add admin as first member
  groupMembers.push({
    email: adminUser.email,
    userId: adminId,
    status: 'active',
    joinedAt: new Date()
  });

  if (members && Array.isArray(members)) {
    // Process each member email
    const memberEmails = members.map(email => email.toLowerCase().trim());
    
    // Remove admin email if included in members list
    const uniqueEmails = memberEmails.filter(email => email !== adminUser.email.toLowerCase());
    
    if (uniqueEmails.length > 0) {
      // Find existing users by email
      const existingUsers = await User.find({ 
        email: { $in: uniqueEmails } 
      });
      
      const existingEmailMap = {};
      existingUsers.forEach(user => {
        existingEmailMap[user.email.toLowerCase()] = user;
      });

      // Process each unique email
      uniqueEmails.forEach(email => {
        const user = existingEmailMap[email];
        
        groupMembers.push({
          email: email,
          userId: user ? user._id : null,
          status: user ? 'active' : 'invited',
          joinedAt: user ? new Date() : null
        });
      });
    }
  }

  try {
    // Create group with member objects
    const group = new Group({
      name: name.trim(),
      members: groupMembers,
      admin: adminId
    });

    await group.save();

    // Populate member userId references and admin details
    await group.populate([
      { path: 'members.userId', select: 'username email profilePhoto' },
      { path: 'admin', select: 'username email profilePhoto' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      return next(new ErrorResponse(message, 400));
    }
    
    console.error('Error creating group:', error);
    return next(new ErrorResponse('Error creating group', 500));
  }
});

// @desc    Get user's groups
// @route   GET /api/groups
// @access  Private
const getUserGroups = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const groups = await Group.find({
      'members.userId': userId
    }).populate([
      { path: 'members.userId', select: 'username email profilePhoto' },
      { path: 'admin', select: 'username email profilePhoto' }
    ])
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });

  } catch (error) {
    console.error('Error fetching user groups:', error);
    return next(new ErrorResponse('Error fetching groups', 500));
  }
});

// @desc    Get group by ID with expense summary
// @route   GET /api/groups/:groupId
// @access  Private
const getGroupById = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const group = await Group.findById(groupId).populate([
      { path: 'members.userId', select: 'username email profilePhoto' },
      { path: 'admin', select: 'username email profilePhoto' }
    ]);

    if (!group) {
      return next(new ErrorResponse('Group not found', 404));
    }

    // Check if user is a member (by userId or email, including admin check)
    const currentUser = req.user;
    const isMemberByUserId = group.isMemberByUserId(userId);
    const isMemberByEmail = group.isMemberByEmail(currentUser.email);
    const isAdmin = group.admin.toString() === userId;
    
    if (!isMemberByUserId && !isMemberByEmail && !isAdmin) {
      return next(new ErrorResponse('You are not a member of this group', 403));
    }

    // Get expense summary
    const expenseSummary = await getGroupExpenseSummary(groupId);

    res.status(200).json({
      success: true,
      data: {
        group,
        ...expenseSummary
      }
    });

  } catch (error) {
    console.error('Error fetching group:', error);
    return next(new ErrorResponse('Error fetching group', 500));
  }
});

// @desc    Add member to group
// @route   POST /api/groups/:groupId/members
// @access  Private (Admin only)
const addGroupMember = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const { email } = req.body;
  const currentUserId = req.user.id;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new ErrorResponse('Group not found', 404));
    }

    // Check if current user is admin
    if (!group.isAdmin(currentUserId)) {
      return next(new ErrorResponse('Only group admin can add members', 403));
    }

    // Check if email is already a member
    if (group.isMemberByEmail(email)) {
      return next(new ErrorResponse('User with this email is already a member of this group', 400));
    }

    // Check if user exists by email
    const userToAdd = await User.findOne({ email: email.toLowerCase() });

  // Add member (whether registered or not)
  group.addMemberByEmail(email, userToAdd ? userToAdd._id : null);
    await group.save();

    // Populate and return updated group
    await group.populate([
      { path: 'members.userId', select: 'username email profilePhoto' },
      { path: 'admin', select: 'username email profilePhoto' }
    ]);

    const message = userToAdd 
      ? 'Member added successfully' 
      : `Invitation sent to ${email}. They will be added when they register.`;

    res.status(200).json({
      success: true,
      message: message,
      data: group
    });

  } catch (error) {
    console.error('Error adding group member:', error);
    return next(new ErrorResponse('Error adding group member', 500));
  }
});

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:userId
// @access  Private (Admin only)
const removeGroupMember = asyncHandler(async (req, res, next) => {
  const { groupId, userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new ErrorResponse('Group not found', 404));
    }

    // Check if current user is admin
    if (!group.isAdmin(currentUserId)) {
      return next(new ErrorResponse('Only group admin can remove members', 403));
    }

    // Check if user is a member
    if (!group.isMemberByUserId(userId)) {
      return next(new ErrorResponse('User is not a member of this group', 400));
    }

    // Remove member by userId
    try {
      group.removeMemberByUserId(userId);
      await group.save();

      // Populate and return updated group
      await group.populate([
        { path: 'members.userId', select: 'username email profilePhoto' },
        { path: 'admin', select: 'username email profilePhoto' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
        data: group
      });

    } catch (removeError) {
      return next(new ErrorResponse(removeError.message, 400));
    }

  } catch (error) {
    console.error('Error removing group member:', error);
    return next(new ErrorResponse('Error removing group member', 500));
  }
});

// @desc    Get pending group invitation statistics
// @route   GET /api/groups/stats/pending-invitations
// @access  Private (Admin only)
const getPendingInvitations = asyncHandler(async (req, res, next) => {
  try {
    const stats = await getPendingInvitationStats();
    
    res.status(200).json({
      success: true,
      message: 'Pending invitation statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error fetching pending invitation stats:', error);
    return next(new ErrorResponse('Error fetching pending invitation statistics', 500));
  }
});

// Helper function to calculate simplified debts from balance map
const calculateSimplifiedDebtsFromBalances = (balanceMap, groupMembers) => {
  const creditors = [];
  const debtors = [];
  const tolerance = 0.01;

  // Create a member lookup map for user data
  const memberLookup = new Map();
  groupMembers.forEach(member => {
    memberLookup.set(member.email, {
      _id: member.userId ? member.userId._id : member.email,
      username: member.userId ? member.userId.username : member.email.split('@')[0],
      email: member.email,
      profilePhoto: member.userId ? member.userId.profilePhoto : null
    });
  });

  // Separate creditors and debtors
  balanceMap.forEach((balance, email) => {
    if (balance > tolerance) {
      creditors.push({ email, amount: balance });
    } else if (balance < -tolerance) {
      debtors.push({ email, amount: Math.abs(balance) });
    }
  });

  // Sort by amount (descending)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Generate simplified transactions
  const transactions = [];
  const workingCreditors = [...creditors];
  const workingDebtors = [...debtors];

  while (workingCreditors.length > 0 && workingDebtors.length > 0) {
    const creditor = workingCreditors[0];
    const debtor = workingDebtors[0];
    const settlementAmount = Math.min(creditor.amount, debtor.amount);

    if (settlementAmount > tolerance) {
      transactions.push({
        from: memberLookup.get(debtor.email),
        to: memberLookup.get(creditor.email),
        amount: Number(settlementAmount.toFixed(2)),
        currency: 'INR'
      });
    }

    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    if (creditor.amount <= tolerance) workingCreditors.shift();
    if (debtor.amount <= tolerance) workingDebtors.shift();
  }

  return transactions;
};

// @desc    Get comprehensive group summary with balances, debts, and settlements
// @route   GET /api/groups/:groupId/summary
// @access  Private
const getGroupSummary = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    // Validate group exists and user has access
    const group = await Group.findById(groupId).populate('members.userId', 'username email profilePhoto');
    if (!group) {
      return next(new ErrorResponse('Group not found', 404));
    }

    // Check if user is a member
    const isMemberByUserId = group.isMember(userId);
    const isMemberByEmail = group.isMemberByEmail(req.user.email);
    const isAdmin = group.admin.toString() === userId;
    
    if (!isMemberByUserId && !isMemberByEmail && !isAdmin) {
      return next(new ErrorResponse('You are not a member of this group', 403));
    }

    // Get all expenses for the group
    const expenses = await Expense.find({ group: groupId })
      .populate('paidByUserId', 'username email profilePhoto')
      .populate('splitAmong.userId', 'username email profilePhoto')
      .sort({ date: -1 });

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const currency = group.currency || 'INR';

    // Get settlements before calculating balances (we need them for balance calculation)
    const settlements = await Settlement.find({ groupId: groupId })
      .populate('fromUserId', 'username email profilePhoto')
      .populate('toUserId', 'username email profilePhoto')
      .sort({ createdAt: -1 })
      .exec();

    // Calculate member balances
    const memberBalances = [];
    const balanceMap = new Map();

    // Process each expense to calculate balances
    expenses.forEach(expense => {
      // Credit the payer
      const payerEmail = expense.paidByEmail;
      if (!balanceMap.has(payerEmail)) {
        balanceMap.set(payerEmail, 0);
      }
      balanceMap.set(payerEmail, balanceMap.get(payerEmail) + expense.amount);

      // Debit the split members
      const splitAmount = expense.amount / expense.splitAmong.length;
      expense.splitAmong.forEach(member => {
        const memberEmail = member.email;
        if (!balanceMap.has(memberEmail)) {
          balanceMap.set(memberEmail, 0);
        }
        balanceMap.set(memberEmail, balanceMap.get(memberEmail) - splitAmount);
      });
    });

    // Process settlements to adjust balances
    // When someone pays someone else, it settles part of the debt between them
    settlements.forEach(settlement => {
      const fromEmail = settlement.fromEmail;
      const toEmail = settlement.toEmail;
      const amount = settlement.amount;

      // Initialize if not exists
      if (!balanceMap.has(fromEmail)) {
        balanceMap.set(fromEmail, 0);
      }
      if (!balanceMap.has(toEmail)) {
        balanceMap.set(toEmail, 0);
      }

      // Settlement logic: fromEmail pays toEmail
      // This INCREASES fromEmail's net balance (they paid money out, reducing their debt)
      // This DECREASES toEmail's net balance (they received money, reducing what they're owed)
      balanceMap.set(fromEmail, balanceMap.get(fromEmail) + amount);
      balanceMap.set(toEmail, balanceMap.get(toEmail) - amount);
    });

    // Convert balance map to member balances array
    group.members.forEach(member => {
      const email = member.email;
      const balanceFromMap = balanceMap.get(email) || 0;
      
      // Calculate individual owes and owed amounts
      let totalPaid = 0;
      let totalShare = 0;
      
      expenses.forEach(expense => {
        const splitAmount = expense.amount / expense.splitAmong.length;
        
        // If this member paid for the expense
        if (expense.paidByEmail === email) {
          totalPaid += expense.amount;
        }
        
        // If this member is part of the split
        const isMemberInSplit = expense.splitAmong.some(splitMember => splitMember.email === email);
        if (isMemberInSplit) {
          totalShare += splitAmount;
        }
      });
      
      const calculatedBalance = totalPaid - totalShare;
      const owes = calculatedBalance < 0 ? Math.abs(calculatedBalance) : 0;
      const owed = calculatedBalance > 0 ? calculatedBalance : 0;
      
      memberBalances.push({
        user: {
          _id: member.userId ? member.userId._id : member.email,
          username: member.userId ? member.userId.username : email.split('@')[0],
          email: email,
          profilePhoto: member.userId ? member.userId.profilePhoto : null
        },
        owes: Number(owes.toFixed(2)),
        owed: Number(owed.toFixed(2)),
        balance: Number(balanceFromMap.toFixed(2)),
        currency: currency
      });
    });

    // Calculate simplified debts (now with settlements applied)
    const simplifiedDebts = calculateSimplifiedDebtsFromBalances(balanceMap, group.members);

    // Calculate total settlements amount
    const totalSettlements = settlements.reduce((sum, settlement) => sum + settlement.amount, 0);

    // Calculate total balance (should be close to 0 if balanced)
    const totalBalance = memberBalances.reduce((sum, member) => sum + member.balanceAmount, 0);

    const summary = {
      totalBalance: Number(totalBalance.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      totalSettlements: Number(totalSettlements.toFixed(2)),
      currency: currency,
      memberBalances: memberBalances,
      simplifiedDebts: simplifiedDebts,
      settlements: settlements
    };

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching group summary:', error);
    return next(new ErrorResponse('Error fetching group summary', 500));
  }
});

module.exports = {
  createGroup,
  getUserGroups,
  getGroupById,
  addGroupMember,
  removeGroupMember,
  getPendingInvitations,
  getGroupSummary
};