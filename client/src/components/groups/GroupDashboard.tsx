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

  // Show groups list
  return (
    <div className="groups-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>My Groups</h1>
          <p className="header-subtitle">
            Manage your expense groups and track shared costs
          </p>
        </div>
        <LoadingButton
          variant="primary"
          size="lg"
          onClick={() => setIsCreateModalOpen(true)}
          className="create-group-btn"
        >
          + Create Group
        </LoadingButton>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <Input
          type="text"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          startIcon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          }
        />
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
                {/* Scroll Instructions */}
                <div className="scroll-instructions">
                  Scroll to explore all your groups
                </div>
                
                {/* Horizontal Groups Layout */}
                <div className="groups-grid">
                  {filteredGroups.map((group) => {
                    const memberCount = group.members.length;
                    const activeMembersCount = group.members.filter(m => m.status === 'active').length;
                    const invitedMembersCount = memberCount - activeMembersCount;
                    
                    return (
                      <div
                        key={group._id}
                        className="group-card cursor-pointer"
                        onClick={() => handleGroupSelect(group)}
                      >
                        <div className="p-6 space-y-4">
                          {/* Group Header */}
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <h3 className="group-name">
                                {group.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="badge variant-secondary">
                                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                                </div>
                                {invitedMembersCount > 0 && (
                                  <div className="badge variant-warning">
                                    {invitedMembersCount} pending
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="badge variant-success">Active</div>
                          </div>

                          {/* Group Stats */}
                          <div className="group-stats">
                            <div className="stat">
                              <div className="stat-value">{memberCount}</div>
                              <div className="stat-label">Members</div>
                            </div>
                            <div className="stat">
                              <div className={`stat-value balance-${getBalanceStatus(calculateUserBalance(group))}`}>
                                {(() => {
                                  const balance = calculateUserBalance(group);
                                  const status = getBalanceStatus(balance);
                                  if (status === 'zero') return '₹0.00';
                                  return (balance > 0 ? '+' : '-') + formatCurrency(balance);
                                })()}
                              </div>
                              <div className="stat-label">Your Balance</div>
                            </div>
                          </div>

                          {/* Member Avatars */}
                          <div className="flex items-center gap-3">
                            <div className="member-avatars">
                              {group.members.slice(0, 4).map((member, index) => {
                                const displayName = member.userId ? member.userId.username : member.email;
                                return (
                                  <div
                                    key={member._id}
                                    className={`member-avatar ${member.status === 'invited' ? 'opacity-60' : ''}`}
                                  >
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                );
                              })}
                              {memberCount > 4 && (
                                <div className="member-avatar">
                                  +{memberCount - 4}
                                </div>
                              )}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <p className="member-names">
                                {memberCount === 1 
                                  ? 'Just you' 
                                  : (() => {
                                      const firstMember = group.members[0];
                                      const firstName = firstMember?.userId 
                                        ? firstMember.userId.username 
                                        : firstMember?.email.split('@')[0] || 'You';
                                      const others = memberCount - 1;
                                      return `${firstName} and ${others} other${others > 1 ? 's' : ''}`;
                                    })()
                                }
                              </p>
                            </div>
                          </div>

                          {/* Group Footer */}
                          <div className="group-footer">
                            <div className="text-sm">
                              By {(() => {
                                if (typeof group.createdBy === 'object' && group.createdBy?.username) {
                                  return group.createdBy.username;
                                }
                                if (typeof group.admin === 'object' && group.admin?.username) {
                                  return group.admin.username;
                                }
                                if (typeof group.admin === 'string') {
                                  return group.admin;
                                }
                                return 'You';
                              })()} • {formatRelativeTime(group.createdAt)}
                            </div>
                            <div className="view-link">
                              View Details →
                            </div>
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