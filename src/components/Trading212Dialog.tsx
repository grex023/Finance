import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Trading212Data {
  name: string;
  balance: number;
  result: number;
}

interface Trading212DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTradingData: (data: Trading212Data & { apiKey: string; pieId: string }) => void;
  onManualSetup: () => void;
}

export const Trading212Dialog = ({ open, onOpenChange, onTradingData, onManualSetup }: Trading212DialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'confirm' | 'credentials' | 'manual' | 'fallback'>('confirm');
  const [apiKey, setApiKey] = useState('');
  const [pieId, setPieId] = useState('');
  const [manualData, setManualData] = useState({
    name: 'Trading 212 Investment',
    balance: '',
    result: ''
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleYes = () => {
    setStep('credentials');
  };

  const handleNo = () => {
    onManualSetup();
    onOpenChange(false);
  };

  const handleCancel = () => {
    setStep('confirm');
    setApiKey('');
    setPieId('');
    setApiError(null);
    setManualData({ name: 'Trading 212 Investment', balance: '', result: '' });
    onOpenChange(false);
  };

  const tryApiCall = async () => {
    console.log('🔄 Attempting Trading 212 API call via backend proxy...');
    
    try {
      // First check if backend is available
      const healthResponse = await fetch('http://localhost:5001/api/health');
      if (!healthResponse.ok) {
        throw new Error('Backend server is not running. Please start the backend server.');
      }

      const response = await fetch(`http://localhost:5001/api/trading212/pie/${pieId}`, {
        method: 'GET',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Backend proxy response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        console.error('❌ Backend proxy error:', errorData);
        
        // Provide more specific error messages based on status codes
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Trading 212 API key and ensure it has the correct permissions.');
        } else if (response.status === 403) {
          throw new Error('API key does not have permission to access this pie. Please check your Trading 212 account settings.');
        } else if (response.status === 404) {
          throw new Error('Pie not found. Please check your Pie ID is correct and the pie exists in your account.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status >= 500) {
          throw new Error('Trading 212 servers are currently unavailable. Please try again later.');
        } else {
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('✅ Backend proxy success:', data);
      
      // Extract the relevant data from Trading 212 response
      // Use the correct structure: instruments[0].result.priceAvgValue for balance
      const balance = data.instruments?.[0]?.result?.priceAvgValue || data.result?.value || 0;
      const result = data.instruments?.[0]?.result?.priceAvgResult || data.result?.result || 0;
      
      return {
        name: data.settings?.name || 'Trading 212 Investment',
        balance,
        result,
      };
    } catch (error) {
      console.error('❌ Trading 212 API call failed:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!apiKey || !pieId) {
      toast({
        title: "Error",
        description: "Please fill in both API Key and Pie ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const data = await tryApiCall();
      
      onTradingData({
        ...data,
        apiKey,
        pieId,
      });

      toast({
        title: "Success",
        description: "Trading 212 data retrieved successfully!",
      });

      handleCancel();
    } catch (error) {
      console.error('❌ Trading 212 API error:', error);
      setApiError(error.message);
      setStep('fallback');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    if (!manualData.balance) {
      toast({
        title: "Error",
        description: "Please enter at least the current balance",
        variant: "destructive",
      });
      return;
    }

    onTradingData({
      name: manualData.name,
      balance: parseFloat(manualData.balance),
      result: manualData.result ? parseFloat(manualData.result) : 0,
      apiKey,
      pieId,
    });

    toast({
      title: "Success",
      description: "Trading 212 account added with manual data!",
    });

    handleCancel();
  };

  const goToManualEntry = () => {
    setStep('manual');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'confirm' && 'Trading 212 Integration'}
            {step === 'credentials' && 'Trading 212 Credentials'}
            {step === 'manual' && 'Manual Entry'}
            {step === 'fallback' && 'Alternative Setup'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'confirm' && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Do you have a Trading 212 account you'd like to connect?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleNo}>
                No
              </Button>
              <Button onClick={handleYes}>
                Yes
              </Button>
            </div>
          </div>
        )}

        {step === 'credentials' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                We'll try to fetch your Trading 212 data automatically. If it fails, you can enter the data manually.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your Trading 212 API key"
              />
              <p className="text-xs text-gray-500">
                Get your API key from{' '}
                <a 
                  href="https://www.trading212.com/en/login" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Trading 212 settings <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pieId">Pie ID *</Label>
              <Input
                id="pieId"
                value={pieId}
                onChange={(e) => setPieId(e.target.value)}
                placeholder="Your Trading 212 Pie ID"
              />
              <p className="text-xs text-gray-500">
                Find this in your pie URL or pie settings
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button variant="outline" onClick={goToManualEntry} disabled={loading}>
                Manual Entry
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Try Auto-Fetch'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'fallback' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {apiError || 'Connection failed'}
              </AlertDescription>
            </Alert>

            <p className="text-sm text-gray-600">
              Don't worry! You can still add your Trading 212 account by entering the data manually. 
              You can find this information in your Trading 212 app or website.
            </p>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={goToManualEntry}>
                Enter Data Manually
              </Button>
            </div>
          </div>
        )}

        {step === 'manual' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter your Trading 212 pie information manually. You can find this in your Trading 212 app.
            </p>

            <div className="space-y-2">
              <Label htmlFor="manualName">Account Name</Label>
              <Input
                id="manualName"
                value={manualData.name}
                onChange={(e) => setManualData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., My Investment Pie"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualBalance">Current Balance (£) *</Label>
              <Input
                id="manualBalance"
                type="number"
                step="0.01"
                value={manualData.balance}
                onChange={(e) => setManualData(prev => ({ ...prev, balance: e.target.value }))}
                placeholder="e.g., 5000.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualResult">Total Return (£)</Label>
              <Input
                id="manualResult"
                type="number"
                step="0.01"
                value={manualData.result}
                onChange={(e) => setManualData(prev => ({ ...prev, result: e.target.value }))}
                placeholder="e.g., 250.50 (leave empty if unknown)"
              />
              <p className="text-xs text-gray-500">
                Enter positive for gains, negative for losses
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleManualEntry}>
                Add Account
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
