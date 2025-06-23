import React, { useState } from 'react';
import { Plus, ArrowUpDown, Calendar, ChevronDown, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useAccount } from '@/contexts/AccountContext';
import { AddTransactionDialog } from './AddTransactionDialog';

export const TransactionsSection = () => {
  const { transactions, accounts, deleteTransaction } = useAccount();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(10);

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
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

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Filter by selected date if one is chosen
  const filteredTransactions = selectedDate 
    ? sortedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.toDateString() === selectedDate.toDateString();
      })
    : sortedTransactions;

  const visibleTransactions = filteredTransactions.slice(0, visibleCount);
  const hasMore = filteredTransactions.length > visibleCount;

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    setVisibleCount(10);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Transactions</h3>
          <p className="text-gray-600">
            {selectedDate 
              ? `Transactions for ${format(selectedDate, 'PPP')} (${filteredTransactions.length} found)`
              : `Recent transactions (${transactions.length} total)`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                {selectedDate ? format(selectedDate, 'PPP') : 'Filter by date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-3 pointer-events-auto"
              />
              {selectedDate && (
                <div className="p-3 border-t">
                  <Button size="sm" variant="outline" onClick={clearDateFilter} className="w-full">
                    Clear Filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          <Button onClick={() => setShowAddTransaction(true)} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            {selectedDate ? 'Filtered Transactions' : 'Recent Transactions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visibleTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {selectedDate ? 'No transactions found for this date.' : 'No transactions yet. Add your first transaction!'}
              </p>
            ) : (
              <>
                {visibleTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge className={getTransactionTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {getAccountName(transaction.accountId)} • {transaction.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}£{transaction.amount.toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-600 p-1 h-8 w-8"
                        onClick={() => deleteTransaction(transaction.id)}
                        title="Undo Transaction"
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={handleShowMore}>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show More ({filteredTransactions.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AddTransactionDialog open={showAddTransaction} onOpenChange={setShowAddTransaction} />
    </div>
  );
};
