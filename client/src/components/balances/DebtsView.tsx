import React, { useState, useEffect } from 'react';
import { balancesAPI, Debt, DebtsResponse } from '../../services/balancesAPI';
import { Group, GroupMember } from '../../services/groupsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../common';
import './Balances.css';

interface DebtsViewProps {
  group: Group;
  onBack: () => void;
}

const DebtsView: React.FC<DebtsViewProps> = ({ group, onBack }) => {
  const { user } = useAuth();
  const [debtsData, setDebtsData] = useState<DebtsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Filters
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'expenses' | 'settlements'>('all');

  useEffect(() => {
    loadDebts();
  }, [group._id, selectedMember, startDate, endDate]);

  const loadDebts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters: any = {};
      if (selectedMember) filters.memberEmail = selectedMember;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const response = await balancesAPI.getGroupDebts(group._id, filters);
      setDebtsData(response.data);
    } catch (error: any) {
      setError(error.error || 'Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedMember('');
    setStartDate('');
    setEndDate('');
    setFilterType('all');
  };

  const filteredDebts = debtsData?.debts.filter(debt => {
    if (filterType === 'expenses' && debt.type !== 'expense') return false;
    if (filterType === 'settlements' && debt.type !== 'settlement') return false;
    return true;
  }) || [];

  const getDebtIcon = (debt: Debt) => {
    if (debt.type === 'expense') {
      return '💳';
    } else {
      return '💰';
    }
  };

  const getDebtStatusClass = (debt: Debt) => {
    if (debt.type === 'expense') {
      return debt.isUserOwing ? 'debt-owes' : 'debt-owed';
    } else {
      return debt.isUserPaying ? 'debt-payment' : 'debt-received';
    }
  };

  const getDebtDescription = (debt: Debt) => {
    if (debt.type === 'expense') {
      return {
        title: debt.description,
        subtitle: debt.isUserOwing 
          ? `You owe ${debt.otherPartyName}`
          : `${debt.otherPartyName} owes you`
      };
    } else {
      return {
        title: debt.description,
        subtitle: debt.isUserPaying 
          ? `You paid ${debt.otherPartyName}`
          : `${debt.otherPartyName} paid you`
      };
    }
  };

  if (loading) {
    return (
      <div className="debts-view">
        <div className="debts-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Group
          </button>
          <h1>{group.name} - Transaction History</h1>
        </div>
        <LoadingSpinner message="Loading transaction history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="debts-view">
        <div className="debts-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Group
          </button>
          <h1>{group.name} - Transaction History</h1>
        </div>
        <ErrorMessage message={error} onRetry={loadDebts} />
      </div>
    );
  }

  return (
    <div className="debts-view">
      <div className="debts-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Group
        </button>
        <div className="header-content">
          <h1>{group.name} - Transaction History</h1>
          <p>{filteredDebts.length} transaction{filteredDebts.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="debts-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="memberFilter">Member</label>
            <select
              id="memberFilter"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="form-select small"
            >
              <option value="">All members</option>
              {group.members.map((member) => (
                <option key={member._id} value={member.email}>
                  {member.fullName || (member.userId ? member.userId.username : member.email.split('@')[0])}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="typeFilter">Type</label>
            <select
              id="typeFilter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'expenses' | 'settlements')}
              className="form-select small"
            >
              <option value="all">All transactions</option>
              <option value="expenses">Expenses only</option>
              <option value="settlements">Settlements only</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="startDate">From</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input small"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="endDate">To</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input small"
            />
          </div>

          <div className="filter-actions">
            <button
              className="button small secondary"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Debts List */}
      <div className="debts-content">
        {filteredDebts.length === 0 ? (
          <EmptyState 
            icon="📋" 
            title="No transactions found" 
            description={
              selectedMember || startDate || endDate || filterType !== 'all'
                ? "No transactions match your current filters."
                : "This group doesn't have any transaction history yet."
            }
            actionButton={
              (selectedMember || startDate || endDate || filterType !== 'all') ? {
                text: "Clear Filters",
                onClick: clearFilters,
                variant: "secondary"
              } : undefined
            }
          />
        ) : (
          <div className="debts-list">
            {filteredDebts.map((debt, index) => {
              const icon = getDebtIcon(debt);
              const statusClass = getDebtStatusClass(debt);
              const description = getDebtDescription(debt);
              
              return (
                <div key={index} className={`debt-item ${statusClass}`}>
                  <div className="debt-icon">
                    {icon}
                  </div>

                  <div className="debt-details">
                    <div className="debt-main">
                      <h4 className="debt-title">{description.title}</h4>
                      <p className="debt-subtitle">{description.subtitle}</p>
                    </div>

                    <div className="debt-meta">
                      <span className="debt-date">
                        {balancesAPI.formatDate(debt.date)}
                      </span>
                      {debt.paymentMethod && (
                        <span className="debt-payment-method">
                          via {debt.paymentMethod}
                        </span>
                      )}
                      <span className={`debt-type ${debt.type}`}>
                        {debt.type === 'expense' ? 'Expense' : 'Settlement'}
                      </span>
                    </div>
                  </div>

                  <div className="debt-amount">
                    <div className={`amount ${statusClass}`}>
                      {balancesAPI.formatCurrency(debt.amount, debt.currency)}
                    </div>
                    <div className="debt-status">
                      {debt.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtsView;