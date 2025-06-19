
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';

interface PayDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debtId: string;
}

export const PayDebtDialog = ({ open, onOpenChange, debtId }: PayDebtDialogProps) => {
  const { accounts, debts, payDebt } = useAccount();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
  });

  const selectedDebt = debts.find(debt => debt.id === debtId);
  const availableAccounts = accounts.filter(account => account.balance > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountId || !formData.amount) {
      toast({
        title: "Error",
        description: "Please select an account and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    const selectedAccount = accounts.find(acc => acc.id === formData.accountId);

    if (!selectedAccount) {
      toast({
        title: "Error",
        description: "Selected account not found",
        variant: "destructive",
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (amount > selectedAccount.balance) {
      toast({
        title: "Error",
        description: "Insufficient funds in selected account",
        variant: "destructive",
      });
      return;
    }

    if (selectedDebt && amount > selectedDebt.balance) {
      toast({
        title: "Error",
        description: "Payment amount cannot exceed debt balance",
        variant: "destructive",
      });
      return;
    }

    try {
      await payDebt(debtId, formData.accountId, amount);
      toast({
        title: "Success",
        description: `Payment of £${amount.toFixed(2)} made successfully!`,
      });

      setFormData({
        accountId: '',
        amount: '',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMaxPayment = () => {
    if (!selectedDebt || !formData.accountId) return;
    
    const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
    if (!selectedAccount) return;

    const maxPayment = Math.min(selectedAccount.balance, selectedDebt.balance);
    setFormData(prev => ({ ...prev, amount: maxPayment.toString() }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Debt</DialogTitle>
          {selectedDebt && (
            <p className="text-sm text-gray-600">
              {selectedDebt.name} - Balance: £{selectedDebt.balance.toFixed(2)}
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountId">Pay From Account *</Label>
            <Select value={formData.accountId} onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - £{account.balance.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableAccounts.length === 0 && (
              <p className="text-sm text-red-600">No accounts with sufficient funds available</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleMaxPayment}
                disabled={!formData.accountId || !selectedDebt}
              >
                Max
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={availableAccounts.length === 0}>
              Pay Debt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
