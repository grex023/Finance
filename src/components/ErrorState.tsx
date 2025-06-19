import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  // Determine if this is a connection error
  const isConnectionError = error.includes('Failed to fetch') || 
                           error.includes('NetworkError') || 
                           error.includes('fetch') ||
                           error.includes('connection');

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isConnectionError ? 'Connection Error' : 'Error'}
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={onRetry} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
        {isConnectionError && (
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Make sure the backend server is running on port 5001</p>
            <p>Try running: <code className="bg-gray-100 px-1 rounded">cd server && npm start</code></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
