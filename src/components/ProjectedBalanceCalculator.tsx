
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccount } from '@/contexts/AccountContext';
import { Calendar, TrendingDown, TrendingUp } from 'lucide-react';

interface ProjectedBalanceCalculatorProps {
  initialBalance: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  resetDay?: number;
  onProjectedBalanceChange?: (balance: number) => void;
  showCard?: boolean;
}

export const ProjectedBalanceCalculator = ({ 
  initialBalance,
  frequency,
  resetDay,
  onProjectedBalanceChange,
  showCard = true 
}: ProjectedBalanceCalculatorProps) => {
  const { recurringPayments } = useAccount();
  const [projectedBalance, setProjectedBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    calculateProjectedBalance();
  }, [initialBalance, recurringPayments, frequency, resetDay]);

  useEffect(() => {
    if (onProjectedBalanceChange) {
      onProjectedBalanceChange(projectedBalance);
    }
  }, [projectedBalance, onProjectedBalanceChange]);

  const calculateProjectedBalance = () => {
    const now = new Date();
    let endDate: Date;
    
    // Calculate end date based on frequency and reset day
    if (frequency === 'monthly') {
      const resetDayNum = resetDay || 1;
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Find next reset date
      let nextResetDate = new Date(currentYear, currentMonth, resetDayNum);
      if (nextResetDate <= now) {
        nextResetDate = new Date(currentYear, currentMonth + 1, resetDayNum);
      }
      
      endDate = nextResetDate;
    } else if (frequency === 'weekly') {
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

    setTotalIncome(income);
    setTotalExpenses(expenses);
    setProjectedBalance(initialBalance + income - expenses);
  };

  const getBalanceColor = () => {
    if (projectedBalance > initialBalance) return 'text-green-600';
    if (projectedBalance < initialBalance) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceIcon = () => {
    if (projectedBalance > initialBalance) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (projectedBalance < initialBalance) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Calendar className="h-5 w-5 text-gray-600" />;
  };

  const getFrequencyText = () => {
    switch (frequency) {
      case 'daily':
        return 'End of Day';
      case 'weekly':
        return 'End of Week';
      case 'monthly':
        return `${resetDay || 1}${getOrdinalSuffix(resetDay || 1)} of Month`;
      default:
        return 'Next Reset';
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  if (!showCard) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {getBalanceIcon()}
          Projected Balance ({getFrequencyText()})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Starting Balance:</span>
            <span className="font-medium">£{initialBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-green-600">Expected Income:</span>
            <span className="font-medium text-green-600">+£{totalIncome.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-red-600">Expected Expenses:</span>
            <span className="font-medium text-red-600">-£{totalExpenses.toFixed(2)}</span>
          </div>
          <hr className="border-gray-300" />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Projected Balance:</span>
            <span className={`font-bold text-lg ${getBalanceColor()}`}>
              £{projectedBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {recurringPayments.length === 0 && (
          <p className="text-xs text-gray-500 italic">
            No recurring payments found. Add some recurring payments to see projections.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const useProjectedBalance = (account: any) => {
  const { recurringPayments } = useAccount();
  const [projectedBalance, setProjectedBalance] = useState(0);

  useEffect(() => {
    // Handle null account case
    if (!account || !account.frequency) {
      setProjectedBalance(account?.balance || 0);
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
      if (payment.accountId !== account.id) return;
      
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

    setProjectedBalance(account.balance + income - expenses);
  }, [account, recurringPayments]);

  return projectedBalance;
};
