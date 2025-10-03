const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Group = require('../models/Group');
const { 
  calculateSimplifiedDebts, 
  calculateWhatIfSettlement 
} = require('../utils/debtSimplification');

// @desc    Get simplified debt calculations for a group
// @route   GET /api/groups/:groupId/debts/simplified
// @access  Private
const getSimplifiedDebts = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const { includeSettled } = req.query;

  // Validate group exists and user is a member
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new ErrorResponse('Group not found', 404));
  }

  // Check if user is a member (by userId or email)
  const currentUser = req.user;
  const isMemberByUserId = group.isMember(userId);
  const isMemberByEmail = group.isMemberByEmail(currentUser.email);
  
  if (!isMemberByUserId && !isMemberByEmail) {
    return next(new ErrorResponse('You are not a member of this group', 403));
  }

  try {
    const options = {
      includeSettled: includeSettled === 'true'
    };

    const debtAnalysis = await calculateSimplifiedDebts(groupId, options);

    res.status(200).json({
      success: true,
      data: debtAnalysis
    });

  } catch (error) {
    console.error('Error calculating simplified debts:', error);
    return next(new ErrorResponse('Error calculating group debts', 500));
  }
});

// @desc    Get net balance for a specific user in a group
// @route   GET /api/groups/:groupId/debts/user/:targetUserId
// @access  Private
const getUserBalance = asyncHandler(async (req, res, next) => {
  const { groupId, targetUserId } = req.params;
  const currentUserId = req.user.id;

  // Validate group exists and user is a member
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new ErrorResponse('Group not found', 404));
  }

  // Check if current user is a member (by userId or email)
  const currentUser = req.user;
  const isCurrentMemberByUserId = group.isMember(currentUserId);
  const isCurrentMemberByEmail = group.isMemberByEmail(currentUser.email);
  
  if (!isCurrentMemberByUserId && !isCurrentMemberByEmail) {
    return next(new ErrorResponse('You are not a member of this group', 403));
  }

  if (!group.isMember(targetUserId)) {
    return next(new ErrorResponse('Target user is not a member of this group', 404));
  }

  try {
    const debtAnalysis = await calculateSimplifiedDebts(groupId);
    
    // Find the target user's balance
    const userBalance = debtAnalysis.netBalances.find(
      balance => balance.user.id.toString() === targetUserId
    );

    if (!userBalance) {
      return next(new ErrorResponse('User balance not found', 404));
    }

    // Find any direct transactions involving this user
    const userTransactions = debtAnalysis.simplifiedTransactions.filter(
      transaction => 
        transaction.from.id.toString() === targetUserId ||
        transaction.to.id.toString() === targetUserId
    );

    res.status(200).json({
      success: true,
      data: {
        user: userBalance.user,
        balance: userBalance.balance,
        status: userBalance.status,
        formattedBalance: userBalance.formattedBalance,
        transactions: userTransactions,
        summary: {
          owesTotal: userBalance.balance < 0 ? Math.abs(userBalance.balance) : 0,
          owedTotal: userBalance.balance > 0 ? userBalance.balance : 0,
          transactionCount: userTransactions.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting user balance:', error);
    return next(new ErrorResponse('Error calculating user balance', 500));
  }
});

// @desc    Calculate what-if scenario for settlements
// @route   POST /api/groups/:groupId/debts/what-if
// @access  Private
const calculateWhatIf = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const { settlements } = req.body;
  const userId = req.user.id;

  // Validate group exists and user is a member
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new ErrorResponse('Group not found', 404));
  }

  // Check if user is a member (by userId or email)
  const currentUser = req.user;
  const isMemberByUserId = group.isMember(userId);
  const isMemberByEmail = group.isMemberByEmail(currentUser.email);
  
  if (!isMemberByUserId && !isMemberByEmail) {
    return next(new ErrorResponse('You are not a member of this group', 403));
  }

  // Validate settlements array
  if (!Array.isArray(settlements)) {
    return next(new ErrorResponse('Settlements must be an array', 400));
  }

  // Validate each settlement
  for (const settlement of settlements) {
    const { fromUserId, toUserId, amount } = settlement;
    
    if (!fromUserId || !toUserId || typeof amount !== 'number' || amount <= 0) {
      return next(new ErrorResponse('Each settlement must have fromUserId, toUserId, and positive amount', 400));
    }

    if (!group.isMember(fromUserId) || !group.isMember(toUserId)) {
      return next(new ErrorResponse('All settlement users must be group members', 400));
    }
  }

  try {
    const whatIfResult = await calculateWhatIfSettlement(groupId, settlements);

    res.status(200).json({
      success: true,
      message: 'What-if scenario calculated successfully',
      data: whatIfResult
    });

  } catch (error) {
    console.error('Error calculating what-if scenario:', error);
    return next(new ErrorResponse('Error calculating what-if scenario', 500));
  }
});

// @desc    Get settlement suggestions for optimal debt resolution
// @route   GET /api/groups/:groupId/debts/suggestions
// @access  Private
const getSettlementSuggestions = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const { algorithm = 'greedy' } = req.query;

  // Validate group exists and user is a member
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new ErrorResponse('Group not found', 404));
  }

  // Check if user is a member (by userId or email)
  const currentUser = req.user;
  const isMemberByUserId = group.isMember(userId);
  const isMemberByEmail = group.isMemberByEmail(currentUser.email);
  
  if (!isMemberByUserId && !isMemberByEmail) {
    return next(new ErrorResponse('You are not a member of this group', 403));
  }

  try {
    const debtAnalysis = await calculateSimplifiedDebts(groupId);
    
    // Calculate alternative algorithms if requested
    let alternativeTransactions = [];
    if (algorithm === 'advanced') {
      // This would use the advanced optimization algorithm
      // For now, we'll use the same greedy approach
      alternativeTransactions = debtAnalysis.simplifiedTransactions;
    }

    // Calculate savings compared to direct settlements
    const directTransactionCount = debtAnalysis.debtors.length * debtAnalysis.creditors.length;
    const optimizedTransactionCount = debtAnalysis.simplifiedTransactions.length;
    const transactionSavings = Math.max(0, directTransactionCount - optimizedTransactionCount);

    res.status(200).json({
      success: true,
      data: {
        recommendations: debtAnalysis.simplifiedTransactions,
        alternativeOptions: alternativeTransactions,
        optimization: {
          originalPossibleTransactions: directTransactionCount,
          optimizedTransactions: optimizedTransactionCount,
          transactionsSaved: transactionSavings,
          efficiencyImprovement: directTransactionCount > 0 
            ? `${((transactionSavings / directTransactionCount) * 100).toFixed(1)}%`
            : '0%'
        },
        summary: debtAnalysis.summary,
        tips: generateSettlementTips(debtAnalysis)
      }
    });

  } catch (error) {
    console.error('Error generating settlement suggestions:', error);
    return next(new ErrorResponse('Error generating settlement suggestions', 500));
  }
});

/**
 * Generate helpful tips for debt settlement
 * @param {Object} debtAnalysis - The debt analysis result
 * @returns {Array} Array of helpful tips
 */
const generateSettlementTips = (debtAnalysis) => {
  const tips = [];
  
  if (debtAnalysis.simplifiedTransactions.length === 0) {
    tips.push('🎉 All debts are settled! No transactions needed.');
  } else {
    tips.push(`💡 You can settle all debts with just ${debtAnalysis.simplifiedTransactions.length} transaction(s).`);
    
    if (debtAnalysis.creditors.length === 1) {
      tips.push('💰 There\'s only one person who is owed money, making settlement simple.');
    }
    
    if (debtAnalysis.debtors.length === 1) {
      tips.push('📝 Only one person owes money to others.');
    }
    
    if (debtAnalysis.simplifiedTransactions.length > 0) {
      const largestTransaction = debtAnalysis.simplifiedTransactions.reduce(
        (max, transaction) => transaction.amount > max.amount ? transaction : max
      );
      tips.push(`🔢 Largest settlement: ${largestTransaction.formattedAmount} from ${largestTransaction.from.username} to ${largestTransaction.to.username}.`);
    }
  }
  
  if (debtAnalysis.summary.isBalanced) {
    tips.push('✅ All expenses are properly balanced.');
  } else {
    tips.push('⚠️ Warning: Expenses may not be properly balanced. Please check for errors.');
  }
  
  return tips;
};

module.exports = {
  getSimplifiedDebts,
  getUserBalance,
  calculateWhatIf,
  getSettlementSuggestions
};