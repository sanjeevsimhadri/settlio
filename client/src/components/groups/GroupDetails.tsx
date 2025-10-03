import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { addMemberSchema } from '../../utils/groupValidation';
import { groupsAPI, Group, User, GroupMember } from '../../services/groupsAPI';
import GroupExpenses from '../expenses/GroupExpenses';
import GroupBalances from '../balances/GroupBalances';
import './Groups.css';

interface GroupDetailsProps {
  group: Group;
  onBack: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ group, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'expenses' | 'balances'>('overview');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

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
        onBack(); // Refresh the group data
      }, 2000);

    } catch (error: any) {
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
        onBack(); // Refresh the group data
      }, 1500);

    } catch (error: any) {
      setMemberError(error.error || 'Failed to remove member. Please try again.');
    }
  };

  return (
    <div className="group-details">
      {/* Header */}
      <div className="group-details-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Groups
        </button>
        <div className="group-info">
          <h1>{group.name}</h1>
          <p>{group.members.length} member{group.members.length !== 1 ? 's' : ''} • Created {new Date(group.createdAt).toLocaleDateString()}</p>
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
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Members</h3>
                <div className="stat-number">{group.members.length}</div>
              </div>
              <div className="stat-card">
                <h3>Total Expenses</h3>
                <div className="stat-number">0</div>
              </div>
              <div className="stat-card">
                <h3>Your Balance</h3>
                <div className="stat-number balance-positive">$0.00</div>
              </div>
              <div className="stat-card">
                <h3>Group Total</h3>
                <div className="stat-number">$0.00</div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="empty-state">
                <p>No activity yet. Start by adding an expense!</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-tab">
            <div className="members-header">
              <h3>Group Members</h3>
              <button
                className="button primary"
                onClick={() => setIsAddingMember(true)}
              >
                + Add Member
              </button>
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
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setIsAddingMember(false);
                        reset();
                        setMemberError('');
                        setSearchedUsers([]);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="button primary">
                      Add Member
                    </button>
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
                      <div className="member-balance">Balance: $0.00</div>
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