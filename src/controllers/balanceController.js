const Settlement = require('../models/Settlement');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { validationResult } = require('express-validator');

// Get balances for a group
const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserEmail = req.user.email;

    // Verify user is member of the group
    const group = await Group.findById(groupId).populate('members.userId', 'username email');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(member => 
      member.email === currentUserEmail || 
      (member.userId && member.userId._id.toString() === req.user.id)
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    // Calculate all balances
    const allBalances = await Settlement.calculateGroupBalances(groupId);
    
    // Get current user's balances with other members
    const userBalances = [];
    const currentUserBalance = allBalances.get(currentUserEmail) || { amount: 0, transactions: [] };
    
    // Calculate net balance with each other member
    for (const member of group.members) {
      if (member.email !== currentUserEmail) {
        const netBalance = await Settlement.calculateBalanceBetween(groupId, currentUserEmail, member.email);
        
        if (Math.abs(netBalance) > 0.01) { // Only show non-zero balances
          userBalances.push({
            memberEmail: member.email,
            memberUserId: member.userId?._id,
            memberName: member.fullName || (member.userId ? member.userId.username : member.email.split('@')[0]),
            balanceAmount: Math.round(netBalance * 100) / 100, // Round to 2 decimal places
            currency: group.currency || 'INR',
            status: member.status
          });
        }
      }
    }

    // Calculate total net balance for current user
    const totalNetBalance = userBalances.reduce((sum, balance) => sum + balance.balanceAmount, 0);

    res.json({
      success: true,
      data: {
        balances: userBalances,
        totalNetBalance: Math.round(totalNetBalance * 100) / 100,
        currency: group.currency || 'INR'
      }
    });

  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({ error: 'Failed to get balances' });
  }
};

// Get detailed debts for a group
const getGroupDebts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserEmail = req.user.email;
    const { memberEmail, startDate, endDate } = req.query;

    // Verify user is member of the group
    const group = await Group.findById(groupId).populate('members.userId', 'username email');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(member => 
      member.email === currentUserEmail || 
      (member.userId && member.userId._id.toString() === req.user.id)
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    // Build expense query
    let expenseQuery = { groupId };
    if (startDate || endDate) {
      expenseQuery.date = {};
      if (startDate) expenseQuery.date.$gte = new Date(startDate);
      if (endDate) expenseQuery.date.$lte = new Date(endDate);
    }

    // Get expenses
    const expenses = await Expense.find(expenseQuery)
      .populate('paidByUserId', 'username email')
      .sort({ date: -1 });

    // Get settlements
    let settlementQuery = { groupId };
    if (startDate || endDate) {
      settlementQuery.date = {};
      if (startDate) settlementQuery.date.$gte = new Date(startDate);
      if (endDate) settlementQuery.date.$lte = new Date(endDate);
    }

    const settlements = await Settlement.find(settlementQuery)
      .populate(['fromUserId', 'toUserId'], 'username email')
      .sort({ date: -1 });

    const debts = [];

    // Process expenses to find debts involving current user
    expenses.forEach(expense => {
      const { paidByEmail, splitAmong, amount, description, date, currency, _id } = expense;
      const splitAmount = amount / splitAmong.length;

      splitAmong.forEach(split => {
        // Find debts where current user is involved
        if ((split.email === currentUserEmail && paidByEmail !== currentUserEmail) ||
            (paidByEmail === currentUserEmail && split.email !== currentUserEmail)) {
          
          // Apply member filter if specified
          if (memberEmail && 
              split.email !== memberEmail && 
              paidByEmail !== memberEmail) {
            return;
          }

          const isUserOwing = split.email === currentUserEmail;
          const otherPartyEmail = isUserOwing ? paidByEmail : split.email;
          
          // Find member info
          const otherMember = group.members.find(m => m.email === otherPartyEmail);
          
          debts.push({
            expenseId: _id,
            description,
            date,
            amount: Math.round(splitAmount * 100) / 100,
            currency: currency || group.currency || 'INR',
            paidByEmail,
            owedByEmail: split.email,
            otherPartyEmail,
            otherPartyName: otherMember?.fullName || 
                           (otherMember?.userId ? otherMember.userId.username : otherPartyEmail.split('@')[0]),
            isUserOwing,
            type: 'expense',
            status: 'unpaid' // Will be updated based on settlements
          });
        }
      });
    });

    // Process settlements to update debt status and add settlement records
    settlements.forEach(settlement => {
      const { fromEmail, toEmail, amount, date, comments, _id, paymentMethod } = settlement;
      
      // Add settlement as a debt entry if current user is involved
      if (fromEmail === currentUserEmail || toEmail === currentUserEmail) {
        // Apply member filter if specified
        if (memberEmail && 
            fromEmail !== memberEmail && 
            toEmail !== memberEmail) {
          return;
        }

        const isUserPaying = fromEmail === currentUserEmail;
        const otherPartyEmail = isUserPaying ? toEmail : fromEmail;
        
        // Find member info
        const otherMember = group.members.find(m => m.email === otherPartyEmail);
        
        debts.push({
          settlementId: _id,
          description: comments || `Settlement - ${paymentMethod || 'Payment'}`,
          date,
          amount: Math.round(amount * 100) / 100,
          currency: settlement.currency,
          fromEmail,
          toEmail,
          otherPartyEmail,
          otherPartyName: otherMember?.fullName || 
                         (otherMember?.userId ? otherMember.userId.username : otherPartyEmail.split('@')[0]),
          isUserPaying,
          type: 'settlement',
          status: settlement.status,
          paymentMethod
        });
      }
    });

    // Sort by date (newest first)
    debts.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        debts,
        totalCount: debts.length
      }
    });

  } catch (error) {
    console.error('Get debts error:', error);
    res.status(500).json({ error: 'Failed to get debts' });
  }
};

// Create a new settlement
const createSettlement = async (req, res) => {
  try {
    console.log('=== Settlement Creation Debug ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { groupId } = req.params;
    const {
      toEmail,
      toUserId,
      amount,
      currency,
      paymentMethod,
      comments
    } = req.body;

    const currentUser = req.user;
    const fromEmail = currentUser.email;
    const fromUserId = currentUser.id;

    // Verify group exists and user is member
    const group = await Group.findById(groupId).populate('members.userId', 'username email');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(member => 
      member.email === fromEmail || 
      (member.userId && member.userId._id.toString() === fromUserId)
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    // Verify recipient is also a member
    const recipientIsMember = group.members.some(member => 
      member.email === toEmail || 
      (toUserId && member.userId && member.userId._id.toString() === toUserId)
    );

    if (!recipientIsMember) {
      return res.status(400).json({ error: 'Settlement recipient is not a member of this group' });
    }

    // Temporarily skip balance validation to test settlement creation
    console.log('Skipping balance validation for debugging...');
    
    // TODO: Re-enable balance validation after fixing the core issue
    // const currentBalance = await Settlement.calculateBalanceBetween(groupId, fromEmail, toEmail);
    
    // Validate settlement amount is positive
    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be greater than 0'
      });
    }

    // Create settlement
    const settlement = new Settlement({
      groupId,
      fromUserId,
      fromEmail,
      toUserId: toUserId || null,
      toEmail,
      amount,
      currency: currency || group.currency || 'INR',
      paymentMethod,
      comments,
      createdBy: fromUserId,
      status: 'completed'
    });

    await settlement.save();

    // Populate settlement with user info
    await settlement.populate('fromUserId', 'username email');
    await settlement.populate('toUserId', 'username email');

    // TODO: Re-enable balance calculation after fixing the core issue
    // const updatedBalance = await Settlement.calculateBalanceBetween(groupId, fromEmail, toEmail);

    res.status(201).json({
      success: true,
      data: {
        settlement: {
          _id: settlement._id,
          fromEmail: settlement.fromEmail,
          toEmail: settlement.toEmail,
          amount: settlement.amount,
          currency: settlement.currency,
          date: settlement.date,
          paymentMethod: settlement.paymentMethod,
          comments: settlement.comments,
          status: settlement.status,
          fromUser: settlement.fromUserId,
          toUser: settlement.toUserId
        }
        // updatedBalance: Math.round(updatedBalance * 100) / 100
      }
    });

  } catch (error) {
    console.error('=== Create settlement error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    res.status(500).json({ 
      error: 'Failed to create settlement',
      details: error.message 
    });
  }
};

// Get settlement history for a group
const getSettlementHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserEmail = req.user.email;
    const { page = 1, limit = 20 } = req.query;

    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(member => 
      member.email === currentUserEmail || 
      (member.userId && member.userId._id.toString() === req.user.id)
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    // Get settlements with pagination
    const settlements = await Settlement.find({ groupId })
      .populate(['fromUserId', 'toUserId'], 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalSettlements = await Settlement.countDocuments({ groupId });

    res.json({
      success: true,
      data: {
        settlements: settlements.map(settlement => ({
          _id: settlement._id,
          fromEmail: settlement.fromEmail,
          toEmail: settlement.toEmail,
          amount: settlement.amount,
          currency: settlement.currency,
          date: settlement.date,
          paymentMethod: settlement.paymentMethod,
          comments: settlement.comments,
          status: settlement.status,
          fromUser: settlement.fromUserId,
          toUser: settlement.toUserId,
          createdAt: settlement.createdAt
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSettlements / limit),
          totalSettlements,
          hasNextPage: page * limit < totalSettlements,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get settlement history error:', error);
    res.status(500).json({ error: 'Failed to get settlement history' });
  }
};

module.exports = {
  getGroupBalances,
  getGroupDebts,
  createSettlement,
  getSettlementHistory
};