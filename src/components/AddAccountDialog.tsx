import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import { ProjectedBalanceCalculator } from './ProjectedBalanceCalculator';
import { Trading212Dialog } from './Trading212Dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { API_BASE_URL } from '@/services/api';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddAccountDialog = ({ open, onOpenChange }: AddAccountDialogProps) => {
  const { addAccount, refreshData } = useAccount();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    type: 'current' as 'current' | 'savings' | 'investment' | 'retirement' | 'crypto',
    balance: '',
    interestRate: '',
    apiKey: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    resetDay: '1',
    pieId: '',
    tradingResult: null as number | null,
  });
  const [showProjectedBalance, setShowProjectedBalance] = useState(false);
  const [showTrading212Dialog, setShowTrading212Dialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (file: File) => {
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.balance) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    const accountData = {
      name: formData.name,
      type: formData.type,
      balance: parseFloat(formData.balance),
      order: 0, // Default order if not set
      ...(formData.interestRate && { interestRate: parseFloat(formData.interestRate) }),
      ...(formData.apiKey && { apiKey: formData.apiKey }),
      ...(formData.type === 'current' && { frequency: formData.frequency, resetDay: parseInt(formData.resetDay) }),
      ...(formData.pieId && { pieId: formData.pieId }),
      ...(formData.tradingResult !== null && { tradingResult: formData.tradingResult }),
    };
    const newAccount = await addAccount(accountData as any); // Cast to any to avoid type error if needed
    if (selectedImage && newAccount && newAccount.id) {
      setUploading(true);
      const formDataImg = new FormData();
      formDataImg.append('image', selectedImage);
      try {
        const res = await fetch(`${API_BASE_URL}/accounts/${newAccount.id}/image`, { method: 'POST', body: formDataImg });
        if (!res.ok) throw new Error('Failed to upload image');
        await refreshData();
        toast({ title: 'Success', description: 'Image uploaded!' });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
      } finally {
        setUploading(false);
      }
    }
    toast({ title: 'Success', description: 'Account added successfully!' });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'current',
      balance: '',
      interestRate: '',
      apiKey: '',
      frequency: 'monthly',
      resetDay: '1',
      pieId: '',
      tradingResult: null,
    });
    setShowProjectedBalance(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleTypeChange = (value: any) => {
    setFormData(prev => ({ ...prev, type: value }));
    
    // Show Trading 212 dialog when investment is selected
    if (value === 'investment') {
      setShowTrading212Dialog(true);
    }
  };

  const handleTradingData = (data: any) => {
    setFormData(prev => ({
      ...prev,
      name: data.name,
      balance: data.balance.toString(),
      apiKey: data.apiKey,
      pieId: data.pieId,
      tradingResult: data.result,
    }));
  };

  const handleManualSetup = () => {
    // Continue with manual investment account setup
    setFormData(prev => ({ ...prev, type: 'investment' }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-20 w-20">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} alt="Preview" />
                ) : (
                  <AvatarFallback>{formData.name?.[0] || '?'}</AvatarFallback>
                )}
              </Avatar>
              <Button asChild disabled={uploading} variant="outline" className="mt-2">
                <label>
                  Upload Image
                  <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => {
                    if (e.target.files && e.target.files[0]) handleImageChange(e.target.files[0]);
                  }} />
                </label>
              </Button>
              {uploading && <span className="text-xs text-gray-500">Uploading...</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Checking"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Account Type *</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="investment">Investment Account</SelectItem>
                  <SelectItem value="retirement">Retirement Account</SelectItem>
                  <SelectItem value="crypto">Crypto Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Initial Balance *</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                placeholder="0.00"
              />
              {formData.tradingResult !== null && (
                <p className={`text-sm ${formData.tradingResult < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Result: {formData.tradingResult < 0 ? '' : '+'}£{formData.tradingResult.toFixed(2)}
                </p>
              )}
            </div>

            {formData.type === 'current' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Reset Frequency *</Label>
                  <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.frequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="resetDay">Reset Day *</Label>
                    <Select value={formData.resetDay} onValueChange={(value) => setFormData(prev => ({ ...prev, resetDay: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.balance && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProjectedBalance(!showProjectedBalance)}
                      className="w-full"
                    >
                      {showProjectedBalance ? 'Hide' : 'Show'} Projected Remaining Balance
                    </Button>
                    {showProjectedBalance && (
                      <ProjectedBalanceCalculator 
                        initialBalance={parseFloat(formData.balance)} 
                        frequency={formData.frequency}
                        resetDay={formData.frequency === 'monthly' ? parseInt(formData.resetDay) : undefined}
                      />
                    )}
                  </div>
                )}
              </>
            )}

            {(formData.type === 'savings' || formData.type === 'retirement') && (
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                  placeholder="e.g., 4.5"
                />
              </div>
            )}

            {formData.type === 'investment' && !formData.apiKey && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">Trading 212 API Key (Optional)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Your Trading 212 API key"
                />
                <p className="text-xs text-gray-500">
                  Get your API key from <a href="https://t212public-api-docs.redoc.ly" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Trading 212 API docs</a>
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Trading212Dialog
        open={showTrading212Dialog}
        onOpenChange={setShowTrading212Dialog}
        onTradingData={handleTradingData}
        onManualSetup={handleManualSetup}
      />
    </>
  );
};
