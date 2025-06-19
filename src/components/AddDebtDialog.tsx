
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';

interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddDebtDialog = ({ open, onOpenChange }: AddDebtDialogProps) => {
  const { addDebt } = useAccount();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card' as 'credit_card' | 'loan' | 'car_payment' | 'mortgage',
    balance: '',
    apr: '',
    minimumPayment: '',
    creditLimit: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.balance || !formData.apr || !formData.minimumPayment) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const balance = parseFloat(formData.balance);
    const creditLimit = formData.creditLimit ? parseFloat(formData.creditLimit) : undefined;

    // Validate credit limit for credit cards
    if (formData.type === 'credit_card' && creditLimit && balance > creditLimit) {
      toast({
        title: "Error",
        description: "Balance cannot exceed credit limit",
        variant: "destructive",
      });
      return;
    }

    const debtData = {
      name: formData.name,
      type: formData.type,
      balance,
      apr: parseFloat(formData.apr),
      minimumPayment: parseFloat(formData.minimumPayment),
      creditLimit,
    };

    addDebt(debtData);
    toast({
      title: "Success",
      description: "Debt added successfully!",
    });

    setFormData({
      name: '',
      type: 'credit_card',
      balance: '',
      apr: '',
      minimumPayment: '',
      creditLimit: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Debt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Debt Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Chase Credit Card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Debt Type *</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="car_payment">Car Payment</SelectItem>
                <SelectItem value="mortgage">Mortgage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'credit_card' && (
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance *</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apr">APR (%) *</Label>
            <Input
              id="apr"
              type="number"
              step="0.01"
              value={formData.apr}
              onChange={(e) => setFormData(prev => ({ ...prev, apr: e.target.value }))}
              placeholder="e.g., 18.99"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimumPayment">Minimum Payment *</Label>
            <Input
              id="minimumPayment"
              type="number"
              step="0.01"
              value={formData.minimumPayment}
              onChange={(e) => setFormData(prev => ({ ...prev, minimumPayment: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Debt</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
