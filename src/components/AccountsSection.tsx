import React, { useState, useEffect } from 'react';
import { Plus, Banknote, CreditCard, ArrowLeftRight, Bitcoin, Check, X, Edit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccount } from '@/contexts/AccountContext';
import { AddAccountDialog } from './AddAccountDialog';
import { EditAccountDialog } from './EditAccountDialog';
import { AccountDetailDialog } from './AccountDetailDialog';
import { TransferDialog } from './TransferDialog';
import { Account } from '@/contexts/AccountContext';
import { toast } from '@/components/ui/use-toast';
import { fetchTrading212Data } from '@/services/api';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useIsMobile } from '../hooks/use-mobile';

export const AccountsSection = () => {
  const { accounts, recurringPayments, addTransaction, deleteRecurringPayment, addRecurringPayment, updateAccount, refreshData } = useAccount();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAccountDetail, setShowAccountDetail] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [projectedBalances, setProjectedBalances] = useState<Record<string, number>>({});
  const isMobile = useIsMobile();

  // Calculate projected balances for all accounts
  useEffect(() => {
    const newProjectedBalances: Record<string, number> = {};
    
    accounts.forEach(account => {
      if (!account.frequency) {
        newProjectedBalances[account.id] = account.balance;
        return;
      }

      const now = new Date();
      let endDate: Date;
      
      // Calculate end date based on account's frequency and reset day
      if (account.frequency === 'monthly') {
        const resetDayNum = account.resetDay || 1;
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Find next reset date
        let nextResetDate = new Date(currentYear, currentMonth, resetDayNum);
        if (nextResetDate <= now) {
          nextResetDate = new Date(currentYear, currentMonth + 1, resetDayNum);
        }
        
        endDate = nextResetDate;
      } else if (account.frequency === 'weekly') {
        const daysUntilSunday = (7 - now.getDay()) % 7;
        endDate = new Date(now.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000);
      } else {
        // Daily - until end of day
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      }

      let income = 0;
      let expenses = 0;

      recurringPayments.forEach(payment => {
        const paymentDate = new Date(payment.nextPaymentDate);
        
        // Only include payments that fall before the next reset date
        if (paymentDate <= endDate) {
          if (payment.type === 'income') {
            income += payment.amount;
          } else {
            expenses += payment.amount;
          }
        }
      });

      newProjectedBalances[account.id] = account.balance + income - expenses;
    });

    setProjectedBalances(newProjectedBalances);
  }, [accounts, recurringPayments]);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'current':
        return <CreditCard className="h-5 w-5" />;
      case 'savings':
        return <Banknote className="h-5 w-5" />;
      case 'investment':
        return <ArrowLeftRight className="h-5 w-5" />;
      case 'retirement':
        return <Banknote className="h-5 w-5" />;
      case 'crypto':
        return <Bitcoin className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'current':
        return 'from-blue-500 to-blue-600';
      case 'savings':
        return 'from-green-500 to-green-600';
      case 'investment':
        return 'from-purple-500 to-purple-600';
      case 'retirement':
        return 'from-orange-500 to-orange-600';
      case 'crypto':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  const getNextPaymentDate = (frequency: string, currentDate: Date) => {
    const nextDate = new Date(currentDate);
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    return nextDate;
  };

  const calculateProjectedMonthlyInterest = (account: any) => {
    if (account.type !== 'savings' || !account.interestRate) return 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;
    
    const dailyInterestRate = (account.interestRate / 100) / 365;
    const projectedInterest = account.balance * dailyInterestRate * daysRemaining;
    
    return projectedInterest;
  };

  const handlePaymentPaid = (payment: any) => {
    // Add transaction to the account with correct type
    addTransaction({
      accountId: payment.accountId,
      amount: payment.amount,
      description: payment.name,
      category: payment.category,
      date: new Date(),
      type: payment.type, // Use the payment's type: 'income' or 'expense'
    });

    // Remove the current payment
    deleteRecurringPayment(payment.id);

    // Create the next payment
    const nextPaymentDate = getNextPaymentDate(payment.frequency, payment.nextPaymentDate);
    addRecurringPayment({
      name: payment.name,
      amount: payment.amount,
      frequency: payment.frequency,
      category: payment.category,
      type: payment.type,
      nextPaymentDate,
      accountId: payment.accountId,
    });
  };

  const handlePaymentSkipped = (payment: any) => {
    // Remove the current payment
    deleteRecurringPayment(payment.id);

    // Create the next payment
    const nextPaymentDate = getNextPaymentDate(payment.frequency, payment.nextPaymentDate);
    addRecurringPayment({
      name: payment.name,
      amount: payment.amount,
      frequency: payment.frequency,
      category: payment.category,
      type: payment.type,
      nextPaymentDate,
      accountId: payment.accountId,
    });
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowEditAccount(true);
  };

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setShowAccountDetail(true);
  };

  const handleRefreshInvestment = async (account: Account) => {
    if (!account.apiKey || !account.pieId) return;
    try {
      const data = await fetchTrading212Data(account.apiKey, account.pieId);
      const balance = data.instruments?.[0]?.result?.priceAvgValue || account.balance;
      const result = data.instruments?.[0]?.result?.priceAvgResult || account.tradingResult;
      // Send all required fields to backend
      await updateAccount(account.id, {
        name: account.name,
        type: account.type,
        balance,
        interestRate: account.interestRate,
        apiKey: account.apiKey,
        frequency: account.frequency,
        resetDay: account.resetDay,
        pieId: account.pieId,
        tradingResult: result,
        order: account.order,
      });
      await refreshData();
      toast({
        title: 'Success',
        description: 'Trading 212 balance refreshed!',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh Trading 212 balance.',
        variant: 'destructive',
      });
    }
  };

  // Get upcoming payments (payments due within the next 7 days)
  const upcomingPayments = recurringPayments.filter(payment => {
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    return payment.nextPaymentDate <= weekFromNow;
  });

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  // Sort accounts by order before rendering
  const sortedAccounts = [...accounts].sort((a, b) => a.order - b.order);

  // Only show banking accounts (current, savings, investment, retirement, crypto)
  const bankingAccounts = sortedAccounts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Accounts</h3>
          <p className="text-gray-600">Total Balance: £{totalBalance.toFixed(2)}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddAccount(true)} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
          <Button onClick={() => setShowTransfer(true)} variant="outline">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transfer
          </Button>
        </div>
      </div>

      {/* Responsive: Carousel on mobile, grid on desktop */}
      {isMobile ? (
        <div className="flex overflow-x-auto gap-4 pb-2">
          {bankingAccounts.map(account => (
            <div key={account.id} className="min-w-[260px] max-w-xs flex-shrink-0" onClick={() => handleAccountClick(account)}>
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`bg-gradient-to-r ${getAccountColor(account.type)} p-2 rounded-lg text-white`}>
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="text-right flex-1 ml-3">
                      <CardTitle className="text-lg capitalize">{account.type}</CardTitle>
                      <p className="text-sm text-gray-500">{account.name}</p>
                    </div>
                    <div className="flex gap-1">
                      {account.type === 'investment' && account.apiKey && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={e => { e.stopPropagation(); handleRefreshInvestment(account); }}
                          className="p-1 h-8 w-8"
                          title="Refresh balance from Trading 212"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={e => { e.stopPropagation(); handleEditAccount(account); }}
                        className="p-1 h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Balance</span>
                      <span className="text-lg font-semibold">£{account.balance.toFixed(2)}</span>
                    </div>
                    {account.type === 'current' && account.frequency && recurringPayments.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Projected Balance</span>
                        <span className={`text-sm font-medium ${(projectedBalances[account.id] || account.balance) >= account.balance ? 'text-green-600' : 'text-red-600'}`}>£{(projectedBalances[account.id] || account.balance).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                {/* Upcoming Payments for this account */}
                <div className="mt-2">
                  <h4 className="text-md font-semibold mb-1">Upcoming Payments</h4>
                  {recurringPayments.filter(payment => payment.accountId === account.id && new Date(payment.nextPaymentDate) <= new Date(Date.now() + 7*24*60*60*1000)).length > 0 ? (
                    recurringPayments.filter(payment => payment.accountId === account.id && new Date(payment.nextPaymentDate) <= new Date(Date.now() + 7*24*60*60*1000)).map(payment => (
                      <div key={payment.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <p className="font-medium">{payment.name}</p>
                            <p className="text-xs text-gray-600">Due: {new Date(payment.nextPaymentDate).toLocaleDateString()}</p>
                          </div>
                          <span className="text-orange-600 font-semibold">£{payment.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={e => { e.stopPropagation(); handlePaymentPaid(payment); }}>✓ Paid</Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={e => { e.stopPropagation(); handlePaymentSkipped(payment); }}>✗ Skip</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic text-sm">No upcoming payments in the next 7 days.</div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {bankingAccounts.map(account => (
            <div key={account.id} onClick={() => handleAccountClick(account)}>
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`bg-gradient-to-r ${getAccountColor(account.type)} p-2 rounded-lg text-white`}>
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="text-right flex-1 ml-3">
                      <CardTitle className="text-lg capitalize">{account.type}</CardTitle>
                      <p className="text-sm text-gray-500">{account.name}</p>
                    </div>
                    <div className="flex gap-1">
                      {account.type === 'investment' && account.apiKey && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={e => { e.stopPropagation(); handleRefreshInvestment(account); }}
                          className="p-1 h-8 w-8"
                          title="Refresh balance from Trading 212"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={e => { e.stopPropagation(); handleEditAccount(account); }}
                        className="p-1 h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Balance</span>
                      <span className="text-lg font-semibold">£{account.balance.toFixed(2)}</span>
                    </div>
                    {account.type === 'current' && account.frequency && recurringPayments.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Projected Balance</span>
                        <span className={`text-sm font-medium ${(projectedBalances[account.id] || account.balance) >= account.balance ? 'text-green-600' : 'text-red-600'}`}>£{(projectedBalances[account.id] || account.balance).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                {/* Upcoming Payments for this account */}
                <div className="mt-2">
                  <h4 className="text-md font-semibold mb-1">Upcoming Payments</h4>
                  {recurringPayments.filter(payment => payment.accountId === account.id && new Date(payment.nextPaymentDate) <= new Date(Date.now() + 7*24*60*60*1000)).length > 0 ? (
                    recurringPayments.filter(payment => payment.accountId === account.id && new Date(payment.nextPaymentDate) <= new Date(Date.now() + 7*24*60*60*1000)).map(payment => (
                      <div key={payment.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <p className="font-medium">{payment.name}</p>
                            <p className="text-xs text-gray-600">Due: {new Date(payment.nextPaymentDate).toLocaleDateString()}</p>
                          </div>
                          <span className="text-orange-600 font-semibold">£{payment.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={e => { e.stopPropagation(); handlePaymentPaid(payment); }}>✓ Paid</Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={e => { e.stopPropagation(); handlePaymentSkipped(payment); }}>✗ Skip</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic text-sm">No upcoming payments in the next 7 days.</div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <AddAccountDialog open={showAddAccount} onOpenChange={setShowAddAccount} />
      <EditAccountDialog open={showEditAccount} onOpenChange={setShowEditAccount} account={editingAccount} />
      <AccountDetailDialog open={showAccountDetail} onOpenChange={setShowAccountDetail} account={selectedAccount} />
      <TransferDialog open={showTransfer} onOpenChange={setShowTransfer} />
    </div>
  );
};