import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import { Account } from '@/contexts/AccountContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { API_BASE_URL } from '@/services/api';

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export const EditAccountDialog = ({ open, onOpenChange, account }: EditAccountDialogProps) => {
  const { updateAccount, refreshData } = useAccount();
  const { toast } = useToast();
  const [formData, setFormData] = useState<{
    name: string;
    type: 'current' | 'savings' | 'investment' | 'retirement' | 'crypto';
    balance: string;
    interestRate: string;
    apiKey: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    resetDay: string;
    pieId: string;
    tradingResult: string;
  }>(
    {
      name: '',
      type: 'current',
      balance: '',
      interestRate: '',
      apiKey: '',
      frequency: 'monthly',
      resetDay: '1',
      pieId: '',
      tradingResult: '',
    }
  );
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance?.toString() || '',
        interestRate: account.interestRate?.toString() || '',
        apiKey: account.apiKey || '',
        frequency: account.frequency || 'monthly',
        resetDay: account.resetDay?.toString() || '1',
        pieId: account.pieId || '',
        tradingResult: account.tradingResult?.toString() || '',
      });
    }
  }, [account]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ title: 'Error', description: 'Only JPEG and PNG files are allowed', variant: 'destructive' });
      return;
    }
    if (file.size > 1024 * 1024) {
      toast({ title: 'Error', description: 'File size must be under 1MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_BASE_URL}/accounts/${account.id}/image`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to upload image');
      await refreshData();
      toast({ title: 'Success', description: 'Image uploaded!' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !formData.name) {
      toast({ title: 'Error', description: 'Please fill in the account name', variant: 'destructive' });
      return;
    }
    const updatedData: Partial<Account> = {
      name: formData.name,
      type: formData.type,
      balance: parseFloat(formData.balance),
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      apiKey: formData.apiKey,
      frequency: formData.frequency,
      resetDay: formData.resetDay ? parseInt(formData.resetDay) : undefined,
      pieId: formData.pieId,
      tradingResult: formData.tradingResult ? parseFloat(formData.tradingResult) : undefined,
    };
    updateAccount(account.id, updatedData);
    toast({ title: 'Success', description: 'Account updated successfully!' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20">
              {account?.imageUrl ? (
                <AvatarImage src={`${API_BASE_URL.replace('/api', '')}${account.imageUrl}`} alt="Account" />
              ) : (
                <AvatarFallback>{account?.name?.[0] || '?'}</AvatarFallback>
              )}
            </Avatar>
            <Button asChild disabled={uploading} variant="outline" className="mt-2">
              <label>
                Upload Image
                <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => {
                  if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0]);
                }} />
              </label>
            </Button>
            {uploading && <span className="text-xs text-gray-500">Uploading...</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Main Savings" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Account Type *</Label>
            <select id="type" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))} className="w-full border rounded px-2 py-1">
              <option value="current">Current Account</option>
              <option value="savings">Savings Account</option>
              <option value="investment">Investment Account</option>
              <option value="retirement">Retirement Account</option>
              <option value="crypto">Crypto Account</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Balance *</Label>
            <Input id="balance" type="number" step="0.01" value={formData.balance} onChange={e => setFormData(prev => ({ ...prev, balance: e.target.value }))} placeholder="0.00" />
          </div>
          {formData.type === 'savings' && (
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input id="interestRate" type="number" step="0.01" value={formData.interestRate} onChange={e => setFormData(prev => ({ ...prev, interestRate: e.target.value }))} placeholder="e.g., 2.5" />
            </div>
          )}
          {(formData.type === 'investment' || formData.type === 'crypto') && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">Trading 212 API Key</Label>
              <Input id="apiKey" type="password" value={formData.apiKey} onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))} placeholder="Optional API key" />
            </div>
          )}
          {formData.type === 'current' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="frequency">Reset Frequency *</Label>
                <select id="frequency" value={formData.frequency} onChange={e => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))} className="w-full border rounded px-2 py-1">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {formData.frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="resetDay">Reset Day *</Label>
                  <select id="resetDay" value={formData.resetDay} onChange={e => setFormData(prev => ({ ...prev, resetDay: e.target.value }))} className="w-full border rounded px-2 py-1">
                    {[...Array(28)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
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
