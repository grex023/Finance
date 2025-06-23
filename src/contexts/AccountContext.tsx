import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, ApiAccount, ApiDebt, ApiTransaction, ApiRecurringPayment, fetchTrading212Data } from '@/services/api';

export interface Account {
  id: string;
  name: string;
  type: 'current' | 'savings' | 'investment' | 'retirement' | 'crypto';
  balance: number;
  interestRate?: number;
  apiKey?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  resetDay?: number;
  pieId?: string;
  tradingResult?: number;
  createdAt: Date;
  order: number;
}

export interface Debt {
  id: string;
  name: string;
  type: 'credit_card' | 'loan' | 'car_payment' | 'mortgage';
  balance: number;
  apr: number;
  minimumPayment: number;
  creditLimit?: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  type: 'income' | 'expense' | 'transfer';
  recurringPaymentId?: string;
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  category: string;
  type: 'income' | 'expense';
  nextPaymentDate: Date;
  accountId: string;
}

interface AccountContextType {
  accounts: Account[];
  debts: Debt[];
  transactions: Transaction[];
  recurringPayments: RecurringPayment[];
  loading: boolean;
  error: string | null;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  payDebt: (debtId: string, accountId: string, amount: number) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { date: Date, recurringPaymentId?: string }) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addRecurringPayment: (payment: Omit<RecurringPayment, 'id'>) => Promise<void>;
  updateRecurringPayment: (id: string, payment: Partial<RecurringPayment>) => Promise<void>;
  deleteRecurringPayment: (id: string) => Promise<void>;
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, description: string) => Promise<void>;
  getTotalWealth: () => number;
  getTotalDebt: () => number;
  getNetWorth: () => number;
  getTotalRetirement: () => number;
  getTotalAvailableCredit: () => number;
  getSavingsInterestForFinancialYear: () => number;
  refreshData: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

// Helper functions to convert API data to frontend data
const convertApiAccount = (apiAccount: ApiAccount): Account => ({
  id: apiAccount.id,
  name: apiAccount.name,
  type: apiAccount.type as Account['type'],
  balance: Number(apiAccount.balance),
  interestRate: apiAccount.interest_rate ? Number(apiAccount.interest_rate) : undefined,
  apiKey: apiAccount.api_key || undefined,
  frequency: apiAccount.frequency as Account['frequency'],
  resetDay: apiAccount.reset_day || undefined,
  pieId: apiAccount.pie_id || undefined,
  tradingResult: apiAccount.trading_result ? Number(apiAccount.trading_result) : undefined,
  createdAt: new Date(apiAccount.created_at),
  order: apiAccount.order ? Number(apiAccount.order) : 0,
});

const convertApiDebt = (apiDebt: ApiDebt): Debt => ({
  id: apiDebt.id,
  name: apiDebt.name,
  type: apiDebt.type as Debt['type'],
  balance: Number(apiDebt.balance),
  apr: Number(apiDebt.apr),
  minimumPayment: Number(apiDebt.minimum_payment),
  creditLimit: apiDebt.credit_limit ? Number(apiDebt.credit_limit) : undefined,
  createdAt: new Date(apiDebt.created_at),
});

const convertApiTransaction = (apiTransaction: ApiTransaction): Transaction => ({
  id: apiTransaction.id,
  accountId: apiTransaction.account_id,
  amount: Number(apiTransaction.amount),
  description: apiTransaction.description,
  category: apiTransaction.category,
  date: new Date(apiTransaction.date),
  type: apiTransaction.type as Transaction['type'],
  recurringPaymentId: apiTransaction.recurring_payment_id || undefined,
});

const convertApiRecurringPayment = (apiPayment: ApiRecurringPayment): RecurringPayment => ({
  id: apiPayment.id,
  name: apiPayment.name,
  amount: Number(apiPayment.amount),
  frequency: apiPayment.frequency as RecurringPayment['frequency'],
  category: apiPayment.category,
  type: apiPayment.type as RecurringPayment['type'],
  nextPaymentDate: new Date(apiPayment.next_payment_date),
  accountId: apiPayment.account_id,
});

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data on component mount
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check connection status first
      await apiService.checkConnection();
      
      const [apiAccounts, apiDebts, apiTransactions, apiRecurringPayments] = await Promise.all([
        apiService.getAccounts(),
        apiService.getDebts(),
        apiService.getTransactions(),
        apiService.getRecurringPayments(),
      ]);

      setAccounts(apiAccounts.map(convertApiAccount));
      setDebts(apiDebts.map(convertApiDebt));
      setTransactions(apiTransactions.map(convertApiTransaction));
      setRecurringPayments(apiRecurringPayments.map(convertApiRecurringPayment));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Retry connection and reload data
  const retryConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Force refresh connection status
      const isConnected = await apiService.refreshConnection();
      
      if (isConnected) {
        // If connection is restored, reload all data
        await refreshData();
      } else {
        setError('Backend server is still not available. Please check if the server is running on port 5001.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry connection');
      console.error('Retry connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Account operations
  const addAccount = async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const order = accounts.length; // Set order to next available index
      const apiAccount = await apiService.createAccount({
        id,
        name: accountData.name,
        type: accountData.type,
        balance: accountData.balance,
        interest_rate: accountData.interestRate,
        api_key: accountData.apiKey,
        frequency: accountData.frequency,
        reset_day: accountData.resetDay,
        pie_id: accountData.pieId,
        trading_result: accountData.tradingResult,
        order,
      });
      setAccounts(prev => [...prev, convertApiAccount(apiAccount)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      throw err;
    }
  };

  const updateAccount = async (id: string, accountData: Partial<Account>) => {
    try {
      const apiAccount = await apiService.updateAccount(id, {
        name: accountData.name,
        type: accountData.type,
        balance: accountData.balance,
        interest_rate: accountData.interestRate,
        api_key: accountData.apiKey,
        frequency: accountData.frequency,
        reset_day: accountData.resetDay,
        pie_id: accountData.pieId,
        trading_result: accountData.tradingResult,
        order: accountData.order,
      });
      setAccounts(prev => prev.map(account => 
        account.id === id ? convertApiAccount(apiAccount) : account
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await apiService.deleteAccount(id);
      setAccounts(prev => prev.filter(account => account.id !== id));
      setTransactions(prev => prev.filter(transaction => transaction.accountId !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      throw err;
    }
  };

  // Debt operations
  const addDebt = async (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const apiDebt = await apiService.createDebt({
        id,
        name: debtData.name,
        type: debtData.type,
        balance: debtData.balance,
        apr: debtData.apr,
        minimum_payment: debtData.minimumPayment,
        credit_limit: debtData.creditLimit,
      });
      setDebts(prev => [...prev, convertApiDebt(apiDebt)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add debt');
      throw err;
    }
  };

  const updateDebt = async (id: string, debtData: Partial<Debt>) => {
    try {
      const apiDebt = await apiService.updateDebt(id, {
        name: debtData.name,
        type: debtData.type,
        balance: debtData.balance,
        apr: debtData.apr,
        minimum_payment: debtData.minimumPayment,
        credit_limit: debtData.creditLimit,
      });
      setDebts(prev => prev.map(debt => 
        debt.id === id ? convertApiDebt(apiDebt) : debt
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update debt');
      throw err;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await apiService.deleteDebt(id);
      setDebts(prev => prev.filter(debt => debt.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete debt');
      throw err;
    }
  };

  const payDebt = async (debtId: string, accountId: string, amount: number) => {
    try {
      // Add expense transaction from account
      await addTransaction({
        accountId,
        amount,
        description: `Debt payment`,
        category: 'Debt Payment',
        date: new Date(),
        type: 'expense',
      });

      // Update debt balance
      const debt = debts.find(d => d.id === debtId);
      if (debt) {
        const newBalance = Math.max(0, debt.balance - amount);
        await updateDebt(debtId, { balance: newBalance });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pay debt');
      throw err;
    }
  };

  // Transaction operations
  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const apiTransaction = await apiService.createTransaction({
        id,
        account_id: transactionData.accountId,
        amount: transactionData.amount,
        description: transactionData.description,
        category: transactionData.category,
        date: transactionData.date.toISOString().split('T')[0],
        type: transactionData.type,
        recurring_payment_id: transactionData.recurringPaymentId || null,
      });
      
      const newTransaction = convertApiTransaction(apiTransaction);
      setTransactions(prev => [...prev, newTransaction]);
      
      // Refresh data to get updated account balances
      await refreshData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
      throw err;
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      await apiService.deleteTransaction(transactionId);
      // Optimistically remove the transaction from the UI
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      // Refresh all data to ensure consistency
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo transaction');
      throw err;
    }
  };

  // Recurring payment operations
  const addRecurringPayment = async (paymentData: Omit<RecurringPayment, 'id'>) => {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const apiPayment = await apiService.createRecurringPayment({
        id,
        name: paymentData.name,
        amount: paymentData.amount,
        frequency: paymentData.frequency,
        category: paymentData.category,
        type: paymentData.type,
        next_payment_date: paymentData.nextPaymentDate.toISOString().split('T')[0],
        account_id: paymentData.accountId,
      });
      setRecurringPayments(prev => [...prev, convertApiRecurringPayment(apiPayment)]);
      
      // Check if this recurring payment is for a Trading 212 account and refresh its balance
      const account = accounts.find(acc => acc.id === paymentData.accountId);
      if (account?.type === 'investment' && account.apiKey && account.pieId) {
        try {
          console.log('🔄 Auto-refreshing Trading 212 balance for recurring payment setup:', account.name);
          const tradingData = await fetchTrading212Data(account.apiKey, account.pieId);
          
          // Extract the updated balance from Trading 212 response
          const updatedBalance = tradingData.instruments?.[0]?.result?.priceAvgValue || tradingData.result?.value || account.balance;
          const updatedResult = tradingData.instruments?.[0]?.result?.priceAvgResult || tradingData.result?.result || account.tradingResult;
          
          // Update the account with fresh Trading 212 data
          await updateAccount(account.id, {
            balance: updatedBalance,
            tradingResult: updatedResult,
          });
          
          console.log('✅ Trading 212 balance refreshed for recurring payment setup');
        } catch (error) {
          console.error('❌ Failed to auto-refresh Trading 212 balance for recurring payment:', error);
          // Don't throw here - we still want the recurring payment to be added even if Trading 212 refresh fails
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recurring payment');
      throw err;
    }
  };

  const updateRecurringPayment = async (id: string, paymentData: Partial<RecurringPayment>) => {
    try {
      const apiPayment = await apiService.updateRecurringPayment(id, {
        name: paymentData.name,
        amount: paymentData.amount,
        frequency: paymentData.frequency,
        category: paymentData.category,
        type: paymentData.type,
        next_payment_date: paymentData.nextPaymentDate ? paymentData.nextPaymentDate.toISOString().split('T')[0] : undefined,
        account_id: paymentData.accountId,
      });
      setRecurringPayments(prev => prev.map(payment => 
        payment.id === id ? convertApiRecurringPayment(apiPayment) : payment
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recurring payment');
      throw err;
    }
  };

  const deleteRecurringPayment = async (id: string) => {
    try {
      await apiService.deleteRecurringPayment(id);
      setRecurringPayments(prev => prev.filter(payment => payment.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recurring payment');
      throw err;
    }
  };

  const transferFunds = async (fromAccountId: string, toAccountId: string, amount: number, description: string) => {
    try {
      // Add expense transaction to source account
      await addTransaction({
        accountId: fromAccountId,
        amount,
        description: `Transfer to account: ${description}`,
        category: 'Transfer',
        date: new Date(),
        type: 'expense',
      });

      // Add income transaction to destination account
      await addTransaction({
        accountId: toAccountId,
        amount,
        description: `Transfer from account: ${description}`,
        category: 'Transfer',
        date: new Date(),
        type: 'income',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer funds');
      throw err;
    }
  };

  const getTotalWealth = () => {
    return accounts
      .filter(account => account.type !== 'retirement')
      .reduce((sum, account) => sum + account.balance, 0);
  };

  const getTotalRetirement = () => {
    return accounts
      .filter(account => account.type === 'retirement')
      .reduce((sum, account) => sum + account.balance, 0);
  };

  const getTotalDebt = () => {
    return debts
      .filter(debt => debt.balance > 0)
      .reduce((sum, debt) => sum + debt.balance, 0);
  };

  const getTotalAvailableCredit = () => {
    return debts
      .filter(debt => debt.type === 'credit_card' && debt.creditLimit && debt.balance > 0)
      .reduce((sum, debt) => sum + (debt.creditLimit! - debt.balance), 0);
  };

  const getNetWorth = () => {
    const totalAssets = accounts.reduce((sum, account) => sum + account.balance, 0);
    return totalAssets - getTotalDebt();
  };

  const getSavingsInterestForFinancialYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Financial year runs from April to March
    let financialYearStart: Date;
    if (currentMonth >= 3) { // April onwards (months 3-11)
      financialYearStart = new Date(currentYear, 3, 1); // April 1st current year
    } else { // January to March (months 0-2)
      financialYearStart = new Date(currentYear - 1, 3, 1); // April 1st previous year
    }
    
    const savingsAccounts = accounts.filter(account => account.type === 'savings' && account.interestRate);
    
    let totalInterest = 0;
    savingsAccounts.forEach(account => {
      const annualInterest = (account.balance * (account.interestRate || 0)) / 100;
      const daysSinceFinancialYearStart = Math.max(0, Math.floor((now.getTime() - financialYearStart.getTime()) / (1000 * 60 * 60 * 24)));
      const interestForPeriod = (annualInterest / 365) * daysSinceFinancialYearStart;
      totalInterest += interestForPeriod;
    });
    
    return totalInterest;
  };

  return (
    <AccountContext.Provider value={{
      accounts,
      debts,
      transactions,
      recurringPayments,
      loading,
      error,
      addAccount,
      updateAccount,
      deleteAccount,
      addDebt,
      updateDebt,
      deleteDebt,
      payDebt,
      addTransaction,
      deleteTransaction,
      addRecurringPayment,
      updateRecurringPayment,
      deleteRecurringPayment,
      transferFunds,
      getTotalWealth,
      getTotalDebt,
      getNetWorth,
      getTotalRetirement,
      getTotalAvailableCredit,
      getSavingsInterestForFinancialYear,
      refreshData,
      retryConnection,
    }}>
      {children}
    </AccountContext.Provider>
  );
};
