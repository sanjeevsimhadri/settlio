const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateSettlement } = require('../utils/balanceValidation');
const {
  getGroupBalances,
  getGroupDebts,
  createSettlement,
  getSettlementHistory
} = require('../controllers/balanceController');

// Get balances for a group
router.get('/groups/:groupId/balances', protect, getGroupBalances);

// Get detailed debts for a group
router.get('/groups/:groupId/debts', protect, getGroupDebts);

// Create a settlement
router.post('/groups/:groupId/settlements', protect, validateSettlement, createSettlement);

// Get settlement history for a group
router.get('/groups/:groupId/settlements', protect, getSettlementHistory);

module.exports = router;