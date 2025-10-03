const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test function to verify API endpoints
const testBalanceAPI = async () => {
  console.log('🧪 Testing Settlio Balance Management API\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is responding');
    console.log(`   Status: ${healthResponse.data.status}\n`);

    // Test 2: User registration
    console.log('2️⃣ Testing user registration...');
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    const authToken = registerResponse.data.token;
    console.log('✅ User registered successfully');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);

    // Test 3: Create a test group
    console.log('\n3️⃣ Testing group creation...');
    const testGroup = {
      name: 'Test Balance Group',
      description: 'Testing balance management features',
      members: [
        { email: 'test@example.com' },
        { email: 'friend@example.com' }
      ]
    };

    const groupResponse = await axios.post(`${BASE_URL}/api/groups`, testGroup, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const groupId = groupResponse.data._id;
    console.log('✅ Group created successfully');
    console.log(`   Group ID: ${groupId}`);

    // Test 4: Test balance endpoints
    console.log('\n4️⃣ Testing balance API endpoints...');
    
    // Test getting group balances
    try {
      const balancesResponse = await axios.get(`${BASE_URL}/api/groups/${groupId}/balances`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ GET /groups/:id/balances - Working');
      console.log(`   Balance data structure: ${Object.keys(balancesResponse.data)}`);
    } catch (error) {
      console.log('❌ GET /groups/:id/balances - Failed:', error.response?.data?.error || error.message);
    }

    // Test getting group debts  
    try {
      const debtsResponse = await axios.get(`${BASE_URL}/api/groups/${groupId}/debts`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ GET /groups/:id/debts - Working');
    } catch (error) {
      console.log('❌ GET /groups/:id/debts - Failed:', error.response?.data?.error || error.message);
    }

    // Test getting settlements
    try {
      const settlementsResponse = await axios.get(`${BASE_URL}/api/groups/${groupId}/settlements`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ GET /groups/:id/settlements - Working');
    } catch (error) {
      console.log('❌ GET /groups/:id/settlements - Failed:', error.response?.data?.error || error.message);
    }

    // Test creating a settlement
    console.log('\n5️⃣ Testing settlement creation...');
    try {
      const settlementData = {
        toEmail: 'friend@example.com',
        amount: 25.50,
        comments: 'Test settlement via API'
      };

      const settlementResponse = await axios.post(`${BASE_URL}/api/groups/${groupId}/settlements`, settlementData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ POST /groups/:id/settlements - Working');
      console.log(`   Settlement created: ${settlementResponse.data.settlement?._id || 'Success'}`);
    } catch (error) {
      console.log('❌ POST /groups/:id/settlements - Failed:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Balance Management API Test Complete!');
    console.log('🌐 Frontend available at: http://localhost:3000');
    console.log('🔧 Backend API available at: http://localhost:5000');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Run the test
testBalanceAPI();