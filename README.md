# BudgetMaster - Personal Finance Management App

A comprehensive budgeting application built with React, TypeScript, and Tailwind CSS. Manage your finances with multiple account types, recurring payments, budgets, and transactions.

## Features

### 🏦 Account Management
- **Multiple Account Types**: Current, Savings, Investment, and Retirement accounts
- **Interest Rate Tracking**: Set and monitor interest rates for savings accounts
- **Trading 212 Integration**: Connect your investment accounts with API keys
- **Fund Transfers**: Move money between accounts seamlessly

### 💰 Budget Management
- **Monthly Budgets**: Create and track budgets by category
- **Budget Rollover**: Budgets automatically continue month to month
- **Real-time Tracking**: See how much you've spent vs. budgeted
- **Visual Progress**: Progress bars and percentages for easy monitoring

### 🔄 Recurring Payments
- **Subscription Management**: Track utilities, streaming services, and more
- **Flexible Frequency**: Weekly, monthly, or yearly recurring payments
- **Category Organization**: Organize payments by type
- **Next Payment Tracking**: Never miss a payment date

### 📊 Transaction Management
- **Manual Transactions**: Add income and expenses manually
- **Category System**: Organize transactions with customizable categories
- **Account Integration**: Transactions automatically update account balances
- **Transaction History**: View and search through all transactions

### 📱 Responsive Design
- **Mobile Optimized**: Works perfectly on phones and tablets
- **Desktop Ready**: Full-featured desktop experience
- **Modern UI**: Clean, professional interface with smooth animations

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the setup script to automatically install dependencies and configure the environment:

```bash
./setup.sh
```

This script will:
- Check prerequisites (Node.js, npm, Docker)
- Install all dependencies
- Set up the database
- Start the services
- Provide health checks

### Option 2: Quick Start (For Immediate Use)

For immediate development, use the quick start script:

```bash
./quick-start.sh
```

This will:
- Install dependencies
- Start PostgreSQL (via Docker if available)
- Start backend server
- Start frontend development server
- Open the application

### Option 3: Manual Setup

If you prefer manual setup, follow these steps:

#### Prerequisites
- Node.js 18+ and npm
- PostgreSQL (or Docker for database)
- Docker (optional, for containerized setup)

#### Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev
```

#### Backend Setup
```bash
# Install backend dependencies
cd server
npm install

# Start backend server
npm start
```

#### Database Setup
```bash
# Option A: Using Docker
docker run --name budgetmaster-db \
  -e POSTGRES_DB=budgetmaster \
  -e POSTGRES_USER=budgetuser \
  -e POSTGRES_PASSWORD=budgetpass \
  -p 5432:5432 \
  -d postgres:13

# Option B: Using local PostgreSQL
# Ensure PostgreSQL is running with the correct credentials
```

## Docker Support

This application is fully containerized and ready to run with Docker.

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd budgetmaster
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application**
   Open your browser and go to `http://localhost:3000`

### Docker Services

The application includes three services:
- **Frontend**: React application (port 3000)
- **Backend**: Node.js API server (port 5001)
- **Database**: PostgreSQL database (port 5432)

### Health Checks

All services include health checks:
```bash
# Check frontend
curl http://localhost:3000

# Check backend
curl http://localhost:5001/api/health

# Check database (if using Docker)
docker exec budgetmaster-db pg_isready -U budgetuser
```

## Development Setup

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Start the backend server**
   ```bash
   cd server && npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Environment Variables

Create a `.env` file in the server directory for local development:

```env
DB_HOST=localhost
DB_USER=budgetuser
DB_PASSWORD=budgetpass
DB_NAME=budgetmaster
DB_PORT=5432
PORT=5001
```

## Trading 212 API Integration

To connect your investment accounts:

1. Get your API key from [Trading 212 API Documentation](https://t212public-api-docs.redoc.ly)
2. Add an Investment Account in the app
3. Enter your API key when prompted
4. Your investment account will show as "Connected"

For detailed setup instructions, see [TRADING212_SETUP.md](TRADING212_SETUP.md)

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite
- **Containerization**: Docker & Docker Compose
- **State Management**: React Context API
- **Icons**: Lucide React

## Project Structure

```
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── lib/               # Utility functions
│   └── components/ui/     # shadcn/ui components
├── server/                # Backend source code
│   ├── index.js           # Main server file
│   ├── package.json       # Backend dependencies
│   └── Dockerfile         # Backend container
├── docker-compose.yml     # Multi-service setup
├── setup.sh              # Automated setup script
├── quick-start.sh        # Quick development script
└── TRADING212_SETUP.md   # Trading 212 integration guide
```

## Troubleshooting

### Common Issues

1. **"Cannot find package 'express'"**
   - Run `cd server && npm install`

2. **"Connection reset by peer"**
   - Ensure the backend server is running: `cd server && npm start`

3. **"Database connection error"**
   - Start PostgreSQL: `docker-compose up -d postgres`
   - Or install PostgreSQL locally

4. **"Mock data persists"**
   - The backend is not running or not connected
   - Check backend logs and database connection

### Health Checks

```bash
# Check if all services are running
./setup.sh

# Check backend health
curl http://localhost:5001/api/health

# Check database connection
docker exec budgetmaster-db pg_isready -U budgetuser
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
