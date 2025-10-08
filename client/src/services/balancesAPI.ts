import api from './api';

export interface Balance {
  memberEmail: string;
  memberUserId?: string;
  memberName: string;
  memberUser?: {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  balanceAmount: number;
  currency: string;
  status: 'active' | 'invited';
}

export interface Debt {
  expenseId?: string;
  settlementId?: string;
  description: string;
  date: string;
  amount: number;
  currency: string;
  paidByEmail?: string;
  owedByEmail?: string;
  fromEmail?: string;
  toEmail?: string;
  otherPartyEmail: string;
  otherPartyName: string;
  isUserOwing?: boolean;
  isUserPaying?: boolean;
  type: 'expense' | 'settlement';
  status: 'unpaid' | 'paid' | 'pending' | 'completed';
  paymentMethod?: string;
}

export interface Settlement {
  _id: string;
  fromEmail: string;
  toEmail: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod?: string;
  comments?: string;
  description?: string; // Legacy field for backwards compatibility
  status: 'pending' | 'completed';
  fromUser?: {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  toUser?: {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  payer?: {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  payee?: {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  createdAt: string;
  createdBy?: string | { _id: string; username: string; email: string }; // User ID or User object
}

export interface CreateSettlementData {
  fromEmail?: string;
  fromUserId?: string;
  toEmail: string;
  toUserId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  comments?: string;
}

export interface DebtRelationship {
  _id: string;
  from: {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  to: {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  amount: number;
  currency: string;
}

export interface MemberBalance {
  user: {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  balance: number;
  owes: number;
  owed: number;
  currency: string;
}

export interface GroupSummary {
  totalBalance: number;
  totalExpenses: number;
  totalSettlements: number;
  currency: string;
  memberBalances: MemberBalance[];
  simplifiedDebts: DebtRelationship[];
  settlements: Settlement[];
}

export interface BalancesResponse {
  balances: Balance[];
  totalNetBalance: number;
  currency: string;
}

export interface DebtsResponse {
  debts: Debt[];
  totalCount: number;
}

export interface SettlementResponse {
  settlement: Settlement;
  updatedBalance: number;
}

export interface SettlementHistoryResponse {
  settlements: Settlement[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalSettlements: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class BalancesAPI {
  // Get balances for a group
  async getGroupBalances(groupId: string): Promise<{ data: BalancesResponse }> {
    const response = await api.get(`/groups/${groupId}/balances`);
    return response.data;
  }

  // Get detailed debts for a group
  async getGroupDebts(
    groupId: string,
    filters?: {
      memberEmail?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ data: DebtsResponse }> {
    const params = new URLSearchParams();
    
    if (filters?.memberEmail) {
      params.append('memberEmail', filters.memberEmail);
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    const url = `/groups/${groupId}/debts${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  }

  // Create a settlement
  async createSettlement(
    groupId: string,
    settlementData: CreateSettlementData
  ): Promise<{ data: SettlementResponse }> {
    const response = await api.post(`/groups/${groupId}/settlements`, settlementData);
    return response.data;
  }

  // Get settlement history for a group
  async getSettlementHistory(
    groupId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: SettlementHistoryResponse }> {
    const response = await api.get(`/groups/${groupId}/settlements?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Delete a settlement
  async deleteSettlement(groupId: string, settlementId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/groups/${groupId}/settlements/${settlementId}`);
    return response.data;
  }

  // Get group summary with balances, debts, and settlements
  async getGroupSummary(groupId: string, cacheBuster?: string): Promise<{ data: GroupSummary }> {
    const timestamp = cacheBuster || `?_t=${Date.now()}`;
    const url = `/groups/${groupId}/summary${timestamp}`;
    
    // Additional cache-busting for this specific request
    const response = await api.get(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'If-Modified-Since': '0'
      }
    });
    return response.data;
  }

  // Calculate balance between two users (utility method)
  calculateNetBalance(balances: Balance[], userEmail: string): number {
    return balances.reduce((total, balance) => {
      if (balance.memberEmail === userEmail) {
        return total + balance.balanceAmount;
      }
      return total;
    }, 0);
  }

  // Format currency amount
  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Format date
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get balance status text
  getBalanceStatus(amount: number): { text: string; type: 'owed' | 'owes' | 'settled' } {
    if (Math.abs(amount) < 0.01) {
      return { text: 'Settled up', type: 'settled' };
    } else if (amount > 0) {
      return { text: 'owes you', type: 'owed' };
    } else {
      return { text: 'you owe', type: 'owes' };
    }
  }
}

export const balancesAPI = new BalancesAPI();
export default balancesAPI;