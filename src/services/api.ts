const API_BASE_URL = 'http://localhost:5001/api';

export interface ApiAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  interest_rate?: number;
  api_key?: string;
  frequency?: string;
  reset_day?: number;
  pie_id?: string;
  trading_result?: number;
  created_at: string;
  order: number;
}

export interface ApiDebt {
  id: string;
  name: string;
  type: string;
  balance: number;
  apr: number;
  minimum_payment: number;
  credit_limit?: number;
  created_at: string;
}

export interface ApiTransaction {
  id: string;
  account_id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: string;
}

export interface ApiRecurringPayment {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  type: string;
  next_payment_date: string;
  account_id: string;
}

// Check if we can connect to the backend
async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout (increased from 2)
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Enhanced Trading 212 API call with better error handling
export async function fetchTrading212Data(apiKey: string, pieId: string): Promise<any> {
  console.log('Attempting Trading 212 data fetch...');
  
  // First try backend proxy
  try {
    console.log('Trying backend proxy...');
    const response = await fetch(`${API_BASE_URL}/trading212/pie/${pieId}`, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
      console.error('Backend proxy error response:', errorData);
      
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
        throw new Error(errorData.error || `Backend proxy error: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('Backend proxy successful');
    return data;
  } catch (backendError) {
    console.log('Backend proxy failed:', backendError.message);
    
    // Fallback to direct API call (will likely fail due to CORS)
    try {
      console.log('Trying direct API call...');
      const response = await fetch(`https://live.trading212.com/api/v0/equity/pies/${pieId}`, {
        method: 'GET',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Trading 212 API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Direct API call successful');
      return data;
    } catch (directError) {
      console.log('Direct API call failed:', directError.message);
      
      // Both methods failed - throw descriptive error
      if (directError.message.includes('CORS') || directError.name === 'TypeError') {
        throw new Error('Unable to connect to Trading 212 API due to browser security restrictions. Please use manual entry.');
      } else {
        throw new Error(`Trading 212 API connection failed. Please check your API key and Pie ID, or use manual entry.`);
      }
    }
  }
}

class ApiService {
  private useOfflineMode = false;

  async checkConnection(): Promise<void> {
    const isAvailable = await isBackendAvailable();
    this.useOfflineMode = !isAvailable;
    if (this.useOfflineMode) {
      console.log('🔄 Backend not available, using offline mode with mock data');
    } else {
      console.log('✅ Backend connection established');
    }
  }

  // Force refresh connection status
  async refreshConnection(): Promise<boolean> {
    await this.checkConnection();
    return !this.useOfflineMode;
  }

  // Accounts
  async getAccounts(): Promise<ApiAccount[]> {
    if (this.useOfflineMode) {
      const { mockAccounts } = await import('./mockData');
      return mockAccounts;
    }
    
    const response = await fetch(`${API_BASE_URL}/accounts`);
    if (!response.ok) throw new Error('Failed to fetch accounts');
    return response.json();
  }

  async createAccount(account: Omit<ApiAccount, 'created_at'>): Promise<ApiAccount> {
    if (this.useOfflineMode) {
      // Simulate account creation in offline mode
      const newAccount = {
        ...account,
        created_at: new Date().toISOString()
      };
      console.log('📝 Mock account created:', newAccount);
      return newAccount;
    }

    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        interestRate: account.interest_rate,
        apiKey: account.api_key,
        frequency: account.frequency,
        resetDay: account.reset_day,
        pieId: account.pie_id,
        tradingResult: account.trading_result,
        order: account.order,
      }),
    });
    if (!response.ok) throw new Error('Failed to create account');
    return response.json();
  }

  async updateAccount(id: string, account: Partial<ApiAccount>): Promise<ApiAccount> {
    if (this.useOfflineMode) {
      // Simulate account update in offline mode
      const updatedAccount = {
        id,
        ...account,
        created_at: new Date().toISOString()
      } as ApiAccount;
      console.log('📝 Mock account updated:', updatedAccount);
      return updatedAccount;
    }

    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: account.name,
        type: account.type,
        balance: account.balance,
        interestRate: account.interest_rate,
        apiKey: account.api_key,
        frequency: account.frequency,
        resetDay: account.reset_day,
        pieId: account.pie_id,
        tradingResult: account.trading_result,
        order: account.order,
      }),
    });
    if (!response.ok) throw new Error('Failed to update account');
    return response.json();
  }

  async deleteAccount(id: string): Promise<void> {
    if (this.useOfflineMode) {
      console.log('📝 Mock account deleted:', id);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete account');
  }

  // Debts
  async getDebts(): Promise<ApiDebt[]> {
    if (this.useOfflineMode) {
      const { mockDebts } = await import('./mockData');
      return mockDebts;
    }

    const response = await fetch(`${API_BASE_URL}/debts`);
    if (!response.ok) throw new Error('Failed to fetch debts');
    return response.json();
  }

  async createDebt(debt: Omit<ApiDebt, 'created_at'>): Promise<ApiDebt> {
    if (this.useOfflineMode) {
      const newDebt = {
        ...debt,
        created_at: new Date().toISOString()
      };
      console.log('📝 Mock debt created:', newDebt);
      return newDebt;
    }

    const response = await fetch(`${API_BASE_URL}/debts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: debt.id,
        name: debt.name,
        type: debt.type,
        balance: debt.balance,
        apr: debt.apr,
        minimumPayment: debt.minimum_payment,
        creditLimit: debt.credit_limit,
      }),
    });
    if (!response.ok) throw new Error('Failed to create debt');
    return response.json();
  }

  async updateDebt(id: string, debt: Partial<ApiDebt>): Promise<ApiDebt> {
    if (this.useOfflineMode) {
      const updatedDebt = {
        id,
        ...debt,
        created_at: new Date().toISOString()
      } as ApiDebt;
      console.log('📝 Mock debt updated:', updatedDebt);
      return updatedDebt;
    }

    const response = await fetch(`${API_BASE_URL}/debts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: debt.name,
        type: debt.type,
        balance: debt.balance,
        apr: debt.apr,
        minimumPayment: debt.minimum_payment,
        creditLimit: debt.credit_limit,
      }),
    });
    if (!response.ok) throw new Error('Failed to update debt');
    return response.json();
  }

  async deleteDebt(id: string): Promise<void> {
    if (this.useOfflineMode) {
      console.log('📝 Mock debt deleted:', id);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/debts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete debt');
  }

  // Transactions
  async getTransactions(): Promise<ApiTransaction[]> {
    if (this.useOfflineMode) {
      const { mockTransactions } = await import('./mockData');
      return mockTransactions;
    }

    const response = await fetch(`${API_BASE_URL}/transactions`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  }

  async createTransaction(transaction: ApiTransaction): Promise<ApiTransaction> {
    if (this.useOfflineMode) {
      console.log('📝 Mock transaction created:', transaction);
      return transaction;
    }

    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: transaction.id,
        accountId: transaction.account_id,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date,
        type: transaction.type,
      }),
    });
    if (!response.ok) throw new Error('Failed to create transaction');
    return response.json();
  }

  // Recurring Payments
  async getRecurringPayments(): Promise<ApiRecurringPayment[]> {
    if (this.useOfflineMode) {
      const { mockRecurringPayments } = await import('./mockData');
      return mockRecurringPayments;
    }

    const response = await fetch(`${API_BASE_URL}/recurring-payments`);
    if (!response.ok) throw new Error('Failed to fetch recurring payments');
    return response.json();
  }

  async createRecurringPayment(payment: ApiRecurringPayment): Promise<ApiRecurringPayment> {
    if (this.useOfflineMode) {
      console.log('📝 Mock recurring payment created:', payment);
      return payment;
    }

    const response = await fetch(`${API_BASE_URL}/recurring-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payment.id,
        name: payment.name,
        amount: payment.amount,
        frequency: payment.frequency,
        category: payment.category,
        type: payment.type,
        nextPaymentDate: payment.next_payment_date,
        accountId: payment.account_id,
      }),
    });
    if (!response.ok) throw new Error('Failed to create recurring payment');
    return response.json();
  }

  async updateRecurringPayment(id: string, payment: Partial<ApiRecurringPayment>): Promise<ApiRecurringPayment> {
    if (this.useOfflineMode) {
      const updatedPayment = {
        id,
        ...payment,
      } as ApiRecurringPayment;
      console.log('📝 Mock recurring payment updated:', updatedPayment);
      return updatedPayment;
    }

    const response = await fetch(`${API_BASE_URL}/recurring-payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: payment.name,
        amount: payment.amount,
        frequency: payment.frequency,
        category: payment.category,
        type: payment.type,
        nextPaymentDate: payment.next_payment_date,
        accountId: payment.account_id,
      }),
    });
    if (!response.ok) throw new Error('Failed to update recurring payment');
    return response.json();
  }

  async deleteRecurringPayment(id: string): Promise<void> {
    if (this.useOfflineMode) {
      console.log('📝 Mock recurring payment deleted:', id);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/recurring-payments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete recurring payment');
  }
}

// Create service instance but don't auto-check connection
const apiServiceInstance = new ApiService();

export const apiService = apiServiceInstance;
