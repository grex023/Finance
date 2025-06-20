import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Calendar, RefreshCw, Trash2 } from 'lucide-react';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import { Account, Transaction, RecurringPayment } from '@/contexts/AccountContext';
import { useProjectedBalance } from './ProjectedBalanceCalculator';
import { fetchTrading212Data } from '@/services/api';

interface AccountDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export const AccountDetailDialog = ({ open, onOpenChange, account }: AccountDetailDialogProps) => {
  const { transactions, recurringPayments, updateAccount, deleteAccount, refreshData, addTransaction, deleteRecurringPayment, addRecurringPayment } = useAccount();
  const { toast } = useToast();
  const projectedBalance = useProjectedBalance(account);

  if (!account) return null;

  // Get last 5 transactions for this account
  const accountTransactions = transactions
    .filter(transaction => transaction.accountId === account.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Get recurring payments for the next week for this account
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingRecurringPayments = recurringPayments.filter(payment => payment.accountId === account.id && new Date(payment.nextPaymentDate) <= nextWeek);

  // Add Pay/Skip handlers (re-implement if not available as props)
  const handlePaymentPaid = (payment) => {
    addTransaction({
      accountId: payment.accountId,
      amount: payment.amount,
      description: payment.name,
      category: payment.category,
      date: new Date(),
      type: 'expense',
    });
    deleteRecurringPayment(payment.id);
    // Create the next payment
    const nextPaymentDate = new Date(payment.nextPaymentDate);
    if (payment.frequency === 'weekly') nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
    if (payment.frequency === 'monthly') nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    if (payment.frequency === 'yearly') nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
    addRecurringPayment({ ...payment, nextPaymentDate });
  };
  const handlePaymentSkipped = (payment) => {
    deleteRecurringPayment(payment.id);
    // Create the next payment
    const nextPaymentDate = new Date(payment.nextPaymentDate);
    if (payment.frequency === 'weekly') nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
    if (payment.frequency === 'monthly') nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    if (payment.frequency === 'yearly') nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
    addRecurringPayment({ ...payment, nextPaymentDate });
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRefreshTrading212 = async () => {
    if (!account.apiKey || !account.pieId) return;

    try {
      console.log('Refreshing Trading 212 data for account:', account.id);
      
      const data = await fetchTrading212Data(account.apiKey, account.pieId);
      
      // Extract the updated data using the correct field structure
      const balance = data.instruments?.[0]?.result?.priceAvgValue || account.balance;
      const result = data.instruments?.[0]?.result?.priceAvgResult || account.tradingResult;

      // Update the account in the database and UI state
      await updateAccount(account.id, {
        balance,
        tradingResult: result,
        order: account.order,
      });

      // Force a refresh of the accounts from the database
      await refreshData();

      toast({
        title: "Success",
        description: "Trading 212 data refreshed successfully!",
      });
    } catch (error) {
      console.error('Trading 212 refresh error:', error);
      
      toast({
        title: "Refresh Failed",
        description: error.message.includes('security restrictions') 
          ? "API refresh failed due to security restrictions. You can update the data manually by editing the account."
          : "Failed to refresh Trading 212 data. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteAccount(account.id);
      toast({
        title: "Success",
        description: "Account deleted successfully!",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive",
      });
    }
  };

  const isTrading212Account = account.type === 'investment' && account.apiKey && account.pieId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="capitalize">{account.type} Account</span>
            <span className="text-gray-500">•</span>
            <span>{account.name}</span>
            <div className="ml-auto flex gap-2">
              {isTrading212Account && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshTrading212}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAccount}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Balance</span>
                <span className="text-2xl font-bold">£{account.balance.toFixed(2)}</span>
              </div>
              {account.frequency && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Projected Balance</span>
                  <span className={`text-xl font-semibold ${
                    projectedBalance > account.balance ? 'text-green-600' : 
                    projectedBalance < account.balance ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    £{projectedBalance.toFixed(2)}
                  </span>
                </div>
              )}
              {account.tradingResult !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trading Result</span>
                  <span className={`font-medium ${account.tradingResult < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {account.tradingResult < 0 ? '' : '+'}£{account.tradingResult.toFixed(2)}
                  </span>
                </div>
              )}
              {account.interestRate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Interest Rate</span>
                  <span className="text-green-600 font-medium">{account.interestRate}%</span>
                </div>
              )}
              {account.frequency && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reset Frequency</span>
                  <span className="capitalize">{account.frequency}</span>
                </div>
              )}
              {account.resetDay && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reset Day</span>
                  <span>{account.resetDay}</span>
                </div>
              )}
              {account.apiKey && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trading 212</span>
                  <span className="text-green-600 text-sm">Connected</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Recent Transactions (Last 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accountTransactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions yet</p>
                ) : (
                  accountTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getTransactionTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{transaction.category}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}£{transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Recurring Payments */}
          {upcomingRecurringPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Recurring Payments (Next 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingRecurringPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 border-orange-200">
                      <div>
                        <p className="font-medium">{payment.name}</p>
                        <p className="text-sm text-gray-600">{payment.category}</p>
                        <p className="text-xs text-gray-500">
                          Due: {payment.nextPaymentDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600">
                          £{payment.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{payment.frequency}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => handlePaymentPaid(payment)}>✓ Paid</Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePaymentSkipped(payment)}>✗ Skip</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
