import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { addMemberSchema } from '../../utils/groupValidation';
import { groupsAPI, Group, User, GroupMember } from '../../services/groupsAPI';
import { expensesAPI, Expense } from '../../services/expensesAPI';
import { balancesAPI, GroupSummary } from '../../services/balancesAPI';
import GroupExpenses from '../expenses/GroupExpenses';
import GroupBalances from '../balances/GroupBalances';
import { Card, LoadingButton, Input, Badge, Avatar, Alert } from '../ui';
import { RecordHeader, CreationInfo } from '../common/CreationInfo';
import { useAuth } from '../../contexts/AuthContext';
import './Groups.css';

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
            showAvatar={true}
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
                          <div className="activity-icon">💰</div>
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
              <h3>Group Members</h3>
              <LoadingButton
                variant="primary"
                onClick={() => setIsAddingMember(true)}
              >
                + Add Member
              </LoadingButton>
            </div>

            {/* Add Member Form */}
            {isAddingMember && (
              <div className="add-member-form">
                <h4>Add New Member</h4>
                <form onSubmit={handleSubmit(onAddMember)}>
                  <div className="form-group">
                    <label htmlFor="email">Member Email</label>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="Enter member's email address"
                      autoComplete="off"
                    />
                    {errors.email && (
                      <span className="error-message">{errors.email.message}</span>
                    )}

                    {/* Search Results */}
                    {searchLoading && (
                      <div className="search-loading">Searching users...</div>
                    )}
                    
                    {searchedUsers.length > 0 && (
                      <div className="search-results">
                        {searchedUsers.map(user => (
                          <div key={user._id} className="search-result">
                            <div className="user-info">
                              <span className="username">{user.username}</span>
                              <span className="email">{user.email}</span>
                            </div>
                            <button
                              type="button"
                              className="button small"
                              onClick={() => {
                                // Set the email in the form
                                reset({ email: user.email });
                                setSearchedUsers([]);
                              }}
                            >
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {memberError && (
                    <div className="alert error">{memberError}</div>
                  )}

                  {memberSuccess && (
                    <div className="alert success">{memberSuccess}</div>
                  )}

                  <div className="form-actions">
                    <LoadingButton
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setIsAddingMember(false);
                        reset();
                        setMemberError('');
                        setSearchedUsers([]);
                      }}
                    >
                      Cancel
                    </LoadingButton>
                    <LoadingButton type="submit" variant="primary">
                      Add Member
                    </LoadingButton>
                  </div>
                </form>
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
                        {member.status === 'invited' && (
                          <span className="member-status"> (Invited)</span>
                        )}
                      </div>
                      <div className="member-email">{displayEmail}</div>
                      <div className="member-balance">
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