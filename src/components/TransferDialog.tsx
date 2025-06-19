
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransferDialog = ({ open, onOpenChange }: TransferDialogProps) => {
  const { accounts, transferFunds } = useAccount();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromAccount || !formData.toAccount || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.fromAccount === formData.toAccount) {
      toast({
        title: "Error",
        description: "Cannot transfer to the same account",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    const fromAccount = accounts.find(acc => acc.id === formData.fromAccount);
    
    if (fromAccount && fromAccount.balance < amount) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive",
      });
      return;
    }

    transferFunds(formData.fromAccount, formData.toAccount, amount, formData.description);
    toast({
      title: "Success",
      description: "Transfer completed successfully!",
    });

    setFormData({
      fromAccount: '',
      toAccount: '',
      amount: '',
      description: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Funds</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromAccount">From Account *</Label>
            <Select value={formData.fromAccount} onValueChange={(value) => setFormData(prev => ({ ...prev, fromAccount: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (£{account.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAccount">To Account *</Label>
            <Select value={formData.toAccount} onValueChange={(value) => setFormData(prev => ({ ...prev, toAccount: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (£{account.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Transfer description"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Transfer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
