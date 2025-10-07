import React, { useState, useEffect } from 'react';
import { balancesAPI, Balance, BalancesResponse } from '../../services/balancesAPI';
import { Group } from '../../services/groupsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../common';
import SettlementForm from './SettlementForm';
import './Balances.css';

interface BalancesViewProps {
  group: Group;
  onBack: () => void;
}

const BalancesView: React.FC<BalancesViewProps> = ({ group, onBack }) => {
  const { user } = useAuth();
  const [balancesData, setBalancesData] = useState<BalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Balance | null>(null);
  const [showSettlementForm, setShowSettlementForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    loadBalances();
  }, [group._id]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await balancesAPI.getGroupBalances(group._id);
      setBalancesData(response.data);
    } catch (error: any) {
      setError(error.error || 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  const handleSettleUp = (balance: Balance) => {
    // Only allow settling if user owes money (negative balance means user owes)
    if (balance.balanceAmount >= 0) {
      return; // User doesn't owe this person
    }
    
    setSelectedMember(balance);
    setShowSettlementForm(true);
  };

  const handleSettlementSuccess = () => {
    setShowSettlementForm(false);
    setSelectedMember(null);
    setSuccessMessage('Settlement recorded successfully!');
    loadBalances(); // Reload balances
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSettlementCancel = () => {
    setShowSettlementForm(false);
    setSelectedMember(null);
  };

  const getBalanceDisplay = (balance: Balance) => {
    const amount = Math.abs(balance.balanceAmount);
    const status = balancesAPI.getBalanceStatus(balance.balanceAmount);
    const formattedAmount = balancesAPI.formatCurrency(amount, balance.currency);
    
    return {
      amount: formattedAmount,
      status: status.text,
      type: status.type,
      canSettle: balance.balanceAmount < 0 // User owes money
    };
  };

  const getTotalBalanceDisplay = () => {
    if (!balancesData) return { amount: '$0.00', status: 'settled', type: 'settled' as const };
    
    const amount = Math.abs(balancesData.totalNetBalance);
    const status = balancesAPI.getBalanceStatus(balancesData.totalNetBalance);
    const formattedAmount = balancesAPI.formatCurrency(amount, balancesData.currency);
    
    return {
      amount: formattedAmount,
      status: status.text,
      type: status.type
    };
  };

  if (loading) {
    return (
      <div className="balances-view">
        <div className="balances-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Group
          </button>
          <h1>{group.name} - Balances</h1>
        </div>
        <LoadingSpinner message="Loading balances..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="balances-view">
        <div className="balances-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Group
          </button>
          <h1>{group.name} - Balances</h1>
        </div>
        <ErrorMessage message={error} onRetry={loadBalances} />
      </div>
    );
  }

  const totalBalance = getTotalBalanceDisplay();

  return (
    <div className="balances-view">
      <div className="modern-balances-header">
        <button className="modern-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="header-content">
          <div className="header-title-section">
            <h2 className="modern-balances-title">Group Balances</h2>
            <p className="modern-balances-subtitle">Track member balances and settlements with {group.name}</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{balancesData?.balances.length || 0}</div>
              <div className="stat-label">Active Balances</div>
            </div>
            <div className="stat-card">
              <div className={`stat-value ${totalBalance.type}`}>
                {totalBalance.amount}
              </div>
              <div className="stat-label">Your Balance</div>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="alert success">
          {successMessage}
        </div>
      )}

      {/* Total Balance Summary */}
      <div className="total-balance-card">
        <div className="balance-summary">
          <h2>Your Total Balance</h2>
          <div className={`balance-amount ${totalBalance.type}`}>
            {totalBalance.amount}
          </div>
          <div className={`balance-status ${totalBalance.type}`}>
            {totalBalance.type === 'settled' 
              ? 'You are all settled up!' 
              : `Overall, you ${totalBalance.status}`
            }
          </div>
        </div>
      </div>

      {/* Individual Balances */}
      <div className="balances-content">
        {!balancesData || balancesData.balances.length === 0 ? (
          <EmptyState 
            icon="💰" 
            title="All settled up!" 
            description="You don't owe anyone and no one owes you money in this group."
          />
        ) : (
          <div className="balances-list">
            <h3>Individual Balances</h3>
            {balancesData.balances.map((balance, index) => {
              const display = getBalanceDisplay(balance);
              
              return (
                <div key={index} className="balance-item">
                  <div className="member-info">
                    <div className="member-avatar">
                      {balance.memberName.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-details">
                      <h4 className="member-name">
                        {balance.memberName}
                        {balance.status === 'invited' && (
                          <span className="invited-badge">Pending</span>
                        )}
                      </h4>
                      <p className="member-email">{balance.memberEmail}</p>
                    </div>
                  </div>

                  <div className="balance-info">
                    <div className={`balance-amount ${display.type}`}>
                      {display.amount}
                    </div>
                    <div className={`balance-text ${display.type}`}>
                      {display.status}
                    </div>
                  </div>

                  <div className="balance-actions">
                    {display.canSettle && (
                      <button
                        className="button primary small"
                        onClick={() => handleSettleUp(balance)}
                      >
                        Settle Up
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settlement Form Modal */}
      {showSettlementForm && selectedMember && (
        <SettlementForm
          group={group}
          memberBalance={selectedMember}
          onSuccess={handleSettlementSuccess}
          onCancel={handleSettlementCancel}
        />
      )}
    </div>
  );
};

export default BalancesView;