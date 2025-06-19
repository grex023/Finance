import React from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { WealthDashboard } from './WealthDashboard';
import { AccountsSection } from './AccountsSection';
import { TransactionsSection } from './TransactionsSection';
import { RecurringPaymentsSection } from './RecurringPaymentsSection';
import { DebtsSection } from './DebtsSection';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Dashboard = () => {
  const { loading, error, retryConnection } = useAccount();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorState error={error} onRetry={retryConnection} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full overflow-x-auto whitespace-nowrap flex sm:grid sm:grid-cols-5 gap-1 scrollbar-hide">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="payments">Recurring</TabsTrigger>
            <TabsTrigger value="debts">Debts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <WealthDashboard />
          </TabsContent>
          
          <TabsContent value="accounts" className="mt-6">
            <AccountsSection />
          </TabsContent>
          
          <TabsContent value="transactions" className="mt-6">
            <TransactionsSection />
          </TabsContent>
          
          <TabsContent value="payments" className="mt-6">
            <RecurringPaymentsSection />
          </TabsContent>
          
          <TabsContent value="debts" className="mt-6">
            <DebtsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
