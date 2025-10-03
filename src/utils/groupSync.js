const Group = require('../models/Group');

/**
 * Synchronizes a user with any pending group invitations
 * This function can be called during user registration or as a background task
 * 
 * @param {string} email - User's email address
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<number>} - Number of groups synchronized
 */
const syncUserWithGroupInvitations = async (email, userId) => {
  try {
    // Find groups where this email has pending invitations
    const groups = await Group.find({ 
      'members.email': email, 
      'members.userId': null,
      'members.status': 'invited'
    });

    let syncCount = 0;

    for (const group of groups) {
      let groupUpdated = false;
      
      for (const member of group.members) {
        if (member.email === email && !member.userId && member.status === 'invited') {
          member.userId = userId;
          member.status = 'active';
          member.joinedAt = new Date();
          groupUpdated = true;
          syncCount++;
        }
      }
      
      if (groupUpdated) {
        await group.save();
      }
    }

    console.log(`✅ Synchronized ${syncCount} group invitations for user: ${email}`);
    return syncCount;

  } catch (error) {
    console.error('❌ Error syncing group invitations:', error);
    throw error;
  }
};

/**
 * Batch synchronization for multiple users
 * Useful for background processing or data migration
 * 
 * @param {Array} users - Array of user objects with email and _id
 * @returns {Promise<Object>} - Summary of sync results
 */
const batchSyncGroupInvitations = async (users) => {
  const results = {
    totalUsers: users.length,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalInvitationsSynced: 0,
    errors: []
  };

  for (const user of users) {
    try {
      const syncCount = await syncUserWithGroupInvitations(user.email, user._id);
      results.successfulSyncs++;
      results.totalInvitationsSynced += syncCount;
    } catch (error) {
      results.failedSyncs++;
      results.errors.push({
        user: user.email,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Gets pending invitation statistics
 * Useful for monitoring and reporting
 * 
 * @returns {Promise<Object>} - Statistics about pending invitations
 */
const getPendingInvitationStats = async () => {
  try {
    const groups = await Group.find({ 
      'members.status': 'invited',
      'members.userId': null 
    });

    let totalPendingInvitations = 0;
    const uniqueEmails = new Set();

    groups.forEach(group => {
      group.members.forEach(member => {
        if (member.status === 'invited' && !member.userId) {
          totalPendingInvitations++;
          uniqueEmails.add(member.email);
        }
      });
    });

    return {
      totalGroups: groups.length,
      totalPendingInvitations,
      uniquePendingEmails: uniqueEmails.size,
      pendingEmails: Array.from(uniqueEmails)
    };

  } catch (error) {
    console.error('❌ Error getting pending invitation stats:', error);
    throw error;
  }
};

module.exports = {
  syncUserWithGroupInvitations,
  batchSyncGroupInvitations,
  getPendingInvitationStats
};