export const mockAccounts = [
  {
    id: 'mock-1',
    name: 'Main Checking',
    type: 'current',
    balance: 2500.00,
    frequency: 'monthly',
    reset_day: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-2', 
    name: 'Savings Account',
    type: 'savings',
    balance: 15000.00,
    interest_rate: 4.5,
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-3',
    name: 'Trading 212 Investment',
    type: 'investment',
    balance: 8500.00,
    trading_result: 350.75,
    created_at: new Date().toISOString()
  }
];

export const mockDebts = [
  {
    id: 'debt-1',
    name: 'Credit Card',
    type: 'credit_card',
    balance: 1200.00,
    apr: 18.9,
    minimum_payment: 50.00,
    created_at: new Date().toISOString()
  }
];

export const mockTransactions = [
  {
    id: 'trans-1',
    account_id: 'mock-1',
    amount: 85.50,
    description: 'Grocery Shopping',
    category: 'Food & Dining',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  },
  {
    id: 'trans-2',
    account_id: 'mock-1',
    amount: 3000.00,
    description: 'Salary',
    category: 'Income',
    date: new Date().toISOString().split('T')[0],
    type: 'income'
  }
];

export const mockRecurringPayments = [
  {
    id: 'recurring-1',
    name: 'Netflix Subscription',
    amount: 14.99,
    frequency: 'monthly',
    category: 'Entertainment',
    type: 'expense',
    next_payment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    account_id: 'mock-1'
  }
];
