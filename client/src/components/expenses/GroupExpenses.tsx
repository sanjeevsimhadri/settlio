import React, { useState, useEffect } from 'react';
import { expensesAPI, Expense } from '../../services/expensesAPI';
import { Group, GroupMember } from '../../services/groupsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../common';
import { LoadingButton } from '../ui';
import { AddExpense } from './index';
import { Card, Badge } from '../ui';
import { CreationInfo } from '../common/CreationInfo';
import './Expenses.css';

// Expense categories with icons
const expenseCategories = {
  food: { label: 'Food & Dining', icon: '🍽️' },
  transportation: { label: 'Transportation', icon: '🚗' },
  entertainment: { label: 'Entertainment', icon: '🎬' },
  shopping: { label: 'Shopping', icon: '🛒' },
  bills: { label: 'Bills & Utilities', icon: '💡' },
  travel: { label: 'Travel & Hotels', icon: '✈️' },
  healthcare: { label: 'Healthcare', icon: '🏥' },
  education: { label: 'Education', icon: '📚' },
  groceries: { label: 'Groceries', icon: '🥬' },
  fitness: { label: 'Fitness & Sports', icon: '💪' },
  gifts: { label: 'Gifts & Donations', icon: '🎁' },
  home: { label: 'Home & Garden', icon: '🏠' },
  pets: { label: 'Pets', icon: '🐕' },
  business: { label: 'Business', icon: '💼' },
  other: { label: 'Other', icon: '📦' }
};

interface GroupExpensesProps {
  group: Group;
  onBack: () => void;
}

const GroupExpenses: React.FC<GroupExpensesProps> = ({ group, onBack }) => {
  const { user: currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string>('');

  // Load expenses
  useEffect(() => {
    loadExpenses();
  }, [group._id]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await expensesAPI.getGroupExpenses(group._id);
      
      // Check if response is successful
      if (response && Array.isArray(response.data)) {
        setExpenses(response.data);
      } else {
        // Handle unexpected response format
        setExpenses([]);
        console.warn('Unexpected response format:', response);
      }
    } catch (error: any) {
      // Only set error for actual API failures (network errors, 500s, etc.)
      console.error('Error loading expenses:', error);
      setError(error.error || error.message || 'Something went wrong while loading expenses');
      setExpenses([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpenseSuccess = () => {
    setIsAddingExpense(false);
    setSubmitSuccess('Expense added successfully!');
    loadExpenses();
    setTimeout(() => setSubmitSuccess(''), 3000);
  };

  const handleDeleteExpense = async (expenseId: string, description: string) => {
    if (!window.confirm(`Are you sure you want to delete "${description}"?`)) {
      return;
    }

    try {
      await expensesAPI.deleteExpense(group._id, expenseId);
      setSubmitSuccess('Expense deleted successfully!');
      loadExpenses();
      setTimeout(() => setSubmitSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      setError(error.error || 'Failed to delete expense');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getDisplayName = (email: string, userId?: string) => {
    // Find member in group
    const member = group.members.find(m => 
      m.email === email || (userId && m.userId?._id === userId)
    );
    
    if (member?.fullName) {
      return member.fullName;
    }
    if (member?.userId?.username) {
      return member.userId.username;
    }
    return email.split('@')[0];
  };

  const getCurrentUserDisplay = (email: string, userId?: string) => {
    const displayName = getDisplayName(email, userId);
    
    // Check if this is the current user
    if (userId && userId === currentUser?.id) {
      return `${displayName} (You)`;
    } else if (email === currentUser?.email) {
      return `${displayName} (You)`;
    }
    
    return displayName;
  };

  const getCategoryIcon = (category?: string, description?: string) => {
    // If category is provided and valid, use it
    if (category && expenseCategories[category as keyof typeof expenseCategories]) {
      return expenseCategories[category as keyof typeof expenseCategories].icon;
    }
    
    // Smart category detection based on expense description
    if (description) {
      const desc = description.toLowerCase();
      
      // Food & Dining keywords
      if (desc.includes('dinner') || desc.includes('lunch') || desc.includes('breakfast') || 
          desc.includes('restaurant') || desc.includes('food') || desc.includes('eat') ||
          desc.includes('coffee') || desc.includes('drink') || desc.includes('meal') ||
          desc.includes('pizza') || desc.includes('burger') || desc.includes('cafe')) {
        return expenseCategories.food.icon;
      }
      
      // Transportation keywords
      if (desc.includes('uber') || desc.includes('taxi') || desc.includes('cab') ||
          desc.includes('bus') || desc.includes('train') || desc.includes('metro') ||
          desc.includes('transport') || desc.includes('fuel') || desc.includes('gas') ||
          desc.includes('parking') || desc.includes('ride')) {
        return expenseCategories.transportation.icon;
      }
      
      // Travel keywords
      if (desc.includes('flight') || desc.includes('hotel') || desc.includes('booking') ||
          desc.includes('ticket') || desc.includes('travel') || desc.includes('trip') ||
          desc.includes('vacation') || desc.includes('airbnb') || desc.includes('accommodation')) {
        return expenseCategories.travel.icon;
      }
      
      // Entertainment keywords
      if (desc.includes('movie') || desc.includes('cinema') || desc.includes('game') ||
          desc.includes('concert') || desc.includes('show') || desc.includes('party') ||
          desc.includes('club') || desc.includes('entertainment') || desc.includes('fun')) {
        return expenseCategories.entertainment.icon;
      }
      
      // Shopping keywords
      if (desc.includes('shop') || desc.includes('buy') || desc.includes('purchase') ||
          desc.includes('store') || desc.includes('mall') || desc.includes('cloth') ||
          desc.includes('shoes') || desc.includes('amazon') || desc.includes('online')) {
        return expenseCategories.shopping.icon;
      }
      
      // Bills & Utilities keywords
      if (desc.includes('bill') || desc.includes('electric') || desc.includes('water') ||
          desc.includes('internet') || desc.includes('phone') || desc.includes('utility') ||
          desc.includes('rent') || desc.includes('maintenance') || desc.includes('wifi')) {
        return expenseCategories.bills.icon;
      }
      
      // Groceries keywords
      if (desc.includes('grocery') || desc.includes('vegetables') || desc.includes('fruit') ||
          desc.includes('supermarket') || desc.includes('market') || desc.includes('supplies') ||
          desc.includes('milk') || desc.includes('bread') || desc.includes('groceries')) {
        return expenseCategories.groceries.icon;
      }
      
      // Healthcare keywords
      if (desc.includes('doctor') || desc.includes('hospital') || desc.includes('medicine') ||
          desc.includes('medical') || desc.includes('health') || desc.includes('pharmacy') ||
          desc.includes('clinic') || desc.includes('treatment')) {
        return expenseCategories.healthcare.icon;
      }
    }
    
    // Default to other category
    return expenseCategories.other.icon;
  };

  return (
    <div className="group-expenses">
      {/* Header with Title and Add Button */}
      <div className="expenses-header">
        <h3>💰 Group Expenses</h3>
        <LoadingButton
          variant="primary"
          onClick={() => setIsAddingExpense(true)}
        >
          + Add Expense
        </LoadingButton>
      </div>

      {/* Success Messages */}
      {submitSuccess && (
        <div className="alert success">
          {submitSuccess}
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddingExpense && (
        <AddExpense 
          groupId={group._id}
          onSuccess={handleAddExpenseSuccess}
          onCancel={() => setIsAddingExpense(false)}
        />
      )}

      {/* Expenses List */}
      <div className="expenses-content">
        {loading && (
          <LoadingSpinner message="Loading expenses..." />
        )}

        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={loadExpenses}
          />
        )}

        {!loading && !error && (
          <>
            {expenses.length === 0 ? (
              <EmptyState 
                icon="💰" 
                title="No expenses found" 
                description="This group doesn't have any expenses yet. Start by adding your first expense to track shared costs."
                actionButton={{
                  text: "Add First Expense",
                  onClick: () => setIsAddingExpense(true),
                  variant: "primary"
                }}
              />
            ) : (
              <div className="expenses-list">
                {expenses.map((expense) => (
                  <div key={expense._id} className="expense-item">
                    {/* Expense Avatar */}
                    <div className="expense-avatar">
                      {getCategoryIcon(expense.category, expense.description)}
                    </div>
                    
                    {/* Expense Info */}
                    <div className="expense-info">
                      <div className="expense-name">{expense.description}</div>
                      <div className="expense-details">
                        💸 {formatCurrency(expense.amount, expense.currency)} • Paid by {getCurrentUserDisplay(expense.paidByEmail, expense.paidByUserId?._id)}
                      </div>
                      <div className="expense-date">
                        📅 {formatDateTime(expense.createdAt).date} • 🕒 {formatDateTime(expense.createdAt).time}
                      </div>
                    </div>

                    {/* Expense Actions */}
                    <div className="expense-actions">
                      {((expense.paidByUserId?._id && expense.paidByUserId._id === currentUser?.id) || 
                        (expense.paidByEmail === currentUser?.email) ||
                        (group.admin._id === currentUser?.id)) && (
                        <button
                          className="delete-expense-btn"
                          onClick={() => handleDeleteExpense(expense._id, expense.description)}
                          title="Delete expense"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GroupExpenses;