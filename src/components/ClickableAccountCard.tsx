
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Account } from '@/contexts/AccountContext';

interface ClickableAccountCardProps {
  account: Account;
  onAddTransaction: (accountId: string) => void;
  icon: React.ReactNode;
  colorClass: string;
}

export const ClickableAccountCard = ({ account, onAddTransaction, icon, colorClass }: ClickableAccountCardProps) => {
  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'current':
        return 'Current Account';
      case 'savings':
        return 'Savings Account';
      case 'investment':
        return 'Investment Account';
      case 'retirement':
        return 'Retirement Account';
      case 'crypto':
        return 'Crypto Account';
      default:
        return type;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-blue-200 group cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`bg-gradient-to-r ${colorClass} p-2 rounded-lg text-white`}>
            {icon}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onAddTransaction(account.id);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <CardTitle className="text-lg">{getAccountTypeName(account.type)}</CardTitle>
          <p className="text-sm text-gray-500">{account.name}</p>
        </div>
      </CardHeader>
      <CardContent onClick={() => onAddTransaction(account.id)}>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Balance</span>
            <span className="text-xl font-semibold text-blue-600">£{account.balance.toFixed(2)}</span>
          </div>
          {account.interestRate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Interest Rate</span>
              <span className="text-sm font-medium text-green-600">{account.interestRate}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
