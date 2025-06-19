import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';

interface AddRecurringPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const expenseCategories = [
  'Utilities', 'Subscriptions', 'Insurance', 'Rent/Mortgage', 'Internet',
  'Phone', 'Gym', 'Streaming Services', 'Software', 'Other'
];

const incomeCategories = [
  'Salary', 'Freelance', 'Investment', 'Bonus', 'Interest', 'Other'
];

export const AddRecurringPaymentDialog = ({ open, onOpenChange }: AddRecurringPaymentDialogProps) => {
  const { accounts, addRecurringPayment } = useAccount();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    category: '',
    type: 'expense' as 'income' | 'expense',
    nextPaymentDate: '',
    accountId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.category || !formData.nextPaymentDate || !formData.accountId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const sanitizedAmount = parseFloat(formData.amount.replace(/[^0-9.]/g, ''));
    const paymentData = {
      name: formData.name,
      amount: sanitizedAmount,
      frequency: formData.frequency,
      category: formData.category,
      type: formData.type,
      nextPaymentDate: new Date(formData.nextPaymentDate),
      accountId: formData.accountId,
    };

    addRecurringPayment(paymentData);
    toast({
      title: "Success",
      description: `Recurring ${formData.type} added successfully!`,
    });

    setFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      category: '',
      type: 'expense',
      nextPaymentDate: '',
      accountId: '',
    });
    onOpenChange(false);
  };

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Recurring Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value, category: '' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Recurring Income</SelectItem>
                <SelectItem value="expense">Recurring Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Payment Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={formData.type === 'income' ? 'e.g., Monthly Salary' : 'e.g., Netflix Subscription'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextPaymentDate">Next Payment Date *</Label>
            <Input
              id="nextPaymentDate"
              type="date"
              value={formData.nextPaymentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, nextPaymentDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Account *</Label>
            <Select value={formData.accountId} onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add {formData.type === 'income' ? 'Income' : 'Payment'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
