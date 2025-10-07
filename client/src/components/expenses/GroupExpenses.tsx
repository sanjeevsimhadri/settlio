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

// Professional expense categories with modern icons and colors
const expenseCategories = {
  food: { 
    label: 'Food & Dining', 
    icon: 'utensils',
    color: '#ff6b6b',
    bgColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.2)'
  },
  transportation: { 
    label: 'Transportation', 
    icon: 'car',
    color: '#4ecdc4',
    bgColor: 'rgba(78, 205, 196, 0.1)',
    borderColor: 'rgba(78, 205, 196, 0.2)'
  },
  entertainment: { 
    label: 'Entertainment', 
    icon: 'film',
    color: '#45b7d1',
    bgColor: 'rgba(69, 183, 209, 0.1)',
    borderColor: 'rgba(69, 183, 209, 0.2)'
  },
  shopping: { 
    label: 'Shopping', 
    icon: 'shopping-bag',
    color: '#f9ca24',
    bgColor: 'rgba(249, 202, 36, 0.1)',
    borderColor: 'rgba(249, 202, 36, 0.2)'
  },
  bills: { 
    label: 'Bills & Utilities', 
    icon: 'zap',
    color: '#f0932b',
    bgColor: 'rgba(240, 147, 43, 0.1)',
    borderColor: 'rgba(240, 147, 43, 0.2)'
  },
  travel: { 
    label: 'Travel & Hotels', 
    icon: 'map-pin',
    color: '#eb4d4b',
    bgColor: 'rgba(235, 77, 75, 0.1)',
    borderColor: 'rgba(235, 77, 75, 0.2)'
  },
  healthcare: { 
    label: 'Healthcare', 
    icon: 'heart',
    color: '#6c5ce7',
    bgColor: 'rgba(108, 92, 231, 0.1)',
    borderColor: 'rgba(108, 92, 231, 0.2)'
  },
  education: { 
    label: 'Education', 
    icon: 'book',
    color: '#a29bfe',
    bgColor: 'rgba(162, 155, 254, 0.1)',
    borderColor: 'rgba(162, 155, 254, 0.2)'
  },
  groceries: { 
    label: 'Groceries', 
    icon: 'shopping-cart',
    color: '#00b894',
    bgColor: 'rgba(0, 184, 148, 0.1)',
    borderColor: 'rgba(0, 184, 148, 0.2)'
  },
  fitness: { 
    label: 'Fitness & Sports', 
    icon: 'activity',
    color: '#e17055',
    bgColor: 'rgba(225, 112, 85, 0.1)',
    borderColor: 'rgba(225, 112, 85, 0.2)'
  },
  gifts: { 
    label: 'Gifts & Donations', 
    icon: 'gift',
    color: '#fd79a8',
    bgColor: 'rgba(253, 121, 168, 0.1)',
    borderColor: 'rgba(253, 121, 168, 0.2)'
  },
  home: { 
    label: 'Home & Garden', 
    icon: 'home',
    color: '#fdcb6e',
    bgColor: 'rgba(253, 203, 110, 0.1)',
    borderColor: 'rgba(253, 203, 110, 0.2)'
  },
  pets: { 
    label: 'Pets', 
    icon: 'shield',
    color: '#e84393',
    bgColor: 'rgba(232, 67, 147, 0.1)',
    borderColor: 'rgba(232, 67, 147, 0.2)'
  },
  business: { 
    label: 'Business', 
    icon: 'briefcase',
    color: '#2d3436',
    bgColor: 'rgba(45, 52, 54, 0.1)',
    borderColor: 'rgba(45, 52, 54, 0.2)'
  },
  other: { 
    label: 'Other', 
    icon: 'package',
    color: '#636e72',
    bgColor: 'rgba(99, 110, 114, 0.1)',
    borderColor: 'rgba(99, 110, 114, 0.2)'
  }
};

// SVG Icon component for better performance and customization
const ExpenseIcon: React.FC<{ iconName: string; color: string; size?: number }> = ({ iconName, color, size = 20 }) => {
  const iconPaths = {
    'utensils': 'M3 2v1c0 8.284 6.716 15 15 15s15-6.716 15-15V2M3 2c0-.552.448-1 1-1h4c.552 0 1 .448 1 1v1M3 2v1m18-1v1c0 8.284-6.716 15-15 15M21 2c0-.552-.448-1-1-1h-4c-.552 0-1 .448-1 1v1m6-1v1',
    'car': 'M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 9l2-7h6l4 7H5zM3 11h18v6H3v-6z',
    'film': 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    'shopping-bag': 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M8 10v6M16 10v6',
    'zap': 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    'heart': 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    'book': 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14M20 17H6.5A2.5 2.5 0 0 0 4 19.5',
    'shopping-cart': 'M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6',
    'activity': 'M22 12h-4l-3 9L9 3l-3 9H2',
    'gift': 'M20 12v10H4V12M2 7h20l-2 5H4l-2-5zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    'home': 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
    'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'briefcase': 'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16m8-12H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2z',
    'package': 'M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96 12 12.01l8.73-5.05 M12 22.08V12'
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d={iconPaths[iconName as keyof typeof iconPaths] || iconPaths.package} />
    </svg>
  );
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

  const getCreatedByDisplay = (expense: Expense) => {
    // If createdBy is a user object
    if (typeof expense.createdBy === 'object' && expense.createdBy) {
      const createdByUser = expense.createdBy;
      const displayName = createdByUser.username || createdByUser.email.split('@')[0];
      
      // Check if creator is current user
      if (createdByUser._id === currentUser?.id || createdByUser.email === currentUser?.email) {
        return `${displayName} (You)`;
      }
      return displayName;
    }
    
    // If createdBy is a string (user ID), try to match with group members
    if (typeof expense.createdBy === 'string') {
      const creator = group.members.find(m => 
        m.userId?._id === expense.createdBy || m._id === expense.createdBy
      );
      
      if (creator) {
        const displayName = creator.userId?.username || creator.fullName || creator.email.split('@')[0];
        
        // Check if creator is current user
        if ((creator.userId?._id === currentUser?.id) || (creator.email === currentUser?.email)) {
          return `${displayName} (You)`;
        }
        return displayName;
      }
      
      // If we can't find the creator in group members, check if it's current user by ID
      if (expense.createdBy === currentUser?.id) {
        return `${currentUser?.username || currentUser?.email?.split('@')[0] || 'You'} (You)`;
      }
    }
    
    // Fallback: if no createdBy info, assume it's the same as paidBy
    return getCurrentUserDisplay(expense.paidByEmail, expense.paidByUserId?._id);
  };

  const getCategoryData = (category?: string, description?: string) => {
    // If category is provided and valid, use it
    if (category && expenseCategories[category as keyof typeof expenseCategories]) {
      return expenseCategories[category as keyof typeof expenseCategories];
    }
    
    // Smart category detection based on expense description
    if (description) {
      const desc = description.toLowerCase();
      
      // Food & Dining keywords
      if (desc.includes('dinner') || desc.includes('lunch') || desc.includes('breakfast') || 
          desc.includes('restaurant') || desc.includes('food') || desc.includes('eat') ||
          desc.includes('coffee') || desc.includes('drink') || desc.includes('meal') ||
          desc.includes('pizza') || desc.includes('burger') || desc.includes('cafe')) {
        return expenseCategories.food;
      }
      
      // Transportation keywords
      if (desc.includes('uber') || desc.includes('taxi') || desc.includes('cab') ||
          desc.includes('bus') || desc.includes('train') || desc.includes('metro') ||
          desc.includes('transport') || desc.includes('fuel') || desc.includes('gas') ||
          desc.includes('parking') || desc.includes('ride')) {
        return expenseCategories.transportation;
      }
      
      // Travel keywords
      if (desc.includes('flight') || desc.includes('hotel') || desc.includes('booking') ||
          desc.includes('ticket') || desc.includes('travel') || desc.includes('trip') ||
          desc.includes('vacation') || desc.includes('airbnb') || desc.includes('accommodation')) {
        return expenseCategories.travel;
      }
      
      // Entertainment keywords
      if (desc.includes('movie') || desc.includes('cinema') || desc.includes('game') ||
          desc.includes('concert') || desc.includes('show') || desc.includes('party') ||
          desc.includes('club') || desc.includes('entertainment') || desc.includes('fun')) {
        return expenseCategories.entertainment;
      }
      
      // Shopping keywords
      if (desc.includes('shop') || desc.includes('buy') || desc.includes('purchase') ||
          desc.includes('store') || desc.includes('mall') || desc.includes('cloth') ||
          desc.includes('shoes') || desc.includes('amazon') || desc.includes('online')) {
        return expenseCategories.shopping;
      }
      
      // Bills & Utilities keywords
      if (desc.includes('bill') || desc.includes('electric') || desc.includes('water') ||
          desc.includes('internet') || desc.includes('phone') || desc.includes('utility') ||
          desc.includes('rent') || desc.includes('maintenance') || desc.includes('wifi')) {
        return expenseCategories.bills;
      }
      
      // Groceries keywords
      if (desc.includes('grocery') || desc.includes('vegetables') || desc.includes('fruit') ||
          desc.includes('supermarket') || desc.includes('market') || desc.includes('supplies') ||
          desc.includes('milk') || desc.includes('bread') || desc.includes('groceries')) {
        return expenseCategories.groceries;
      }
      
      // Healthcare keywords
      if (desc.includes('doctor') || desc.includes('hospital') || desc.includes('medicine') ||
          desc.includes('medical') || desc.includes('health') || desc.includes('pharmacy') ||
          desc.includes('clinic') || desc.includes('treatment')) {
        return expenseCategories.healthcare;
      }
    }
    
    // Default to other category
    return expenseCategories.other;
  };

  return (
    <div className="group-expenses">
      {/* Professional Header */}
      <div className="modern-expenses-header">
        <div className="header-content">
          <div className="header-title-section">
            <h2 className="modern-expenses-title">Group Expenses</h2>
            <p className="modern-expenses-subtitle">
              Track and manage shared expenses with {group.name}
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{expenses.length}</div>
              <div className="stat-label">Total Expenses</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {formatCurrency(
                  expenses.reduce((sum, exp) => sum + exp.amount, 0),
                  expenses[0]?.currency
                )}
              </div>
              <div className="stat-label">Total Amount</div>
            </div>
          </div>
        </div>
        <LoadingButton
          variant="primary"
          onClick={() => setIsAddingExpense(true)}
          className="modern-add-expense-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Expense
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
              <div className="modern-expenses-list">
                {expenses.map((expense, index) => {
                  const categoryData = getCategoryData(expense.category, expense.description);
                  const { date, time } = formatDateTime(expense.createdAt);
                  const canDelete = (
                    (expense.paidByUserId?._id && expense.paidByUserId._id === currentUser?.id) || 
                    (expense.paidByEmail === currentUser?.email) ||
                    (group.admin._id === currentUser?.id)
                  );
                  
                  return (
                    <div 
                      key={expense._id} 
                      className="modern-expense-card"
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {/* Category Icon */}
                      <div 
                        className="modern-expense-icon"
                        style={{
                          backgroundColor: categoryData.bgColor,
                          borderColor: categoryData.borderColor
                        }}
                      >
                        <ExpenseIcon 
                          iconName={categoryData.icon} 
                          color={categoryData.color}
                          size={24}
                        />
                      </div>
                      
                      {/* Expense Content */}
                      <div className="modern-expense-content">
                        <div className="expense-header-row">
                          <h4 className="expense-title">{expense.description}</h4>
                          <div className="expense-amount">
                            {formatCurrency(expense.amount, expense.currency)}
                          </div>
                        </div>
                        
                        <div className="expense-details-row">
                          <div className="expense-paid-by">
                            <span className="detail-label">Paid by</span>
                            <span className="detail-value">
                              {getCurrentUserDisplay(expense.paidByEmail, expense.paidByUserId?._id)}
                            </span>
                          </div>
                          <div className="expense-category">
                            <span 
                              className="modern-category-badge"
                              style={{
                                backgroundColor: categoryData.bgColor,
                                color: categoryData.color,
                                borderColor: categoryData.borderColor
                              }}
                            >
                              {categoryData.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="expense-meta-row">
                          <div className="created-by-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Created by {getCreatedByDisplay(expense)}</span>
                          </div>
                          <div className="expense-timestamp">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                            <span>{date} at {time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {canDelete && (
                        <div className="modern-expense-actions">
                          <button
                            className="modern-delete-btn"
                            onClick={() => handleDeleteExpense(expense._id, expense.description)}
                            title="Delete expense"
                            aria-label="Delete expense"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GroupExpenses;