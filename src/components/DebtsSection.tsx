
import React, { useState } from 'react';
import { Plus, CreditCard, Building, Car, Home, Trash2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccount } from '@/contexts/AccountContext';
import { AddDebtDialog } from './AddDebtDialog';
import { PayDebtDialog } from './PayDebtDialog';
import { useToast } from '@/hooks/use-toast';

export const DebtsSection = () => {
  const { debts, deleteDebt } = useAccount();
  const { toast } = useToast();
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showPayDebt, setShowPayDebt] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string>('');

  // Filter out debts with zero balance
  const activeDebts = debts.filter(debt => debt.balance > 0);

  const getDebtIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'loan':
        return <Building className="h-5 w-5" />;
      case 'car_payment':
        return <Car className="h-5 w-5" />;
      case 'mortgage':
        return <Home className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getDebtColor = (type: string) => {
    switch (type) {
      case 'credit_card':
        return 'from-red-500 to-red-600';
      case 'loan':
        return 'from-orange-500 to-orange-600';
      case 'car_payment':
        return 'from-purple-500 to-purple-600';
      case 'mortgage':
        return 'from-pink-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getDebtTypeName = (type: string) => {
    switch (type) {
      case 'credit_card':
        return 'Credit Card';
      case 'loan':
        return 'Loan';
      case 'car_payment':
        return 'Car Payment';
      case 'mortgage':
        return 'Mortgage';
      default:
        return type;
    }
  };

  const handleDeleteDebt = async (debtId: string, debtName: string) => {
    try {
      await deleteDebt(debtId);
      toast({
        title: "Success",
        description: `${debtName} has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete debt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePayDebt = (debtId: string) => {
    setSelectedDebtId(debtId);
    setShowPayDebt(true);
  };

  const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMonthlyPayments = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Debts</h3>
          <p className="text-gray-600">Total Debt: £{totalDebt.toFixed(2)} | Monthly Payments: £{totalMonthlyPayments.toFixed(2)}</p>
        </div>
        <Button onClick={() => setShowAddDebt(true)} className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Debt
        </Button>
      </div>

      {activeDebts.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 text-lg">No active debts</p>
            <p className="text-gray-400 text-sm mt-2">Add a debt to start tracking your financial obligations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeDebts.map((debt) => (
            <Card key={debt.id} className="hover:shadow-lg transition-shadow duration-300 border-red-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`bg-gradient-to-r ${getDebtColor(debt.type)} p-2 rounded-lg text-white`}>
                    {getDebtIcon(debt.type)}
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-lg">{getDebtTypeName(debt.type)}</CardTitle>
                    <p className="text-sm text-gray-500">{debt.name}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Balance</span>
                    <span className="text-lg font-semibold text-red-600">£{debt.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">APR</span>
                    <span className="text-sm font-medium text-red-600">{debt.apr}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Min Payment</span>
                    <span className="text-sm font-medium">£{debt.minimumPayment.toFixed(2)}</span>
                  </div>
                  {debt.type === 'credit_card' && debt.creditLimit && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available Credit</span>
                      <span className="text-sm font-medium text-green-600">£{(debt.creditLimit - debt.balance).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePayDebt(debt.id)}
                      className="flex-1"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      Pay
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDebt(debt.id, debt.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddDebtDialog open={showAddDebt} onOpenChange={setShowAddDebt} />
      <PayDebtDialog 
        open={showPayDebt} 
        onOpenChange={setShowPayDebt}
        debtId={selectedDebtId}
      />
    </div>
  );
};
