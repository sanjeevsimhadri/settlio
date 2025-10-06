import React, { useState, useEffect } from 'react';
import { expensesAPI, Expense } from '../../services/expensesAPI';
import { Group, GroupMember } from '../../services/groupsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../common';
import { LoadingButton } from '../ui';
import { AddExpense } from './index';
import { Card, Badge, Avatar } from '../ui';
import { CreationInfo } from '../common/CreationInfo';
import './Expenses.css';

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

  return (
    <div className="group-expenses">
      {/* Header */}
      <div className="expenses-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Group
        </button>
        <div className="header-content">
          <h1>{group.name} - Expenses</h1>
          <p>{expenses.length} expense{expenses.length !== 1 ? 's' : ''} • {group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
        </div>
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
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <Card key={expense._id} variant="outlined" padding="medium" hover={true}>
                    <div className="space-y-4">
                      {/* Expense Header */}
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {expense.description}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="secondary" size="small">
                              {formatDate(expense.date)}
                            </Badge>
                            <Badge variant="info" size="small">
                              {expense.currency}
                            </Badge>
                            {expense.settled && (
                              <Badge variant="success" size="small">
                                Settled
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(expense.amount, expense.currency)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(expense.amount / expense.splitAmong.length, expense.currency)} per person
                          </div>
                        </div>
                      </div>

                      {/* Expense Details */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Paid by:</h5>
                          <div className="flex items-center gap-3">
                            <Avatar 
                              alt={getCurrentUserDisplay(expense.paidByEmail, expense.paidByUserId?._id)}
                              size="small"
                            />
                            <span className="text-sm text-gray-900">
                              {getCurrentUserDisplay(expense.paidByEmail, expense.paidByUserId?._id)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Split among:</h5>
                          <div className="space-y-1">
                            {expense.splitAmong.map((split, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar 
                                    alt={getCurrentUserDisplay(split.email, split.userId)}
                                    size="small"
                                  />
                                  <span className="text-sm text-gray-900">
                                    {getCurrentUserDisplay(split.email, split.userId)}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {formatCurrency(expense.amount / expense.splitAmong.length, expense.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {expense.comments && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Notes:</h5>
                          <p className="text-sm text-gray-600">{expense.comments}</p>
                        </div>
                      )}

                      {/* Creation Info & Actions */}
                      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                        <CreationInfo
                          createdAt={expense.createdAt}
                          createdBy={expense.createdBy || expense.paidByUserId}
                          users={group.members.map(m => m.userId).filter((user): user is NonNullable<typeof user> => user !== null)}
                          layout="compact"
                          size="small"
                          showRelativeTime={true}
                        />
                        
                        {((expense.paidByUserId?._id && expense.paidByUserId._id === currentUser?.id) || 
                          (expense.paidByEmail === currentUser?.email) ||
                          (group.admin._id === currentUser?.id)) && (
                          <button
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                            onClick={() => handleDeleteExpense(expense._id, expense.description)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
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