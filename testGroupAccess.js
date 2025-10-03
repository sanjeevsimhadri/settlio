const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testGroupAccess() {
  try {
    // Wait a bit for server to fully start
    console.log('⏳ Waiting for server...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔐 Testing group access...\n');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Get user groups
    console.log('\n2. Getting user groups...');
    const groupsResponse = await axios.get(`${BASE_URL}/groups`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const groups = groupsResponse.data.data;
    console.log(`✅ Found groups: ${groups.length}`);
    
    if (groups.length === 0) {
      console.log('❌ No groups found');
      return;
    }

    const groupId = groups[0]._id;
    console.log(`   Group ID: ${groupId}`);

    // Step 3: Access specific group with detailed error handling
    console.log('\n3. Testing group access...');
    try {
      const groupResponse = await axios.get(`${BASE_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Group access successful!');
      console.log(`   Group name: ${groupResponse.data.data.group.name}`);
      console.log(`   Members count: ${groupResponse.data.data.group.members.length}`);
      
      // Show expense summary if available
      if (groupResponse.data.data.expenses) {
        console.log(`   Total expenses: ${groupResponse.data.data.expenses.length}`);
      }
      if (groupResponse.data.data.groupTotals) {
        console.log(`   Total amount: $${groupResponse.data.data.groupTotals.totalAmount || 0}`);
      }

    } catch (groupError) {
      console.log('❌ Group access failed:');
      console.log(`   Status: ${groupError.response?.status}`);
      console.log(`   Error: ${groupError.response?.data?.error || groupError.message}`);
      
      if (groupError.response?.data?.stack) {
        console.log(`   Stack: ${groupError.response.data.stack}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Hint: Make sure the server is running on port 5000');
    }
  }
}

testGroupAccess();