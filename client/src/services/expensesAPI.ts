import api from './api';

export interface Expense {
  _id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidByEmail: string;
  paidByUserId?: {
    _id: string;
    username: string;
    email: string;
  };
  splitAmong: SplitAmongMember[];
  date: string;
  comments?: string;
  settled: boolean;
  createdAt: string;
  createdBy?: string | { _id: string; username: string; email: string }; // User ID or User object
  updatedAt: string;
}

export interface SplitAmongMember {
  email: string;
  userId?: string;
}

export interface CreateExpenseData {
  groupId: string;
  description: string;
  amount: number;
  currency?: string;
  paidByEmail: string;
  paidByUserId?: string;
  splitAmong: SplitAmongMember[];
  date?: string;
  comments?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

// Expenses API functions
export const expensesAPI = {
  // Get expenses for a group
  getGroupExpenses: async (groupId: string): Promise<{ success: boolean; count: number; data: Expense[] }> => {
    try {
      const response = await api.get(`/expenses/${groupId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch expenses' };
    }
  },

  // Get expense by ID
  getExpenseById: async (groupId: string, expenseId: string): Promise<{ success: boolean; data: Expense }> => {
    try {
      const response = await api.get(`/groups/${groupId}/expenses/${expenseId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch expense details' };
    }
  },

  // Create new expense
  createExpense: async (expenseData: CreateExpenseData): Promise<{ success: boolean; data: Expense }> => {
    try {
      const response = await api.post('/expenses', expenseData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to create expense' };
    }
  },

  // Update expense
  updateExpense: async (groupId: string, expenseId: string, expenseData: UpdateExpenseData): Promise<{ success: boolean; data: Expense }> => {
    try {
      const response = await api.put(`/groups/${groupId}/expenses/${expenseId}`, expenseData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to update expense' };
    }
  },

  // Delete expense
  deleteExpense: async (groupId: string, expenseId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to delete expense' };
    }
  },

  // Get expense categories
  getCategories: async (): Promise<{ success: boolean; data: string[] }> => {
    try {
      const response = await api.get('/expenses/categories');
      return response.data;
    } catch (error: any) {
      // Return default categories if API fails
      return {
        success: true,
        data: ['Food & Drink', 'Transportation', 'Entertainment', 'Shopping', 'Bills & Utilities', 'Travel', 'Other']
      };
    }
  }
};