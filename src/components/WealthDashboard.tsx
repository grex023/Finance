import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Percent, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useAccount } from '@/contexts/AccountContext';
import FinanceChat from './FinanceChat';
import { Button } from '@/components/ui/button';

export const WealthDashboard = () => {
  const { accounts, debts, transactions, recurringPayments, addTransaction, deleteRecurringPayment, addRecurringPayment, getTotalWealth, getTotalRetirement, getTotalDebt, getNetWorth, getTotalAvailableCredit } = useAccount();

  const totalWealth = getTotalWealth();
  const totalRetirement = getTotalRetirement();
  const totalDebt = getTotalDebt();
  const netWorth = getNetWorth();
  const totalAvailableCredit = getTotalAvailableCredit();

  // Calculate savings interest from actual interest transactions only
  const getSavingsInterestFromTransactions = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Financial year runs from April to March
    let financialYearStart: Date;
    if (currentMonth >= 3) { // April onwards (months 3-11)
      financialYearStart = new Date(currentYear, 3, 1); // April 1st current year
    } else { // January to March (months 0-2)
      financialYearStart = new Date(currentYear - 1, 3, 1); // April 1st previous year
    }
    
    // Filter transactions for interest payments within the financial year
    const interestTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transaction.category.toLowerCase().includes('interest') &&
        transaction.type === 'income' &&
        transactionDate >= financialYearStart &&
        transactionDate <= now
      );
    });
    
    return interestTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  };

  const savingsInterestForYear = getSavingsInterestFromTransactions();

  const wealthByType = accounts
    .filter(account => account.type !== 'retirement')
    .reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + account.balance;
      return acc;
    }, {} as Record<string, number>);

  const retirementAccounts = accounts.filter(account => account.type === 'retirement');

  const debtByType = debts
    .filter(debt => debt.balance > 0)
    .reduce((acc, debt) => {
      acc[debt.type] = (acc[debt.type] || 0) + debt.balance;
      return acc;
    }, {} as Record<string, number>);

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'current':
        return 'Current Accounts';
      case 'savings':
        return 'Savings Accounts';
      case 'investment':
        return 'Investment Accounts';
      case 'crypto':
        return 'Crypto Accounts';
      default:
        return type;
    }
  };

  const getDebtTypeName = (type: string) => {
    switch (type) {
      case 'credit_card':
        return 'Credit Cards';
      case 'loan':
        return 'Loans';
      case 'car_payment':
        return 'Car Payments';
      case 'mortgage':
        return 'Mortgages';
      default:
        return type;
    }
  };

  const summaryCards = [
    {
      title: "Total Wealth",
      value: totalWealth,
      icon: TrendingUp,
      colors: "border-green-200 bg-green-50 text-green-800 text-green-600 text-green-900"
    },
    {
      title: "Retirement",
      value: totalRetirement,
      icon: PiggyBank,
      colors: "border-blue-200 bg-blue-50 text-blue-800 text-blue-600 text-blue-900"
    },
    {
      title: "Available Credit",
      value: totalAvailableCredit,
      icon: CreditCard,
      colors: "border-orange-200 bg-orange-50 text-orange-800 text-orange-600 text-orange-900"
    },
    {
      title: "Savings Interest",
      value: savingsInterestForYear,
      icon: Percent,
      colors: "border-yellow-200 bg-yellow-50 text-yellow-800 text-yellow-600 text-yellow-900"
    },
    {
      title: "Total Debt",
      value: totalDebt,
      icon: TrendingDown,
      colors: "border-red-200 bg-red-50 text-red-800 text-red-600 text-red-900"
    },
    {
      title: "Net Worth",
      value: netWorth,
      icon: DollarSign,
      colors: netWorth >= 0 
        ? "border-purple-200 bg-purple-50 text-purple-800 text-purple-600 text-purple-900"
        : "border-orange-200 bg-orange-50 text-orange-800 text-orange-600 text-orange-900"
    }
  ];

  // Helper to get account name by ID
  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  // Helper to get next payment date
  const getNextPaymentDate = (frequency, currentDate) => {
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

  // Payment handlers
  const handlePaymentPaid = (payment) => {
    addTransaction({
      accountId: payment.accountId,
      amount: payment.amount,
      description: payment.name,
      category: payment.category,
      date: new Date(),
      type: payment.type,
    });
    deleteRecurringPayment(payment.id);
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
  const handlePaymentSkipped = (payment) => {
    deleteRecurringPayment(payment.id);
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

  // Get upcoming payments (next 7 days)
  const today = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(today.getDate() + 7);
  const upcomingPayments = recurringPayments.filter(payment => new Date(payment.nextPaymentDate) <= weekFromNow);

  return (
    <div className="space-y-8 relative pb-32">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Wealth Dashboard</h3>
        <p className="text-gray-600">Overview of your financial position</p>
      </div>

      {/* Summary Cards Carousel */}
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-1">
            {summaryCards.map((card, index) => {
              const colorClasses = card.colors.split(' ');
              return (
                <CarouselItem key={index} className="pl-1 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/6">
                  <Card className={`${colorClasses[0]} ${colorClasses[1]} border-2`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className={`text-sm font-medium ${colorClasses[2]}`}>{card.title}</CardTitle>
                      <card.icon className={`h-4 w-4 ${colorClasses[3]}`} />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${colorClasses[4]}`}>£{card.value.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Add Upcoming Payments section below summary cards and above breakdown */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-orange-800">Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length > 0 ? (
              upcomingPayments.map(payment => (
                <div key={payment.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <p className="font-medium">{payment.name} <span className={`ml-2 text-xs font-semibold rounded px-2 py-1 ${payment.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{payment.type === 'income' ? 'Income' : 'Expense'}</span></p>
                      <p className="text-xs text-gray-600">Due: {new Date(payment.nextPaymentDate).toLocaleDateString()} | Account: {getAccountName(payment.accountId)}</p>
                    </div>
                    <span className="text-orange-600 font-semibold">£{payment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => handlePaymentPaid(payment)}>✓ Paid</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePaymentSkipped(payment)}>✗ Skip</Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 italic text-sm">No upcoming payments in the next 7 days.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wealth Breakdown Carousel (3 overview cards) */}
      <div className="w-full mt-6">
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-1">
            {/* Liquid Wealth Overview Card */}
            <CarouselItem className="pl-1 basis-full sm:basis-1/2 lg:basis-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-800">Liquid Wealth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(wealthByType).map(([type, amount]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{getAccountTypeName(type)}</span>
                        <span className="font-semibold text-green-600">£{amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.keys(wealthByType).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No liquid accounts yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
            {/* Retirement Accounts Overview Card */}
            <CarouselItem className="pl-1 basis-full sm:basis-1/2 lg:basis-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800">Retirement Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {retirementAccounts.map((account) => (
                      <div key={account.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{account.name}</span>
                        <span className="font-semibold text-blue-600">£{account.balance.toFixed(2)}</span>
                      </div>
                    ))}
                    {retirementAccounts.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No retirement accounts yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
            {/* Active Debts Overview Card */}
            <CarouselItem className="pl-1 basis-full sm:basis-1/2 lg:basis-1/3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-800">Active Debts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(debtByType).map(([type, amount]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{getDebtTypeName(type)}</span>
                        <span className="font-semibold text-red-600">£{amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.keys(debtByType).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No active debts</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
      <FinanceChat />
    </div>
  );
};
