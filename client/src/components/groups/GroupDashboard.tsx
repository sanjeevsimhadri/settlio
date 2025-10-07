import React, { useState, useEffect } from 'react';
import { groupsAPI, Group } from '../../services/groupsAPI';
import { balancesAPI, GroupSummary } from '../../services/balancesAPI';
import CreateGroupModal from './CreateGroupModal';
import GroupDetails from './GroupDetails';
import { Card, LoadingButton, Input, Badge, Avatar, useToast } from '../ui';
import { CreationInfo } from '../common/CreationInfo';
import { formatCreatedBy, formatCreatedAt, formatRelativeTime } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import './Groups.css';

const GroupDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupBalances, setGroupBalances] = useState<Map<string, GroupSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load user's groups on component mount
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load groups
      const groupsResponse = await groupsAPI.getUserGroups();
      setGroups(groupsResponse.data);
      
      // Load balance data for each group
      const balanceMap = new Map<string, GroupSummary>();
      await Promise.all(
        groupsResponse.data.map(async (group) => {
          try {
            const balanceResponse = await balancesAPI.getGroupSummary(group._id);
            balanceMap.set(group._id, balanceResponse.data);
          } catch (balanceError) {
            // If balance fetch fails, continue with other groups
            console.warn(`Failed to load balance for group ${group._id}:`, balanceError);
          }
        })
      );
      
      setGroupBalances(balanceMap);
    } catch (error: any) {
      setError(error.error || 'Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = () => {
    // Refresh the groups list after creating a new group
    loadGroups();
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
  };

  const handleBackToList = () => {
    setSelectedGroup(null);
    // Refresh groups to get updated data
    loadGroups();
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate current user's balance in a group
  const calculateUserBalance = (group: Group): number => {
    const groupSummary = groupBalances.get(group._id);
    if (!groupSummary || !currentUser) {
      return 0;
    }
    
    // Find current user's balance from memberBalances
    const userBalance = groupSummary.memberBalances.find(
      (memberBalance) => {
        // Match by user ID or email
        return (
          memberBalance.user._id === currentUser.id ||
          memberBalance.user.email === currentUser.email
        );
      }
    );
    
    return userBalance ? userBalance.balance : 0;
  };

  // Format currency for display with proper sign handling
  const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    return `₹${absAmount.toFixed(2)}`;
  };
  
  // Get balance status for styling
  const getBalanceStatus = (amount: number): 'positive' | 'negative' | 'zero' => {
    if (Math.abs(amount) < 0.01) return 'zero';
    return amount > 0 ? 'positive' : 'negative';
  };

  // If a group is selected, show group details
  if (selectedGroup) {
    return (
      <GroupDetails
        group={selectedGroup}
        onBack={handleBackToList}
      />
    );
  }

  // Calculate dashboard statistics
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.members.some(m => m.status === 'active')).length;
  const totalBalance = groups.reduce((sum, group) => sum + calculateUserBalance(group), 0);
  const positiveBalance = groups.filter(g => calculateUserBalance(g) > 0).length;
  const negativeBalance = groups.filter(g => calculateUserBalance(g) < 0).length;

  // Show groups list
  return (
    <div className="modern-groups-dashboard">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-header">
            <div className="hero-title-section">
              <h1 className="hero-title">
                Welcome back, {currentUser?.username || 'User'}!
              </h1>
              <p className="hero-subtitle">
                Manage your expense groups and track shared costs with ease
              </p>
            </div>
            
            <LoadingButton
              variant="primary"
              size="lg"
              onClick={() => setIsCreateModalOpen(true)}
              className="hero-cta-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              Create New Group
            </LoadingButton>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h3v7c0 .55.45 1 1 1h9c.55 0 1-.45 1-1v-7h3v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{totalGroups}</div>
                <div className="stat-label">Total Groups</div>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{activeGroups}</div>
                <div className="stat-label">Active Groups</div>
              </div>
            </div>

            <div className="stat-card balance">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className={`stat-value ${getBalanceStatus(totalBalance)}`}>
                  {totalBalance >= 0 ? '+' : ''}{formatCurrency(totalBalance)}
                </div>
                <div className="stat-label">Net Balance</div>
              </div>
            </div>

            <div className="stat-card info">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  <span className="positive-count">+{positiveBalance}</span>
                  <span className="divider">/</span>
                  <span className="negative-count">-{negativeBalance}</span>
                </div>
                <div className="stat-label">Owe/Owed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search & Filters */}
      <div className="search-filter-section">
        <div className="search-container">
          <Input
            type="text"
            placeholder="Search groups by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="modern-search-input"
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            }
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>
        
        {filteredGroups.length !== groups.length && (
          <div className="search-results-info">
            Showing {filteredGroups.length} of {groups.length} groups
          </div>
        )}
      </div>

      {/* Groups Content */}
      <div className="groups-content">
        {loading && (
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>Loading your groups...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div className="alert error">
              {error}
            </div>
            <LoadingButton
              variant="secondary"
              onClick={loadGroups}
            >
              Try Again
            </LoadingButton>
          </div>
        )}

        {!loading && !error && (
          <>
            {filteredGroups.length === 0 ? (
              <div className="empty-state">
                {groups.length === 0 ? (
                  // No groups at all
                  <>
                    <div className="empty-icon">👥</div>
                    <h3>No groups yet</h3>
                    <p>
                      Create your first group to start tracking shared expenses
                      with friends, family, or colleagues.
                    </p>
                    <LoadingButton
                      variant="primary"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Create Your First Group
                    </LoadingButton>
                  </>
                ) : (
                  // No groups match search
                  <>
                    <div className="empty-icon">🔍</div>
                    <h3>No groups found</h3>
                    <p>
                      No groups match your search "{searchTerm}".
                      Try a different search term.
                    </p>
                    <LoadingButton
                      variant="secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </LoadingButton>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Groups Section Header */}
                <div className="groups-section-header">
                  <h2 className="section-title">
                    Your Groups
                    <span className="count-badge">{filteredGroups.length}</span>
                  </h2>
                  <p className="section-subtitle">
                    {filteredGroups.length === 1 
                      ? 'You have 1 expense group' 
                      : `You have ${filteredGroups.length} expense groups`}
                  </p>
                </div>
                
                {/* Modern Groups Grid */}
                <div className="modern-groups-grid">
                  {filteredGroups.map((group) => {
                    const memberCount = group.members.length;
                    const activeMembersCount = group.members.filter(m => m.status === 'active').length;
                    const invitedMembersCount = memberCount - activeMembersCount;
                    
                    return (
                      <div
                        key={group._id}
                        className="modern-group-card"
                        onClick={() => handleGroupSelect(group)}
                      >
                        <div className="group-card-header">
                          <div className="group-header-left">
                            <div className="group-icon">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h3v7c0 .55.45 1 1 1h9c.55 0 1-.45 1-1v-7h3v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2z"/>
                              </svg>
                            </div>
                            <div className="group-title-section">
                              <h3 className="modern-group-name">{group.name}</h3>
                              <div className="group-badges">
                                <div className="member-count-badge">
                                  <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h3v7c0 .55.45 1 1 1h9c.55 0 1-.45 1-1v-7h3v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2z"/>
                                  </svg>
                                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                                </div>
                                {invitedMembersCount > 0 && (
                                  <div className="pending-badge">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    {invitedMembersCount} pending
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="group-status active">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Active
                          </div>
                        </div>

                        <div className="group-balance-section">
                          <div className="balance-display">
                            <div className="balance-label">Your Balance</div>
                            <div className={`balance-amount ${getBalanceStatus(calculateUserBalance(group))}`}>
                              {(() => {
                                const balance = calculateUserBalance(group);
                                const status = getBalanceStatus(balance);
                                if (status === 'zero') return '₹0.00';
                                return (balance > 0 ? '+' : '-') + formatCurrency(balance);
                              })()}
                            </div>
                            <div className="balance-status">
                              {(() => {
                                const balance = calculateUserBalance(group);
                                if (Math.abs(balance) < 0.01) return 'All settled up!';
                                return balance > 0 ? 'You are owed' : 'You owe';
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className="group-members-section">
                          <div className="members-avatars">
                            {group.members.slice(0, 5).map((member, index) => {
                              const displayName = member.userId ? member.userId.username : member.email;
                              return (
                                <div
                                  key={member._id}
                                  className={`modern-member-avatar ${member.status === 'invited' ? 'invited' : 'active'}`}
                                  title={displayName}
                                >
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                              );
                            })}
                            {memberCount > 5 && (
                              <div className="more-members-avatar" title={`+${memberCount - 5} more members`}>
                                +{memberCount - 5}
                              </div>
                            )}
                          </div>
                          
                          <div className="members-summary">
                            <div className="members-text">
                              {memberCount === 1 
                                ? 'Just you' 
                                : `${activeMembersCount} active${invitedMembersCount > 0 ? `, ${invitedMembersCount} pending` : ''}`
                              }
                            </div>
                          </div>
                        </div>

                        <div className="group-card-footer">
                          <div className="group-meta">
                            <div className="created-info">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H3V8h14v12z"/>
                              </svg>
                              Created {formatRelativeTime(group.createdAt)}
                            </div>
                            <div className="admin-info">
                              by {(() => {
                                if (typeof group.createdBy === 'object' && group.createdBy?.username) {
                                  return group.createdBy.username;
                                }
                                if (typeof group.admin === 'object' && group.admin?.username) {
                                  return group.admin.username;
                                }
                                return 'You';
                              })()}
                            </div>
                          </div>
                          
                          <div className="view-group-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Groups Summary */}
            {filteredGroups.length > 0 && (
              <div className="groups-summary">
                <p>
                  Showing {filteredGroups.length} of {groups.length} group{groups.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};

export default GroupDashboard;