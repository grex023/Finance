
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import { Account } from '@/contexts/AccountContext';

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export const EditAccountDialog = ({ open, onOpenChange, account }: EditAccountDialogProps) => {
  const { updateAccount } = useAccount();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    interestRate: '',
    apiKey: '',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        interestRate: account.interestRate?.toString() || '',
        apiKey: account.apiKey || '',
      });
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !formData.name) {
      toast({
        title: "Error",
        description: "Please fill in the account name",
        variant: "destructive",
      });
      return;
    }

    const updatedData: Partial<Account> = {
      name: formData.name,
      type: account.type, // Include the current type to prevent null constraint error
      balance: account.balance, // Include current balance
    };

    if (formData.interestRate) {
      updatedData.interestRate = parseFloat(formData.interestRate);
    }

    if (formData.apiKey) {
      updatedData.apiKey = formData.apiKey;
    }

    // Include frequency and resetDay if they exist
    if (account.frequency) {
      updatedData.frequency = account.frequency;
    }

    if (account.resetDay) {
      updatedData.resetDay = account.resetDay;
    }

    updateAccount(account.id, updatedData);
    toast({
      title: "Success",
      description: "Account updated successfully!",
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Main Savings"
            />
          </div>

          {account?.type === 'savings' && (
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                placeholder="e.g., 2.5"
              />
            </div>
          )}

          {(account?.type === 'investment' || account?.type === 'crypto') && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">Trading 212 API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Optional API key"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Account</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
