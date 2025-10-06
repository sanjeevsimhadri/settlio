import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { settlementSchema, partialSettlementSchema } from '../../utils/balanceValidation';
import { balancesAPI, GroupSummary, CreateSettlementData, DebtRelationship } from '../../services/balancesAPI';
import { Group, User, GroupMember } from '../../services/groupsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../common';
import { Card, Badge, Avatar, LoadingButton } from '../ui';
import { CreationInfo } from '../common/CreationInfo';
import './Balances.css';
import './ModernBalances.css';

interface GroupBalancesProps {
  group: Group;
  onBack: () => void;
}

const GroupBalances: React.FC<GroupBalancesProps> = ({ group, onBack }) => {
  const { user: currentUser } = useAuth();
  const [groupSummary, setGroupSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isAddingSettlement, setIsAddingSettlement] = useState(false);
  const [isPartialSettling, setIsPartialSettling] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRelationship | null>(null);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'balances' | 'settlements'>('balances');

  // Form for new settlements
  const settlementForm = useForm({
    resolver: yupResolver(settlementSchema),
    defaultValues: {
      payerId: '',
      payeeId: '',
      amount: 0,
      description: ''
    }
  });

  // Form for partial settlements
  const partialForm = useForm({
    resolver: yupResolver(partialSettlementSchema),
    defaultValues: {
      amount: 0,
      description: ''
    }
  });

  // Load group balances on component mount
  useEffect(() => {
    loadGroupBalances(false);
  }, [group._id]);

  const loadGroupBalances = async (forceFresh = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Add cache-busting timestamp for fresh data
      const cacheBuster = forceFresh ? `?t=${Date.now()}` : '';
      console.log('Loading group balances', forceFresh ? 'with cache busting' : 'normally');
      
      const response = await balancesAPI.getGroupSummary(group._id, cacheBuster);
      setGroupSummary(response.data);
      
      console.log('Group summary loaded:', response.data);
    } catch (err: any) {
      console.error('Failed to load group balances:', err);
      setError(err.response?.data?.message || 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSettlement = async (data: any) => {
    console.log('Form submitted with data:', data);
    console.log('Group data:', group);
    
    setIsSubmitting(true);
    try {
      setSubmitError('');
      setSubmitSuccess('');
      
      // Validate required fields
      if (!data.payerId || !data.payeeId || !data.amount) {
        throw new Error('Please fill in all required fields');
      }

      if (data.payerId === data.payeeId) {
        throw new Error('Payer and payee cannot be the same person');
      }

      if (parseFloat(data.amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Find both payer and payee member details
      const payerMember = group.members.find(m => 
        (m.userId?._id === data.payerId) || (m.email === data.payerId)
      );
      
      const payeeMember = group.members.find(m => 
        (m.userId?._id === data.payeeId) || (m.email === data.payeeId)
      );

      if (!payerMember) {
        throw new Error('Invalid payer selected');
      }
      
      if (!payeeMember) {
        throw new Error('Invalid payee selected');
      }

      const settlementData: CreateSettlementData = {
        fromEmail: payerMember.email,
        fromUserId: payerMember.userId?._id || undefined,
        toEmail: payeeMember.email,
        toUserId: payeeMember.userId?._id || undefined,
        amount: parseFloat(data.amount),
        comments: data.description || `Settlement: ${payerMember.userId?.username || payerMember.email} paid ${payeeMember.userId?.username || payeeMember.email}`,
        currency: 'INR'
      };

      console.log('Sending settlement data:', settlementData);
      console.log('Group ID:', group._id);

      await balancesAPI.createSettlement(group._id, settlementData);
      setSubmitSuccess('Payment recorded successfully!');
      setIsAddingSettlement(false);
      settlementForm.reset();
      
      // Force fresh data fetch with cache busting
      console.log('Refreshing data after settlement creation...');
      
      // Clear any cached data by resetting the state first
      setGroupSummary(null);
      setLoading(true);
      
      // Wait a moment to ensure backend is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload with fresh data (force cache busting with timestamp)
      await loadGroupBalances(true);
      
      console.log('Data refresh completed after settlement');

      setTimeout(() => setSubmitSuccess(''), 3000);
    } catch (err: any) {
      console.error('Settlement error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to record payment';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitPartialSettlement = async (data: any) => {
    if (!selectedDebt) return;

    setIsSubmitting(true);
    try {
      setSubmitError('');
      setSubmitSuccess('');
      const settlementData: CreateSettlementData = {
        toEmail: selectedDebt.to.email,
        toUserId: selectedDebt.to._id,
        amount: parseFloat(data.amount),
        comments: data.description || `Partial payment: ${selectedDebt.from.username} to ${selectedDebt.to.username}`,
        currency: selectedDebt.currency
      };

      await balancesAPI.createSettlement(group._id, settlementData);
      setSubmitSuccess('Partial settlement recorded successfully!');
      setIsPartialSettling(false);
      setSelectedDebt(null);
      partialForm.reset();
      
      // Force fresh data reload
      setGroupSummary(null);
      await loadGroupBalances(true);

      setTimeout(() => setSubmitSuccess(''), 3000);
    } catch (err: any) {
      console.error('Partial settlement error:', err);
      setSubmitError(err.response?.data?.message || 'Failed to record partial settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartialSettle = (debt: DebtRelationship) => {
    setSelectedDebt(debt);
    setIsPartialSettling(true);
    partialForm.setValue('amount', debt.amount);
  };

  const handleSettleDebt = async (debt: DebtRelationship) => {
    if (!window.confirm(`Settle full amount of ${formatCurrency(debt.amount)} from ${debt.from.username} to ${debt.to.username}?`)) {
      return;
    }

    try {
      setSubmitError('');
      const settlementData: CreateSettlementData = {
        toEmail: debt.to.email,
        toUserId: debt.to._id,
        amount: debt.amount,
        comments: `Full settlement: ${debt.from.username} to ${debt.to.username}`,
        currency: debt.currency
      };

      await balancesAPI.createSettlement(group._id, settlementData);
      setSubmitSuccess('Debt settled successfully!');
      await loadGroupBalances();

      setTimeout(() => setSubmitSuccess(''), 3000);
    } catch (err: any) {
      console.error('Settlement error:', err);
      setSubmitError(err.response?.data?.message || 'Failed to settle debt');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'zero';
  };

  const getUserDisplayName = (user: User) => {
    return user._id === currentUser?.id ? `${user.username} (You)` : user.username;
  };

  const getMemberDisplayName = (member: GroupMember) => {
    if (member.userId) {
      return member.userId._id === currentUser?.id ? `${member.userId.username} (You)` : member.userId.username;
    } else {
      return member.email;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadGroupBalances} />;
  }

  return (
    <div className="group-balances-modern">
      {/* Modern Header */}
      <div className="modern-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div className="header-info">
            <h1 className="group-title">{group.name}</h1>
            <p className="group-subtitle">Balance Management • {group.members?.length || 0} members</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="action-btn primary"
            onClick={() => setIsAddingSettlement(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Record Payment
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {submitSuccess && (
        <div className="modern-alert success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          {submitSuccess}
        </div>
      )}

      {submitError && (
        <div className="modern-alert error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
          {submitError}
        </div>
      )}

      {/* Modern Tab Navigation */}
      <div className="modern-tabs">
        <button 
          className={`tab-btn ${activeTab === 'balances' ? 'active' : ''}`}
          onClick={() => setActiveTab('balances')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
          Balances & Debts
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settlements' ? 'active' : ''}`}
          onClick={() => setActiveTab('settlements')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          Settlement History
        </button>
      </div>

      {/* Content */}
      {!loading && !error && groupSummary && (
        <>
          {activeTab === 'balances' && (
            <div className="balance-content">
              {/* Summary Cards */}
              <div className="summary-grid">
                <div className="summary-card expenses">
                  <div className="card-header">
                    <h3 className="card-title">Total Expenses</h3>
                    <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                    </svg>
                  </div>
                  <h2 className="card-value">{formatCurrency(groupSummary.totalExpenses)}</h2>
                  <p className="card-subtitle">Across {group.members?.length || 0} members</p>
                </div>

                <div className="summary-card balance">
                  <div className="card-header">
                    <h3 className="card-title">Outstanding Debts</h3>
                    <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                    </svg>
                  </div>
                  <h2 className="card-value">
                    {groupSummary.simplifiedDebts.length}
                  </h2>
                  <p className="card-subtitle">
                    {groupSummary.simplifiedDebts.length === 1 ? 'active debt' : 'active debts'}
                  </p>
                </div>
              </div>

              {/* Member Balances Section */}
              <div className="member-balances-section">
                <div className="section-header">
                  <h3 className="section-title">Member Balances</h3>
                  <p className="section-subtitle">Individual balance breakdown for each group member</p>
                </div>
                <div className="member-grid">
                  {groupSummary.memberBalances.map((memberBalance) => (
                    <div key={memberBalance.user._id} className="member-card">
                      <div className="member-info">
                        <div className="member-avatar">
                          {memberBalance.user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-details">
                          <div className="member-name">
                            {getUserDisplayName(memberBalance.user)}
                          </div>
                          <div className="balance-breakdown">
                            <span>Owes: {formatCurrency(memberBalance.owes)}</span>
                            <span>•</span>
                            <span>Owed: {formatCurrency(memberBalance.owed)}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`net-balance ${getBalanceStatus(memberBalance.balance)}`}>
                        {memberBalance.balance === 0 && 'Settled'}
                        {memberBalance.balance > 0 && `+${formatCurrency(memberBalance.balance)}`}
                        {memberBalance.balance < 0 && formatCurrency(memberBalance.balance)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simplified Debts Section */}
              <div className="debts-section">
                <div className="section-header">
                  <h3 className="section-title">Simplified Debts</h3>
                  <p className="section-subtitle">Optimized payments to settle all group debts</p>
                </div>
                {groupSummary.simplifiedDebts.length === 0 ? (
                  <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <h3>All Settled!</h3>
                    <p>No outstanding debts between group members.</p>
                  </div>
                ) : (
                  <div className="debt-grid">
                    {groupSummary.simplifiedDebts.map((debt, index) => (
                      <div key={`debt-${index}`} className="debt-card">
                        <div className="debt-info">
                          <div className="debt-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/>
                            </svg>
                          </div>
                          <div className="debt-description">
                            <div className="debt-text">
                              {getUserDisplayName(debt.from)} owes {getUserDisplayName(debt.to)}
                            </div>
                            <div className="debt-meta">
                              Simplified payment • Settles all debts
                            </div>
                          </div>
                        </div>
                        <div className="debt-amount">{formatCurrency(debt.amount)}</div>
                        <div className="debt-actions">
                          {(debt.from._id === currentUser?.id || debt.to._id === currentUser?.id || group.admin._id === currentUser?.id) && (
                            <>
                              <button
                                className="action-btn small secondary"
                                onClick={() => handlePartialSettle(debt)}
                              >
                                Partial
                              </button>
                              <button
                                className="action-btn small primary"
                                onClick={() => handleSettleDebt(debt)}
                              >
                                Settle Full
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settlements' && (
            <div className="settlements-section">
              <div className="section-header">
                <h3 className="section-title">Settlement History</h3>
                <p className="section-subtitle">Track all payments made between group members</p>
              </div>
              {groupSummary.settlements.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <h3>No Settlements Yet</h3>
                  <p>No payments have been recorded between members. Use the "Record Payment" button to track settlements.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupSummary.settlements.map((settlement) => (
                    <Card key={settlement._id} variant="outlined" padding="medium">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <Avatar 
                                alt={settlement.fromUser?.username || settlement.fromEmail}
                                size="small"
                              />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {settlement.fromUser?.username || settlement.fromEmail}
                              </span>
                              <span className="text-sm text-gray-600">paid</span>
                              <Avatar 
                                alt={settlement.toUser?.username || settlement.toEmail}
                                size="small"
                              />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {settlement.toUser?.username || settlement.toEmail}
                              </span>
                            </div>
                            
                            {settlement.comments && (
                              <div className="text-sm text-gray-600">
                                {settlement.comments}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={settlement.status === 'completed' ? 'success' : 'warning'} 
                                size="small"
                              >
                                {settlement.status}
                              </Badge>
                              {settlement.paymentMethod && (
                                <Badge variant="secondary" size="small">
                                  {settlement.paymentMethod}
                                </Badge>
                              )}
                            </div>
                            
                            <CreationInfo
                              createdAt={settlement.createdAt}
                              createdBy={settlement.createdBy || settlement.fromUser}
                              users={group.members.map(m => m.userId).filter((user): user is NonNullable<typeof user> => user !== null)}
                              layout="compact"
                              size="small"
                              showRelativeTime={true}
                            />
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(settlement.amount)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!loading && !error && !groupSummary && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          <h3>No balance data found</h3>
          <p>No expenses have been added to this group yet. Add some expenses to see member balances and debts.</p>
        </div>
      )}

      {/* Add Settlement Modal */}
      {isAddingSettlement && (
        <div className="modal-overlay" onClick={() => setIsAddingSettlement(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record New Payment</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setIsAddingSettlement(false);
                  settlementForm.reset();
                  setSubmitError('');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={settlementForm.handleSubmit(onSubmitSettlement)}>
              {submitError && (
                <div className="modern-alert error" style={{marginBottom: '20px'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                  {submitError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="payerId">Who Paid? *</label>
                <select
                  id="payerId"
                  {...settlementForm.register('payerId')}
                  className={`form-select ${settlementForm.formState.errors.payerId ? 'error' : ''}`}
                >
                  <option value="">Select member</option>
                  {group.members.map((member) => (
                    <option key={member._id} value={member.userId?._id || member.email}>
                      {getMemberDisplayName(member)}
                    </option>
                  ))}
                </select>
                {settlementForm.formState.errors.payerId && (
                  <span className="error-message">{settlementForm.formState.errors.payerId.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="payeeId">Who Received Payment? *</label>
                <select
                  id="payeeId"
                  {...settlementForm.register('payeeId')}
                  className={`form-select ${settlementForm.formState.errors.payeeId ? 'error' : ''}`}
                >
                  <option value="">Select member</option>
                  {group.members.map((member) => (
                    <option key={member._id} value={member.userId?._id || member.email}>
                      {getMemberDisplayName(member)}
                    </option>
                  ))}
                </select>
                {settlementForm.formState.errors.payeeId && (
                  <span className="error-message">{settlementForm.formState.errors.payeeId.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="amount">Amount *</label>
                <div className="currency-input">
                  <span className="currency-symbol">₹</span>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...settlementForm.register('amount', { valueAsNumber: true })}
                    className={`form-input ${settlementForm.formState.errors.amount ? 'error' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {settlementForm.formState.errors.amount && (
                  <span className="error-message">{settlementForm.formState.errors.amount.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Description</label>
                <input
                  id="description"
                  type="text"
                  {...settlementForm.register('description')}
                  className={`form-input ${settlementForm.formState.errors.description ? 'error' : ''}`}
                  placeholder="Optional description"
                />
                {settlementForm.formState.errors.description && (
                  <span className="error-message">{settlementForm.formState.errors.description.message}</span>
                )}
              </div>

              <div className="btn-group">
                <button
                  type="button"
                  className="btn secondary"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsAddingSettlement(false);
                    settlementForm.reset();
                    setSubmitError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner"></span>
                      Recording...
                    </>
                  ) : (
                    'Record Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partial Settlement Modal */}
      {isPartialSettling && selectedDebt && (
        <div className="modal-overlay" onClick={() => setIsPartialSettling(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Partial Settlement</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setIsPartialSettling(false);
                  setSelectedDebt(null);
                  partialForm.reset();
                  setSubmitError('');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <p style={{marginBottom: '24px', color: '#6b7280'}}>
              {selectedDebt.from.username} owes {selectedDebt.to.username} {formatCurrency(selectedDebt.amount)}
            </p>

            <form onSubmit={partialForm.handleSubmit(onSubmitPartialSettlement)}>
              <div className="form-group">
                <label className="form-label" htmlFor="partial-amount">Amount Being Paid *</label>
                <div className="currency-input">
                  <span className="currency-symbol">₹</span>
                  <input
                    id="partial-amount"
                    type="number"
                    step="0.01"
                    max={selectedDebt.amount}
                    {...partialForm.register('amount')}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
                <small style={{color: '#6b7280', fontSize: '12px'}}>
                  Maximum: {formatCurrency(selectedDebt.amount)}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="partial-description">Description</label>
                <input
                  id="partial-description"
                  type="text"
                  {...partialForm.register('description')}
                  className="form-input"
                  placeholder="Optional description"
                />
              </div>

              <div className="btn-group">
                <button
                  type="button"
                  className="btn secondary"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsPartialSettling(false);
                    setSelectedDebt(null);
                    partialForm.reset();
                    setSubmitError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner"></span>
                      Recording...
                    </>
                  ) : (
                    'Record Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupBalances;