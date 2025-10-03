const axios = require('axios');

async function quickTest() {
  try {
    console.log('🔍 Quick API Test...\n');
    
    // Test health endpoint
    console.log('Testing health endpoint...');
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check successful:', response.data);
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.message);
    console.log('Data:', error.response?.data);
  }
}

quickTest();