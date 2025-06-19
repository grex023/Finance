# Trading 212 Integration Setup Guide

## Overview

The BudgetMaster app includes integration with Trading 212 to automatically fetch your investment pie data. This guide will help you set up the integration and troubleshoot common issues.

## Prerequisites

1. **Trading 212 Account**: You need an active Trading 212 account with at least one pie
2. **API Key**: You need to generate an API key from your Trading 212 account
3. **Pie ID**: You need the ID of the pie you want to track

## Getting Your Trading 212 API Key

1. Log in to your Trading 212 account at [www.trading212.com](https://www.trading212.com)
2. Go to **Settings** → **API** (or **Developer** section)
3. Generate a new API key
4. Make sure the API key has **read permissions** for your pies
5. Copy the API key (keep it secure!)
6. **Note**: Trading 212 API keys are typically 32 characters long (e.g., `37110674ZczMwIIuKTeOvCmDbStCmNBtnXFZc`)

## Finding Your Pie ID

1. In your Trading 212 app or website, navigate to the pie you want to track
2. Look at the URL - it should contain something like: `https://www.trading212.com/en/pies/12345678`
3. The number at the end (e.g., `12345678`) is your Pie ID
4. Alternatively, check the pie settings for an ID field

## Testing Your Connection

You can test your API key and Pie ID using curl:

```bash
curl -i -X GET \
    'https://live.trading212.com/api/v0/equity/pies/YOUR_PIE_ID' \
    -H 'Authorization: YOUR_API_KEY'
```

If this works, the BudgetMaster integration should also work.

## Setting Up in BudgetMaster

1. **Add Investment Account**: 
   - Go to the Accounts tab
   - Click "Add Account"
   - Select "Investment" as the account type
   - Choose "Yes" when asked about Trading 212 integration

2. **Enter Credentials**:
   - Enter your API key
   - Enter your Pie ID
   - Click "Try Auto-Fetch"

3. **Success**: If successful, your pie data will be automatically imported
4. **Manual Entry**: If auto-fetch fails, you can enter the data manually

## Troubleshooting

### Common Error Messages

#### "Invalid API key"
- **Cause**: API key is incorrect or doesn't have proper permissions
- **Solution**: 
  - Double-check your API key
  - Ensure the API key has read permissions
  - Generate a new API key if needed

#### "Pie not found"
- **Cause**: Pie ID is incorrect or pie doesn't exist
- **Solution**:
  - Verify your Pie ID from the Trading 212 URL
  - Ensure the pie exists in your account
  - Check that your API key has access to this pie

#### "API key does not have permission"
- **Cause**: API key lacks required permissions
- **Solution**:
  - Check your Trading 212 API settings
  - Ensure the API key has read access to pies
  - Generate a new API key with proper permissions

#### "Rate limit exceeded"
- **Cause**: Too many API requests
- **Solution**:
  - Wait a few minutes before trying again
  - Trading 212 has rate limits to prevent abuse

#### "Backend server is not running"
- **Cause**: The BudgetMaster backend server is not started
- **Solution**:
  - Start the backend server: `npm run dev` in the server directory
  - Or use Docker: `docker-compose up -d`

### Manual Setup

If automatic fetching fails, you can still add your Trading 212 account manually:

1. **Get Current Balance**: Check your pie's current value in Trading 212
2. **Get Total Return**: Calculate your total gains/losses (optional)
3. **Enter Manually**: Use the manual entry option in the app

### API Key Format Issues

If you're getting "Invalid API key" errors:

1. **Check Length**: Trading 212 API keys are typically 32 characters long
2. **No Bearer Prefix**: The API key should be used directly without "Bearer " prefix
3. **Test with curl**: Use the curl command above to verify your credentials work
4. **Permissions**: Ensure your API key has read access to pies

### Backend Connection Issues

If you get "Backend server is not running":

1. **Start the server**: `cd server && npm start`
2. **Check port**: Ensure port 5001 is available
3. **Test endpoint**: Visit `http://localhost:5001/api/trading212/test`
4. **Check logs**: Look for any error messages in the server console

## Security Notes

- **API Key Security**: Never share your Trading 212 API key
- **Local Storage**: API keys are stored locally in your browser
- **No Server Storage**: API keys are not stored on BudgetMaster servers
- **Read-Only**: The integration only reads data, never modifies your account

## Technical Details

### API Endpoints Used
- **Pie Data**: `https://live.trading212.com/api/v0/equity/pies/{pieId}`
- **Proxy**: BudgetMaster uses a backend proxy to avoid CORS issues

### Data Retrieved
- **Pie Name**: The name of your investment pie
- **Current Value**: Total current value of the pie
- **Total Return**: Total gains/losses since creation

### Refresh Frequency
- **Manual Refresh**: Click the refresh button in account details
- **No Auto-Refresh**: Data is not automatically updated (privacy-focused)

## Support

If you continue to have issues:

1. **Check Trading 212 Status**: Ensure Trading 212 services are running
2. **Verify Credentials**: Double-check your API key and Pie ID
3. **Try Manual Entry**: Use manual entry as a fallback
4. **Check Backend**: Ensure the BudgetMaster backend is running

## Privacy

- Your Trading 212 data is only accessed when you explicitly request it
- No data is stored on external servers
- All data processing happens locally in your browser
- API keys are stored securely in your browser's local storage 