const express = require('express');
const {
  createGroup,
  getUserGroups,
  getGroupById,
  addGroupMember,
  removeGroupMember,
  getPendingInvitations,
  getGroupSummary
} = require('../controllers/groupController');
const { createExpense } = require('../controllers/expenseController');
const { deleteExpense } = require('../controllers/newExpenseController');
const {
  getSimplifiedDebts,
  getUserBalance,
  calculateWhatIf,
  getSettlementSuggestions
} = require('../controllers/debtController');
const { protect } = require('../middleware/auth');
const { 
  validate, 
  createGroupSchema, 
  createExpenseSchema, 
  addMemberSchema 
} = require('../utils/validation');

const router = express.Router();

// All routes are protected - user must be authenticated
router.use(protect);

// Group routes
router.route('/')
  .get(getUserGroups)                                    // GET /api/groups - Get user's groups
  .post(validate(createGroupSchema), createGroup);       // POST /api/groups - Create new group

router.route('/stats/pending-invitations')
  .get(getPendingInvitations);                           // GET /api/groups/stats/pending-invitations - Get pending invitation stats

router.route('/:groupId')
  .get(getGroupById);                                    // GET /api/groups/:groupId - Get group details with expense summary

router.route('/:groupId/summary')
  .get(getGroupSummary);                                 // GET /api/groups/:groupId/summary - Get comprehensive group summary

// Group member management routes
router.route('/:groupId/members')
  .post(validate(addMemberSchema), addGroupMember);      // POST /api/groups/:groupId/members - Add member to group

router.route('/:groupId/members/:userId')
  .delete(removeGroupMember);                            // DELETE /api/groups/:groupId/members/:userId - Remove member from group

// Expense routes
router.route('/:groupId/expenses')
  .post(validate(createExpenseSchema), createExpense);   // POST /api/groups/:groupId/expenses - Create new expense

router.route('/:groupId/expenses/:expenseId')
  .delete(deleteExpense);                                // DELETE /api/groups/:groupId/expenses/:expenseId - Delete expense

// Debt calculation and settlement routes
router.route('/:groupId/debts/simplified')
  .get(getSimplifiedDebts);                              // GET /api/groups/:groupId/debts/simplified - Get simplified debts

router.route('/:groupId/debts/suggestions')
  .get(getSettlementSuggestions);                        // GET /api/groups/:groupId/debts/suggestions - Get settlement suggestions

router.route('/:groupId/debts/user/:targetUserId')
  .get(getUserBalance);                                  // GET /api/groups/:groupId/debts/user/:userId - Get user balance

router.route('/:groupId/debts/what-if')
  .post(calculateWhatIf);                                // POST /api/groups/:groupId/debts/what-if - Calculate what-if scenarios

module.exports = router;