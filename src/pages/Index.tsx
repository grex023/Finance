
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { AccountProvider } from '@/contexts/AccountContext';

const Index = () => {
  return (
    <AccountProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Dashboard />
        </main>
      </div>
    </AccountProvider>
  );
};

export default Index;
