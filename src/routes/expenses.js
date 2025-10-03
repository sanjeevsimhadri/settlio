const express = require('express');
const {
  createExpense,
  getGroupExpenses,
  getExpenseById
} = require('../controllers/newExpenseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// POST /api/expenses - Create new expense
router.post('/', createExpense);

// GET /api/expenses/:groupId - Get expenses for a group
router.get('/:groupId', getGroupExpenses);

// GET /api/expenses/expense/:expenseId - Get expense by ID
router.get('/expense/:expenseId', getExpenseById);

module.exports = router;