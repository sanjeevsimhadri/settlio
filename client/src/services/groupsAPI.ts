import api from './api';

export interface Group {
  _id: string;
  name: string;
  members: GroupMember[];
  admin: User;
  memberCount: number;
  createdAt: string;
  createdBy?: string | User; // User ID or User object
  updatedAt: string;
}

export interface GroupMember {
  email: string;
  userId: User | null; // Populated user object or null for unregistered users
  fullName?: string; // Optional full name for registered users
  status: 'invited' | 'active';
  invitedAt: string;
  joinedAt: string | null;
  _id: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  profilePhoto?: string;
}

export interface CreateGroupData {
  name: string;
  members: string[]; // Array of user IDs or emails
}

export interface AddMemberData {
  email: string;
}

// Groups API functions
export const groupsAPI = {
  // Get all user's groups
  getUserGroups: async (): Promise<{ success: boolean; count: number; data: Group[] }> => {
    try {
      const response = await api.get('/groups');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch groups' };
    }
  },

  // Get group by ID with detailed info
  getGroupById: async (groupId: string): Promise<{ success: boolean; data: any }> => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch group details' };
    }
  },

  // Create new group
  createGroup: async (groupData: CreateGroupData): Promise<{ success: boolean; data: Group }> => {
    try {
      const response = await api.post('/groups', groupData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to create group' };
    }
  },

  // Add member to group
  addMember: async (groupId: string, memberData: AddMemberData): Promise<{ success: boolean; data: Group }> => {
    try {
      const response = await api.post(`/groups/${groupId}/members`, memberData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to add member' };
    }
  },

  // Remove member from group
  removeMember: async (groupId: string, userId: string): Promise<{ success: boolean; data: Group }> => {
    try {
      const response = await api.delete(`/groups/${groupId}/members/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to remove member' };
    }
  },

  // Search users by email (for adding members)
  searchUsersByEmail: async (email: string): Promise<{ success: boolean; data: User[] }> => {
    try {
      // This endpoint needs to be implemented in the backend
      const response = await api.get(`/users/search?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to search users' };
    }
  }
};