import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 5001;

// Database connection with error handling
const pool = new Pool({
  user: process.env.DB_USER || 'budgetuser',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'budgetmaster',
  password: process.env.DB_PASSWORD || 'budgetpass',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://192.168.3.10:3000', 'http://192.168.3.10:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Health check endpoint - add this first for debugging
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', port: port, timestamp: new Date().toISOString() });
});

// Test Trading 212 connection endpoint (for debugging)
app.get('/api/trading212/test', (req, res) => {
  console.log('🧪 Trading 212 test endpoint hit');
  res.json({ 
    message: 'Trading 212 proxy is running',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    endpoints: ['/api/trading212/pie/:pieId', '/api/trading212/test']
  });
});

// Test endpoint that mimics the exact curl command
app.get('/api/trading212/test-curl/:pieId', async (req, res) => {
  console.log('🧪 Testing with exact curl format...');
  
  try {
    const { pieId } = req.params;
    const apiKey = req.headers.authorization;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'Authorization header required' });
    }
    
    // Clean up API key - remove 'Bearer ' prefix if present
    let cleanApiKey = apiKey;
    if (apiKey.startsWith('Bearer ')) {
      cleanApiKey = apiKey.substring(7);
    }
    
    console.log('🧪 Testing with pieId:', pieId);
    console.log('🧪 Testing with apiKey length:', cleanApiKey.length);
    console.log('🧪 Testing with apiKey (first 10):', cleanApiKey.substring(0, 10) + '...');
    
    const trading212Url = `https://live.trading212.com/api/v0/equity/pies/${pieId}`;
    
    // Mimic the exact curl command format
    const response = await fetch(trading212Url, {
      method: 'GET',
      headers: {
        'Authorization': cleanApiKey
      }
    });
    
    console.log('🧪 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `Trading 212 API error: ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    res.json({
      success: true,
      status: response.status,
      data: data
    });
    
  } catch (error) {
    console.error('🧪 Test error:', error);
    res.status(500).json({ 
      error: 'Test failed',
      details: error.message 
    });
  }
});

// Initialize database tables
async function initializeTables() {
  try {
    console.log('Initializing database tables...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        balance DECIMAL(10,2) NOT NULL,
        interest_rate DECIMAL(5,2),
        api_key TEXT,
        frequency VARCHAR(20),
        reset_day INTEGER,
        pie_id VARCHAR(255),
        trading_result DECIMAL(10,2),
        "order" INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist (for existing databases)
    await pool.query(`
      ALTER TABLE accounts 
      ADD COLUMN IF NOT EXISTS pie_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS trading_result DECIMAL(10,2)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS debts (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        balance DECIMAL(10,2) NOT NULL,
        apr DECIMAL(5,2) NOT NULL,
        minimum_payment DECIMAL(10,2) NOT NULL,
        credit_limit DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add credit_limit column if it doesn't exist (for existing databases)
    await pool.query(`
      ALTER TABLE debts 
      ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        account_id VARCHAR(50) REFERENCES accounts(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        type VARCHAR(20) NOT NULL,
        recurring_payment_id VARCHAR(50) REFERENCES recurring_payments(id) ON DELETE SET NULL
      )
    `);

    // For existing databases, add the column if it doesn't exist
    try {
      await pool.query('ALTER TABLE transactions ADD COLUMN recurring_payment_id VARCHAR(50) REFERENCES recurring_payments(id) ON DELETE SET NULL');
    } catch (e) {
      if (e.code !== '42701') { // 42701 is duplicate column
        throw e;
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS recurring_payments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        frequency VARCHAR(20) NOT NULL,
        category VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        next_payment_date DATE NOT NULL,
        account_id VARCHAR(50) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id VARCHAR(50) PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        budget_amount DECIMAL(10,2) NOT NULL,
        spent_amount DECIMAL(10,2) DEFAULT 0,
        month VARCHAR(7) NOT NULL
      )
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Trading 212 Proxy Endpoint - FIXED TO USE LIVE API
app.get('/api/trading212/pie/:pieId', async (req, res) => {
  console.log('📡 Trading 212 proxy endpoint hit');
  console.log('📍 Request URL:', req.url);
  console.log('📍 Request params:', req.params);
  console.log('📍 Request headers:', req.headers);

  // Set CORS headers specifically for this endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    const { pieId } = req.params;
    let apiKey = req.headers.authorization;

    console.log('🔄 Trading 212 API request received:', { 
      pieId: pieId, 
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0
    });

    if (!apiKey) {
      console.log('❌ No API key provided');
      return res.status(401).json({ error: 'Authorization header required' });
    }

    if (!pieId) {
      console.log('❌ No Pie ID provided');
      return res.status(400).json({ error: 'Pie ID required' });
    }

    // Clean up API key - remove 'Bearer ' prefix if present
    if (apiKey.startsWith('Bearer ')) {
      apiKey = apiKey.substring(7);
    }

    // Validate API key format (Trading 212 API keys are typically 32 characters)
    if (!apiKey || apiKey.length < 10) {
      console.log('❌ API key too short or missing');
      return res.status(400).json({ error: 'Invalid API key format' });
    }

    // Use LIVE Trading 212 API URL (not demo)
    const trading212Url = `https://live.trading212.com/api/v0/equity/pies/${pieId}`;
    console.log('🚀 Making Trading 212 API call to:', trading212Url);
    console.log('🔑 Using API key (first 10 chars):', apiKey.substring(0, 10) + '...');
    console.log('🔑 API key length:', apiKey.length);

    const requestHeaders = {
      'Authorization': apiKey
    };

    console.log('📤 Request headers being sent:', requestHeaders);

    const response = await fetch(trading212Url, {
      method: 'GET',
      headers: requestHeaders,
      timeout: 15000, // 15 second timeout
    });

    console.log('📡 Trading 212 API response status:', response.status);
    console.log('📡 Trading 212 API response headers:', Object.fromEntries(response.headers.entries()));
    console.log('📡 Response URL:', response.url);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('❌ Trading 212 API error response:', errorText);
      } catch (e) {
        errorText = 'Unable to read error response';
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        return res.status(401).json({ 
          error: 'Invalid API key. Please check your Trading 212 API key and ensure it has the correct permissions.' 
        });
      } else if (response.status === 403) {
        return res.status(403).json({ 
          error: 'API key does not have permission to access this pie. Please check your Trading 212 account settings.' 
        });
      } else if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Pie not found. Please check your Pie ID is correct and the pie exists in your account.' 
        });
      } else if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please wait a moment and try again.' 
        });
      } else if (response.status >= 500) {
        return res.status(503).json({ 
          error: 'Trading 212 servers are currently unavailable. Please try again later.' 
        });
      } else {
        return res.status(response.status).json({ 
          error: `Trading 212 API error: ${response.status}`,
          details: errorText
        });
      }
    }

    // Log the raw response body for debugging
    const rawText = await response.text();
    console.log('🟢 Raw Trading 212 API response body:', rawText);
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('❌ Failed to parse Trading 212 API response as JSON:', e);
      return res.status(500).json({ error: 'Failed to parse Trading 212 API response as JSON', details: rawText });
    }
    console.log('✅ Trading 212 API response data received successfully');
    console.log('📊 Pie data preview:', {
      name: data.settings?.name,
      instrumentsCount: data.instruments?.length,
      hasResult: !!data.result
    });
    
    res.json(data);
  } catch (error) {
    console.error('❌ Trading 212 proxy error:', error);
    
    // Handle specific error types
    if (error.code === 'ENOTFOUND') {
      return res.status(503).json({ 
        error: 'Unable to reach Trading 212 servers. Please check your internet connection and try again.' 
      });
    } else if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        error: 'Request timeout. Trading 212 servers are taking too long to respond. Please try again.' 
      });
    } else if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Trading 212 servers are currently unreachable. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error. Please try manual entry instead.',
      details: error.message 
    });
  }
});

// OPTIONS handler for Trading 212 endpoint (CORS preflight)
app.options('/api/trading212/pie/:pieId', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// Routes

// Accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY "order"');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    console.log('🔵 Incoming account creation request:', req.body);
    const { id, name, type, balance, interestRate, apiKey, frequency, resetDay, pieId, tradingResult, order } = req.body;
    const result = await pool.query(
      'INSERT INTO accounts (id, name, type, balance, interest_rate, api_key, frequency, reset_day, pie_id, trading_result, "order") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [id, name, type, balance, interestRate || null, apiKey || null, frequency || null, resetDay || null, pieId || null, tradingResult || null, order]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating account:', error.message, req.body);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { name, type, balance, interestRate, apiKey, frequency, resetDay, pieId, tradingResult, order } = req.body;

    // If 'order' is undefined or null, fetch the current value from the database
    if (order === undefined || order === null) {
      const result = await pool.query('SELECT "order" FROM accounts WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        order = result.rows[0].order;
      } else {
        // If account not found, return error
        return res.status(404).json({ error: 'Account not found' });
      }
    }

    const updateResult = await pool.query(
      'UPDATE accounts SET name = $1, type = $2, balance = $3, interest_rate = $4, api_key = $5, frequency = $6, reset_day = $7, pie_id = $8, trading_result = $9, "order" = $10 WHERE id = $11 RETURNING *',
      [name, type, balance, interestRate || null, apiKey || null, frequency || null, resetDay || null, pieId || null, tradingResult || null, order, id]
    );
    res.json(updateResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debts
app.get('/api/debts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM debts ORDER BY created_at');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/debts', async (req, res) => {
  try {
    const { id, name, type, balance, apr, minimumPayment, creditLimit } = req.body;
    const result = await pool.query(
      'INSERT INTO debts (id, name, type, balance, apr, minimum_payment, credit_limit) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, type, balance, apr, minimumPayment, creditLimit || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/debts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, balance, apr, minimumPayment, creditLimit } = req.body;
    const result = await pool.query(
      'UPDATE debts SET name = $1, type = $2, balance = $3, apr = $4, minimum_payment = $5, credit_limit = $6 WHERE id = $7 RETURNING *',
      [name, type, balance, apr, minimumPayment, creditLimit || null, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/debts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM debts WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { id, account_id, amount, description, category, date, type, recurring_payment_id } = req.body;
    
    const client = await pool.connect();
    await client.query('BEGIN');
    // Add transaction
    await client.query(
      'INSERT INTO transactions (id, account_id, amount, description, category, date, type, recurring_payment_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, account_id, amount, description, category, date, type, recurring_payment_id]
    );
    // Update account balance
    const balanceChange = type === 'income' ? amount : -amount;
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [balanceChange, account_id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a transaction (Undo)
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the transaction to undo
    const txResult = await client.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (txResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const tx = txResult.rows[0];

    // Reverse the balance change on the account
    if (tx.type === 'income') {
      await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [tx.amount, tx.account_id]);
    } else if (tx.type === 'expense') {
      await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [tx.amount, tx.account_id]);
    }
    
    // If it was from a recurring payment, reset the payment's date
    if (tx.recurring_payment_id) {
      const rpResult = await client.query('SELECT * FROM recurring_payments WHERE id = $1', [tx.recurring_payment_id]);
      if (rpResult.rows.length > 0) {
        const rp = rpResult.rows[0];
        let previousDate = new Date(rp.next_payment_date);
        
        // Calculate the previous payment date
        if (rp.frequency === 'weekly') previousDate.setDate(previousDate.getDate() - 7);
        if (rp.frequency === 'monthly') previousDate.setMonth(previousDate.getMonth() - 1);
        if (rp.frequency === 'yearly') previousDate.setFullYear(previousDate.getFullYear() - 1);

        await client.query('UPDATE recurring_payments SET next_payment_date = $1 WHERE id = $2', [previousDate.toISOString().split('T')[0], rp.id]);
      }
    }
    
    // Delete the transaction
    await client.query('DELETE FROM transactions WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Recurring Payments
app.get('/api/recurring-payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recurring_payments ORDER BY next_payment_date');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recurring-payments', async (req, res) => {
  try {
    const { id, name, amount, frequency, category, type, nextPaymentDate, accountId } = req.body;
    const result = await pool.query(
      'INSERT INTO recurring_payments (id, name, amount, frequency, category, type, next_payment_date, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, name, amount, frequency, category, type, nextPaymentDate, accountId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/recurring-payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get current recurring payment
    const currentResult = await pool.query('SELECT * FROM recurring_payments WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }
    const currentPayment = currentResult.rows[0];

    // Merge current data with updates
    const newPayment = { ...currentPayment, ...updates };

    const result = await pool.query(
      'UPDATE recurring_payments SET name = $1, amount = $2, frequency = $3, category = $4, type = $5, next_payment_date = $6, account_id = $7 WHERE id = $8 RETURNING *',
      [
        newPayment.name,
        newPayment.amount,
        newPayment.frequency,
        newPayment.category,
        newPayment.type,
        newPayment.next_payment_date,
        newPayment.account_id,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/recurring-payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM recurring_payments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Budgets
app.get('/api/budgets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budgets ORDER BY month DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const { id, category, budgetAmount, spentAmount, month } = req.body;
    const result = await pool.query(
      'INSERT INTO budgets (id, category, budget_amount, spent_amount, month) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, category, budgetAmount, spentAmount || 0, month]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, budgetAmount, spentAmount, month } = req.body;
    const result = await pool.query(
      'UPDATE budgets SET category = $1, budget_amount = $2, spent_amount = $3, month = $4 WHERE id = $5 RETURNING *',
      [category, budgetAmount, spentAmount, month, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Context-aware AI Q&A endpoint
app.post('/api/ai-finance', async (req, res) => {
  try {
    console.log('AI Q&A request received:', req.body);
    const { question, provider, openaiApiKey } = req.body;
    if (!question || !provider) {
      console.log('Missing question or provider');
      return res.status(400).json({ error: 'Missing question or provider' });
    }

    // --- 1. Analyze question type ---
    let contextData = '';
    let prompt = '';
    const now = new Date();
    const year = now.getFullYear();

    // --- 2. Fetch relevant data based on question ---
    if (/interest/i.test(question)) {
      // Fetch all interest transactions for this year
      const tx = await pool.query(
        'SELECT * FROM transactions WHERE LOWER(description) LIKE $1 AND date >= $2 AND date <= $3',
        ['%interest%', `${year}-01-01`, `${year}-12-31`]
      );
      const totalInterest = tx.rows.reduce((sum, t) => sum + Number(t.amount), 0);
      contextData = `Interest transactions for ${year}:\n` + tx.rows.map(t => `- £${t.amount} on ${t.date} (${t.description})`).join('\n') + `\nTotal interest: £${totalInterest.toFixed(2)}`;
      prompt = `User question: "${question}"\n${contextData}`;
    } else if (/amazon.*subscription|subscription.*amazon/i.test(question)) {
      // Fetch recurring payments for Amazon
      const subs = await pool.query(
        "SELECT * FROM recurring_payments WHERE LOWER(name) LIKE '%amazon%' OR LOWER(description) LIKE '%amazon%' ORDER BY next_payment_date DESC LIMIT 1"
      );
      if (subs.rows.length > 0) {
        const sub = subs.rows[0];
        contextData = `Amazon subscription: £${sub.amount} due on ${sub.next_payment_date} (frequency: ${sub.frequency})`;
      } else {
        contextData = 'No Amazon subscription found.';
      }
      prompt = `User question: "${question}"\n${contextData}`;
    } else {
      // Fallback: provide recent transactions and recurring payments
      const tx = await pool.query('SELECT * FROM transactions ORDER BY date DESC LIMIT 10');
      const rec = await pool.query('SELECT * FROM recurring_payments ORDER BY next_payment_date DESC LIMIT 5');
      contextData = `Recent transactions:\n` + tx.rows.map(t => `- £${t.amount} on ${t.date} (${t.description})`).join('\n') +
        `\nThe following recurring payments are labeled as either Income (money in) or Expense (money out).\n` + rec.rows.map(r => `- £${r.amount} (${r.type === 'income' ? 'Income' : 'Expense'}) for ${r.name} due on ${r.next_payment_date}`).join('\n');
      prompt = `User question: "${question}"\n${contextData}`;
    }

    // --- 3. Send to AI provider ---
    let aiResponse = '';
    if (provider === 'ollama') {
      // Send to local Ollama (assume Llama 3)
      const ollamaRes = await fetch('http://host.docker.internal:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3:latest',
          messages: [
            { role: 'system', content: 'You are a helpful personal finance assistant. Answer based only on the data provided. Do not infer whether a payment is income or expense from its name; always use the provided type (Income or Expense).' },
            { role: 'user', content: prompt }
          ]
        })
      });
      // Node.js-compatible stream parser for Ollama
      if (ollamaRes.body && ollamaRes.body.pipe) {
        const readline = await import('readline');
        const rl = readline.default.createInterface({ input: ollamaRes.body });
        for await (const line of rl) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message && json.message.content) {
              aiResponse += json.message.content;
            }
          } catch (e) { /* ignore parse errors for incomplete lines */ }
        }
      } else {
        // Fallback: non-streaming
        const ollamaData = await ollamaRes.json();
        aiResponse = ollamaData.message?.content || ollamaData.response || 'No response from Ollama.';
      }
      res.json({ answer: aiResponse });
      return;
    } else if (provider === 'openai') {
      console.log('--- OpenAI Request ---');
      console.log('Received request for OpenAI');
      // Send to OpenAI ChatGPT
      if (!openaiApiKey) {
        console.log('Error: Missing OpenAI API key');
        return res.status(400).json({ error: 'Missing OpenAI API key' });
      }
      console.log('OpenAI API Key provided (hidden for security)');
      console.log('Prompt:', prompt);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      };
      console.log('Request Headers:', { 'Content-Type': headers['Content-Type'], 'Authorization': 'Bearer [REDACTED]' });

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful personal finance assistant. Answer based only on the data provided. Do not infer whether a payment is income or expense from its name; always use the provided type (Income or Expense).' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300
        })
      });

      if (!openaiRes.ok) {
        const errorText = await openaiRes.text();
        console.error('OpenAI API Error:', openaiRes.status, errorText);
        return res.status(502).json({ error: 'Failed to fetch from OpenAI', details: errorText });
      }

      const openaiData = await openaiRes.json();
      aiResponse = openaiData.choices?.[0]?.message?.content || 'No response from OpenAI.';
      return res.json({ answer: aiResponse });
    } else {
      return res.status(400).json({ error: 'Unknown provider' });
    }
  } catch (error) {
    console.error('AI Q&A error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server with better error handling
app.listen(port, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 API available at http://localhost:${port}/api`);
  console.log(`💚 Health check: http://localhost:${port}/api/health`);
  console.log(`🏦 Trading 212 proxy: http://localhost:${port}/api/trading212/pie/:pieId`);
  
  // Initialize database tables after server starts
  initializeTables().catch(console.error);
});
