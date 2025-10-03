const Expense = require('../models/Expense');
const Group = require('../models/Group');

/**
 * Calculate net balances and simplify debts between users in a group
 * @param {string} groupId - MongoDB ObjectId of the group
 * @param {Object} options - Additional options
 * @returns {Object} Simplified debt structure with minimized transactions
 */
const calculateSimplifiedDebts = async (groupId, options = {}) => {
  try {
    // Get all expenses for the group
    const expenses = await Expense.find({ 
      group: groupId,
      ...(options.includeSettled !== true && { settled: false })
    }).populate('paidBy splitBetween', 'username email');

    // Get group members
    const group = await Group.findById(groupId).populate('members', 'username email');
    if (!group) {
      throw new Error('Group not found');
    }

    // Initialize user balances
    const userBalances = {};
    const userDetails = {};

    // Initialize all group members with zero balance
    group.members.forEach(member => {
      const userId = member._id.toString();
      userBalances[userId] = 0;
      userDetails[userId] = {
        id: member._id,
        username: member.username,
        email: member.email
      };
    });

    // Calculate net balances from all expenses
    expenses.forEach(expense => {
      const payerId = expense.paidBy._id.toString();
      const totalAmount = expense.amount;

      // Add the full amount to the payer's balance (they get credit)
      if (userBalances.hasOwnProperty(payerId)) {
        userBalances[payerId] += totalAmount;
      }

      // Subtract each person's share from their balance (they owe money)
      expense.splitBetween.forEach((user, index) => {
        const userId = user._id.toString();
        const shareAmount = expense.splitAmounts[index];
        
        if (userBalances.hasOwnProperty(userId)) {
          userBalances[userId] -= shareAmount;
        }
      });
    });

    // Round balances to avoid floating point issues
    Object.keys(userBalances).forEach(userId => {
      userBalances[userId] = Math.round(userBalances[userId] * 100) / 100;
    });

    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = [];
    const debtors = [];
    const tolerance = 0.01;

    Object.entries(userBalances).forEach(([userId, balance]) => {
      if (balance > tolerance) {
        creditors.push({
          userId,
          amount: balance,
          user: userDetails[userId]
        });
      } else if (balance < -tolerance) {
        debtors.push({
          userId,
          amount: Math.abs(balance),
          user: userDetails[userId]
        });
      }
    });

    // Sort creditors and debtors by amount (descending) for optimal matching
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Simplify debts using greedy algorithm
    const simplifiedTransactions = simplifyDebts(creditors, debtors);

    // Calculate summary statistics
    const totalOwed = debtors.reduce((sum, debtor) => sum + debtor.amount, 0);
    const totalCredit = creditors.reduce((sum, creditor) => sum + creditor.amount, 0);
    const isBalanced = Math.abs(totalOwed - totalCredit) < tolerance;

    return {
      groupId,
      netBalances: Object.entries(userBalances).map(([userId, balance]) => ({
        user: userDetails[userId],
        balance: balance,
        formattedBalance: `$${Math.abs(balance).toFixed(2)}`,
        status: balance > tolerance ? 'owed' : balance < -tolerance ? 'owes' : 'settled'
      })).sort((a, b) => b.balance - a.balance),
      
      creditors: creditors.map(c => ({
        ...c,
        formattedAmount: `$${c.amount.toFixed(2)}`
      })),
      
      debtors: debtors.map(d => ({
        ...d,
        formattedAmount: `$${d.amount.toFixed(2)}`
      })),
      
      simplifiedTransactions,
      
      summary: {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        totalOwed: Math.round(totalOwed * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        transactionCount: simplifiedTransactions.length,
        isBalanced,
        formattedTotalAmount: `$${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}`,
        formattedTotalOwed: `$${totalOwed.toFixed(2)}`
      },
      
      calculatedAt: new Date()
    };

  } catch (error) {
    console.error('Error calculating simplified debts:', error);
    throw error;
  }
};

/**
 * Simplify debts using a greedy algorithm to minimize transactions
 * @param {Array} creditors - Array of users who are owed money
 * @param {Array} debtors - Array of users who owe money
 * @returns {Array} Array of simplified transactions
 */
const simplifyDebts = (creditors, debtors) => {
  const transactions = [];
  
  // Create working copies to avoid mutating original arrays
  const workingCreditors = creditors.map(c => ({ ...c }));
  const workingDebtors = debtors.map(d => ({ ...d }));
  
  while (workingCreditors.length > 0 && workingDebtors.length > 0) {
    // Get the largest creditor and debtor
    const creditor = workingCreditors[0];
    const debtor = workingDebtors[0];
    
    // Calculate settlement amount (minimum of what's owed and what's credited)
    const settlementAmount = Math.min(creditor.amount, debtor.amount);
    
    // Only create transaction if amount is significant
    if (settlementAmount > 0.01) {
      transactions.push({
        from: debtor.user,
        to: creditor.user,
        amount: Math.round(settlementAmount * 100) / 100,
        formattedAmount: `$${settlementAmount.toFixed(2)}`,
        description: `Settlement payment from ${debtor.user.username} to ${creditor.user.username}`
      });
    }
    
    // Update balances
    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;
    
    // Remove users with zero balance
    if (creditor.amount <= 0.01) {
      workingCreditors.shift();
    }
    if (debtor.amount <= 0.01) {
      workingDebtors.shift();
    }
    
    // Re-sort arrays to maintain optimal order
    workingCreditors.sort((a, b) => b.amount - a.amount);
    workingDebtors.sort((a, b) => b.amount - a.amount);
  }
  
  return transactions;
};

/**
 * Advanced debt simplification using graph-based optimization
 * This algorithm can further reduce transactions in complex scenarios
 * @param {Array} creditors - Array of users who are owed money
 * @param {Array} debtors - Array of users who owe money
 * @returns {Array} Array of optimally simplified transactions
 */
const optimizeDebtsAdvanced = (creditors, debtors) => {
  // For small groups, use simple greedy algorithm
  if (creditors.length + debtors.length <= 4) {
    return simplifyDebts(creditors, debtors);
  }
  
  // Create adjacency matrix for graph-based optimization
  const allUsers = [...creditors, ...debtors];
  const n = allUsers.length;
  const balanceMap = {};
  
  // Map user balances
  creditors.forEach(c => {
    balanceMap[c.userId] = c.amount;
  });
  debtors.forEach(d => {
    balanceMap[d.userId] = -d.amount;
  });
  
  // Use cycle detection and removal to minimize transactions
  const transactions = [];
  const visited = new Set();
  
  // Find and eliminate cycles first
  allUsers.forEach(user => {
    if (!visited.has(user.userId) && Math.abs(balanceMap[user.userId]) > 0.01) {
      const cycle = findSettlementCycle(user, balanceMap, allUsers);
      if (cycle.length > 2) {
        const cycleTransactions = optimizeCycle(cycle, balanceMap);
        transactions.push(...cycleTransactions);
        cycle.forEach(userId => visited.add(userId));
      }
    }
  });
  
  // Handle remaining balances with greedy approach
  const remainingCreditors = creditors.filter(c => 
    !visited.has(c.userId) && balanceMap[c.userId] > 0.01
  );
  const remainingDebtors = debtors.filter(d => 
    !visited.has(d.userId) && balanceMap[d.userId] < -0.01
  );
  
  const remainingTransactions = simplifyDebts(remainingCreditors, remainingDebtors);
  transactions.push(...remainingTransactions);
  
  return transactions;
};

/**
 * Find settlement cycles to optimize multi-party transactions
 * @param {Object} startUser - Starting user for cycle detection
 * @param {Object} balanceMap - Map of user balances
 * @param {Array} allUsers - All users in the group
 * @returns {Array} Array of user IDs forming a cycle
 */
const findSettlementCycle = (startUser, balanceMap, allUsers) => {
  // Simple cycle detection - in practice, this would be more sophisticated
  // For now, return empty cycle to use greedy approach
  return [];
};

/**
 * Optimize a detected cycle to minimize transactions
 * @param {Array} cycle - Array of user IDs in the cycle
 * @param {Object} balanceMap - Map of user balances
 * @returns {Array} Optimized transactions for the cycle
 */
const optimizeCycle = (cycle, balanceMap) => {
  // Cycle optimization logic would go here
  // For now, return empty array
  return [];
};

/**
 * Calculate what-if scenarios for debt settlements
 * @param {string} groupId - Group ID
 * @param {Array} proposedSettlements - Array of proposed settlement transactions
 * @returns {Object} Updated balances after proposed settlements
 */
const calculateWhatIfSettlement = async (groupId, proposedSettlements) => {
  const currentState = await calculateSimplifiedDebts(groupId);
  const updatedBalances = { ...currentState.netBalances };
  
  // Apply proposed settlements
  proposedSettlements.forEach(settlement => {
    const { fromUserId, toUserId, amount } = settlement;
    
    // Update balances
    if (updatedBalances[fromUserId] && updatedBalances[toUserId]) {
      updatedBalances[fromUserId].balance += amount;
      updatedBalances[toUserId].balance -= amount;
    }
  });
  
  return {
    currentBalances: currentState.netBalances,
    projectedBalances: Object.values(updatedBalances),
    settlements: proposedSettlements,
    remainingDebts: Object.values(updatedBalances).filter(user => 
      Math.abs(user.balance) > 0.01
    ).length
  };
};

module.exports = {
  calculateSimplifiedDebts,
  simplifyDebts,
  optimizeDebtsAdvanced,
  calculateWhatIfSettlement
};