import React, { useState } from 'react';
import { Plus, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccount } from '@/contexts/AccountContext';
import { AddRecurringPaymentDialog } from './AddRecurringPaymentDialog';
import { EditRecurringPaymentDialog } from './EditRecurringPaymentDialog';
import { useToast } from '@/hooks/use-toast';
import { RecurringPayment } from '@/contexts/AccountContext';

export const RecurringPaymentsSection = () => {
  const { recurringPayments, accounts, deleteRecurringPayment } = useAccount();
  const { toast } = useToast();
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'bg-blue-100 text-blue-800';
      case 'monthly':
        return 'bg-green-100 text-green-800';
      case 'yearly':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  const handleEditPayment = (payment: RecurringPayment) => {
    setEditingPayment(payment);
    setShowEditPayment(true);
  };

  const handleDeletePayment = (payment: RecurringPayment) => {
    deleteRecurringPayment(payment.id);
    toast({
      title: "Success",
      description: "Recurring payment deleted successfully!",
    });
  };

  const totalMonthlyRecurring = recurringPayments
    .filter(payment => payment.frequency === 'monthly')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Recurring Payments</h3>
          <p className="text-gray-600">Monthly recurring total: £{totalMonthlyRecurring.toFixed(2)}</p>
        </div>
        <Button onClick={() => setShowAddPayment(true)} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recurringPayments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{payment.name}</CardTitle>
                <Badge className={getFrequencyColor(payment.frequency)}>
                  {payment.frequency}
                </Badge>
              </div>
              <div className="mt-1">
                <span className={`text-xs font-semibold rounded px-2 py-1 ${payment.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{payment.type === 'income' ? 'Income' : 'Expense'}</span>
              </div>
              <p className="text-sm text-gray-600">{payment.category}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount</span>
                  <span className="text-lg font-semibold">£{payment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account</span>
                  <span className="text-sm">{getAccountName(payment.accountId)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Next: {payment.nextPaymentDate.toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPayment(payment)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeletePayment(payment)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddRecurringPaymentDialog open={showAddPayment} onOpenChange={setShowAddPayment} />
      <EditRecurringPaymentDialog 
        open={showEditPayment} 
        onOpenChange={setShowEditPayment}
        payment={editingPayment}
      />
    </div>
  );
};
