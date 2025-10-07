import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { addMemberSchema } from '../../utils/groupValidation';
import { groupsAPI, Group, User, GroupMember } from '../../services/groupsAPI';
import { expensesAPI, Expense } from '../../services/expensesAPI';
import { balancesAPI, GroupSummary } from '../../services/balancesAPI';
import GroupExpenses from '../expenses/GroupExpenses';
import GroupBalances from '../balances/GroupBalances';
import { Card, LoadingButton, Input, Badge, Alert } from '../ui';
import { RecordHeader, CreationInfo } from '../common/CreationInfo';
import { useAuth } from '../../contexts/AuthContext';
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

  const watchedEmail = watch('email');

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

  return (
    <div className="group-details">
      {/* Header */}
      <div className="mb-6">
        <LoadingButton
          variant="secondary"
          size="sm"
          onClick={onBack}
          className="mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Groups
        </LoadingButton>
        
        <Card variant="elevated" padding="large">
          <RecordHeader
            title={group.name}
            subtitle={`${group.members.length} member${group.members.length !== 1 ? 's' : ''}`}
            createdAt={group.createdAt}
            createdBy={group.createdBy || group.admin}
            users={group.members.map(m => m.userId).filter((user): user is NonNullable<typeof user> => user !== null)}
          />
        </Card>
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
              <div className="loading-state">
                <div className="spinner large"></div>
                <p>Loading group data...</p>
              </div>
            )}
            
            {dataError && (
              <div className="error-state">
                <div className="alert error">{dataError}</div>
                <LoadingButton variant="secondary" onClick={fetchGroupData}>
                  Try Again
                </LoadingButton>
              </div>
            )}
            
            {!dataLoading && !dataError && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Total Members</h3>
                    <div className="stat-number">{group.members.length}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Total Expenses</h3>
                    <div className="stat-number">{expenses.length}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Your Balance</h3>
                    <div className={`stat-number ${
                      getUserBalance() > 0 
                        ? 'balance-positive' 
                        : getUserBalance() < 0 
                        ? 'balance-negative' 
                        : ''
                    }`}>
                      ₹{Math.abs(getUserBalance()).toFixed(2)}
                      {getUserBalance() !== 0 && (
                        <span className="balance-indicator">
                          {getUserBalance() > 0 ? ' (you are owed)' : ' (you owe)'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="stat-card">
                    <h3>Group Total</h3>
                    <div className="stat-number">
                      ₹{groupSummary ? groupSummary.totalExpenses.toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>

                <div className="recent-activity">
                  <h3>Recent Activity</h3>
                  {getRecentActivity().length > 0 ? (
                    <div className="activity-list">
                      {getRecentActivity().map((expense) => (
                        <div key={expense._id} className="activity-item">
                          <div className="activity-icon">
                            {getCategoryIcon(expense.category, expense.description)}
                          </div>
                          <div className="activity-details">
                            <div className="activity-title">{expense.description}</div>
                            <div className="activity-subtitle">
                              ₹{expense.amount.toFixed(2)} • paid by {expense.paidByEmail}
                            </div>
                            <div className="activity-date">
                              {new Date(expense.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No activity yet. Start by adding an expense!</p>
                      <LoadingButton 
                        variant="primary" 
                        onClick={() => setActiveTab('expenses')}
                        className="mt-4"
                      >
                        Add First Expense
                      </LoadingButton>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-tab">
            <div className="members-header">
              <h3>👥 Group Members</h3>
              <LoadingButton
                variant="primary"
                onClick={() => setIsAddingMember(true)}
              >
                + Add Member
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

            {/* Members List */}
            <div className="members-list">
              {group.members.map((member) => {
                const memberUser = member.userId;
                const displayName = memberUser ? memberUser.username : member.email.split('@')[0];
                const displayEmail = member.email;
                const avatarText = memberUser ? memberUser.username.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase();
                const isAdmin = memberUser && memberUser._id === group.admin._id;
                
                return (
                  <div key={member._id} className="member-item">
                    <div className={`member-avatar large ${member.status === 'invited' ? 'invited' : ''}`}>
                      {avatarText}
                    </div>
                    <div className="member-info">
                      <div className="member-name">
                        {displayName}
                      </div>
                      <div className="member-email">{displayEmail}</div>
                      <div className={`member-balance ${
                        (() => {
                          const balanceAmount = groupSummary 
                            ? (groupSummary.memberBalances.find(balance => balance.user.email === displayEmail)?.balance || 0)
                            : 0;
                          if (balanceAmount > 0) return 'positive';
                          if (balanceAmount < 0) return 'negative';
                          return 'zero';
                        })()
                      }`}>
                        Balance: ₹{
                          groupSummary 
                            ? (groupSummary.memberBalances.find(balance => balance.user.email === displayEmail)?.balance || 0).toFixed(2)
                            : '0.00'
                        }
                      </div>
                    </div>
                    <div className="member-actions">
                      {isAdmin && (
                        <span className="admin-badge">Admin</span>
                      )}
                      {!isAdmin && memberUser && (
                        <button
                          className="button danger small"
                          onClick={() => handleRemoveMember(memberUser._id, displayName)}
                        >
                          Remove
                        </button>
                      )}
                      {member.status === 'invited' && (
                        <span className="invited-badge">Pending</span>
                      )}
                    </div>
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