#!/usr/bin/env node

// Test script to verify Trading 212 API connection
// Usage: node test-trading212.js

const API_KEY = '37110674ZczMwIIuKTeOvCmDbStCmNBtnXFZc';
const PIE_ID = '3697142';

async function testTrading212API() {
  console.log('🧪 Testing Trading 212 API connection...');
  console.log('🔑 API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');
  console.log('🔑 API Key length:', API_KEY.length);
  console.log('📊 Pie ID:', PIE_ID);
  
  const url = `https://live.trading212.com/api/v0/equity/pies/${PIE_ID}`;
  console.log('🌐 URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': API_KEY
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success!');
    console.log('📊 Pie name:', data.settings?.name);
    console.log('💰 Current value:', data.result?.value);
    console.log('📈 Total result:', data.result?.result);
    console.log('🔢 Instruments count:', data.instruments?.length);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTrading212API(); 