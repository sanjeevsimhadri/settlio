import React, { useState, useEffect } from 'react';
import { groupsAPI, Group } from '../../services/groupsAPI';
import CreateGroupModal from './CreateGroupModal';
import GroupDetails from './GroupDetails';
import './Groups.css';

const GroupDashboard: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
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
      const response = await groupsAPI.getUserGroups();
      setGroups(response.data);
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
        <button
          className="button primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Create Group
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
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
            <button
              className="button secondary"
              onClick={loadGroups}
            >
              Try Again
            </button>
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
                    <button
                      className="button primary"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Create Your First Group
                    </button>
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
                    <button
                      className="button secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Groups Grid */
              <div className="groups-grid">
                {filteredGroups.map((group) => (
                  <div
                    key={group._id}
                    className="group-card"
                    onClick={() => handleGroupSelect(group)}
                  >
                    <div className="group-header">
                      <h3 className="group-name">{group.name}</h3>
                      <span className="group-status active">Active</span>
                    </div>

                    <div className="group-stats">
                      <div className="stat">
                        <span className="stat-label">Members</span>
                        <span className="stat-value">{group.members.length}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Total Balance</span>
                        <span className="stat-value">$0.00</span>
                      </div>
                    </div>

                    <div className="group-members">
                      <div className="member-avatars">
                        {group.members.slice(0, 3).map((member, index) => {
                          const displayName = member.userId ? member.userId.username : member.email;
                          const avatarText = member.userId ? member.userId.username.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase();
                          return (
                            <div
                              key={member._id}
                              className={`member-avatar ${member.status === 'invited' ? 'invited' : ''}`}
                              title={`${displayName} (${member.status})`}
                            >
                              {avatarText}
                            </div>
                          );
                        })}
                        {group.members.length > 3 && (
                          <div className="member-avatar more">
                            +{group.members.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="member-names">
                        {group.members.length === 1
                          ? 'Just you'
                          : (() => {
                              const firstMember = group.members[0];
                              const firstName = firstMember?.userId ? firstMember.userId.username : firstMember?.email.split('@')[0] || 'You';
                              const others = group.members.length - 1;
                              return `${firstName} and ${others} other${others > 1 ? 's' : ''}`;
                            })()
                        }
                      </div>
                    </div>

                    <div className="group-footer">
                      <span className="created-date">
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                      <span className="view-link">
                        View Details →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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