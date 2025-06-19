
# BudgetMaster Backend API

## Setup Instructions

### Development Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start PostgreSQL database:
```bash
docker-compose up postgres -d
```

3. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Production Setup

1. Build and start all services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 5000
- Frontend application on port 3000

### API Endpoints

- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

- `GET /api/debts` - Get all debts
- `POST /api/debts` - Create new debt
- `PUT /api/debts/:id` - Update debt
- `DELETE /api/debts/:id` - Delete debt

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction

- `GET /api/recurring-payments` - Get all recurring payments
- `POST /api/recurring-payments` - Create new recurring payment
- `PUT /api/recurring-payments/:id` - Update recurring payment
- `DELETE /api/recurring-payments/:id` - Delete recurring payment

- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget

### Database Schema

The application automatically creates the following tables:
- `accounts` - User accounts (checking, savings, etc.)
- `debts` - User debts (credit cards, loans, etc.)
- `transactions` - Financial transactions
- `recurring_payments` - Recurring income/expenses
- `budgets` - Budget categories and limits
