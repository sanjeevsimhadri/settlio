import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { addMemberSchema } from '../../utils/groupValidation';
import { quickExpenseSchema, QuickExpenseFormData } from '../../utils/expenseValidation';
import { groupsAPI, Group, User, GroupMember } from '../../services/groupsAPI';
import { expensesAPI, Expense, CreateExpenseData, SplitAmongMember } from '../../services/expensesAPI';
import { balancesAPI, GroupSummary } from '../../services/balancesAPI';
import GroupExpenses from '../expenses/GroupExpenses';
import GroupBalances from '../balances/GroupBalances';
import { Card, LoadingButton, Input, Badge, Alert, Avatar } from '../ui';
import { RecordHeader, CreationInfo } from '../common/CreationInfo';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarProps, getUserInitial } from '../../utils/profilePhotoUtils';
import './Groups.css';

// Expense categories with icons for Recent Activity
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

interface GroupDetailsProps {
  group: Group;
  onBack: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ group, onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'expenses' | 'balances'>('overview');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // New state for data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupSummary, setGroupSummary] = useState<GroupSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // Quick actions state
  const [activeQuickAction, setActiveQuickAction] = useState<'expense' | 'settle' | 'invite' | null>(null);
  const [quickActionLoading, setQuickActionLoading] = useState(false);
  const [quickActionError, setQuickActionError] = useState('');
  const [quickActionSuccess, setQuickActionSuccess] = useState('');

  // Member form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: yupResolver(addMemberSchema),
    defaultValues: {
      email: ''
    }
  });

  // Quick expense form
  const {
    register: registerExpense,
    handleSubmit: handleSubmitExpense,
    formState: { errors: expenseErrors },
    reset: resetExpense,
    watch: watchExpense,
    setValue: setValueExpense
  } = useForm({
    resolver: yupResolver(quickExpenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      paidBy: user?.email || '',
      splitMembers: [] as string[]
    }
  });

  const watchedEmail = watch('email');
  const watchedSplitMembers = watchExpense('splitMembers');

  // Fetch group data (expenses and summary)
  const fetchGroupData = async () => {
    try {
      setDataLoading(true);
      setDataError('');
      
      const [expensesResponse, summaryResponse] = await Promise.all([
        expensesAPI.getGroupExpenses(group._id),
        balancesAPI.getGroupSummary(group._id)
      ]);
      
      setExpenses(expensesResponse.data);
      setGroupSummary(summaryResponse.data);
    } catch (error: any) {
      console.error('Error fetching group data:', error);
      setDataError('Failed to load group data');
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchGroupData();
  }, [group._id]);

  // Get category icon with smart detection
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

  // Get user's balance from group summary
  const getUserBalance = () => {
    if (!groupSummary || !user) return 0;
    const userBalance = groupSummary.memberBalances.find(
      balance => balance.user.email === user.email
    );
    return userBalance ? userBalance.balance : 0;
  };

  // Get recent activity from expenses
  const getRecentActivity = () => {
    if (!expenses.length) return [];
    return expenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  // Search for users by email
  const searchUsers = async (email: string) => {
    if (email.length < 3) {
      setSearchedUsers([]);
      return;
    }

    try {
      setSearchLoading(true);
      const users = await groupsAPI.searchUsersByEmail(email);
      setSearchedUsers(users.data);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchedUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (watchedEmail) {
        searchUsers(watchedEmail);
      } else {
        setSearchedUsers([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [watchedEmail]);

  const onAddMember = async (data: any) => {
    try {
      setMemberError('');
      setMemberSuccess('');

      await groupsAPI.addMember(group._id, { email: data.email });
      
      setMemberSuccess('Member added successfully!');
      reset();
      setSearchedUsers([]);
      
        setTimeout(() => {
        setIsAddingMember(false);
        setMemberSuccess('');
        fetchGroupData(); // Refresh the group data
        onBack(); // Refresh the group data
      }, 2000);    } catch (error: any) {
      setMemberError(error.error || 'Failed to add member. Please try again.');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
      return;
    }

    try {
      await groupsAPI.removeMember(group._id, userId);
      setMemberSuccess('Member removed successfully!');
      
      setTimeout(() => {
        setMemberSuccess('');
        fetchGroupData(); // Refresh the group data
        onBack(); // Refresh the group data
      }, 1500);

    } catch (error: any) {
      setMemberError(error.error || 'Failed to remove member. Please try again.');
    }
  };

  // Quick Action Handlers
  const handleQuickExpense = async (data: any) => {
    try {
      setQuickActionLoading(true);
      setQuickActionError('');

      const splitAmong: SplitAmongMember[] = (data.splitMembers || []).map((email: string) => ({ email }));
      
      const expenseData: CreateExpenseData = {
        groupId: group._id,
        description: data.description,
        amount: data.amount,
        paidByEmail: data.paidBy,
        splitAmong: splitAmong,
        currency: 'INR'
      };

      await expensesAPI.createExpense(expenseData);
      setQuickActionSuccess('Expense added successfully!');
      resetExpense();
      setActiveQuickAction(null);
      fetchGroupData(); // Refresh data
      
      setTimeout(() => setQuickActionSuccess(''), 3000);
    } catch (error: any) {
      setQuickActionError(error.error || 'Failed to add expense. Please try again.');
    } finally {
      setQuickActionLoading(false);
    }
  };

  const handleQuickInvite = async (data: { email: string }) => {
    try {
      setQuickActionLoading(true);
      setQuickActionError('');

      await groupsAPI.addMember(group._id, { email: data.email });
      setQuickActionSuccess('Member invited successfully!');
      reset();
      setActiveQuickAction(null);
      fetchGroupData(); // Refresh data
      
      setTimeout(() => setQuickActionSuccess(''), 3000);
    } catch (error: any) {
      setQuickActionError(error.error || 'Failed to invite member. Please try again.');
    } finally {
      setQuickActionLoading(false);
    }
  };

  const closeQuickAction = () => {
    setActiveQuickAction(null);
    setQuickActionError('');
    setQuickActionSuccess('');
    resetExpense();
    reset();
  };

  const toggleSplitMember = (email: string) => {
    const currentMembers = watchedSplitMembers || [];
    const newMembers = currentMembers.includes(email)
      ? currentMembers.filter(m => m !== email)
      : [...currentMembers, email];
    setValueExpense('splitMembers', newMembers);
  };

  return (
    <div className="group-details">
      {/* Modern Header */}
      <div className="modern-group-header">
        <button className="modern-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="header-content">
          <div className="header-title-section">
            <h2 className="modern-group-title">{group.name}</h2>
            <p className="modern-group-subtitle">Manage expenses and settlements • {group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{expenses.length}</div>
              <div className="stat-label">Total Expenses</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{group.members.length}</div>
              <div className="stat-label">Members</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{groupSummary?.simplifiedDebts?.length || 0}</div>
              <div className="stat-label">Outstanding</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members ({group.members.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses
        </button>
        <button
          className={`tab-button ${activeTab === 'balances' ? 'active' : ''}`}
          onClick={() => setActiveTab('balances')}
        >
          Balances
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {dataLoading && (
              <div className="modern-loading-state">
                <div className="loading-hero">
                  <div className="loading-spinner-large"></div>
                  <h3>Loading Dashboard...</h3>
                  <p>Fetching your group insights and recent activity</p>
                </div>
              </div>
            )}
            
            {dataError && (
              <div className="modern-error-state">
                <div className="error-hero">
                  <div className="error-icon">⚠️</div>
                  <h3>Unable to Load Dashboard</h3>
                  <p>{dataError}</p>
                  <LoadingButton variant="primary" onClick={fetchGroupData} className="retry-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23,4 23,10 17,10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Try Again
                  </LoadingButton>
                </div>
              </div>
            )}
            
            {!dataLoading && !dataError && (
              <>
                {/* Success Message */}
                {quickActionSuccess && (
                  <div className="quick-action-success">
                    {quickActionSuccess}
                  </div>
                )}

                {/* Hero Metrics Dashboard */}
                <div className="overview-hero">
                  <div className="hero-title">
                    <h2>Dashboard Overview</h2>
                    <p>Track expenses, balances, and group activity at a glance</p>
                  </div>
                  
                  <div className="hero-metrics">
                    <div className="hero-metric primary">
                      <div className="metric-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">₹{groupSummary ? groupSummary.totalExpenses.toFixed(2) : '0.00'}</div>
                        <div className="metric-label">Total Group Spending</div>
                        <div className="metric-insight">Across {expenses.length} expense{expenses.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    
                    <div className={`hero-metric ${getUserBalance() > 0 ? 'positive' : getUserBalance() < 0 ? 'negative' : 'neutral'}`}>
                      <div className="metric-icon">
                        {getUserBalance() > 0 ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                          </svg>
                        ) : getUserBalance() < 0 ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        )}
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">₹{Math.abs(getUserBalance()).toFixed(2)}</div>
                        <div className="metric-label">Your Balance</div>
                        <div className="metric-insight">
                          {getUserBalance() > 0 ? 'You are owed money' : 
                           getUserBalance() < 0 ? 'You owe money' : 
                           'You are settled up'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="hero-metric secondary">
                      <div className="metric-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{group.members.length}</div>
                        <div className="metric-label">Active Members</div>
                        <div className="metric-insight">
                          {group.members.filter(m => m.status === 'active').length} active, 
                          {group.members.filter(m => m.status === 'invited').length} pending
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="quick-actions">
                  <h3>Quick Actions</h3>
                  
                  {!activeQuickAction ? (
                    <div className="actions-grid">
                      <button className="action-card primary" onClick={() => setActiveQuickAction('expense')}>
                        <div className="action-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </div>
                        <div className="action-content">
                          <div className="action-title">Add Expense</div>
                          <div className="action-subtitle">Record new spending</div>
                        </div>
                      </button>
                      
                      <button className="action-card secondary" onClick={() => setActiveTab('balances')}>
                        <div className="action-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                          </svg>
                        </div>
                        <div className="action-content">
                          <div className="action-title">Settle Up</div>
                          <div className="action-subtitle">Manage balances</div>
                        </div>
                      </button>
                      
                      <button className="action-card tertiary" onClick={() => setActiveQuickAction('invite')}>
                        <div className="action-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <div className="action-content">
                          <div className="action-title">Invite People</div>
                          <div className="action-subtitle">Add new members</div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="quick-action-form-container">
                      {/* Quick Expense Form */}
                      {activeQuickAction === 'expense' && (
                        <div className="quick-action-form">
                          <div className="quick-form-header">
                            <h4>Add Quick Expense</h4>
                            <button className="close-btn" onClick={closeQuickAction}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>

                          {quickActionError && (
                            <div className="alert error mb-4">{quickActionError}</div>
                          )}

                          <form onSubmit={handleSubmitExpense(handleQuickExpense)} className="quick-form">
                            <div className="form-row">
                              <div className="form-group">
                                <label className="form-label">Description *</label>
                                <input
                                  {...registerExpense('description')}
                                  type="text"
                                  className={`form-input ${expenseErrors.description ? 'error' : ''}`}
                                  placeholder="What was this expense for?"
                                />
                                {expenseErrors.description && (
                                  <span className="error-message">{expenseErrors.description.message}</span>
                                )}
                              </div>
                              
                              <div className="form-group">
                                <label className="form-label">Amount (₹) *</label>
                                <input
                                  {...registerExpense('amount', { valueAsNumber: true })}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className={`form-input ${expenseErrors.amount ? 'error' : ''}`}
                                  placeholder="0.00"
                                />
                                {expenseErrors.amount && (
                                  <span className="error-message">{expenseErrors.amount.message}</span>
                                )}
                              </div>
                            </div>

                            <div className="form-group">
                              <label className="form-label">Who paid? *</label>
                              <select
                                {...registerExpense('paidBy')}
                                className={`form-input ${expenseErrors.paidBy ? 'error' : ''}`}
                              >
                                <option value="">Select who paid</option>
                                {group.members.map(member => (
                                  <option key={member.email} value={member.email}>
                                    {member.email === user?.email ? 'You' : 
                                     member.userId?.username || member.email.split('@')[0]}
                                  </option>
                                ))}
                              </select>
                              {expenseErrors.paidBy && (
                                <span className="error-message">{expenseErrors.paidBy.message}</span>
                              )}
                            </div>

                            <div className="form-group">
                              <label className="form-label">Split between *</label>
                              <div className="split-members-grid">
                                {group.members.map(member => {
                                  const isSelected = watchedSplitMembers?.includes(member.email);
                                  const displayName = member.email === user?.email ? 'You' : 
                                    member.userId?.username || member.email.split('@')[0];
                                  
                                  return (
                                    <div
                                      key={member.email}
                                      className={`split-member-card ${isSelected ? 'selected' : ''}`}
                                      onClick={() => toggleSplitMember(member.email)}
                                    >
                                      <div className="member-avatar-small">
                                        {member.userId?.profilePhoto ? (
                                          <img 
                                            src={`http://localhost:5000${member.userId.profilePhoto}`} 
                                            alt={displayName}
                                            style={{ 
                                              width: '100%', 
                                              height: '100%', 
                                              borderRadius: '50%',
                                              objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                              if (fallback) {
                                                fallback.style.display = 'flex';
                                              }
                                            }}
                                          />
                                        ) : null}
                                        <div 
                                          className="avatar-fallback"
                                          style={{ 
                                            display: member.userId?.profilePhoto ? 'none' : 'flex',
                                            width: '100%',
                                            height: '100%',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                          }}
                                        >
                                          {displayName.charAt(0).toUpperCase()}
                                        </div>
                                      </div>
                                      <span className="member-name">{displayName}</span>
                                      {isSelected && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <polyline points="20,6 9,17 4,12"></polyline>
                                        </svg>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {expenseErrors.splitMembers && (
                                <span className="error-message">{expenseErrors.splitMembers.message}</span>
                              )}
                            </div>

                            <div className="form-actions">
                              <button type="button" className="btn secondary" onClick={closeQuickAction}>
                                Cancel
                              </button>
                              <button 
                                type="submit" 
                                className="btn primary" 
                                disabled={quickActionLoading}
                              >
                                {quickActionLoading ? 'Adding...' : 'Add Expense'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Quick Invite Form */}
                      {activeQuickAction === 'invite' && (
                        <div className="quick-action-form">
                          <div className="quick-form-header">
                            <h4>Invite New Member</h4>
                            <button className="close-btn" onClick={closeQuickAction}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>

                          {quickActionError && (
                            <div className="alert error mb-4">{quickActionError}</div>
                          )}

                          <form onSubmit={handleSubmit(handleQuickInvite)} className="quick-form">
                            <div className="form-group">
                              <label className="form-label">Email Address *</label>
                              <input
                                {...register('email')}
                                type="email"
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                placeholder="Enter member's email address"
                              />
                              {errors.email && (
                                <span className="error-message">{errors.email.message}</span>
                              )}
                            </div>

                            <div className="form-actions">
                              <button type="button" className="btn secondary" onClick={closeQuickAction}>
                                Cancel
                              </button>
                              <button 
                                type="submit" 
                                className="btn primary" 
                                disabled={quickActionLoading}
                              >
                                {quickActionLoading ? 'Inviting...' : 'Send Invitation'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Activity & Insights */}
                <div className="overview-content">
                  <div className="content-main">
                    <div className="recent-activity-modern">
                      <div className="section-header">
                        <h3>Recent Activity</h3>
                        {expenses.length > 5 && (
                          <button className="view-all-btn" onClick={() => setActiveTab('expenses')}>
                            View All
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18l6-6-6-6"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {getRecentActivity().length > 0 ? (
                        <div className="activity-list-modern">
                          {getRecentActivity().map((expense, index) => {
                            const isUserExpense = expense.paidByEmail === user?.email;
                            const splitAmount = expense.amount / expense.splitAmong.length;
                            
                            return (
                              <div 
                                key={expense._id} 
                                className={`activity-item-modern ${isUserExpense ? 'user-expense' : 'other-expense'}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                              >
                                <div className="activity-visual">
                                  <div className="activity-icon-modern">
                                    {getCategoryIcon(expense.category, expense.description)}
                                  </div>
                                  <div className="activity-line"></div>
                                </div>
                                
                                <div className="activity-content-modern">
                                  <div className="activity-header">
                                    <div className="activity-title-modern">{expense.description}</div>
                                    <div className="activity-amount">₹{expense.amount.toFixed(2)}</div>
                                  </div>
                                  
                                  <div className="activity-details-modern">
                                    <div className="activity-payer">
                                      <span className="payer-label">Paid by</span>
                                      <span className={`payer-name ${isUserExpense ? 'user' : 'other'}`}>
                                        {isUserExpense ? 'You' : expense.paidByEmail.split('@')[0]}
                                      </span>
                                    </div>
                                    <div className="activity-split">
                                      <span className="split-label">Split between {expense.splitAmong.length} member{expense.splitAmong.length !== 1 ? 's' : ''}</span>
                                      <span className="split-amount">₹{splitAmount.toFixed(2)} each</span>
                                    </div>
                                  </div>
                                  
                                  <div className="activity-meta">
                                    <span className="activity-date-modern">
                                      {new Date(expense.createdAt).toLocaleDateString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    {isUserExpense && (
                                      <span className="user-badge">You paid</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty-state-modern">
                          <div className="empty-icon">📊</div>
                          <div className="empty-content">
                            <h4>No Activity Yet</h4>
                            <p>Start tracking expenses to see your group's activity here</p>
                            <button className="empty-action-btn" onClick={() => setActiveTab('expenses')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                              Add First Expense
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="content-sidebar">
                    {/* Group Insights */}
                    <div className="insights-card">
                      <h4>Group Insights</h4>
                      <div className="insights-list">
                        <div className="insight-item">
                          <div className="insight-icon">💰</div>
                          <div className="insight-content">
                            <div className="insight-label">Average per person</div>
                            <div className="insight-value">
                              ₹{groupSummary && group.members.length > 0 
                                ? (groupSummary.totalExpenses / group.members.length).toFixed(2) 
                                : '0.00'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="insight-item">
                          <div className="insight-icon">📈</div>
                          <div className="insight-content">
                            <div className="insight-label">Most active</div>
                            <div className="insight-value">
                              {(() => {
                                const expenseCounts = expenses.reduce((acc, exp) => {
                                  acc[exp.paidByEmail] = (acc[exp.paidByEmail] || 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>);
                                
                                const mostActive = Object.entries(expenseCounts)
                                  .sort(([,a], [,b]) => b - a)[0];
                                
                                return mostActive 
                                  ? (mostActive[0] === user?.email ? 'You' : mostActive[0].split('@')[0])
                                  : 'No data';
                              })()} 
                            </div>
                          </div>
                        </div>
                        
                        <div className="insight-item">
                          <div className="insight-icon">🎯</div>
                          <div className="insight-content">
                            <div className="insight-label">Outstanding debts</div>
                            <div className="insight-value">
                              {groupSummary?.simplifiedDebts?.length || 0} debt{(groupSummary?.simplifiedDebts?.length || 0) !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        
                        {expenses.length > 0 && (
                          <div className="insight-item">
                            <div className="insight-icon">📅</div>
                            <div className="insight-content">
                              <div className="insight-label">Last activity</div>
                              <div className="insight-value">
                                {(() => {
                                  const lastExpense = expenses.sort((a, b) => 
                                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                  )[0];
                                  
                                  const daysDiff = Math.floor(
                                    (Date.now() - new Date(lastExpense.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                                  );
                                  
                                  return daysDiff === 0 ? 'Today' : 
                                         daysDiff === 1 ? 'Yesterday' : 
                                         `${daysDiff} days ago`;
                                })()} 
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-tab">
            <div className="modern-members-header">
              <div className="header-content">
                <div className="header-title-section">
                  <h2 className="modern-members-title">Group Members</h2>
                  <p className="modern-members-subtitle">
                    Manage and track members in {group.name}
                  </p>
                </div>
                <div className="header-stats">
                  <div className="stat-card">
                    <div className="stat-value">{group.members.length}</div>
                    <div className="stat-label">Total Members</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {group.members.filter(m => m.status === 'active').length}
                    </div>
                    <div className="stat-label">Active</div>
                  </div>
                </div>
              </div>
              <LoadingButton
                variant="primary"
                onClick={() => setIsAddingMember(true)}
                className="modern-add-member-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Member
              </LoadingButton>
            </div>

            {/* Add Member Modal */}
            {isAddingMember && (
              <div className="member-modal-overlay">
                <div className="member-modal-container">
                  {/* Modal Header */}
                  <div className="member-modal-header">
                    <div className="header-content">
                      <div className="header-icon">👥</div>
                      <div className="header-text">
                        <h2>Add New Member</h2>
                        <p>Invite someone to join <span className="group-name">{group.name}</span></p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="modal-close-btn" 
                      onClick={() => {
                        setIsAddingMember(false);
                        reset();
                        setMemberError('');
                        setSearchedUsers([]);
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Error/Success Alerts */}
                  {memberError && (
                    <div className="alert-banner error">
                      <span className="alert-icon">⚠️</span>
                      <span className="alert-text">{memberError}</span>
                    </div>
                  )}

                  {memberSuccess && (
                    <div className="alert-banner success">
                      <span className="alert-icon">✓</span>
                      <span className="alert-text">{memberSuccess}</span>
                    </div>
                  )}

                  {/* Form Content */}
                  <form onSubmit={handleSubmit(onAddMember)} className="member-form">
                    {/* Email Input Section */}
                    <div className="form-section">
                      <h3 className="section-title">📫 Invitation Details</h3>
                      
                      <div className="field-group">
                        <label className="field-label">
                          <span className="label-text">Email Address *</span>
                          <span className="label-icon">📎</span>
                        </label>
                        <div className="input-wrapper">
                          <input
                            id="email"
                            type="email"
                            className={`member-input ${errors.email ? 'error' : ''}`}
                            placeholder="Enter member's email address (e.g. john@example.com)"
                            autoComplete="off"
                            {...register('email')}
                          />
                          <div className="input-icon">📧</div>
                        </div>
                        {errors.email && (
                          <span className="field-error">{errors.email.message}</span>
                        )}

                        
                        {/* Search Loading State */}
                        {searchLoading && (
                          <div className="search-loading">
                            <div className="loading-spinner"></div>
                            <span>Searching for users...</span>
                          </div>
                        )}
                        
                        {/* Search Results */}
                        {searchedUsers.length > 0 && (
                          <div className="search-results">
                            <div className="results-header">
                              <span className="results-count">{searchedUsers.length} user{searchedUsers.length !== 1 ? 's' : ''} found</span>
                            </div>
                            <div className="results-list">
                              {searchedUsers.map(user => {
                                const userInitial = (user.username || user.email)[0].toUpperCase();
                                return (
                                  <div key={user._id} className="user-result-card">
                                    <div className="user-avatar">{userInitial}</div>
                                    <div className="user-details">
                                      <div className="user-name">{user.username}</div>
                                      <div className="user-email">{user.email}</div>
                                    </div>
                                    <button
                                      type="button"
                                      className="select-user-btn"
                                      onClick={() => {
                                        reset({ email: user.email });
                                        setSearchedUsers([]);
                                      }}
                                    >
                                      <span className="btn-icon">✓</span>
                                      Select
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Information Section */}
                    <div className="info-section">
                      <div className="info-card">
                        <div className="info-icon">📝</div>
                        <div className="info-content">
                          <h4>How it works</h4>
                          <p>Enter an email address to invite someone to this group. If they're not registered yet, they'll receive an invitation to join Settlio.</p>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="member-form-actions">
                      <button
                        type="button"
                        className="action-btn cancel"
                        onClick={() => {
                          setIsAddingMember(false);
                          reset();
                          setMemberError('');
                          setSearchedUsers([]);
                        }}
                      >
                        <span className="btn-icon">✕</span>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="action-btn primary"
                        disabled={!watch('email') || !!errors.email}
                      >
                        <span className="btn-icon">📧</span>
                        Send Invitation
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modern Members List */}
            <div className="modern-members-list">
              {group.members.map((member, index) => {
                const memberUser = member.userId;
                const displayName = memberUser ? memberUser.username : member.email.split('@')[0];
                const displayEmail = member.email;
                const avatarText = memberUser ? memberUser.username.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase();
                const isAdmin = memberUser && memberUser._id === group.admin._id;
                const balanceAmount = groupSummary 
                  ? (groupSummary.memberBalances.find(balance => balance.user.email === displayEmail)?.balance || 0)
                  : 0;
                const joinedDate = member.joinedAt ? new Date(member.joinedAt) : new Date(member.invitedAt || Date.now());
                
                // Determine member type and colors
                const memberTypeData = (() => {
                  if (isAdmin) {
                    return {
                      type: 'Admin',
                      icon: 'crown',
                      color: '#f59e0b',
                      bgColor: 'rgba(245, 158, 11, 0.1)',
                      borderColor: 'rgba(245, 158, 11, 0.2)'
                    };
                  } else if (member.status === 'invited') {
                    return {
                      type: 'Pending',
                      icon: 'clock',
                      color: '#6b7280',
                      bgColor: 'rgba(107, 114, 128, 0.1)',
                      borderColor: 'rgba(107, 114, 128, 0.2)'
                    };
                  } else {
                    return {
                      type: 'Member',
                      icon: 'user',
                      color: '#10b981',
                      bgColor: 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'rgba(16, 185, 129, 0.2)'
                    };
                  }
                })();
                
                return (
                  <div 
                    key={member._id} 
                    className="modern-member-card"
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    {/* Member Type Icon */}
                    <div 
                      className="modern-member-icon"
                      style={{
                        backgroundColor: memberTypeData.bgColor,
                        borderColor: memberTypeData.borderColor
                      }}
                    >
                      <div className="member-avatar-large">
                        {memberUser?.profilePhoto ? (
                          <img 
                            src={`http://localhost:5000${memberUser.profilePhoto}`} 
                            alt={displayName}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="avatar-fallback"
                          style={{ 
                            display: memberUser?.profilePhoto ? 'none' : 'flex',
                            color: memberTypeData.color,
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            fontWeight: '600'
                          }}
                        >
                          {avatarText}
                        </div>
                      </div>
                    </div>
                    
                    {/* Member Content */}
                    <div className="modern-member-content">
                      <div className="member-header-row">
                        <h4 className="member-title">{displayName}</h4>
                        <div className={`member-balance ${
                          balanceAmount > 0 ? 'positive' : balanceAmount < 0 ? 'negative' : 'zero'
                        }`}>
                          {balanceAmount !== 0 ? (balanceAmount > 0 ? '+' : '-') : ''}₹{Math.abs(balanceAmount).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="member-details-row">
                        <div className="member-email-info">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{displayEmail}</span>
                        </div>
                        <div className="member-type">
                          <span 
                            className="modern-type-badge"
                            style={{
                              backgroundColor: memberTypeData.bgColor,
                              color: memberTypeData.color,
                              borderColor: memberTypeData.borderColor
                            }}
                          >
                            {memberTypeData.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="member-meta-row">
                        <div className="joined-info">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <span className="meta-text">
                            {member.status === 'invited' ? 'Invited' : 'Joined'} {joinedDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="balance-info">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                          <span className="meta-text">
                            {balanceAmount > 0 ? 'Owed money' : balanceAmount < 0 ? 'Owes money' : 'Settled'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {!isAdmin && memberUser && (
                      <div className="member-actions">
                        <button
                          className="modern-remove-btn"
                          onClick={() => handleRemoveMember(memberUser._id, displayName)}
                          title="Remove member"
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
          </div>
        )}

        {activeTab === 'expenses' && (
          <GroupExpenses group={group} onBack={onBack} />
        )}

        {activeTab === 'balances' && (
          <GroupBalances group={group} onBack={onBack} />
        )}
      </div>

      {/* Global Success Message */}
      {memberSuccess && !isAddingMember && (
        <div className="floating-alert success">
          {memberSuccess}
        </div>
      )}

      {/* Global Error Message */}
      {memberError && !isAddingMember && (
        <div className="floating-alert error">
          {memberError}
        </div>
      )}
    </div>
  );
};

export default GroupDetails;